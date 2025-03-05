import path from 'path';
import fs from 'fs';

// Constants for zodiac signs
const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', start: 0 },
  { name: 'Taurus', symbol: '♉', start: 30 },
  { name: 'Gemini', symbol: '♊', start: 60 },
  { name: 'Cancer', symbol: '♋', start: 90 },
  { name: 'Leo', symbol: '♌', start: 120 },
  { name: 'Virgo', symbol: '♍', start: 150 },
  { name: 'Libra', symbol: '♎', start: 180 },
  { name: 'Scorpio', symbol: '♏', start: 210 },
  { name: 'Sagittarius', symbol: '♐', start: 240 },
  { name: 'Capricorn', symbol: '♑', start: 270 },
  { name: 'Aquarius', symbol: '♒', start: 300 },
  { name: 'Pisces', symbol: '♓', start: 330 }
];

// Constants for moon phases
const MOON_PHASES = [
  { name: 'New Moon', range: [0, 45] },
  { name: 'Waxing Crescent', range: [45, 90] },
  { name: 'First Quarter', range: [90, 135] },
  { name: 'Waxing Gibbous', range: [135, 180] },
  { name: 'Full Moon', range: [180, 225] },
  { name: 'Waning Gibbous', range: [225, 270] },
  { name: 'Last Quarter', range: [270, 315] },
  { name: 'Waning Crescent', range: [315, 360] }
];

// Constants for Swiss Ephemeris
const SE_MOON = 1;
const SE_SUN = 0;
const SE_GREG_CAL = 1;
const SEFLG_SPEED = 256;
const SEFLG_SWIEPH = 2;
const SEFLG_EQUATORIAL = 2048;  // For equatorial coordinates
const SE_EQU2HOR = 16384;       // For azimuth/altitude conversion
const SEFLG_ECLIPTIC = 0;       // For ecliptic coordinates

// Observer settings (without location)
const OBSERVER_SETTINGS = {
  altitude: 0,          // meters above sea level
  pressure: 1013.25,    // millibars (standard atmospheric pressure at sea level)
  temperature: 15,      // degrees Celsius
};

// Required ephemeris files for basic operation
const REQUIRED_FILES = [
  'semo_18.se1',  // Main moon ephemeris file
  'sepl_18.se1',  // Main planetary positions file
  'sefstars.txt'  // Fixed stars data
];

// Helper function to calculate moon phase based on moon and sun longitudes
function calculateMoonPhase(moonLongitude, sunLongitude) {
  // Calculate the phase angle (distance between moon and sun)
  let phaseAngle = (moonLongitude - sunLongitude + 360) % 360;
  
  // Find the corresponding moon phase
  const phase = MOON_PHASES.find(phase => 
    phaseAngle >= phase.range[0] && phaseAngle < phase.range[1]
  );
  
  if (!phase) {
    throw new Error(`Could not determine moon phase for angle ${phaseAngle}`);
  }
  
  return {
    name: phase.name,
    angle: phaseAngle
  };
}

// Helper function to get zodiac sign based on longitude
function getZodiacSign(longitude) {
  // Find the zodiac sign based on the longitude
  const zodiacIndex = ZODIAC_SIGNS.findIndex((sign, index) => {
    const nextIndex = (index + 1) % 12;
    const nextStart = nextIndex === 0 ? 360 : ZODIAC_SIGNS[nextIndex].start;
    return longitude >= sign.start && longitude < nextStart;
  });
  
  if (zodiacIndex === -1) {
    throw new Error(`Could not determine zodiac sign for longitude ${longitude}`);
  }
  
  const sign = ZODIAC_SIGNS[zodiacIndex];
  
  // Calculate position within the sign
  const degreesInSign = longitude - sign.start;
  const degrees = Math.floor(degreesInSign);
  const minutes = Math.floor((degreesInSign - degrees) * 60);
  const seconds = Math.round(((degreesInSign - degrees) * 60 - minutes) * 60);
  
  // Handle case where seconds round up to 60
  let adjustedMinutes = minutes;
  let adjustedSeconds = seconds;
  let adjustedDegrees = degrees;
  
  if (adjustedSeconds === 60) {
    adjustedSeconds = 0;
    adjustedMinutes += 1;
    if (adjustedMinutes === 60) {
      adjustedMinutes = 0;
      adjustedDegrees += 1;
    }
  }
  
  return {
    name: sign.name,
    symbol: sign.symbol,
    degrees: adjustedDegrees,
    minutes: adjustedMinutes,
    seconds: adjustedSeconds,
    degreesTotal: longitude
  };
}

