"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/react"
import Link from "next/link"

interface InviteInfo {
  inviteId: string
  senderName: string
  senderId: string
  expiresAt: string | null
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Dəvət tapılmadı")
        } else {
          const data = await res.json()
          setInvite(data)
        }
      })
      .catch(() => setError("Xəta baş verdi"))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" })
      if (res.ok) {
        setAccepted(true)
        setTimeout(() => router.push("/feed"), 1500)
      } else {
        const data = await res.json()
        setError(data.error ?? "Qəbul edilmədi")
      }
    } catch {
      setError("Xəta baş verdi")
    } finally {
      setAccepting(false)
    }
  }

  if (loading || authStatus === "loading") {
    return (
      <Flex minH="100svh" align="center" justify="center">
        <Spinner size="lg" />
      </Flex>
    )
  }

  return (
    <Flex minH="100svh" align="center" justify="center" bg="gray.50" p={4}>
      <Box bg="white" rounded="2xl" shadow="sm" p={8} maxW="400px" w="full" textAlign="center">
        {/* Logo */}
        <Text fontSize="2xl" fontWeight="800" color="brand.600" mb={6}>
          Trusted
        </Text>

        {error ? (
          <Stack gap={4}>
            <Text fontSize="3xl">😕</Text>
            <Text color="gray.600" fontSize="sm">{error}</Text>
            <Link href="/">
              <Button variant="outline" size="sm" w="full">Ana səhifəyə get</Button>
            </Link>
          </Stack>
        ) : accepted ? (
          <Stack gap={4}>
            <Text fontSize="3xl">🎉</Text>
            <Heading size="md">Əlaqə quruldu!</Heading>
            <Text color="gray.500" fontSize="sm">
              {invite?.senderName} ilə əlaqə qurdunuz. Lentinizə yönləndirilirsiniz…
            </Text>
          </Stack>
        ) : (
          <Stack gap={6}>
            {/* Sender avatar placeholder */}
            <Flex justify="center">
              <Box
                w="72px" h="72px" bg="brand.100" rounded="full"
                display="flex" alignItems="center" justifyContent="center"
                fontSize="2xl" fontWeight="bold" color="brand.700"
              >
                {invite?.senderName?.charAt(0).toUpperCase()}
              </Box>
            </Flex>

            <Box>
              <Heading size="md" mb={1}>
                {invite?.senderName}
              </Heading>
              <Text color="gray.500" fontSize="sm">
                sizi <strong>Trusted</strong>-a dəvət edir
              </Text>
            </Box>

            <Text color="gray.400" fontSize="xs">
              Trusted — etibarlı insanlardan tövsiyə alın
            </Text>

            {session ? (
              // Logged-in: accept directly
              <Stack gap={3}>
                {session.user?.id === invite?.senderId ? (
                  <Text color="gray.400" fontSize="sm">Bu sizin öz dəvət linkinizdir</Text>
                ) : (
                  <Button
                    colorPalette="brand"
                    size="lg"
                    w="full"
                    loading={accepting}
                    onClick={handleAccept}
                  >
                    Dəvəti qəbul et
                  </Button>
                )}
              </Stack>
            ) : (
              // Not logged in: go to signup or login
              <Stack gap={3}>
                <Link href={`/signup?inviteToken=${token}`} style={{ width: "100%" }}>
                  <Button colorPalette="brand" size="lg" w="full">
                    Qeydiyyatdan keç
                  </Button>
                </Link>
                <Link href={`/login?inviteToken=${token}`} style={{ width: "100%" }}>
                  <Button variant="outline" size="lg" w="full">
                    Daxil ol
                  </Button>
                </Link>
                <Text color="gray.400" fontSize="xs">
                  Hesabınız varsa daxil olun, dəvət avtomatik qəbul ediləcək
                </Text>
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </Flex>
  )
}
