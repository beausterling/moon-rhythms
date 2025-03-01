import React from 'react';
import { Box, Flex, Text, Stack, Button, IconButton, useDisclosure, useColorModeValue } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';

const links = [
  { href: '/', label: 'Home' },
  { href: '/form', label: 'Birth Form' },
  { href: '/chart', label: 'Chart Generator' },
  { href: '/about', label: 'About' },
];

const NavLink = ({ href, children, isActive }) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const activeColor = useColorModeValue('purple.600', 'purple.300');
  const hoverColor = useColorModeValue('purple.800', 'purple.200');
  
  return (
    <Link href={href} passHref>
      <Box
        px={2}
        py={1}
        rounded={'md'}
        color={isActive ? activeColor : linkColor}
        fontWeight={isActive ? 'bold' : 'medium'}
        _hover={{
          textDecoration: 'none',
          color: hoverColor,
        }}
        cursor="pointer"
      >
        {children}
      </Box>
    </Link>
  );
};

export default function Navbar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  
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
        <Box>
          <Link href="/" passHref>
            <Text
              fontSize="xl"
              fontWeight="bold"
              bgGradient="linear(to-r, purple.400, purple.600)"
              bgClip="text"
              cursor="pointer"
            >
              Moon Rhythms
            </Text>
          </Link>
        </Box>
        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            {links.map((link) => (
              <NavLink 
                key={link.href} 
                href={link.href}
                isActive={router.pathname === link.href}
              >
                {link.label}
              </NavLink>
            ))}
          </Stack>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as={'nav'} spacing={4}>
            {links.map((link) => (
              <NavLink 
                key={link.href} 
                href={link.href}
                isActive={router.pathname === link.href}
              >
                {link.label}
              </NavLink>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
} 