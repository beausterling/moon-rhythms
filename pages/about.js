import { Box, Container, Heading, Text, VStack, Divider, Link, UnorderedList, ListItem, useColorModeValue } from '@chakra-ui/react';
import Head from 'next/head';

export default function About() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = useColorModeValue('purple.500', 'purple.300');

  return (
    <>
      <Head>
        <title>About - Moon Rhythms</title>
        <meta name="description" content="Learn about Moon Rhythms and how it helps you track lunar cycles" />
      </Head>
      
      <Box bg={bgColor} minH="calc(100vh - 64px)" py={10}>
        <Container maxW="container.md">
          <VStack spacing={8} align="start">
            <Heading 
              as="h1" 
              size="xl" 
              color={accentColor}
            >
              About Moon Rhythms
            </Heading>
            
            <Text fontSize="lg" color={textColor}>
              Moon Rhythms is a web application designed to help you connect with the natural cycles of the moon
              and understand how its position in the zodiac influences daily life. Our goal is to make astronomical
              and astrological information accessible, accurate, and beautiful.
            </Text>
            
            <Box 
              w="full" 
              bg={cardBg} 
              p={6} 
              borderRadius="lg" 
              shadow="md"
            >
              <VStack align="start" spacing={4}>
                <Heading as="h2" size="md">Our Features</Heading>
                <UnorderedList spacing={2} pl={4}>
                  <ListItem>Real-time moon position tracking with Swiss Ephemeris</ListItem>
                  <ListItem>Accurate moon phase visualization with detailed lunar features</ListItem>
                  <ListItem>Zodiac sign positioning with precise degree calculations</ListItem>
                  <ListItem>Moon phase identification and interpretation</ListItem>
                </UnorderedList>
              </VStack>
            </Box>
            
            <Divider />
            
            <Heading as="h2" size="md">The Technology</Heading>
            <Text color={textColor}>
              Moon Rhythms uses the Swiss Ephemeris library, a high precision ephemeris developed by Astrodienst,
              based on the DE431 ephemeris from NASA's JPL. This ensures that our astronomical calculations are
              accurate to within 0.001 arc seconds.
            </Text>
            
            <Text color={textColor}>
              The application is built with modern web technologies including:
            </Text>
            
            <UnorderedList spacing={2} pl={4}>
              <ListItem>Next.js for server-side rendering and routing</ListItem>
              <ListItem>React for interactive UI components</ListItem>
              <ListItem>Chakra UI for accessible and responsive design</ListItem>
              <ListItem>Canvas API for custom moon phase visualization</ListItem>
            </UnorderedList>
            
            <Divider />
            
            <Heading as="h2" size="md">Lunar Cycles and Astrology</Heading>
            <Text color={textColor}>
              The moon completes a full orbit around the Earth approximately every 27.3 days (sidereal month),
              but the lunar phase cycle (new moon to new moon) takes about 29.5 days (synodic month). During this
              journey, the moon passes through all twelve zodiac signs, spending roughly 2-3 days in each sign.
            </Text>
            
            <Text color={textColor}>
              In astrology, the moon's position is believed to influence emotional patterns, instinctual responses,
              and the subconscious mind. By tracking the moon's position, you can gain insights into how these
              cosmic energies might be affecting your daily experience.
            </Text>
            
            <Divider />
            
            <Text fontSize="sm" color="gray.500" alignSelf="center" pt={4}>
              Moon Rhythms © {new Date().getFullYear()} | Swiss Ephemeris © Astrodienst AG
            </Text>
          </VStack>
        </Container>
      </Box>
    </>
  );
} 