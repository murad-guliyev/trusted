"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Heading,
  Flex,
  Badge,
  Field,
} from "@chakra-ui/react"

interface Connection {
  id: string
  userId: string
  displayName: string
  cityName?: string
}

interface Invite {
  id: string
  type: "incoming" | "outgoing"
  userId: string
  displayName: string
  status: string
  sentAt: string
}

type ActiveTab = "connections" | "invites"

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("connections")
  const [connections, setConnections] = useState<Connection[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResult, setSearchResult] = useState<{ id: string; displayName: string } | null>(null)
  const [searchError, setSearchError] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareToast, setShareToast] = useState("")

  useEffect(() => {
    fetchConnections()
    fetchInvites()
  }, [])

  async function fetchConnections() {
    try {
      const res = await fetch("/api/connections")
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function fetchInvites() {
    try {
      const res = await fetch("/api/connections/invites")
      if (res.ok) {
        const data = await res.json()
        setInvites(data.invites ?? [])
      }
    } catch {
      // ignore
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchError("")
    setSearchResult(null)

    if (!searchEmail.trim()) return

    try {
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(searchEmail)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResult(data)
      } else {
        const data = await res.json()
        setSearchError(data.error || "İstifadəçi tapılmadı")
      }
    } catch {
      setSearchError("Xəta baş verdi")
    }
  }

  async function sendInvite(recipientId: string) {
    setActionLoading(recipientId)
    try {
      const res = await fetch("/api/connections/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      })
      if (res.ok) {
        setSearchResult(null)
        setSearchEmail("")
        await fetchInvites()
      } else {
        const data = await res.json()
        setSearchError(data.error || "Dəvət göndərilmədi")
      }
    } catch {
      setSearchError("Xəta baş verdi")
    } finally {
      setActionLoading(null)
    }
  }

  async function removeConnection(connectionId: string) {
    setActionLoading(connectionId)
    try {
      await fetch(`/api/connections?id=${connectionId}`, { method: "DELETE" })
      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function acceptInvite(inviteId: string) {
    setActionLoading(inviteId)
    try {
      await fetch(`/api/connections/invites/${inviteId}/accept`, { method: "POST" })
      await fetchInvites()
      await fetchConnections()
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function shareInviteLink() {
    setShareLoading(true)
    setShareToast("")
    try {
      const res = await fetch("/api/connections/invites/link", { method: "POST" })
      const data = await res.json()
      const url: string = data.url

      if (navigator.share) {
        await navigator.share({
          title: "Trusted-a qoşul",
          text: "Mən sizi Trusted-a dəvət edirəm — etibarlı insanlardan tövsiyə alın",
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast("Link kopyalandı!")
        setTimeout(() => setShareToast(""), 3000)
      }
    } catch {
      // User cancelled share or clipboard failed — silent
    } finally {
      setShareLoading(false)
    }
  }

  async function rejectInvite(inviteId: string) {
    setActionLoading(inviteId)
    try {
      await fetch(`/api/connections/invites/${inviteId}/reject`, { method: "POST" })
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const incomingInvites = invites.filter((i) => i.type === "incoming" && i.status === "PENDING")
  const outgoingInvites = invites.filter((i) => i.type === "outgoing" && i.status === "PENDING")

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Heading size="md" mb={4}>Əlaqələr</Heading>

      {/* Share Invite Link */}
      <Box bg="brand.50" rounded="xl" p={4} borderWidth={1} borderColor="brand.200" mb={3}>
        <Text fontWeight="600" fontSize="sm" mb={1}>Dəvət linki ilə paylaş</Text>
        <Text fontSize="xs" color="gray.500" mb={3}>
          WhatsApp, Telegram və ya istənilən kanalda paylaşın. Link 7 gün etibarlıdır.
        </Text>
        <Button
          colorPalette="brand"
          size="sm"
          w="full"
          loading={shareLoading}
          onClick={shareInviteLink}
        >
          🔗 Dəvət linkini paylaş
        </Button>
        {shareToast && (
          <Text fontSize="xs" color="brand.600" mt={2} textAlign="center">{shareToast}</Text>
        )}
      </Box>

      {/* Search / Invite by email */}
      <Box bg="white" rounded="xl" p={4} borderWidth={1} borderColor="gray.200" mb={4}>
        <Text fontWeight="600" fontSize="sm" mb={3}>E-poçt ilə dəvət et</Text>
        <form onSubmit={handleSearch}>
          <Flex gap={2}>
            <Field.Root flex={1} invalid={!!searchError}>
              <Input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="istifadeci@email.az"
                size="sm"
              />
            </Field.Root>
            <Button type="submit" size="sm" colorPalette="brand" px={4}>
              Axtar
            </Button>
          </Flex>
        </form>
        {searchError && (
          <Text color="red.500" fontSize="xs" mt={2}>{searchError}</Text>
        )}
        {searchResult && (
          <Flex align="center" justify="space-between" mt={3} p={3} bg="gray.50" rounded="lg">
            <Text fontSize="sm" fontWeight="500">{searchResult.displayName}</Text>
            <Button
              size="sm"
              colorPalette="brand"
              loading={actionLoading === searchResult.id}
              onClick={() => sendInvite(searchResult.id)}
            >
              Dəvət et
            </Button>
          </Flex>
        )}
      </Box>

      {/* Tabs */}
      <Flex mb={4} borderBottomWidth={2} borderColor="gray.200">
        <Box
          as="button"
          px={4}
          py={2}
          fontSize="sm"
          fontWeight={activeTab === "connections" ? "700" : "400"}
          color={activeTab === "connections" ? "brand.600" : "gray.500"}
          borderBottomWidth={2}
          borderColor={activeTab === "connections" ? "brand.600" : "transparent"}
          mb="-2px"
          onClick={() => setActiveTab("connections")}
        >
          Əlaqələrim ({connections.length})
        </Box>
        <Box
          as="button"
          px={4}
          py={2}
          fontSize="sm"
          fontWeight={activeTab === "invites" ? "700" : "400"}
          color={activeTab === "invites" ? "brand.600" : "gray.500"}
          borderBottomWidth={2}
          borderColor={activeTab === "invites" ? "brand.600" : "transparent"}
          mb="-2px"
          onClick={() => setActiveTab("invites")}
        >
          Dəvətlər
          {incomingInvites.length > 0 && (
            <Badge colorPalette="red" ml={2} borderRadius="full" size="sm">
              {incomingInvites.length}
            </Badge>
          )}
        </Box>
      </Flex>

      {/* Connections Tab */}
      {activeTab === "connections" && (
        <Box>
          {loading ? (
            <Stack gap={3}>
              {[1, 2, 3].map((i) => (
                <Box key={i} bg="white" rounded="xl" p={4} borderWidth={1} borderColor="gray.200" h="60px" />
              ))}
            </Stack>
          ) : connections.length === 0 ? (
            <Box bg="white" rounded="xl" p={8} textAlign="center" borderWidth={1} borderColor="gray.200">
              <Text fontSize="2xl" mb={2}>👥</Text>
              <Text color="gray.500" fontSize="sm">Hələlik əlaqəniz yoxdur</Text>
            </Box>
          ) : (
            <Stack gap={2}>
              {connections.map((conn) => (
                <Flex
                  key={conn.id}
                  bg="white"
                  rounded="xl"
                  p={4}
                  borderWidth={1}
                  borderColor="gray.200"
                  align="center"
                  gap={3}
                >
                  <Box
                    w="36px" h="36px" bg="brand.100" rounded="full"
                    display="flex" alignItems="center" justifyContent="center"
                    fontSize="sm" fontWeight="bold" color="brand.700" flexShrink={0}
                  >
                    {conn.displayName.charAt(0).toUpperCase()}
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="600" fontSize="sm">{conn.displayName}</Text>
                    {conn.cityName && (
                      <Text fontSize="xs" color="gray.400">📍 {conn.cityName}</Text>
                    )}
                  </Box>
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    loading={actionLoading === conn.id}
                    onClick={() => removeConnection(conn.id)}
                  >
                    Sil
                  </Button>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Invites Tab */}
      {activeTab === "invites" && (
        <Box>
          {incomingInvites.length > 0 && (
            <Box mb={4}>
              <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase">
                Gələn dəvətlər
              </Text>
              <Stack gap={2}>
                {incomingInvites.map((invite) => (
                  <Flex
                    key={invite.id}
                    bg="white"
                    rounded="xl"
                    p={4}
                    borderWidth={1}
                    borderColor="brand.200"
                    align="center"
                    gap={3}
                  >
                    <Box
                      w="36px" h="36px" bg="brand.100" rounded="full"
                      display="flex" alignItems="center" justifyContent="center"
                      fontSize="sm" fontWeight="bold" color="brand.700" flexShrink={0}
                    >
                      {invite.displayName.charAt(0).toUpperCase()}
                    </Box>
                    <Box flex={1}>
                      <Text fontWeight="600" fontSize="sm">{invite.displayName}</Text>
                      <Text fontSize="xs" color="gray.400">Dəvət göndərdi</Text>
                    </Box>
                    <Flex gap={2}>
                      <Button
                        size="xs"
                        colorPalette="green"
                        loading={actionLoading === invite.id}
                        onClick={() => acceptInvite(invite.id)}
                      >
                        Qəbul et
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="red"
                        loading={actionLoading === invite.id}
                        onClick={() => rejectInvite(invite.id)}
                      >
                        Rədd et
                      </Button>
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            </Box>
          )}

          {outgoingInvites.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase">
                Göndərilən dəvətlər
              </Text>
              <Stack gap={2}>
                {outgoingInvites.map((invite) => (
                  <Flex
                    key={invite.id}
                    bg="white"
                    rounded="xl"
                    p={4}
                    borderWidth={1}
                    borderColor="gray.200"
                    align="center"
                    gap={3}
                  >
                    <Box
                      w="36px" h="36px" bg="gray.100" rounded="full"
                      display="flex" alignItems="center" justifyContent="center"
                      fontSize="sm" fontWeight="bold" color="gray.600" flexShrink={0}
                    >
                      {invite.displayName.charAt(0).toUpperCase()}
                    </Box>
                    <Box flex={1}>
                      <Text fontWeight="600" fontSize="sm">{invite.displayName}</Text>
                      <Badge colorPalette="yellow" size="sm" mt={0.5}>Gözləyir</Badge>
                    </Box>
                  </Flex>
                ))}
              </Stack>
            </Box>
          )}

          {incomingInvites.length === 0 && outgoingInvites.length === 0 && (
            <Box bg="white" rounded="xl" p={8} textAlign="center" borderWidth={1} borderColor="gray.200">
              <Text color="gray.500" fontSize="sm">Aktiv dəvət yoxdur</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
