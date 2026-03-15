"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Heading,
  Field,
  Flex,
} from "@chakra-ui/react"

interface ProfileData {
  id: string
  email: string
  displayName: string | null
  cityId: string | null
  cityName: string | null
  createdAt: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me")
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setDisplayName(data.displayName ?? "")
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          cityId: profile?.cityId ?? "city_baku",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors)
        } else {
          setError(data.error || "Xəta baş verdi.")
        }
        return
      }

      setProfile((prev) => prev ? { ...prev, displayName: data.displayName, cityName: data.cityName } : prev)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError("Xəta baş verdi. Yenidən cəhd edin.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box p={4} maxW="400px" mx="auto">
        <Box bg="white" rounded="xl" p={6} borderWidth={1} borderColor="gray.200" h="200px" />
      </Box>
    )
  }

  return (
    <Box p={4} maxW="400px" mx="auto">
      <Heading size="md" mb={4}>Profil</Heading>

      <Box bg="white" rounded="xl" p={6} borderWidth={1} borderColor="gray.200" shadow="sm" mb={4}>
        {/* Avatar */}
        <Flex justify="center" mb={4}>
          <Box
            w="72px" h="72px"
            bg="brand.100"
            rounded="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="2xl"
            fontWeight="bold"
            color="brand.700"
          >
            {(displayName || profile?.email || "?").charAt(0).toUpperCase()}
          </Box>
        </Flex>

        <form onSubmit={handleSave}>
          <Stack gap={4}>
            <Field.Root>
              <Field.Label>E-poçt</Field.Label>
              <Input value={profile?.email ?? ""} disabled bg="gray.50" />
            </Field.Root>

            <Field.Root invalid={!!fieldErrors.displayName}>
              <Field.Label>Ad Soyad</Field.Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Adınız Soyadınız"
                required
              />
              {fieldErrors.displayName && (
                <Field.ErrorText>{fieldErrors.displayName}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>Şəhər</Field.Label>
              <Input value="Bakı" disabled bg="gray.50" />
            </Field.Root>

            {success && (
              <Box bg="green.50" borderWidth={1} borderColor="green.200" rounded="md" p={3}>
                <Text color="green.700" fontSize="sm">Profil uğurla yeniləndi!</Text>
              </Box>
            )}

            {error && (
              <Box bg="red.50" borderWidth={1} borderColor="red.200" rounded="md" p={3}>
                <Text color="red.600" fontSize="sm">{error}</Text>
              </Box>
            )}

            <Button
              type="submit"
              colorPalette="brand"
              loading={saving}
              loadingText="Yadda saxlanır..."
              w="full"
            >
              Yadda saxla
            </Button>
          </Stack>
        </form>
      </Box>

      <Box bg="white" rounded="xl" p={4} borderWidth={1} borderColor="gray.200" shadow="sm">
        <Button
          variant="outline"
          colorPalette="red"
          w="full"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Çıxış
        </Button>
      </Box>

      {profile?.createdAt && (
        <Text fontSize="xs" color="gray.400" textAlign="center" mt={4}>
          Qeydiyyat tarixi: {new Date(profile.createdAt).toLocaleDateString("az-AZ")}
        </Text>
      )}
    </Box>
  )
}
