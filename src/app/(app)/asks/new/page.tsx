"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Heading,
  Textarea,
  Field,
  Flex,
  Badge,
} from "@chakra-ui/react"

const CATEGORIES = [
  { key: "car_master", label: "Avtomobil ustası" },
  { key: "doctor", label: "Həkim" },
  { key: "dentist", label: "Diş həkimi" },
  { key: "nurse", label: "Tibb bacısı" },
  { key: "tutor", label: "Repetitor" },
  { key: "electrician", label: "Elektrik ustası" },
  { key: "plumber", label: "Santexnik" },
  { key: "repair_master", label: "Təmir ustası" },
  { key: "beauty", label: "Gözəllik / Salon" },
  { key: "lawyer", label: "Hüquqşünas" },
  { key: "babysitter", label: "Uşaq baxıcısı" },
  { key: "restaurant", label: "Restoran / Kafe" },
  { key: "vet", label: "Baytarlıq həkimi" },
  { key: "it_specialist", label: "Proqramçı / IT" },
  { key: "other", label: "Digər" },
]

interface Connection {
  id: string
  userId: string
  displayName: string
}

export default function NewAskPage() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [visibilityMode, setVisibilityMode] = useState<"ALL_CONNECTIONS" | "SELECTED_CONNECTIONS">("ALL_CONNECTIONS")
  const [audienceIds, setAudienceIds] = useState<string[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [categoryKeyToId, setCategoryKeyToId] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Fetch real category IDs from API
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories")
        if (res.ok) {
          const cats = await res.json()
          const map: Record<string, string> = {}
          for (const cat of cats) {
            map[cat.key] = cat.id
          }
          setCategoryKeyToId(map)
        }
      } catch {
        // ignore
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (visibilityMode === "SELECTED_CONNECTIONS") {
      async function fetchConnections() {
        try {
          const res = await fetch("/api/connections")
          if (res.ok) {
            const data = await res.json()
            setConnections(data.connections ?? [])
          }
        } catch {
          // ignore
        }
      }
      fetchConnections()
    }
  }, [visibilityMode])

  function toggleAudience(userId: string) {
    setAudienceIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    if (!categoryId) {
      setFieldErrors({ categoryId: "Kateqoriya seçin" })
      return
    }

    // Get the actual category ID from the API
    const resolvedCategoryId = categoryKeyToId[categoryId] || categoryId

    setLoading(true)
    try {
      const res = await fetch("/api/asks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          categoryId: resolvedCategoryId,
          cityId: "city_baku",
          visibilityMode,
          audienceIds: visibilityMode === "SELECTED_CONNECTIONS" ? audienceIds : undefined,
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

      router.push("/feed")
    } catch {
      setError("Xəta baş verdi. Yenidən cəhd edin.")
    } finally {
      setLoading(false)
    }
  }

  const charCount = text.length

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Heading size="md" mb={4}>
        Sual yarat
      </Heading>

      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field.Root invalid={!!fieldErrors.text}>
            <Field.Label>Sual</Field.Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nə soruşmaq istəyirsiniz? (ən az 10, ən çox 220 simvol)"
              rows={4}
              maxLength={220}
              required
            />
            <Flex justify="space-between" mt={1}>
              {fieldErrors.text ? (
                <Field.ErrorText>{fieldErrors.text}</Field.ErrorText>
              ) : (
                <Box />
              )}
              <Text fontSize="xs" color={charCount > 200 ? "red.500" : "gray.400"}>
                {charCount}/220
              </Text>
            </Flex>
          </Field.Root>

          <Field.Root invalid={!!fieldErrors.categoryId}>
            <Field.Label>Kateqoriya</Field.Label>
            <Box as="select"
              value={categoryId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                fontSize: "14px",
                background: "white",
              }}
              required
            >
              <option value="">Kateqoriya seçin...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </Box>
            {fieldErrors.categoryId && (
              <Field.ErrorText>{fieldErrors.categoryId}</Field.ErrorText>
            )}
          </Field.Root>

          <Field.Root>
            <Field.Label>Şəhər</Field.Label>
            <Input value="Bakı" disabled bg="gray.50" />
          </Field.Root>

          <Field.Root>
            <Field.Label>Görünürlük</Field.Label>
            <Stack gap={2} mt={1}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="visibility"
                  value="ALL_CONNECTIONS"
                  checked={visibilityMode === "ALL_CONNECTIONS"}
                  onChange={() => setVisibilityMode("ALL_CONNECTIONS")}
                />
                <Text fontSize="sm">Bütün əlaqələr</Text>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="visibility"
                  value="SELECTED_CONNECTIONS"
                  checked={visibilityMode === "SELECTED_CONNECTIONS"}
                  onChange={() => setVisibilityMode("SELECTED_CONNECTIONS")}
                />
                <Text fontSize="sm">Seçilmiş əlaqələr</Text>
              </label>
            </Stack>
          </Field.Root>

          {visibilityMode === "SELECTED_CONNECTIONS" && (
            <Field.Root invalid={!!fieldErrors.audienceIds}>
              <Field.Label>Əlaqələri seçin</Field.Label>
              {connections.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  Əlaqəniz yoxdur.
                </Text>
              ) : (
                <Stack gap={2} mt={1}>
                  {connections.map((conn) => (
                    <label
                      key={conn.userId}
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={audienceIds.includes(conn.userId)}
                        onChange={() => toggleAudience(conn.userId)}
                      />
                      <Text fontSize="sm">{conn.displayName}</Text>
                      {audienceIds.includes(conn.userId) && (
                        <Badge colorPalette="green" size="sm">Seçildi</Badge>
                      )}
                    </label>
                  ))}
                </Stack>
              )}
              {fieldErrors.audienceIds && (
                <Field.ErrorText>{fieldErrors.audienceIds}</Field.ErrorText>
              )}
            </Field.Root>
          )}

          {error && (
            <Box bg="red.50" borderWidth={1} borderColor="red.200" rounded="md" p={3}>
              <Text color="red.600" fontSize="sm">{error}</Text>
            </Box>
          )}

          <Button
            type="submit"
            colorPalette="brand"
            loading={loading}
            loadingText="Paylaşılır..."
            w="full"
            size="lg"
          >
            Paylaş
          </Button>
        </Stack>
      </form>
    </Box>
  )
}
