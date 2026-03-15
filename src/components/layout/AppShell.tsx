"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Box, Flex, Text, Badge } from "@chakra-ui/react"
import Link from "next/link"

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/notifications?count=true&unread=true")
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.count ?? 0)
        }
      } catch {
        // ignore
      }
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: "/feed", label: "Ev", icon: <HomeIcon /> },
    { href: "/connections", label: "Əlaqələr", icon: <UsersIcon /> },
    { href: "/profile", label: "Profil", icon: <UserIcon /> },
  ]

  return (
    <Box minH="100vh" bg="gray.50" pb="80px">
      {/* Top bar */}
      <Flex
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        bg="white"
        borderBottomWidth={1}
        borderColor="gray.200"
        px={4}
        py={3}
        align="center"
        justify="space-between"
        shadow="sm"
      >
        <Text fontWeight="bold" fontSize="xl" color="brand.600">
          Trusted
        </Text>
        <Link href="/notifications">
          <Box position="relative" color={pathname === "/notifications" ? "brand.600" : "gray.600"}>
            <BellIcon />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-6px"
                right="-6px"
                colorPalette="red"
                borderRadius="full"
                fontSize="xs"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Box>
        </Link>
      </Flex>

      {/* Main content */}
      <Box pt="60px">{children}</Box>

      {/* Bottom nav */}
      <Flex
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={100}
        bg="white"
        borderTopWidth={1}
        borderColor="gray.200"
        shadow="sm"
        h="64px"
        align="center"
        justify="space-around"
        px={2}
      >
        {/* Home */}
        <Link href="/feed">
          <Flex
            direction="column"
            align="center"
            gap={0.5}
            color={pathname === "/feed" ? "brand.600" : "gray.500"}
            _hover={{ color: "brand.600" }}
            px={3}
            py={1}
          >
            <HomeIcon />
            <Text fontSize="2xs" fontWeight={pathname === "/feed" ? "600" : "400"}>
              Ev
            </Text>
          </Flex>
        </Link>

        {/* Create Ask - prominent circle button */}
        <Link href="/asks/new">
          <Flex
            align="center"
            justify="center"
            w="52px"
            h="52px"
            bg="brand.600"
            color="white"
            borderRadius="full"
            shadow="md"
            _hover={{ bg: "brand.700" }}
            mt="-20px"
          >
            <PlusIcon />
          </Flex>
        </Link>

        {/* Connections */}
        <Link href="/connections">
          <Flex
            direction="column"
            align="center"
            gap={0.5}
            color={pathname === "/connections" ? "brand.600" : "gray.500"}
            _hover={{ color: "brand.600" }}
            px={3}
            py={1}
          >
            <UsersIcon />
            <Text fontSize="2xs" fontWeight={pathname === "/connections" ? "600" : "400"}>
              Əlaqələr
            </Text>
          </Flex>
        </Link>

        {/* Profile */}
        <Link href="/profile">
          <Flex
            direction="column"
            align="center"
            gap={0.5}
            color={pathname === "/profile" ? "brand.600" : "gray.500"}
            _hover={{ color: "brand.600" }}
            px={3}
            py={1}
          >
            <UserIcon />
            <Text fontSize="2xs" fontWeight={pathname === "/profile" ? "600" : "400"}>
              Profil
            </Text>
          </Flex>
        </Link>
      </Flex>
    </Box>
  )
}
