import { Box, Flex, HStack, Link as ChakraLink, IconButton, useDisclosure, useColorModeValue, useColorMode, Stack, Text } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NavLink = ({ children, href }) => {
  const router = useRouter();
  const isActive = router.pathname === href;
  
  return (
    <Link href={href} passHref legacyBehavior>
      <ChakraLink
        px={2}
        py={1}
        rounded={'md'}
        fontWeight={isActive ? 'bold' : 'medium'}
        color={isActive ? useColorModeValue('blue.500', 'blue.300') : useColorModeValue('gray.600', 'gray.200')}
        _hover={{
          textDecoration: 'none',
          bg: useColorModeValue('gray.200', 'gray.700'),
        }}
      >
        {children}
      </ChakraLink>
    </Link>
  );
};

export default function Navbar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const Links = [
    { name: 'Home', path: '/' },
    { name: 'Moon Position', path: '/moon-position' },
    { name: 'Natal Form', path: '/natal-form' },
    { name: 'Profile', path: '/natal-chart-display' },
    { name: 'About', path: '/about' }
  ];

  return (
    <Box bg={useColorModeValue('white', 'gray.900')} px={4} boxShadow="sm">
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <IconButton
          size={'md'}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={'Open Menu'}
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
        <HStack spacing={8} alignItems={'center'}>
          <Box>
            <Text fontWeight="bold" fontSize="lg" color={useColorModeValue('blue.600', 'blue.300')}>
              Moon Rhythms
            </Text>
          </Box>
          <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            {Links.map((link) => (
              <NavLink key={link.name} href={link.path}>
                {link.name}
              </NavLink>
            ))}
          </HStack>
        </HStack>
        <Flex alignItems={'center'}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as={'nav'} spacing={4}>
            {Links.map((link) => (
              <NavLink key={link.name} href={link.path}>
                {link.name}
              </NavLink>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
} 