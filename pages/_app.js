import "@/styles/globals.css";
import { ChakraProvider, Box } from '@chakra-ui/react';
import Navbar from '../components/Navbar';

export default function App({ Component, pageProps }) {
  return (
    <ChakraProvider>
      <Box minH="100vh">
        <Navbar />
        <Component {...pageProps} />
      </Box>
    </ChakraProvider>
  );
}
