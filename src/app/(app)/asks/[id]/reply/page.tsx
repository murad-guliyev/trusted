"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Heading,
  Textarea,
  Field,
} from "@chakra-ui/react"
import Link from "next/link"

export default function ReplyPage() {
  const router = useRouter()
  const params = useParams()
  const askId = params.id as string

  const [recommendedName, setRecommendedName] = useState("")
  const [phone, setPhone] = useState("")
  const [url, setUrl] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    // Client-side: at least one field required
    if (!recommendedName && !phone && !url && !note) {
      setFieldErrors({ note: "Ən az bir sahə doldurulmalıdır" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/asks/${askId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendedName: recommendedName || undefined,
          phone: phone || undefined,
          url: url || undefined,
          note: note || undefined,
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

      router.push(`/asks/${askId}`)
    } catch {
      setError("Xəta baş verdi. Yenidən cəhd edin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Box mb={4}>
        <Link href={`/asks/${askId}`}>
          <Text fontSize="sm" color="brand.600" fontWeight="600">
            ← Suala qayıt
          </Text>
        </Link>
      </Box>

      <Heading size="md" mb={4}>
        Cavab ver
      </Heading>

      <Box bg="white" rounded="xl" p={5} borderWidth={1} borderColor="gray.200" shadow="sm">
        <Text fontSize="sm" color="gray.500" mb={4}>
          Ən az bir sahəni doldurun
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <Field.Root invalid={!!fieldErrors.recommendedName}>
              <Field.Label>Tövsiyə edilən şəxsin adı (ixtiyari)</Field.Label>
              <Input
                value={recommendedName}
                onChange={(e) => setRecommendedName(e.target.value)}
                placeholder="Məsələn: Rauf müəllim"
                maxLength={100}
              />
              {fieldErrors.recommendedName && (
                <Field.ErrorText>{fieldErrors.recommendedName}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!fieldErrors.phone}>
              <Field.Label>Telefon nömrəsi (ixtiyari)</Field.Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+994 50 000 00 00"
              />
              {fieldErrors.phone && (
                <Field.ErrorText>{fieldErrors.phone}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!fieldErrors.url}>
              <Field.Label>Keçid (link) (ixtiyari)</Field.Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
              {fieldErrors.url && (
                <Field.ErrorText>{fieldErrors.url}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root invalid={!!fieldErrors.note}>
              <Field.Label>Qeyd (ixtiyari)</Field.Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Əlavə məlumat, tövsiyəniz haqqında..."
                rows={3}
                maxLength={500}
              />
              <Text fontSize="xs" color="gray.400" textAlign="right">{note.length}/500</Text>
              {fieldErrors.note && (
                <Field.ErrorText>{fieldErrors.note}</Field.ErrorText>
              )}
            </Field.Root>

            {error && (
              <Box bg="red.50" borderWidth={1} borderColor="red.200" rounded="md" p={3}>
                <Text color="red.600" fontSize="sm">{error}</Text>
              </Box>
            )}

            <Button
              type="submit"
              colorPalette="brand"
              loading={loading}
              loadingText="Göndərilir..."
              w="full"
            >
              Cavabı göndər
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
