"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Box, Button, Input, Stack, Text, Heading, Field, Spinner, Flex } from "@chakra-ui/react"
import Link from "next/link"

interface FieldErrors {
  email?: string
  password?: string
  displayName?: string
  general?: string
}

function SignupForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("inviteToken")

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(data.errors ?? { general: data.error || "Xəta baş verdi." })
        return
      }
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setErrors({ general: "Qeydiyyat uğurlu oldu, lakin giriş xətası baş verdi." })
        return
      }
      if (inviteToken) {
        await fetch(`/api/invite/${inviteToken}/accept`, { method: "POST" })
        window.location.href = `/invite/${inviteToken}`
      } else {
        window.location.href = "/feed"
      }
    } catch {
      setErrors({ general: "Xəta baş verdi. Yenidən cəhd edin." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box bg="white" p={8} rounded="xl" shadow="md" borderWidth={1} borderColor="gray.200">
      <Heading size="lg" mb={6} textAlign="center">Qeydiyyat</Heading>

      {inviteToken && (
        <Box bg="brand.50" border="1px" borderColor="brand.200" rounded="md" p={3} mb={4}>
          <Text fontSize="sm" color="brand.700">
            Dəvət linki aşkarlandı — qeydiyyatdan keçdikdən sonra avtomatik qəbul ediləcək.
          </Text>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field.Root invalid={!!errors.displayName}>
            <Field.Label>Ad Soyad</Field.Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Adınız Soyadınız" required />
            {errors.displayName && <Field.ErrorText>{errors.displayName}</Field.ErrorText>}
          </Field.Root>
          <Field.Root invalid={!!errors.email}>
            <Field.Label>E-poçt</Field.Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@nümunə.az" required autoComplete="email" />
            {errors.email && <Field.ErrorText>{errors.email}</Field.ErrorText>}
          </Field.Root>
          <Field.Root invalid={!!errors.password}>
            <Field.Label>Şifrə</Field.Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Ən az 8 simvol" required autoComplete="new-password" />
            {errors.password && <Field.ErrorText>{errors.password}</Field.ErrorText>}
          </Field.Root>
          {errors.general && (
            <Box bg="red.50" border="1px" borderColor="red.200" rounded="md" p={3}>
              <Text color="red.600" fontSize="sm">{errors.general}</Text>
            </Box>
          )}
          <Button type="submit" colorPalette="brand" loading={loading}
            loadingText="Qeydiyyat edilir..." w="full">
            Qeydiyyatdan keç
          </Button>
        </Stack>
      </form>

      <Box mt={6} textAlign="center">
        <Text fontSize="sm" color="gray.600">
          Artıq hesabınız var?{" "}
          <Link href={inviteToken ? `/login?inviteToken=${inviteToken}` : "/login"}
            style={{ color: "#6366f1", fontWeight: 600 }}>
            Daxil ol
          </Link>
        </Text>
      </Box>
    </Box>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Flex justify="center"><Spinner /></Flex>}>
      <SignupForm />
    </Suspense>
  )
}
