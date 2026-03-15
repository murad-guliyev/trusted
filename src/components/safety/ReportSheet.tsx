"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Stack,
  Text,
  Heading,
  Textarea,
  Field,
  Flex,
} from "@chakra-ui/react"

const REASON_OPTIONS = [
  { code: "spam", label: "Spam və ya reklamçılıq" },
  { code: "harassment", label: "Təhqir və ya zorakılıq" },
  { code: "unsafe", label: "Təhlükəli və ya qeyri-qanuni məzmun" },
  { code: "fraud", label: "Yanlış və ya aldadıcı məlumat" },
  { code: "privacy", label: "Şəxsi məlumatların pozulması" },
]

interface ReportSheetProps {
  targetType: "ASK" | "REPLY" | "USER"
  targetId: string
  onClose: () => void
}

export function ReportSheet({ targetType, targetId, onClose }: ReportSheetProps) {
  const [reasonCode, setReasonCode] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!reasonCode) {
      setError("Şikayət səbəbi seçin")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reasonCode,
          note: note || undefined,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || "Xəta baş verdi.")
      }
    } catch {
      setError("Xəta baş verdi. Yenidən cəhd edin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={200}
      display="flex"
      alignItems="flex-end"
      bg="blackAlpha.600"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <Box
        bg="white"
        w="full"
        maxW="600px"
        mx="auto"
        rounded="2xl"
        roundedBottom={0}
        p={6}
        pb={8}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Şikayət et</Heading>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </Flex>

        {submitted ? (
          <Box textAlign="center" py={6}>
            <Text fontSize="3xl" mb={3}>✅</Text>
            <Heading size="sm" mb={2}>Şikayətiniz qəbul edildi</Heading>
            <Text color="gray.500" fontSize="sm" mb={4}>
              Şikayətinizi nəzərdən keçirəcəyik.
            </Text>
            <Button colorPalette="brand" onClick={onClose}>Bağla</Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Şikayət səbəbi</Field.Label>
                <Stack gap={2} mt={1}>
                  {REASON_OPTIONS.map((opt) => (
                    <label
                      key={opt.code}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${reasonCode === opt.code ? "#6366f1" : "#E2E8F0"}`,
                        background: reasonCode === opt.code ? "#eef2ff" : "white",
                      }}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={opt.code}
                        checked={reasonCode === opt.code}
                        onChange={() => setReasonCode(opt.code)}
                        style={{ accentColor: "#6366f1" }}
                      />
                      <Text fontSize="sm">{opt.label}</Text>
                    </label>
                  ))}
                </Stack>
              </Field.Root>

              <Field.Root>
                <Field.Label>Əlavə qeyd (ixtiyari)</Field.Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Əlavə məlumat..."
                  rows={3}
                  maxLength={300}
                />
                <Text fontSize="xs" color="gray.400" textAlign="right">{note.length}/300</Text>
              </Field.Root>

              {error && (
                <Box bg="red.50" borderWidth={1} borderColor="red.200" rounded="md" p={3}>
                  <Text color="red.600" fontSize="sm">{error}</Text>
                </Box>
              )}

              <Flex gap={3}>
                <Button variant="outline" flex={1} onClick={onClose}>
                  Ləğv et
                </Button>
                <Button
                  type="submit"
                  colorPalette="red"
                  flex={1}
                  loading={loading}
                  loadingText="Göndərilir..."
                >
                  Şikayət et
                </Button>
              </Flex>
            </Stack>
          </form>
        )}
      </Box>
    </Box>
  )
}
