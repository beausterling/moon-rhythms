import { Box, Button, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, HStack, VStack, Grid, GridItem, Progress } from '@chakra-ui/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

const MoonPhaseLoop = ({ size = 500 }) => {
  const [currentHour, setCurrentHour] = useState(648);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(null);
  const [frameSkips, setFrameSkips] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef(null);
  const preloadedImages = useRef(new Map());
  
  const START_HOUR = 648;  // First new moon
  const END_HOUR = 8433;   // Last new moon
  const TOTAL_IMAGES = END_HOUR - START_HOUR + 1;
  const HIDE_CONTROLS_DELAY = 3000; // Hide controls after 3 seconds of inactivity

  // Handle mouse movement to show controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    // Clear existing timer
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    
    // Set new timer to hide controls
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, HIDE_CONTROLS_DELAY);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  const formatTime = (totalHours) => {
    return {
      hours: totalHours,
      days: Math.floor(totalHours / 24),
      weeks: Math.floor(totalHours / (24 * 7)),
      months: Math.floor(totalHours / (24 * 30))
    };
  };

  // Preload all images at startup
  useEffect(() => {
    let loadedCount = 0;
    const loadImage = (hour) => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        const imageUrl = `/moon-phases/moon.${hour.toString().padStart(4, '0')}.jpg`;
        
        img.onload = () => {
          preloadedImages.current.set(hour, img);
          loadedCount++;
          setLoadingProgress(Math.floor((loadedCount / TOTAL_IMAGES) * 100));
          resolve();
        };
        
        img.onerror = (error) => {
          console.error(`Failed to preload image for hour ${hour}:`, error);
          reject(error);
        };
        
        img.src = imageUrl;
      });
    };

    const preloadAllImages = async () => {
      const promises = [];
      for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        promises.push(loadImage(hour));
      }
      
      try {
        await Promise.all(promises);
        setIsLoading(false);
        setIsPlaying(true); // Auto-start when loaded
      } catch (error) {
        console.error('Failed to preload all images:', error);
        setImageLoadError(error);
      }
    };

    preloadAllImages();
  }, []);

  const updateHour = useCallback(() => {
    if (isPlaying) {
      setCurrentHour(hour => {
        const nextHour = hour >= END_HOUR ? START_HOUR : hour + 1;
        if (nextHour - hour > 1 && nextHour !== START_HOUR) {
          console.warn(`Hour jump detected: ${hour} -> ${nextHour}`);
          setFrameSkips(skips => skips + 1);
        }
        return nextHour;
      });
    }
  }, [isPlaying]);

  // Animation loop with fixed timing for 30fps
  useEffect(() => {
    if (isLoading) return;
    
    let lastTimestamp = performance.now();
    const targetFrameTime = 1000 / 30; // 30fps

    const animate = (timestamp) => {
      if (isPlaying) {
        const elapsed = timestamp - lastTimestamp;
        if (elapsed >= targetFrameTime) {
          updateHour();
          lastTimestamp = timestamp;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    let animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [updateHour, isPlaying, isLoading]);

  const time = formatTime(currentHour - START_HOUR); // Normalize to start from 0

  if (isLoading) {
    return (
      <VStack spacing={4} align="center" w="100%" maxW="800px" mx="auto" p={4}>
        <Text>Loading moon phases... {loadingProgress}%</Text>
        <Progress hasStripe value={loadingProgress} w="100%" />
      </VStack>
    );
  }

  return (
    <VStack 
      spacing={6} 
      align="center" 
      w="100%" 
      maxW="800px" 
      mx="auto" 
      p={4}
      onMouseMove={handleMouseMove}
      position="relative"
    >
      <Box 
        width={`${size}px`} 
        height={`${size}px`} 
        bg="black" 
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor={showControls ? 'auto' : 'none'}
      >
        <img
          src={`/moon-phases/moon.${currentHour.toString().padStart(4, '0')}.jpg`}
          alt={`Moon phase at hour ${currentHour - START_HOUR}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </Box>

      <VStack spacing={4} w="100%">
        {/* Controls with fade effect */}
        <HStack 
          spacing={4} 
          w="100%" 
          h="40px"
          opacity={showControls ? 1 : 0}
          transition="opacity 0.3s ease-in-out"
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            w="40px"
            h="40px"
            p={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
          </Button>
          <Slider
            value={currentHour}
            min={START_HOUR}
            max={END_HOUR}
            onChange={(v) => {
              const newHour = Math.floor(v);
              setCurrentHour(newHour);
            }}
            flex={1}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </HStack>

        {/* Time display - always visible */}
        <Grid templateColumns="repeat(4, auto)" gap={2} w="100%" color="white" justifyContent="center">
          <GridItem>
            <Box display="flex" justifyContent="center" alignItems="center" fontFamily="mono" whiteSpace="nowrap">
              <Text as="span" fontWeight="bold" w="4ch" textAlign="right">{time.hours}</Text>
              <Text as="span" ml={1}>h</Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box display="flex" justifyContent="center" alignItems="center" fontFamily="mono" whiteSpace="nowrap">
              <Text as="span" fontWeight="bold" w="4ch" textAlign="right">{time.days}</Text>
              <Text as="span" ml={1}>d</Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box display="flex" justifyContent="center" alignItems="center" fontFamily="mono" whiteSpace="nowrap">
              <Text as="span" fontWeight="bold" w="4ch" textAlign="right">{time.weeks}</Text>
              <Text as="span" ml={1}>w</Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box display="flex" justifyContent="center" alignItems="center" fontFamily="mono" whiteSpace="nowrap">
              <Text as="span" fontWeight="bold" w="4ch" textAlign="right">{time.months}</Text>
              <Text as="span" ml={1}>m</Text>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </VStack>
  );
};

export default MoonPhaseLoop; 