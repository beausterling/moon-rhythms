import { createClient } from '@supabase/supabase-js';
import sweph from 'sweph';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // Set this to true to bypass RLS policies
    global: {
      headers: {
        'X-Client-Info': 'supabase-js/2.0.0',
      },
    },
  }
);

// Swiss Ephemeris constants
const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_URANUS = 7;
const SE_NEPTUNE = 8;
const SE_PLUTO = 9;

// Calculation flags
const SEFLG_SWIEPH = 2;       // use Swiss Ephemeris
const SEFLG_SPEED = 256;      // high precision speed 
const SEFLG_EQUATORIAL = 2048; // equatorial positions are wanted

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

// Define aspect types with their orbs
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
  return ((longitude % 30) + 30) % 30;
}

// Function to format degrees to degrees, minutes, seconds
function formatDegrees(degrees) {
  const totalSeconds = Math.round(degrees * 3600);
  const degs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${degs}° ${mins}' ${secs}"`;
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

// Function to adjust time for timezone
function adjustTimeForTimezone(date, utcOffset) {
  // Create a new date object to avoid modifying the original
  const adjustedDate = new Date(date);
  
  // Parse the UTC offset (format: UTC+/-HH:MM)
  const offsetMatch = utcOffset.match(/UTC([+-])(\d{2}):(\d{2})/);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? -1 : 1; // Note: we invert the sign because we're converting local to UTC
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3], 10);
    
    // Calculate offset in minutes
    const offsetMinutes = sign * (hours * 60 + minutes);
    
    // Adjust the date by the offset
    adjustedDate.setMinutes(adjustedDate.getMinutes() + offsetMinutes);
    
    console.log(`Adjusted time from ${date.toISOString()} to ${adjustedDate.toISOString()} (offset: ${utcOffset})`);
  } else {
    console.warn(`Could not parse UTC offset: ${utcOffset}`);
  }
  
  return adjustedDate;
}

