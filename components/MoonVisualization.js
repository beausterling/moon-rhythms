import { Box, Image as ChakraImage } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

// This map contains the actual phase angles for each hour of 2017
// Format: { imageNumber: phaseAngle }
// We'll populate this from an API endpoint that uses Swiss Ephemeris to calculate these values
const PHASE_ANGLE_MAP = {};

const MoonVisualization = ({ phase, size = 200 }) => {
  const [currentHour, setCurrentHour] = useState(648); // Start at first new moon of 2017
  const [lastLoadedHour, setLastLoadedHour] = useState(null);

  // Constants from our previous calculation
  const START_HOUR = 648;  // First new moon of 2017 (January 27, 23:00)
  const END_HOUR = 8433;   // Last new moon of 2017 (December 18, 08:00)
  
  // Update current hour based on phase
  useEffect(() => {
    // Normalize phase to 0-360 range
    const normalizedPhase = ((phase % 360) + 360) % 360;
    
    // Calculate which hour to show based on the phase
    // We want to map 0-360 degrees to START_HOUR-END_HOUR
    const hourRange = END_HOUR - START_HOUR;
    const hour = Math.round(START_HOUR + (normalizedPhase / 360) * hourRange);
    
    setCurrentHour(hour);
  }, [phase]);

  // Preload the next image
  useEffect(() => {
    const nextHour = currentHour >= END_HOUR ? START_HOUR : currentHour + 1;
    const img = new window.Image();
    img.src = `/moon-phases/moon.${nextHour.toString().padStart(4, '0')}.jpg`;
  }, [currentHour]);

  const handleImageLoad = () => {
    setLastLoadedHour(currentHour);
  };

  return (
    <Box position="relative">
      <Box 
        width={`${size}px`} 
        height={`${size}px`} 
        my={8}
        bg="black" 
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <ChakraImage
          src={`/moon-phases/moon.${currentHour.toString().padStart(4, '0')}.jpg`}
          alt={`Moon phase ${phase.toFixed(1)}°`}
          width="100%"
          height="100%"
          objectFit="contain"
          loading="eager"
          onLoad={handleImageLoad}
          fallback={lastLoadedHour ? (
            <ChakraImage
              src={`/moon-phases/moon.${lastLoadedHour.toString().padStart(4, '0')}.jpg`}
              alt={`Moon phase ${phase.toFixed(1)}° (fallback)`}
              width="100%"
              height="100%"
              objectFit="contain"
            />
          ) : null}
        />
      </Box>
    </Box>
  );
};

export default MoonVisualization; 