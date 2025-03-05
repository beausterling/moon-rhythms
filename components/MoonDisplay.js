import { useState, useEffect } from 'react';
import { Box, VStack, Text, Image, Container, Heading, Flex, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import MoonPhaseVisual from './MoonPhaseVisual';

export default function MoonDisplay() {
  const [moonData, setMoonData] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Get user's location
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

  useEffect(() => {
    const fetchMoonPosition = async () => {
      try {
        const response = await fetch('/api/moon-position', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ location })
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setMoonData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchMoonPosition();
    // Update every second
    const interval = setInterval(fetchMoonPosition, 1000);
    return () => clearInterval(interval);
  }, [location]);

  if (error) {
    return (
      <Box textAlign="center" p={8}>
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  if (!moonData) {
    return (
      <Box textAlign="center" p={8}>
        <Text>Loading moon data...</Text>
      </Box>
    );
  }

  // Format arc seconds with leading zeros
  const formatArcSeconds = (value) => value.toString().padStart(2, '0');

  function getAzimuthDirection(azimuth) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    return directions[Math.round(azimuth / 45) % 8];
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6}>
        <Heading as="h1" size="xl" mb={2}>
          Moon Position
        </Heading>

        {/* Moon Phase Visual */}
        <Box>
          <MoonPhaseVisual phaseAngle={moonData.moonPhase.angle} />
        </Box>

        {/* Moon Phase Info */}
        <Box 
          bg="white" 
          p={6} 
          borderRadius="lg" 
          boxShadow="sm"
          w="100%"
        >
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold">Current Phase:</Text>
              <Text fontSize="lg">{moonData.moonPhase.name}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold">Phase Angle:</Text>
              <Text fontSize="lg">{moonData.moonPhase.angle.toFixed(2)}°</Text>
            </Flex>
          </VStack>
        </Box>

        {/* Zodiac Position */}
        <Box 
          bg="white" 
          p={6} 
          borderRadius="lg" 
          boxShadow="sm"
          w="100%"
        >
          <Heading size="md" mb={4} textAlign="center">
            Position in the Sky
          </Heading>
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold">Sign:</Text>
              <Text fontSize="lg">{moonData.zodiacSign.symbol} {moonData.zodiacSign.name}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold">Position:</Text>
              <Text fontSize="lg">
                {moonData.zodiacSign.degrees}° {moonData.zodiacSign.minutes}' {formatArcSeconds(moonData.zodiacSign.seconds)}"
              </Text>
            </Flex>
          </VStack>
        </Box>

        {/* Detailed Position */}
        <Box 
          bg="white" 
          p={6} 
          borderRadius="lg" 
          boxShadow="sm"
          w="100%"
        >
          <Heading size="md" mb={4} textAlign="center">
            Detailed Position
          </Heading>
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between">
              <Text>Longitude:</Text>
              <Text>{moonData.moonLongitude.toFixed(6)}°</Text>
            </Flex>
            <Flex justify="space-between">
              <Text>Latitude:</Text>
              <Text>{moonData.moonLatitude.toFixed(6)}°</Text>
            </Flex>
            <Flex justify="space-between">
              <Text>Distance:</Text>
              <Text>{(moonData.moonDistance * 149597870.7).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} km</Text>
            </Flex>
          </VStack>
        </Box>

        {/* Local Position - Only show if location is available */}
        {location && moonData?.altitude && (
          <Box 
            bg="white" 
            p={6} 
            borderRadius="lg" 
            boxShadow="sm"
            w="100%"
          >
            <Heading size="md" mb={4} textAlign="center">
              Local Position ({location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°)
            </Heading>
            <VStack spacing={3} align="stretch">
              <Flex justify="space-between">
                <Text>Azimuth:</Text>
                <Text>
                  {moonData.altitude.azimuth ? 
                    `${moonData.altitude.azimuth.toFixed(2)}° (${getAzimuthDirection(moonData.altitude.azimuth)})` : 
                    'Calculating...'
                  }
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Altitude:</Text>
                <Text>
                  {moonData.altitude.apparentAltitude ? 
                    `${moonData.altitude.apparentAltitude.toFixed(2)}°` : 
                    'Calculating...'
                  }
                </Text>
              </Flex>
            </VStack>
          </Box>
        )}

        {locationError && (
          <Box bg="yellow.100" p={4} borderRadius="md" w="100%">
            <Text color="yellow.800">{locationError}</Text>
          </Box>
        )}

        {/* How it Works Accordion */}
        <Accordion allowToggle width="100%">
          <AccordionItem border="1px" borderColor="gray.200" borderRadius="lg">
            <h2>
              <AccordionButton _expanded={{ bg: 'blue.50' }}>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  How are these calculations made?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} bg="gray.50">
              <VStack spacing={4} align="stretch">
                <Text>
                  We calculate the Moon's position in two ways: from Earth's center and from your local viewpoint. Here's what the numbers mean:
                </Text>
                <Box>
                  <Text fontWeight="medium" mb={1}>🌍 Global Position</Text>
                  <Text>These are the Moon's coordinates as seen from Earth's center:</Text>
                  <Text>• Longitude: How far east or west the Moon is in the sky</Text>
                  <Text>• Latitude: How far up or down from the Earth's orbit around the Sun</Text>
                  <Text>• Distance: How far the Moon is from Earth in kilometers</Text>
                </Box>
                <Box>
                  <Text fontWeight="medium" mb={1}>📍 Local Position</Text>
                  <Text>These show where to find the Moon in your local sky:</Text>
                  <Text>• Azimuth: The compass direction (0° is North, 90° is East)</Text>
                  <Text>• Altitude: How high above the horizon (90° is straight up)</Text>
                </Box>
                <Box>
                  <Text fontWeight="medium" mb={1}>🔄 Real-Time Updates</Text>
                  <Text>We update all positions every second using the Swiss Ephemeris, a highly accurate astronomical calculator that accounts for the Moon's complex motion.</Text>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Last Updated */}
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500">
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </Box>
      </VStack>
    </Container>
  );
} 