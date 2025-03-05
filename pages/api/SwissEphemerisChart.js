import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js/2.0.0',
      },
    },
  }
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

// Map of planets to their Swiss Ephemeris indices
const planetIndices = {
  Sun: 0,
  Moon: 1,
  Mercury: 2,
  Venus: 3,
  Mars: 4,
  Jupiter: 5,
  Saturn: 6,
  Uranus: 7,
  Neptune: 8,
  Pluto: 9,
  Chiron: 15,
  "Black Moon Lilith": 13
};

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
  return { degrees: degs, minutes: mins, seconds: secs };
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
          break;
        }
      }
    }
  }
  
  return aspects;
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
        name,
        location,
        utc_offset 
      } = req.body;

      // Validate required fields
      if (!birthdate || !birthtime || !lat || !lng) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse the birthdate and birthtime
      const [year, month, day] = birthdate.split('-').map(Number);
      const [hour, minute, second = 0] = birthtime.split(':').map(Number);
      
      // Parse UTC offset from string (e.g., "UTC-07:00" -> -7)
      const utcOffsetHours = utc_offset 
        ? parseFloat(utc_offset.toString().replace('UTC', '')) 
        : 0;

      console.log('Input date/time:', {
        year, month, day,
        hour, minute, second,
        utcOffsetHours,
        birthdate,
        birthtime,
        utc_offset
      });

      // Initialize Swiss Ephemeris
      const swisseph = await import('swisseph');
      const ephePath = path.join(process.cwd(), 'swisseph-master', 'ephe');
      swisseph.swe_set_ephe_path(ephePath);

      // Set the calculation mode to use Moshier ephemeris
      const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_MOSEPH;

      // Initialize result object
      const result = {
        planets: [],
        houses: [],
        aspects: []
      };

      // Calculate Julian day for the birth time
      // For UTC-08:00, if local time is 10:16, UTC time is 18:16 of the same day
      // We need to SUBTRACT the offset hours because we're converting TO UTC
      // For negative offsets (west of GMT), we ADD the absolute value
      // For positive offsets (east of GMT), we SUBTRACT
      const adjustedHours = hour + minute / 60.0 + second / 3600.0 - utcOffsetHours;
      console.log('Local time:', `${hour}:${minute}:${second}`);
      console.log('UTC offset:', utcOffsetHours);
      console.log('Adjusted hours (UTC):', adjustedHours);
      
      // If adjusted hours goes over 24 or under 0, we need to adjust the day
      let adjustedDay = day;
      let finalHours = adjustedHours;
      if (adjustedHours >= 24) {
        adjustedDay = day + 1;
        finalHours = adjustedHours - 24;
      } else if (adjustedHours < 0) {
        adjustedDay = day - 1;
        finalHours = adjustedHours + 24;
      }
      
      console.log('Final calculation values:', {
        year,
        month,
        adjustedDay,
        finalHours
      });

      const julianDay = swisseph.swe_julday(
        year,
        month,
        adjustedDay,
        finalHours,
        swisseph.SE_GREG_CAL
      );

      console.log('Julian Day:', julianDay);

      // Double check the date by converting Julian Day back to calendar date
      const calendarDate = swisseph.swe_revjul(julianDay, swisseph.SE_GREG_CAL);
      console.log('Calendar date from Julian Day:', calendarDate);

      // Calculate positions for all planets
      const planets = [
        { id: swisseph.SE_SUN, name: 'Sun' },
        { id: swisseph.SE_MOON, name: 'Moon' },
        { id: swisseph.SE_MERCURY, name: 'Mercury' },
        { id: swisseph.SE_VENUS, name: 'Venus' },
        { id: swisseph.SE_MARS, name: 'Mars' },
        { id: swisseph.SE_JUPITER, name: 'Jupiter' },
        { id: swisseph.SE_SATURN, name: 'Saturn' },
        { id: swisseph.SE_URANUS, name: 'Uranus' },
        { id: swisseph.SE_NEPTUNE, name: 'Neptune' },
        { id: swisseph.SE_PLUTO, name: 'Pluto' }
      ];

      for (const planet of planets) {
        const calc = swisseph.swe_calc_ut(julianDay, planet.id, flags);
        
        if (!calc || calc.error) {
          console.error(`Error calculating ${planet.name} position:`, calc?.error);
          continue;
        }

        result.planets.push({
          name: planet.name,
          longitude: parseFloat(calc.longitude.toFixed(6)),
          latitude: parseFloat(calc.latitude.toFixed(6)),
          distance: parseFloat(calc.distance.toFixed(6)),
          longitudeSpeed: parseFloat(calc.longitudeSpeed.toFixed(6)),
          latitudeSpeed: parseFloat(calc.latitudeSpeed.toFixed(6)),
          distanceSpeed: parseFloat(calc.distanceSpeed.toFixed(6))
        });
      }

      // If no planets were calculated successfully, throw an error
      if (result.planets.length === 0) {
        throw new Error('Failed to calculate any planet positions');
      }

      // Calculate house cusps using Placidus system
      const geopos = [parseFloat(lng), parseFloat(lat), 0]; // longitude, latitude, altitude
      const houses = swisseph.swe_houses(
        julianDay,
        geopos[1], // latitude
        geopos[0], // longitude
        'P' // Placidus house system
      );

      if (!houses || houses.error) {
        throw new Error('Error calculating houses: ' + houses?.error);
      }

      console.log('Houses result:', houses); // Debug log

      // Format house cusps
      const cusps = houses.house; // Get the house cusps array
      if (!cusps || !Array.isArray(cusps)) {
        throw new Error('Invalid house cusps data');
      }

      // Add house cusps to result
      for (let i = 0; i < 12; i++) {
        result.houses.push({
          number: i + 1,
          longitude: parseFloat(cusps[i].toFixed(6))
        });
      }

      // Add Ascendant and Midheaven
      if (typeof houses.ascendant === 'number') {
        result.ascendant = parseFloat(houses.ascendant.toFixed(6));
      } else {
        result.ascendant = result.houses[0]?.longitude || 0;
      }

      if (typeof houses.mc === 'number') {
        result.midheaven = parseFloat(houses.mc.toFixed(6));
      } else {
        result.midheaven = result.houses[9]?.longitude || 0;
      }

      // Calculate house positions for each planet
      for (const planet of result.planets) {
        try {
          const housePosition = swisseph.swe_house_pos(
            result.ascendant,
            geopos[1], // latitude
            swisseph.SEFLG_SIDEREAL, // ecliptic
            planet.longitude
          );

          if (typeof housePosition === 'number') {
            planet.house = Math.floor(housePosition) + 1; // Add 1 since house numbers are 1-based
          } else {
            console.error(`Invalid house position for ${planet.name}`);
          }
        } catch (error) {
          console.error(`Error calculating house position for ${planet.name}:`, error);
        }
      }

      // Calculate aspects between planets
      result.aspects = calculateAspects(result.planets);

      // Clean up
      swisseph.swe_close();

      return res.status(200).json({ 
        success: true, 
        data: result,
        name,
        location,
        birthdate,
        birthtime,
        utc_offset
      });

    } catch (error) {
      console.error('Error calculating chart:', error);
      return res.status(500).json({ 
        error: 'Error calculating chart',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}