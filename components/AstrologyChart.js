import React from 'react';
import { Box, Heading, Text, Grid, Flex, Badge, SimpleGrid, Divider, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import CircularChart from './CircularChart';

// Planet symbols
const planetSymbols = {
  'Sun': '☉',
  'Moon': '☽',
  'Mercury': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptune': '♆',
  'Pluto': '♇'
};

// Zodiac symbols
const zodiacSymbols = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓'
};

const AstrologyChart = ({ chartData }) => {
  if (!chartData) {
    return <Box p={4}>Loading chart data...</Box>;
  }

  const { planets, houses, aspects } = chartData;

  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>Astrological Chart</Heading>
      
      <Tabs isFitted variant="enclosed" colorScheme="purple" mb={6}>
        <TabList>
          <Tab>Chart Wheel</Tab>
          <Tab>Planets</Tab>
          <Tab>Houses</Tab>
          <Tab>Aspects</Tab>
        </TabList>
        
        <TabPanels>
          {/* Chart Wheel Tab */}
          <TabPanel>
            <Box height="500px">
              <CircularChart chartData={chartData} />
            </Box>
          </TabPanel>
          
          {/* Planets Tab */}
          <TabPanel>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {planets.map((planet) => (
                <Box 
                  key={planet.name} 
                  p={3} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  boxShadow="sm"
                >
                  <Flex align="center" mb={2}>
                    <Text fontSize="xl" mr={2}>{planetSymbols[planet.name]}</Text>
                    <Heading as="h4" size="sm">{planet.name}</Heading>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>
                      {zodiacSymbols[planet.sign]} {planet.sign} {planet.positionDMS ? 
                        `${planet.positionDMS.degrees}° ${planet.positionDMS.minutes}' ${planet.positionDMS.seconds}"` : 
                        `${planet.position.toFixed(2)}°`}
                    </Text>
                    <Badge>HOUSE {planet.house}</Badge>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          </TabPanel>
          
          {/* Houses Tab */}
          <TabPanel>
            <SimpleGrid columns={[2, 3, 4]} spacing={4}>
              {houses.map((house) => (
                <Box 
                  key={house.number} 
                  p={3} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  boxShadow="sm"
                >
                  <Heading as="h4" size="sm" mb={2}>House {house.number}</Heading>
                  <Text>
                    {zodiacSymbols[house.sign]} {house.sign} {house.position.toFixed(2)}°
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </TabPanel>
          
          {/* Aspects Tab */}
          <TabPanel>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {aspects.map((aspect, index) => (
                <Box 
                  key={index} 
                  p={3} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  boxShadow="sm"
                >
                  <Flex justify="space-between" mb={2}>
                    <Text>{planetSymbols[aspect.planet1]} {aspect.planet1}</Text>
                    <Text fontSize="xl">{aspect.symbol}</Text>
                    <Text>{planetSymbols[aspect.planet2]} {aspect.planet2}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Badge colorScheme={getAspectColor(aspect.type)}>{aspect.type}</Badge>
                    <Text fontSize="sm">Orb: {aspect.orb}°</Text>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

// Helper function to get color for aspect type
function getAspectColor(aspectType) {
  switch (aspectType) {
    case 'Conjunction':
      return 'red';
    case 'Opposition':
      return 'orange';
    case 'Trine':
      return 'green';
    case 'Square':
      return 'purple';
    case 'Sextile':
      return 'blue';
    case 'Quincunx':
      return 'pink';
    case 'Semi-Sextile':
      return 'teal';
    default:
      return 'gray';
  }
}

export default AstrologyChart; 