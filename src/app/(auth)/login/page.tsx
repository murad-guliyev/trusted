"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Heading,
  Field,
} from "@chakra-ui/react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/feed",
        redirect: false,
      })

      if (result?.error) {
        setError("E-poçt və ya şifrə yanlışdır. Yenidən cəhd edin.")
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch {
      setError("Xəta baş verdi. Yenidən cəhd edin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      bg="white"
      p={8}
      rounded="xl"
      shadow="md"
      borderWidth={1}
      borderColor="gray.200"
    >
      <Heading size="lg" mb={6} textAlign="center">
        Daxil ol
      </Heading>

      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>E-poçt</Field.Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@nümunə.az"
              required
              autoComplete="email"
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Şifrə</Field.Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </Field.Root>

          {error && (
            <Box
              bg="red.50"
              border="1px"
              borderColor="red.200"
              rounded="md"
              p={3}
            >
              <Text color="red.600" fontSize="sm">
                {error}
              </Text>
            </Box>
          )}

          <Button
            type="submit"
            colorPalette="brand"
            loading={loading}
            loadingText="Giriş edilir..."
            w="full"
          >
            Daxil ol
          </Button>
        </Stack>
      </form>

      <Box mt={6} textAlign="center">
        <Text fontSize="sm" color="gray.600">
          Hesabınız yoxdur?{" "}
          <Link href="/signup" style={{ color: "#6366f1", fontWeight: 600 }}>
            Qeydiyyat
          </Link>
        </Text>
      </Box>
    </Box>
  )
}
