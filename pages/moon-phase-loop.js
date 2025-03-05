import { Box, Heading } from '@chakra-ui/react';
import MoonPhaseLoop from '../components/MoonPhaseLoop';

const MoonPhaseLoopPage = () => {
  return (
    <Box bg="black" minH="100vh" py={8}>
      <Box maxW="container.lg" mx="auto">
        <Heading color="white" textAlign="center" mb={8}>
          Moon Phase Animation
        </Heading>
        <MoonPhaseLoop />
      </Box>
    </Box>
  );
};

export default MoonPhaseLoopPage; 