// Initialize Swiss Ephemeris
async function initializeSwissEph() {
  const swissephModule = await import('swisseph');
  const swisseph = swissephModule.default;
  const ephePath = path.join(process.cwd(), 'swisseph-master', 'ephe');
  swisseph.swe_set_ephe_path(ephePath);

  // Test date
  const testDate = new Date(2024, 4, 22, 0, 1);
  const jd = swisseph.swe_julday(
    testDate.getFullYear(),
    testDate.getMonth() + 1,
    testDate.getDate(),
    testDate.getHours() + testDate.getMinutes() / 60.0,
    swisseph.SE_GREG_CAL
  );

  // Calculate moon position with equatorial coordinates
  const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH | swisseph.SEFLG_EQUATORIAL;
  const moonXX = new Buffer.alloc(6 * 8); // 6 doubles
  const sunXX = new Buffer.alloc(6 * 8);  // 6 doubles
  const serr = new Buffer.alloc(256);     // error string buffer

  // Calculate moon position
  const moonResult = swisseph.swe_calc_ut(jd, swisseph.SE_MOON, flags, moonXX, serr);
  if (moonResult < 0) {
    throw new Error(`Failed to calculate moon position: ${serr.toString()}`);
  }

  // Calculate sun position
  const sunResult = swisseph.swe_calc_ut(jd, swisseph.SE_SUN, flags, sunXX, serr);
  if (sunResult < 0) {
    throw new Error(`Failed to calculate sun position: ${serr.toString()}`);
  }

  // Calculate altitude and azimuth
  const geopos = [DEFAULT_OBSERVER.longitude, DEFAULT_OBSERVER.latitude, DEFAULT_OBSERVER.altitude];
  const xin = [moonXX.readDoubleLE(0), moonXX.readDoubleLE(8)];
  const xaz = new Buffer.alloc(3 * 8); // 3 doubles for azimuth, true altitude, apparent altitude

  swisseph.swe_azalt(
    jd,
    swisseph.SE_EQU2HOR,
    geopos,
    DEFAULT_OBSERVER.pressure,
    DEFAULT_OBSERVER.temperature,
    xin,
    xaz
  );

  // Cleanup
  swisseph.swe_close();
  
  return {
    moon: {
      longitude: moonXX.readDoubleLE(0),
      latitude: moonXX.readDoubleLE(8),
      distance: moonXX.readDoubleLE(16),
      longitudeSpeed: moonXX.readDoubleLE(24),
      latitudeSpeed: moonXX.readDoubleLE(32),
      distanceSpeed: moonXX.readDoubleLE(40),
      azimuth: xaz.readDoubleLE(0),
      altitude: xaz.readDoubleLE(8),
      apparentAltitude: xaz.readDoubleLE(16)
    },
    sun: {
      longitude: sunXX.readDoubleLE(0),
      latitude: sunXX.readDoubleLE(8),
      distance: sunXX.readDoubleLE(16),
      longitudeSpeed: sunXX.readDoubleLE(24),
      latitudeSpeed: sunXX.readDoubleLE(32),
      distanceSpeed: sunXX.readDoubleLE(40)
    }
  };
}

export default async function handler(req, res) {
  try {
    // Get location from request body
    const userLocation = req.body?.location;

    // Initialize Swiss Ephemeris
    const swissephModule = await import('swisseph');
    const swisseph = swissephModule.default;
    const ephePath = path.join(process.cwd(), 'swisseph-master', 'ephe');
    swisseph.swe_set_ephe_path(ephePath);
    console.log('Swiss Ephemeris initialized successfully');

    // Calculate current date in Julian days with millisecond precision
    const now = new Date();
    const jd = swisseph.swe_julday(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      now.getUTCHours() + 
      now.getUTCMinutes() / 60.0 + 
      now.getUTCSeconds() / 3600.0 + 
      now.getUTCMilliseconds() / 3600000.0,
      swisseph.SE_GREG_CAL
    );

    // Calculate moon position in ecliptic coordinates for phase calculation
    const eclipticFlags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH;
    const moonEcliptic = swisseph.swe_calc_ut(jd, swisseph.SE_MOON, eclipticFlags);
    const sunEcliptic = swisseph.swe_calc_ut(jd, swisseph.SE_SUN, eclipticFlags);

    if (!moonEcliptic || moonEcliptic.error) {
      throw new Error('Moon position calculation failed: ' + (moonEcliptic?.error || 'null result'));
    }
    if (!sunEcliptic || sunEcliptic.error) {
      throw new Error('Sun position calculation failed: ' + (sunEcliptic?.error || 'null result'));
    }

    // Calculate moon phase using ecliptic longitudes
    const moonPhase = calculateMoonPhase(moonEcliptic.longitude, sunEcliptic.longitude);

    // Calculate equatorial coordinates for display
    const equatorialFlags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH | swisseph.SEFLG_EQUATORIAL;
    const moonEquatorial = swisseph.swe_calc_ut(jd, swisseph.SE_MOON, equatorialFlags);

    if (!moonEquatorial || moonEquatorial.error) {
      throw new Error('Moon equatorial calculation failed: ' + (moonEquatorial?.error || 'null result'));
    }

    // Calculate altitude and azimuth only if location is provided
    let altitudeData = null;
    if (userLocation) {
      const geopos = [userLocation.longitude, userLocation.latitude, OBSERVER_SETTINGS.altitude];
      const xin = [moonEquatorial.longitude, moonEquatorial.latitude];
      const xaz = new Array(3);

      swisseph.swe_azalt(
        jd,
        swisseph.SE_EQU2HOR,
        geopos,
        OBSERVER_SETTINGS.pressure,
        OBSERVER_SETTINGS.temperature,
        xin,
        xaz
      );

      altitudeData = {
        azimuth: xaz[0],
        trueAltitude: xaz[1],
        apparentAltitude: xaz[2]
      };
    }

    // Calculate zodiac sign using ecliptic longitude
    const zodiacSign = getZodiacSign(moonEcliptic.longitude);

    // Clean up
    swisseph.swe_close();

    // Disable caching for real-time updates
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Expires', '0');

    // Return the data in the structure expected by the component
    res.status(200).json({
      moonLongitude: moonEcliptic.longitude,
      moonLatitude: moonEcliptic.latitude,
      moonDistance: moonEcliptic.distance,
      moonPhase: {
        name: moonPhase.name,
        angle: moonPhase.angle
      },
      zodiacSign: {
        name: zodiacSign.name,
        symbol: zodiacSign.symbol,
        degrees: zodiacSign.degrees,
        minutes: zodiacSign.minutes,
        seconds: Math.round(zodiacSign.seconds)
      },
      ...(altitudeData && { altitude: altitudeData })
    });
  } catch (error) {
    console.error('Error in moon position calculation:', error);
    res.status(500).json({
      error: 'Failed to calculate moon position',
      details: {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
} 