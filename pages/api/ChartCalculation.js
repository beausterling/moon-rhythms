import { createClient } from '@supabase/supabase-js';
import ephemeris from 'ephemeris';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map of zodiac signs with their degree ranges
const zodiacSigns = [
  { name: "Aries", symbol: "♈", start: 0, end: 30 },
  { name: "Taurus", symbol: "♉", start: 30, end: 60 },
  { name: "Gemini", symbol: "♊", start: 60, end: 90 },
  { name: "Cancer", symbol: "♋", start: 90, end: 120 },
  { name: "Leo", symbol: "♌", start: 120, end: 150 },
  { name: "Virgo", symbol: "♍", start: 150, end: 180 },
  { name: "Libra", symbol: "♎", start: 180, end: 210 },
  { name: "Scorpio", symbol: "♏", start: 210, end: 240 },
  { name: "Sagittarius", symbol: "♐", start: 240, end: 270 },
  { name: "Capricorn", symbol: "♑", start: 270, end: 300 },
  { name: "Aquarius", symbol: "♒", start: 300, end: 330 },
  { name: "Pisces", symbol: "♓", start: 330, end: 360 }
];

// Map of planets with their corresponding keys in the ephemeris result
const planets = [
  { name: "Sun", key: "sun" },
  { name: "Moon", key: "moon" },
  { name: "Mercury", key: "mercury" },
  { name: "Venus", key: "venus" },
  { name: "Mars", key: "mars" },
  { name: "Jupiter", key: "jupiter" },
  { name: "Saturn", key: "saturn" },
  { name: "Uranus", key: "uranus" },
  { name: "Neptune", key: "neptune" },
  { name: "Pluto", key: "pluto" }
];

// Define aspect types with their orbs (allowed deviation)
const aspectTypes = [
  { name: "Conjunction", angle: 0, orb: 8, symbol: "☌" },
  { name: "Opposition", angle: 180, orb: 8, symbol: "☍" },
  { name: "Trine", angle: 120, orb: 8, symbol: "△" },
  { name: "Square", angle: 90, orb: 7, symbol: "□" },
  { name: "Sextile", angle: 60, orb: 6, symbol: "⚹" },
  { name: "Quincunx", angle: 150, orb: 5, symbol: "⚻" },
  { name: "Semi-Sextile", angle: 30, orb: 3, symbol: "⚺" }
];

// Function to determine the zodiac sign based on longitude
function getZodiacSign(longitude) {
  // Normalize longitude to 0-360 range
  const normalizedLongitude = ((longitude % 360) + 360) % 360;
  return zodiacSigns.find(sign => 
    normalizedLongitude >= sign.start && normalizedLongitude < sign.end
  );
}

// Function to calculate the position within a sign (0-30 degrees)
function getPositionInSign(longitude) {
  return longitude % 30;
}

// Function to calculate aspects between planets
function calculateAspects(planets) {
  const aspects = [];
  
  // Compare each planet with every other planet
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      // Calculate the angular difference between the two planets
      let angleDiff = Math.abs(planet1.longitude - planet2.longitude);
      
      // Ensure the angle is the shortest distance around the circle
      if (angleDiff > 180) {
        angleDiff = 360 - angleDiff;
      }
      
      // Check if this angle corresponds to any aspect type
      for (const aspectType of aspectTypes) {
        const orb = Math.abs(angleDiff - aspectType.angle);
        
        if (orb <= aspectType.orb) {
          aspects.push({
            planet1: planet1.name,
            planet2: planet2.name,
            type: aspectType.name,
            angle: parseFloat(angleDiff.toFixed(2)),
            orb: parseFloat(orb.toFixed(2)),
            symbol: aspectType.symbol
          });
          
          // Only record the first (closest) aspect between these planets
          break;
        }
      }
    }
  }
  
  return aspects;
}