// Function to determine which house a planet is in
function determineHouse(planetLongitude, houseCusps) {
  // Normalize longitude to 0-360 range
  const normalizedLongitude = ((planetLongitude % 360) + 360) % 360;
  
  console.log(`House cusps:`, houseCusps.map(cusp => ((cusp % 360) + 360) % 360));
  console.log(`Planet longitude: ${normalizedLongitude}`);
  
  // Special handling for 12th house - check if planet is between 12th house cusp and Ascendant
  const asc = ((houseCusps[0] % 360) + 360) % 360;
  const house12Cusp = ((houseCusps[11] % 360) + 360) % 360;
  
  if ((house12Cusp < asc && (normalizedLongitude >= house12Cusp && normalizedLongitude < asc)) ||
      (house12Cusp > asc && (normalizedLongitude >= house12Cusp || normalizedLongitude < asc))) {
    console.log(`Planet at ${normalizedLongitude}° is in house 12 (${house12Cusp}° to ${asc}°)`);
    return 12;
  }
  
  // Loop through houses 1-11 (we already handled 12 above)
  for (let i = 1; i <= 11; i++) {
    const thisHouseCusp = ((houseCusps[i-1] % 360) + 360) % 360;
    const nextHouseCusp = ((houseCusps[i] % 360) + 360) % 360;
    
    // Check if planet is in this house
    if (nextHouseCusp > thisHouseCusp) {
      // House doesn't cross 0°
      if (normalizedLongitude >= thisHouseCusp && normalizedLongitude < nextHouseCusp) {
        console.log(`Planet at ${normalizedLongitude}° is in house ${i} (${thisHouseCusp}° to ${nextHouseCusp}°)`);
        return i;
      }
    } else {
      // House crosses 0°
      if (normalizedLongitude >= thisHouseCusp || normalizedLongitude < nextHouseCusp) {
        console.log(`Planet at ${normalizedLongitude}° is in house ${i} (${thisHouseCusp}° to ${nextHouseCusp}°)`);
        return i;
      }
    }
  }
  
  // Fallback (should never happen)
  console.error(`Could not determine house for longitude ${planetLongitude}`);
  return 1;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract data from request body
      const { 
        birthdate, 
        birthtime, 
        lat, 
        lng, 
        email, 
        name,
        location_name,
        utc_offset 
      } = req.body;

      // Log the request data for debugging
      console.log('Chart Calculation Request:', { 
        birthdate, 
        birthtime, 
        lat, 
        lng, 
        email, 
        name,
        location_name,
        utc_offset 
      });

      // Validate required fields
      if (!birthdate || !birthtime || !lat || !lng) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse the birthdate and birthtime
      const [year, month, day] = birthdate.split('-').map(Number);
      const [hour, minute, second = 0] = birthtime.split(':').map(Number);
      
      // Create a Date object for the birth time (local time)
      // Note: JavaScript months are 0-indexed
      let birthDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
      
      // Adjust for timezone if provided
      if (utc_offset) {
        birthDate = adjustTimeForTimezone(birthDate, utc_offset);
      }
      
      console.log(`Using birth date: ${birthDate.toISOString()} for calculations`);
      
      // Initialize Swiss Ephemeris
      sweph.set_ephe_path(null); // Use Moshier algorithm (no data files needed)
      console.log('Using Moshier algorithm for calculations');
      
      // Calculate Julian day for the birth time (UT)
      const julianDay = sweph.julday(
        birthDate.getUTCFullYear(),
        birthDate.getUTCMonth() + 1, // sweph months are 1-indexed
        birthDate.getUTCDate(),
        birthDate.getUTCHours() + birthDate.getUTCMinutes() / 60.0 + birthDate.getUTCSeconds() / 3600.0,
        1 // 1 for Gregorian calendar (SE_GREG_CAL)
      );
      
      console.log(`Julian day for birth time: ${julianDay}`);
      
      // Set calculation flags
      const flags = SEFLG_SWIEPH | SEFLG_SPEED;
      
      // Calculate houses using Placidus system
      const houses = sweph.houses(
        julianDay,
        parseFloat(lat),
        parseFloat(lng),
        'P' // Placidus house system
      );
      
      console.log('Houses calculation result:', houses);
      console.log('Ascendant:', houses.data.points[0]);
      console.log('MC:', houses.data.points[1]);
      
      // Format the data for the response
      const formattedData = {
        planets: [],
        houses: [],
        aspects: [],
      };
      
      // Format houses data
      for (let i = 0; i < 12; i++) {
        const longitude = houses.data.houses[i];
        const sign = getZodiacSign(longitude);
        const position = getPositionInSign(longitude);
        
        formattedData.houses.push({
          number: i + 1,
          sign: sign.name,
          position: parseFloat(position.toFixed(2)),
          positionFormatted: formatDegrees(position),
          longitude: parseFloat(longitude.toFixed(2))
        });
      }
      
      // Define planets to calculate
      const planetsToCalculate = [
        { name: "Sun", id: SE_SUN },
        { name: "Moon", id: SE_MOON },
        { name: "Mercury", id: SE_MERCURY },
        { name: "Venus", id: SE_VENUS },
        { name: "Mars", id: SE_MARS },
        { name: "Jupiter", id: SE_JUPITER },
        { name: "Saturn", id: SE_SATURN },
        { name: "Uranus", id: SE_URANUS },
        { name: "Neptune", id: SE_NEPTUNE },
        { name: "Pluto", id: SE_PLUTO }
      ];
      
      // Calculate planet positions
      for (const planet of planetsToCalculate) {
        const result = sweph.calc_ut(julianDay, planet.id, flags);
        
        if (result && result.data) {
          const longitude = result.data[0]; // Longitude is the first element in the data array
          const sign = getZodiacSign(longitude);
          const position = getPositionInSign(longitude);
          
          // Determine house
          const house = determineHouse(longitude, houses.data.houses);
          
          // Log detailed information for the Sun
          if (planet.name === "Sun") {
            console.log("SUN CALCULATION DETAILS:");
            console.log("- Raw longitude:", longitude);
            console.log("- Normalized longitude:", ((longitude % 360) + 360) % 360);
            console.log("- Sign:", sign.name);
            console.log("- Position in sign:", position);
            console.log("- House:", house);
            console.log("- Julian day used:", julianDay);
            console.log("- Calculation flags:", flags);
            
            // Log house cusps for debugging
            console.log("House cusps:");
            houses.data.houses.forEach((cusp, i) => {
              console.log(`House ${i+1}: ${((cusp % 360) + 360) % 360}°`);
            });
          }
          
          formattedData.planets.push({
            name: planet.name,
            sign: sign.name,
            position: parseFloat(position.toFixed(2)),
            positionFormatted: formatDegrees(position),
            positionDMS: {
              degrees: Math.floor(position),
              minutes: Math.floor((position - Math.floor(position)) * 60),
              seconds: Math.round(((position - Math.floor(position)) * 60 - Math.floor((position - Math.floor(position)) * 60)) * 60)
            },
            house: house.toString(),
            longitude: parseFloat(longitude.toFixed(2)),
            speed: parseFloat(result.data[3].toFixed(6)) // Daily motion in longitude
          });
        }
      }
      
      // Calculate aspects between planets
      formattedData.aspects = calculateAspects(formattedData.planets);
      
      // Add additional chart data
      formattedData.ascendant = {
        longitude: parseFloat(houses.data.points[0].toFixed(2)),
        sign: getZodiacSign(houses.data.points[0]).name,
        position: parseFloat(getPositionInSign(houses.data.points[0]).toFixed(2)),
        positionFormatted: formatDegrees(getPositionInSign(houses.data.points[0]))
      };
      
      formattedData.midheaven = {
        longitude: parseFloat(houses.data.points[1].toFixed(2)),
        sign: getZodiacSign(houses.data.points[1]).name,
        position: parseFloat(getPositionInSign(houses.data.points[1]).toFixed(2)),
        positionFormatted: formatDegrees(getPositionInSign(houses.data.points[1]))
      };
      
      // Save the chart data to Supabase if email is provided
      if (email) {
        try {
          // Create a structured chart_data object
          const chart_data = {
            planets: formattedData.planets.map(planet => ({
              name: planet.name,
              sign: planet.sign,
              position: planet.position,
              positionFormatted: planet.positionFormatted,
              positionDMS: planet.positionDMS,
              house: planet.house,
              longitude: planet.longitude,
              speed: planet.speed
            })),
            houses: formattedData.houses.map(house => ({
              number: house.number,
              sign: house.sign,
              position: house.position,
              positionFormatted: house.positionFormatted,
              longitude: house.longitude
            })),
            aspects: formattedData.aspects.map(aspect => ({
              planet1: aspect.planet1,
              planet2: aspect.planet2,
              type: aspect.type,
              angle: aspect.angle,
              orb: aspect.orb,
              symbol: aspect.symbol
            })),
            ascendant: {
              longitude: formattedData.ascendant.longitude,
              sign: formattedData.ascendant.sign,
              position: formattedData.ascendant.position,
              positionFormatted: formattedData.ascendant.positionFormatted
            },
            midheaven: {
              longitude: formattedData.midheaven.longitude,
              sign: formattedData.midheaven.sign,
              position: formattedData.midheaven.position,
              positionFormatted: formattedData.midheaven.positionFormatted
            },
            utc_offset: utc_offset
          };

          console.log('Saving to Supabase with data:', {
            email,
            name,
            birthdate,
            birthtime,
            location_name,
            birth_lat: lat,
            birth_lng: lng,
            utc_offset,
            chart_data_keys: Object.keys(chart_data)
          });

          const { data, error } = await supabaseAdmin
            .from('users')
            .upsert({
              email: email,
              name: name,
              birthdate: birthdate,
              birthtime: birthtime,
              location_name: location_name,
              birth_lat: lat,
              birth_lng: lng,
              utc_offset: utc_offset,
              chart_data: chart_data
            }, { onConflict: 'email' });

          if (error) {
            console.error('Error saving chart data to Supabase:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            // Continue with the response even if there's an error saving to Supabase
          } else {
            console.log('User data saved to Supabase:', data);
          }
        } catch (error) {
          console.error('Error in Supabase save operation:', error);
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
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching user data from Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        console.log('No data found for email:', email);
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