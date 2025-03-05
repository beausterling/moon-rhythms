import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Collapse,
  useDisclosure,
} from "@chakra-ui/react";

// Dynamically import Google Maps components to avoid SSR issues
const GoogleMapsComponents = dynamic(
  () => import("../components/GoogleMapsComponents"),
  { ssr: false }
);

export default function NatalForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    birthtime: "",
    location_name: "",
    lat: "",
    lng: "",
    place_id: "",
    utc_offset: "",
  });

  const [errors, setErrors] = useState({});
  const [searchBox, setSearchBox] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const { isOpen, onToggle } = useDisclosure();

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = "Please enter a valid name (at least 2 characters).";
    }

    if (!formData.birthdate) {
      newErrors.birthdate = "Please select a valid birthdate.";
    } else {
      const selectedDate = new Date(formData.birthdate);
      if (isNaN(selectedDate.getTime()) || selectedDate > new Date()) {
        newErrors.birthdate = "Birthdate must be a valid past date.";
      }
    }

    if (!formData.birthtime) {
      newErrors.birthtime = "Please enter a valid birth time.";
    }

    if (!formData.location_name.trim()) {
      newErrors.location_name = "Please select a location from the dropdown.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTimezoneOffset = async (lat, lng, timestamp) => {
    try {
      let date = timestamp;
      if (!date && formData.birthdate) {
        date = new Date(formData.birthdate);
      }
      date = date || new Date();
      
      const timestampSeconds = Math.floor(date.getTime() / 1000);
      
      const response = await fetch(
        `/api/timezone?lat=${lat}&lng=${lng}&timestamp=${timestampSeconds}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.utcOffset;
      } else {
        console.error("Error getting timezone:", await response.text());
        return null;
      }
    } catch (error) {
      console.error("Error fetching timezone data:", error);
      return null;
    }
  };

  const onPlacesChanged = async () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places.length > 0) {
        const place = places[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        let date = null;
        if (formData.birthdate) {
          date = new Date(formData.birthdate);
        }
        
        const utcOffset = await getTimezoneOffset(lat, lng, date);
        
        setFormData({
          ...formData,
          location_name: place.formatted_address,
          lat,
          lng,
          place_id: place.place_id,
          utc_offset: utcOffset || "UTC offset unavailable",
        });
        
        setErrors((prev) => ({ ...prev, location_name: "" }));
      }
    }
  };

  useEffect(() => {
    const updateUtcOffset = async () => {
      if (formData.lat && formData.lng && formData.birthdate) {
        const date = new Date(formData.birthdate);
        const utcOffset = await getTimezoneOffset(formData.lat, formData.lng, date);
        if (utcOffset) {
          setFormData(prev => ({
            ...prev,
            utc_offset: utcOffset
          }));
        }
      }
    };
    
    updateUtcOffset();
  }, [formData.birthdate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setDebugInfo(null);
    setErrors({});

    try {
      const formattedBirthtime = formData.birthtime.includes(':') 
        ? formData.birthtime.split(':').length === 2 
          ? `${formData.birthtime}:00` 
          : formData.birthtime
        : `${formData.birthtime}:00:00`;

      const chartResponse = await fetch("/api/SwissEphemerisChart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthdate: formData.birthdate,
          birthtime: formattedBirthtime,
          lat: formData.lat,
          lng: formData.lng,
          name: formData.name,
          location: formData.location_name,
          utc_offset: formData.utc_offset.replace('UTC', '').trim()
        }),
      });

      const chartData = await chartResponse.json();

      if (!chartResponse.ok) {
        console.error("Chart API error:", chartData);
        setDebugInfo(chartData);
        throw new Error(chartData.error || chartData.details || "Failed to fetch astrology data");
      }

      // Store the chart data in localStorage for the display page
      localStorage.setItem('natalChartData', JSON.stringify({
        ...chartData.data,
        name: formData.name,
        location: formData.location_name,
        birthdate: formData.birthdate,
        birthtime: formattedBirthtime,
        utc_offset: formData.utc_offset
      }));

      // Redirect to the chart display page
      router.push('/natal-chart-display');
    } catch (error) {
      console.error("Error:", error);
      setErrors({
        submit: error.message || "An error occurred while generating your chart."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>Birth Chart Calculator</Heading>
      
      <GoogleMapsComponents
        onPlacesChanged={onPlacesChanged}
        setSearchBox={setSearchBox}
      >
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            {/* Name Field */}
            <FormControl isRequired isInvalid={errors.name}>
              <FormLabel>Full Name</FormLabel>
              <Input
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            {/* Birth Date Field */}
            <FormControl isRequired isInvalid={errors.birthdate}>
              <FormLabel>Birth Date</FormLabel>
              <Input
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
              />
              <FormErrorMessage>{errors.birthdate}</FormErrorMessage>
            </FormControl>

            {/* Birth Time Field */}
            <FormControl isRequired isInvalid={errors.birthtime}>
              <FormLabel>Birth Time</FormLabel>
              <Input
                type="time"
                value={formData.birthtime}
                onChange={(e) => setFormData({ ...formData, birthtime: e.target.value })}
              />
              <FormErrorMessage>{errors.birthtime}</FormErrorMessage>
            </FormControl>

            {/* Birth Location Field */}
            <FormControl isRequired isInvalid={errors.location_name}>
              <FormLabel>Birth Location</FormLabel>
              <Input
                type="text"
                placeholder="Search for your birth location"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              />
              {formData.utc_offset && (
                <Text fontSize="sm" mt={1} color="green.600">Time Zone: {formData.utc_offset}</Text>
              )}
              <FormErrorMessage>{errors.location_name}</FormErrorMessage>
            </FormControl>

            {/* Submit Button */}
            <Button 
              type="submit" 
              colorScheme="purple" 
              size="lg" 
              isLoading={isSubmitting}
              loadingText="Generating Chart"
              mt={4}
            >
              Generate Birth Chart
            </Button>
            
            {errors.submit && (
              <Alert status="error" mt={4} borderRadius="md">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription display="block">
                    {errors.submit}
                    {debugInfo && (
                      <Box mt={2}>
                        <Button size="sm" onClick={onToggle} variant="link">
                          {isOpen ? "Hide" : "Show"} Technical Details
                        </Button>
                        <Collapse in={isOpen} animateOpacity>
                          <Box
                            p={2}
                            mt={2}
                            bg="gray.50"
                            borderRadius="md"
                            fontSize="xs"
                            fontFamily="monospace"
                            overflowX="auto"
                          >
                            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                          </Box>
                        </Collapse>
                      </Box>
                    )}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </form>
      </GoogleMapsComponents>
    </Container>
  );
} 