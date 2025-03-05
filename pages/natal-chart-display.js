import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  GridItem,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';

// Function to get zodiac sign based on longitude
function getZodiacSign(longitude) {
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  return signs[signIndex];
}

// Function to get position in sign (0-30 degrees)
function getPositionInSign(longitude) {
  return ((longitude % 30) + 30) % 30;
}

// Function to format degrees to DMS
function formatDegrees(degrees) {
  const totalSeconds = Math.round(degrees * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { degrees: d, minutes: m, seconds: s };
}

export default function NatalChartDisplay() {
  const [chartData, setChartData] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Load chart data from localStorage
    const savedData = localStorage.getItem('natalChartData');
    if (savedData) {
      setChartData(JSON.parse(savedData));
    }
  }, []);

  if (!chartData) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={4} align="center">
          <Heading>No Chart Data Available</Heading>
          <Text>Please generate a birth chart first using the Natal Form.</Text>
        </VStack>
      </Container>
    );
  }

  // Format planet data
  const formattedPlanets = chartData.planets.map(planet => {
    const longitude = planet.longitude;
    const sign = getZodiacSign(longitude);
    const position = getPositionInSign(longitude);
    const positionDMS = formatDegrees(position);
    return {
      ...planet,
      sign,
      position,
      positionDMS,
      isRetrograde: planet.longitudeSpeed < 0
    };
  });

  // Format house data
  const formattedHouses = chartData.houses.map(house => {
    const longitude = house.longitude;
    const sign = getZodiacSign(longitude);
    const position = getPositionInSign(longitude);
    const positionDMS = formatDegrees(position);
    return {
      ...house,
      sign,
      position,
      positionDMS
    };
  });

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={2}>{chartData.name}'s Birth Chart</Heading>
          <Text fontSize="lg" color="gray.600">
            Born on {new Date(chartData.birthdate + 'T00:00:00').toLocaleDateString()} at {chartData.birthtime}
          </Text>
          <Text fontSize="md" color="gray.500">
            {chartData.location} ({chartData.utc_offset})
          </Text>
        </Box>

        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {/* Planets Section */}
          <GridItem colSpan={[2, 1]}>
            <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>Planetary Positions</Heading>
              <VStack spacing={3} align="stretch">
                {formattedPlanets.map((planet, index) => (
                  <Box key={index} p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Grid templateColumns="1fr auto">
                      <Text fontWeight="bold">{planet.name}</Text>
                      <Badge colorScheme="purple">
                        {planet.sign} {planet.positionDMS.degrees}°{planet.positionDMS.minutes}'{planet.positionDMS.seconds}"
                        {planet.isRetrograde && ' ℞'}
                      </Badge>
                    </Grid>
                  </Box>
                ))}
              </VStack>
            </Box>
          </GridItem>

          {/* Houses Section */}
          <GridItem colSpan={[2, 1]}>
            <Box bg={bgColor} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>House Positions</Heading>
              <VStack spacing={3} align="stretch">
                {formattedHouses.map((house, index) => (
                  <Box key={index} p={3} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Grid templateColumns="1fr auto">
                      <Text fontWeight="bold">House {house.number}</Text>
                      <Badge colorScheme="blue">
                        {house.sign} {house.positionDMS.degrees}°{house.positionDMS.minutes}'{house.positionDMS.seconds}"
                      </Badge>
                    </Grid>
                  </Box>
                ))}
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
}