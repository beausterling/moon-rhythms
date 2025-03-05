import "@/styles/globals.css";
import { ChakraProvider, Box } from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import theme from '../theme';

export default function App({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Head>
        <title>Moon Rhythms</title>
        <meta name="description" content="Track moon phases and astrological positions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box minH="100vh" display="flex" flexDirection="column">
        <Navbar />
        <Box flex="1">
          <Component {...pageProps} />
        </Box>
      </Box>
    </ChakraProvider>
  );
}
