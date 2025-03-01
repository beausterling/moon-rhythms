import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
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
  Spinner
} from "@chakra-ui/react";

// Dynamically import Google Maps components to avoid SSR issues
const GoogleMapsComponents = dynamic(
  () => import("../components/GoogleMapsComponents"),
  { ssr: false }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function AstrologyForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthdate: "",
    birthtime: "",
    location_name: "",
    lat: "",
    lng: "",
    place_id: "",
    utc_offset: "", // Keep this for display purposes only
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

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTimezoneOffset = async (lat, lng, timestamp) => {
    try {
      // If we have a birthdate, use that for the timestamp
      let date = timestamp;
      if (!date && formData.birthdate) {
        date = new Date(formData.birthdate);
      }
      date = date || new Date(); // Fallback to current date if no birthdate
      
      const timestampSeconds = Math.floor(date.getTime() / 1000);
      
      const response = await fetch(
        `/api/timezone?lat=${lat}&lng=${lng}&timestamp=${timestampSeconds}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.utcOffset; // This returns the display format (UTC+HH:MM)
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
        
        // Get the timezone offset for the selected location
        // If we have a birthdate, use that for the timestamp
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
        
        setErrors((prev) => ({ ...prev, location_name: "" })); // Clear location error
      }
    }
  };

  // Update UTC offset when birthdate changes if we already have a location
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
      // Format birth time to ensure it has seconds
      const formattedBirthtime = formData.birthtime.includes(':') 
        ? formData.birthtime.split(':').length === 2 
          ? `${formData.birthtime}:00` 
          : formData.birthtime
        : `${formData.birthtime}:00:00`;

      console.log("Submitting form with data:", {
        ...formData,
        birthtime: formattedBirthtime
      });

      // Fetch astrology data from chart calculation API
      const chartResponse = await fetch("/api/ChartCalculation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthdate: formData.birthdate,
          birthtime: formattedBirthtime,
          lat: formData.lat,
          lng: formData.lng,
          email: formData.email || null,
          location: formData.location_name
        }),
      });

      const chartData = await chartResponse.json();

      if (!chartResponse.ok) {
        console.error("Chart API error:", chartData);
        setDebugInfo(chartData);
        throw new Error(chartData.error || chartData.details || "Failed to fetch astrology data");
      }

      console.log("Chart API response:", chartData);

      // Store the UTC offset with the chart data for display purposes only
      if (formData.utc_offset) {
        chartData.utc_offset = formData.utc_offset;
      }

      // 2. Save user data to Supabase
      try {
        // Check if email exists and get existing record
        let existingUser = null;
        
        if (formData.email) {
          const { data } = await supabase
            .from("users")
            .select("id")
            .eq("email", formData.email)
            .limit(1);
            
          existingUser = data && data.length > 0 ? data[0] : null;
        }
        
        let supabaseError;
        
        if (existingUser) {
          // Update existing record
          const { error } = await supabase
            .from("users")
            .update({
              name: formData.name,
              birthdate: formData.birthdate,
              birthtime: formattedBirthtime,
              birth_location: formData.location_name,
              birth_lat: formData.lat,
              birth_lng: formData.lng,
              chart_data: chartData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingUser.id);
            
          supabaseError = error;
        } else {
          // Insert new record
          const { error } = await supabase.from("users").insert([
            {
              name: formData.name,
              email: formData.email || null,
              birthdate: formData.birthdate,
              birthtime: formattedBirthtime,
              birth_location: formData.location_name,
              birth_lat: formData.lat,
              birth_lng: formData.lng,
              chart_data: chartData,
              created_at: new Date().toISOString(),
            },
          ]);
          
          supabaseError = error;
        }

        if (supabaseError) {
          console.error("Supabase error:", supabaseError);
          
          // Handle duplicate email error specifically
          if (supabaseError.code === "23505" && supabaseError.message.includes("users_email_key")) {
            // If email already exists, we can still proceed but with a warning
            console.warn("Email already exists, proceeding with session storage only");
            
            // Store email in session storage for chart retrieval
            if (formData.email) {
              sessionStorage.setItem("userEmail", formData.email);
            }
            
            // Store chart data and user data in session storage
            sessionStorage.setItem("chartData", JSON.stringify(chartData));
            sessionStorage.setItem("userData", JSON.stringify({
              name: formData.name,
              birthdate: formData.birthdate,
              birthtime: formattedBirthtime,
              birth_location: formData.location_name,
              birth_lat: formData.lat,
              birth_lng: formData.lng,
              email: formData.email || null
            }));
            
            // Redirect to chart display page instead of thank you page
            router.push("/chart-display");
            return; // Exit early
          }
          
          throw new Error(supabaseError.message || "Failed to save user data");
        }
      } catch (supabaseError) {
        console.error("Error saving to Supabase:", supabaseError);
        // Continue even if Supabase save fails - we'll just use session storage
      }

      // 3. Store email in session storage for chart retrieval
      if (formData.email) {
        sessionStorage.setItem("userEmail", formData.email);
      }

      // Store chart data and user data in session storage for users without email
      sessionStorage.setItem("chartData", JSON.stringify(chartData));
      sessionStorage.setItem("userData", JSON.stringify({
        name: formData.name,
        birthdate: formData.birthdate,
        birthtime: formattedBirthtime,
        birth_location: formData.location_name,
        birth_lat: formData.lat,
        birth_lng: formData.lng,
        email: formData.email || null
      }));

      // 4. Redirect to chart display page instead of thank you page
      router.push("/chart-display");
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({ 
        submit: error.message || "An error occurred. Please try again." 
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="lg" py={8}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">Generate Your Birth Chart</Heading>
      
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

            {/* Email Field (Optional) */}
            <FormControl isInvalid={errors.email}>
              <FormLabel>Email (Optional)</FormLabel>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
              <Text fontSize="xs" color="gray.500" mt={1}>Optional: Enter your email to receive updates</Text>
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
