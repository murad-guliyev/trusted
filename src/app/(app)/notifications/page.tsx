"use client"

import { useEffect, useState } from "react"
import { Box, Text, Heading, Stack, Badge, Flex } from "@chakra-ui/react"

interface Notification {
  id: string
  type: "NEW_REPLY" | "CONNECTION_INVITE" | "INVITE_ACCEPTED"
  subjectType: string
  subjectId: string
  isRead: boolean
  createdAt: string
}

function getNotificationMessage(type: Notification["type"]): string {
  switch (type) {
    case "NEW_REPLY":
      return "Sualınıza yeni cavab gəldi"
    case "CONNECTION_INVITE":
      return "Sizə əlaqə dəvəti göndərildi"
    case "INVITE_ACCEPTED":
      return "Dəvətiniz qəbul edildi"
    default:
      return "Yeni bildiriş"
  }
}

function getNotificationIcon(type: Notification["type"]): string {
  switch (type) {
    case "NEW_REPLY":
      return "💬"
    case "CONNECTION_INVITE":
      return "👤"
    case "INVITE_ACCEPTED":
      return "✅"
    default:
      return "🔔"
  }
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("az-AZ", { day: "numeric", month: "long" })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications ?? [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch {
      // ignore
    }
  }

  const todayNotifications = notifications.filter((n) => isToday(n.createdAt))
  const earlierNotifications = notifications.filter((n) => !isToday(n.createdAt))
  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (loading) {
    return (
      <Box p={4} maxW="600px" mx="auto">
        <Heading size="md" mb={4}>Bildirişlər</Heading>
        <Stack gap={3}>
          {[1, 2, 3].map((i) => (
            <Box key={i} bg="white" rounded="xl" p={4} borderWidth={1} borderColor="gray.200" h="64px" />
          ))}
        </Stack>
      </Box>
    )
  }

  if (notifications.length === 0) {
    return (
      <Box p={4} maxW="600px" mx="auto">
        <Heading size="md" mb={4}>Bildirişlər</Heading>
        <Box bg="white" rounded="xl" p={8} textAlign="center" borderWidth={1} borderColor="gray.200">
          <Text fontSize="3xl" mb={3}>🔔</Text>
          <Text color="gray.500">Bildiriş yoxdur</Text>
        </Box>
      </Box>
    )
  }

  const renderNotification = (notif: Notification) => (
    <Box
      key={notif.id}
      bg={notif.isRead ? "white" : "brand.50"}
      rounded="xl"
      p={4}
      borderWidth={1}
      borderColor={notif.isRead ? "gray.200" : "brand.200"}
      shadow="sm"
      cursor="pointer"
      onClick={() => !notif.isRead && markAsRead(notif.id)}
      _hover={{ shadow: "md" }}
      transition="all 0.15s"
    >
      <Flex align="center" gap={3}>
        <Text fontSize="xl">{getNotificationIcon(notif.type)}</Text>
        <Box flex={1}>
          <Text fontSize="sm" fontWeight={notif.isRead ? "400" : "600"} color="gray.800">
            {getNotificationMessage(notif.type)}
          </Text>
          <Text fontSize="xs" color="gray.400" mt={0.5}>
            {formatTime(notif.createdAt)}
          </Text>
        </Box>
        {!notif.isRead && (
          <Box w="8px" h="8px" bg="brand.500" rounded="full" flexShrink={0} />
        )}
      </Flex>
    </Box>
  )

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="md">Bildirişlər</Heading>
        {unreadCount > 0 && (
          <Badge colorPalette="brand" borderRadius="full">
            {unreadCount} oxunmamış
          </Badge>
        )}
      </Flex>

      {todayNotifications.length > 0 && (
        <Box mb={4}>
          <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase">
            Bu gün
          </Text>
          <Stack gap={2}>
            {todayNotifications.map(renderNotification)}
          </Stack>
        </Box>
      )}

      {earlierNotifications.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase">
            Əvvəl
          </Text>
          <Stack gap={2}>
            {earlierNotifications.map((notif) => (
              <Box key={notif.id}>
                <Text fontSize="xs" color="gray.400" mb={1} ml={1}>
                  {formatDate(notif.createdAt)}
                </Text>
                {renderNotification(notif)}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