// Function to calculate house positions (simplified)
function calculateHouses(date, lat, lng) {
  const houses = [];
  
  // This is a simplified approach - in a real implementation, 
  // you would use a more accurate house system calculation
  
  // Get Julian date for the calculation
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  
  // Calculate GMST (Greenwich Mean Sidereal Time)
  const jd0 = Math.floor(julianDate - 0.5) + 0.5; // Julian day at noon
  const T = (jd0 - 2451545.0) / 36525.0; // Julian centuries since J2000
  const gmst = 280.46061837 + 360.98564736629 * (julianDate - 2451545.0) + 
               0.000387933 * T * T - T * T * T / 38710000.0;
  
  // Calculate local sidereal time
  const lst = (gmst + lng) % 360;
  
  // Calculate ascendant (simplified)
  const ascendantLongitude = (lst + 90) % 360;
  
  // Generate houses based on the ascendant (equal house system)
  for (let i = 0; i < 12; i++) {
    const houseLongitude = (ascendantLongitude + (i * 30)) % 360;
    const sign = getZodiacSign(houseLongitude);
    
    // Make sure we have a valid sign before accessing its properties
    if (sign) {
      houses.push({
        number: i + 1,
        sign: sign.name,
        position: parseFloat(getPositionInSign(houseLongitude).toFixed(2))
      });
    } else {
      // Fallback if no sign is found (shouldn't happen with proper normalization)
      console.warn(`No zodiac sign found for house ${i+1} at longitude ${houseLongitude}`);
      houses.push({
        number: i + 1,
        sign: "Unknown",
        position: parseFloat((houseLongitude % 30).toFixed(2))
      });
    }
  }
  
  return houses;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract data from request body
      const { birthdate, birthtime, lat, lng, email, location } = req.body;

      // Log the request data for debugging
      console.log('Chart Calculation Request:', { birthdate, birthtime, lat, lng, email, location });

      // Validate required fields
      if (!birthdate || !birthtime || !lat || !lng) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse the birthdate and birthtime
      const [year, month, day] = birthdate.split('-').map(Number);
      const [hour, minute] = birthtime.split(':').map(Number);
      
      // Create a Date object for the birth time
      // Note: JavaScript months are 0-indexed
      const birthDate = new Date(year, month - 1, day, hour, minute);
      
      // Calculate planetary positions using ephemeris
      const result = ephemeris.getAllPlanets(
        birthDate,
        parseFloat(lng),
        parseFloat(lat),
        0 // height in meters
      );
      
      // Format the data for the response
      const formattedData = {
        planets: [],
        houses: calculateHouses(birthDate, parseFloat(lat), parseFloat(lng)),
        aspects: [],
      };
      
      // Process planet positions
      planets.forEach(planet => {
        if (result.observed[planet.key]) {
          const longitude = result.observed[planet.key].apparentLongitudeDd;
          const sign = getZodiacSign(longitude);
          const position = getPositionInSign(longitude);
          
          // Determine house (simplified)
          const houseIndex = Math.floor(longitude / 30) % 12;
          const house = (houseIndex + 1).toString();
          
          formattedData.planets.push({
            name: planet.name,
            sign: sign.name,
            position: parseFloat(position.toFixed(2)),
            house: house,
            longitude: parseFloat(longitude.toFixed(2))
          });
        }
      });
      
      // Calculate aspects between planets
      formattedData.aspects = calculateAspects(formattedData.planets);
      
      // Save the chart data to Supabase if email is provided
      if (email) {
        try {
          const { data, error } = await supabase
            .from('users')
            .upsert({
              email,
              name: email.split('@')[0], // Simple name extraction from email
              birthdate,
              birthtime,
              birth_location: location || 'Unknown',
              birth_lat: lat,
              birth_lng: lng,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'email',
              ignoreDuplicates: false
            })
            .select();

          if (error) {
            console.error('Error saving chart data to Supabase:', error);
          } else {
            console.log('Chart data saved to Supabase:', data);
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }

      return res.status(200).json({ 
        success: true, 
        astrologyData: formattedData,
        userEmail: email || null
      });
    } catch (error) {
      console.error('Error calculating chart:', error);
      return res.status(500).json({ 
        error: 'Error calculating chart',
        details: error.message
      });
    }
  } else if (req.method === 'GET') {
    // Handle GET request for retrieving chart data by email
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      // Fetch user data from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No chart data found for this email' });
      }

      // Use the first (most recent) record
      const userData = data[0];

      return res.status(200).json({ 
        success: true,
        astrologyData: userData.chart_data,
        userData: {
          id: userData.id,
          name: userData.name,
          birthdate: userData.birthdate,
          birthtime: userData.birthtime,
          birth_location: userData.birth_location,
          birth_lat: userData.birth_lat,
          birth_lng: userData.birth_lng,
          created_at: userData.created_at
        }
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return res.status(500).json({ error: 'Error fetching chart data' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 