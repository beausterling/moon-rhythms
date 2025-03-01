import { useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  VStack,
  useToast,
  Divider,
  Text,
  Flex,
  Spinner
} from '@chakra-ui/react';
import AstrologyChart from '../components/AstrologyChart';
import { useRouter } from 'next/router';

export default function ChartPage() {
  const [formData, setFormData] = useState({
    birthdate: '',
    birthtime: '',
    lat: '',
    lng: '',
    email: '',
    location: ''
  });
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.birthdate || !formData.birthtime || !formData.lat || !formData.lng) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ChartCalculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChartData(data.astrologyData);
        toast({
          title: 'Chart generated',
          description: 'Your astrological chart has been generated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // If email was provided, save to history
        if (formData.email) {
          // You could redirect to a saved chart page or just keep on this page
          // router.push(`/chart/${data.userEmail}`);
        }
      } else {
        throw new Error(data.error || 'Failed to generate chart');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate chart. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle getting current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toFixed(4),
            lng: position.coords.longitude.toFixed(4)
          }));
          
          toast({
            title: 'Location detected',
            description: 'Your current location has been added to the form.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        },
        (error) => {
          toast({
            title: 'Location error',
            description: 'Unable to get your current location. Please enter it manually.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      );
    } else {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation. Please enter your location manually.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" mb={6} textAlign="center">Astrological Chart Generator</Heading>
      
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        {/* Form Section */}
        <Box flex="1" p={6} borderWidth="1px" borderRadius="lg" boxShadow="md">
          <Heading as="h2" size="md" mb={4}>Enter Your Birth Details</Heading>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Birth Date</FormLabel>
                <Input 
                  type="date" 
                  name="birthdate" 
                  value={formData.birthdate} 
                  onChange={handleChange}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Birth Time</FormLabel>
                <Input 
                  type="time" 
                  name="birthtime" 
                  value={formData.birthtime} 
                  onChange={handleChange}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Birth Location (optional)</FormLabel>
                <Input 
                  type="text" 
                  name="location" 
                  placeholder="e.g., New York, USA" 
                  value={formData.location} 
                  onChange={handleChange}
                />
              </FormControl>
              
              <Flex gap={4}>
                <FormControl isRequired flex="1">
                  <FormLabel>Latitude</FormLabel>
                  <Input 
                    type="number" 
                    name="lat" 
                    placeholder="e.g., 40.7128" 
                    value={formData.lat} 
                    onChange={handleChange}
                    step="0.0001"
                  />
                </FormControl>
                
                <FormControl isRequired flex="1">
                  <FormLabel>Longitude</FormLabel>
                  <Input 
                    type="number" 
                    name="lng" 
                    placeholder="e.g., -74.0060" 
                    value={formData.lng} 
                    onChange={handleChange}
                    step="0.0001"
                  />
                </FormControl>
              </Flex>
              
              <Button 
                colorScheme="blue" 
                variant="outline" 
                onClick={getCurrentLocation}
                size="sm"
              >
                Use Current Location
              </Button>
              
              <FormControl>
                <FormLabel>Email (optional, to save your chart)</FormLabel>
                <Input 
                  type="email" 
                  name="email" 
                  placeholder="your@email.com" 
                  value={formData.email} 
                  onChange={handleChange}
                />
              </FormControl>
              
              <Button 
                type="submit" 
                colorScheme="purple" 
                size="lg" 
                isLoading={isLoading}
                loadingText="Generating Chart"
              >
                Generate Chart
              </Button>
            </VStack>
          </form>
        </Box>
        
        {/* Chart Display Section */}
        <Box flex="2" p={6} borderWidth="1px" borderRadius="lg" boxShadow="md">
          {isLoading ? (
            <Flex justify="center" align="center" h="100%" minH="400px">
              <VStack>
                <Spinner size="xl" color="purple.500" />
                <Text mt={4}>Calculating celestial positions...</Text>
              </VStack>
            </Flex>
          ) : chartData ? (
            <AstrologyChart chartData={chartData} />
          ) : (
            <Flex justify="center" align="center" h="100%" minH="400px">
              <Text color="gray.500">
                Enter your birth details and generate your chart to see your astrological profile.
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Container>
  );
}
