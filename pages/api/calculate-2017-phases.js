import swisseph from 'swisseph';
import path from 'path';

// Initialize Swiss Ephemeris with the path to ephemeris files
const initializeSwissEph = () => {
  const ephePath = path.join(process.cwd(), 'ephe');
  swisseph.swe_set_ephe_path(ephePath);
};

// Calculate moon phase angle for a specific date/time
const calculatePhaseAngle = (julday) => {
  try {
    const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH;
    
    // Calculate moon position
    const moonResult = swisseph.swe_calc_ut(julday, swisseph.SE_MOON, flags);
    if (moonResult.error) {
      throw new Error(`Moon calculation error: ${moonResult.error}`);
    }
    
    // Calculate sun position
    const sunResult = swisseph.swe_calc_ut(julday, swisseph.SE_SUN, flags);
    if (sunResult.error) {
      throw new Error(`Sun calculation error: ${sunResult.error}`);
    }

    // Calculate phase angle (difference between moon and sun longitudes)
    let phaseAngle = moonResult.longitude - sunResult.longitude;
    
    // Normalize to 0-360 range
    phaseAngle = ((phaseAngle % 360) + 360) % 360;
    
    return phaseAngle;
  } catch (error) {
    console.error('Error calculating phase angle:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  try {
    initializeSwissEph();
    
    const phaseAngles = {};
    
    // Calculate phase angle for December 31, 2016 23:00 UT
    const preStartDate = new Date('2016-12-31T23:00:00Z');
    const preStartJulday = swisseph.swe_julday(
      preStartDate.getUTCFullYear(),
      preStartDate.getUTCMonth() + 1,
      preStartDate.getUTCDate(),
      23, // hour
      swisseph.SE_GREG_CAL
    );
    const preStartPhase = calculatePhaseAngle(preStartJulday);

    // Start at January 1, 2017 00:00:00 UT
    const startDate = new Date('2017-01-01T00:00:00Z');
    let julday = swisseph.swe_julday(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      startDate.getUTCDate(),
      0, // hour
      swisseph.SE_GREG_CAL
    );

    // Calculate phase angle for each hour of 2017
    for (let hour = 0; hour < 8760; hour++) {
      const currentJulday = julday + (hour / 24);
      const phaseAngle = calculatePhaseAngle(currentJulday);
      phaseAngles[hour + 1] = phaseAngle;
    }

    // Clean up
    swisseph.swe_close();
    
    res.status(200).json({
      success: true,
      phaseAngles,
      metadata: {
        startDate: startDate.toISOString(),
        totalHours: 8760,
        preStartPhase: preStartPhase,
        startPhase: phaseAngles[1],
        endPhase: phaseAngles[8760],
        description: 'Phase angles for each hour of 2017, starting at 00:00 UT on January 1st'
      }
    });
  } catch (error) {
    console.error('Error in phase angle calculation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
} 