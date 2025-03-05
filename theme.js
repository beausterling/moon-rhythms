import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: 'var(--font-inter), system-ui, sans-serif',
    body: 'var(--font-inter), system-ui, sans-serif',
  },
  colors: {
    brand: {
      50: '#f5e6ff',
      100: '#dbb3ff',
      200: '#c180ff',
      300: '#a74dff',
      400: '#8d1aff',
      500: '#7400e6',
      600: '#5a00b3',
      700: '#400080',
      800: '#26004d',
      900: '#0d001a',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.900',
      },
    }),
  },
});

export default theme; 