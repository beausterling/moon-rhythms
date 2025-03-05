import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useColorModeValue,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { MoonIcon, StarIcon, SunIcon } from '@chakra-ui/icons';

export default function Home() {
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const features = [
    {
      title: 'Current Moon Position',
      description: 'Track the Moon\'s real-time position in the zodiac and your local sky.',
      icon: MoonIcon,
      path: '/moon-position'
    },
    {
      title: 'Birth Chart Calculator',
      description: 'Generate your complete astrological birth chart using Swiss Ephemeris.',
      icon: StarIcon,
      path: '/natal-form'
    },
    {
      title: 'Profile',
      description: 'View your saved birth chart and astrological insights.',
      icon: SunIcon,
      path: '/natal-chart-display'
    }
  ];

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="center">
        <Box textAlign="center">
          <Heading
            as="h1"
            size="2xl"
            bgGradient="linear(to-r, purple.400, blue.500)"
            bgClip="text"
            mb={4}
          >
            Moon Rhythms
          </Heading>
          <Text fontSize="xl" color={useColorModeValue('gray.600', 'gray.300')}>
            Explore the cosmic dance of celestial bodies and discover your astrological blueprint
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} pt={8}>
          {features.map((feature, index) => (
            <Box
              key={index}
              bg={bgColor}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              cursor="pointer"
              onClick={() => router.push(feature.path)}
              _hover={{
                transform: 'translateY(-5px)',
                boxShadow: 'lg',
                transition: 'all 0.2s'
              }}
            >
              <VStack spacing={4}>
                <Icon as={feature.icon} w={8} h={8} color="purple.500" />
                <Heading size="md">{feature.title}</Heading>
                <Text textAlign="center" color={useColorModeValue('gray.600', 'gray.300')}>
                  {feature.description}
                </Text>
                <Button
                  colorScheme="purple"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(feature.path);
                  }}
                >
                  Explore
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
