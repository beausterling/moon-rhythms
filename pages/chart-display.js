import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Textarea,
  Button,
  Divider,
  useToast,
  Spinner,
  Flex
} from "@chakra-ui/react";
import AstrologyChart from "../components/AstrologyChart";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ChartDisplayPage() {
  const router = useRouter();
  const toast = useToast();
  const [chartData, setChartData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    // Retrieve chart data and user data from session storage
    const loadData = async () => {
      try {
        const storedChartData = sessionStorage.getItem("chartData");
        const storedUserData = sessionStorage.getItem("userData");
        
        if (storedChartData) {
          setChartData(JSON.parse(storedChartData));
        } else {
          // If no chart data in session storage, try to get it from API using email
          const email = sessionStorage.getItem("userEmail");
          if (email) {
            const response = await fetch(`/api/SwissEphemerisChart?email=${encodeURIComponent(email)}`);
            const data = await response.json();
            
            if (data.success) {
              setChartData(data.astrologyData);
              setUserData(data.userData);
            } else {
              throw new Error("Failed to fetch chart data");
            }
          } else {
            throw new Error("No chart data available");
          }
        }
        
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }
      } catch (error) {
        console.error("Error loading chart data:", error);
        toast({
          title: "Error",
          description: "Failed to load your chart data. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;

    try {
      const { error } = await supabase
        .from("feedback")
        .insert([{ 
          message: feedback,
          user_email: userData?.email || sessionStorage.getItem("userEmail") || null,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        throw new Error(error.message);
      }

      setFeedbackSubmitted(true);
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Flex direction="column" align="center" justify="center" minH="60vh">
          <Spinner size="xl" color="purple.500" mb={4} />
          <Text fontSize="lg">Loading your birth chart...</Text>
        </Flex>
      </Container>
    );
  }

  if (!chartData) {
    return (
      <Container maxW="container.xl" py={12}>
        <Box textAlign="center" py={10} px={6}>
          <Heading as="h2" size="xl" mb={4}>
            Chart Data Not Found
          </Heading>
          <Text mb={6}>
            We couldn't find your chart data. Please go back and try again.
          </Text>
          <Button
            colorScheme="purple"
            onClick={() => router.push("/form")}
          >
            Return to Form
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Your Birth Chart
      </Heading>
      
      <Box mb={4} p={3} borderRadius="md" bg="green.50" textAlign="center">
        <Text fontWeight="medium" color="green.700">
          Powered by Swiss Ephemeris for professional-grade astrological accuracy
        </Text>
      </Box>
      
      {userData && (
        <Box mb={8} p={4} borderWidth="1px" borderRadius="lg" bg="purple.50">
          <Heading as="h2" size="md" mb={2}>
            Birth Details
          </Heading>
          <Text><strong>Name:</strong> {userData.name}</Text>
          <Text><strong>Birth Date:</strong> {userData.birthdate}</Text>
          <Text><strong>Birth Time:</strong> {userData.birthtime}</Text>
          {userData.birth_location && (
            <Text><strong>Location:</strong> {userData.birth_location}</Text>
          )}
        </Box>
      )}
      
      {/* Chart Display */}
      <Box mb={10}>
        <AstrologyChart chartData={chartData.planets ? chartData : chartData.astrologyData} />
      </Box>
      
      <Divider my={10} />
      
      {/* Thank You Section */}
      <Box textAlign="center" py={6}>
        <Heading as="h2" size="lg" mb={4}>
          Thank You!
        </Heading>
        <Text fontSize="lg" mb={6}>
          Welcome to MoonRhythms.io. We hope you enjoy exploring your birth chart.
        </Text>
        
        {/* Feedback Section */}
        <VStack spacing={4} mt={8} maxW="lg" mx="auto">
          <Heading as="h3" size="md">
            We'd Love Your Feedback
          </Heading>
          
          {!feedbackSubmitted ? (
            <>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about our service (optional)"
                size="md"
                resize="vertical"
              />
              <Button 
                colorScheme="blue" 
                onClick={handleFeedbackSubmit}
                isDisabled={!feedback.trim()}
              >
                Submit Feedback
              </Button>
            </>
          ) : (
            <Text color="green.600" fontWeight="medium">
              Thanks for your feedback! 😊
            </Text>
          )}
        </VStack>
      </Box>
    </Container>
  );
} 