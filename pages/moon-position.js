import { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Spinner, useColorModeValue, Button, 
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import MoonVisualization from '../components/MoonVisualization';
import { useRouter } from 'next/router';

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

export default function MoonPosition() {
  const router = useRouter();
  const [moonData, setMoonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  const bgColor = useColorModeValue('black', 'black');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const moonColor = useColorModeValue('blue.300', 'blue.300');
  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Please enable location services to see the Moon's position in your local sky.");
          setLocation(null);
        }
      );
    } else {
      setLocationError("Your browser doesn't support geolocation. Local sky position cannot be shown.");
      setLocation(null);
    }
  }, []);

  const fetchMoonPosition = async () => {
    try {
      const response = await fetch('/api/moon-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ location })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch moon position');
      }
      const data = await response.json();
      setMoonData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching moon position:', err);
      setError('Failed to fetch moon position. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on first render
    fetchMoonPosition();
    
    // Update every 100ms for smooth motion
    const intervalId = setInterval(fetchMoonPosition, 100);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return (
      <Container centerContent maxW="container.md" py={10}>
        <VStack spacing={6}>
          <Heading as="h1" size="xl">Moon Position Tracker</Heading>
          <Text color="red.500">{error}</Text>
          <Button colorScheme="blue" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container centerContent maxW="container.md" py={10} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="center" w="full">
        <Heading as="h1" size="xl" color={textColor}>
          Moon Position Tracker
        </Heading>
        
        {loading || !moonData ? (
          <Spinner size="xl" color={moonColor} thickness="4px" />
        ) : (
          <>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => router.push('/moon-phase-loop')}
              mb={4}
            >
              View Moon Phase Animation
            </Button>

            <MoonVisualization phase={moonData.moonPhase.angle} size={250} />
            
            <VStack 
              spacing={4} 
              align="center" 
              p={6} 
              bg={cardBg} 
              borderRadius="lg" 
              shadow="md" 
              w="full" 
              maxW="md"
            >
              <HStack spacing={3}>
                <Text fontSize="4xl" fontWeight="bold" color={moonColor}>
                  {moonData.zodiacSign.symbol}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  {moonData.zodiacSign.name}
                </Text>
              </HStack>
              
              <Text fontSize="xl" color={textColor}>
                {moonData.zodiacSign.degrees}° {moonData.zodiacSign.minutes}' {moonData.zodiacSign.seconds.toString().padStart(2, '0')}"
              </Text>
              
              <Text fontSize="lg" color={textColor} fontWeight="medium">
                Phase: {moonData.moonPhase.name}
              </Text>
              
              <Text fontSize="sm" color={mutedTextColor} mt={2}>
                Updated: {new Date().toLocaleTimeString()}
              </Text>
            </VStack>
            
            <VStack 
              spacing={4} 
              align="center" 
              p={6} 
              bg={cardBg} 
              borderRadius="lg" 
              shadow="md" 
              w="full" 
              maxW="md"
            >
              <Heading size="md" mb={2}>Detailed Position</Heading>
              <HStack spacing={3} w="full" justify="space-between">
                <Text>Longitude:</Text>
                <Text>{moonData.moonLongitude.toFixed(4)}°</Text>
              </HStack>
              <HStack spacing={3} w="full" justify="space-between">
                <Text>Latitude:</Text>
                <Text>{moonData.moonLatitude.toFixed(4)}°</Text>
              </HStack>
              <HStack spacing={3} w="full" justify="space-between">
                <Text>Distance:</Text>
                <Text>{(moonData.moonDistance * 149597870.7).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} km</Text>
              </HStack>
            </VStack>

            {/* Local Position Section */}
            {location && moonData.altitude && (
              <VStack 
                spacing={4} 
                align="center" 
                p={6} 
                bg={cardBg} 
                borderRadius="lg" 
                shadow="md" 
                w="full" 
                maxW="md"
              >
                <Heading size="md" mb={2}>
                  Local Sky Position
                  <Text fontSize="sm" color={mutedTextColor} mt={1}>
                    Based on location: {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                  </Text>
                </Heading>
                <HStack spacing={3} w="full" justify="space-between">
                  <Text>Altitude:</Text>
                  <Text>{moonData.altitude.apparentAltitude.toFixed(2)}° above horizon</Text>
                </HStack>
                <HStack spacing={3} w="full" justify="space-between">
                  <Text>Azimuth:</Text>
                  <Text>{moonData.altitude.azimuth.toFixed(2)}°</Text>
                </HStack>
              </VStack>
            )}

            {locationError && (
              <Box bg="yellow.800" p={4} borderRadius="md" w="full" maxW="md">
                <Text color="yellow.100">{locationError}</Text>
              </Box>
            )}

            <Accordion allowToggle width="full" maxW="md">
              <AccordionItem border="none">
                <h2>
                  <AccordionButton 
                    _hover={{ bg: 'transparent' }}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    gap={2}
                    color={textColor}
                    fontSize="md"
                    fontWeight="medium"
                  >
                    <Text>How were these calculations made?</Text>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} color={mutedTextColor} fontSize="sm" textAlign="left">
                  We use a special astronomy calculator called Swiss Ephemeris to track the Moon's exact position. 
                  It measures where the Moon is in relation to Earth and the Sun, calculating its coordinates, 
                  determining which zodiac sign it's in, and showing its current phase. All of this updates in 
                  real-time, giving you the most up-to-date position of the Moon!
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
            
            <Text fontSize="xs" color={mutedTextColor}>
              Swiss Ephemeris © Astrodienst AG. For commercial use, please purchase a license.
            </Text>
          </>
        )}
      </VStack>
    </Container>
  );
} 