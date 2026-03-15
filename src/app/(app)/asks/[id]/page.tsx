import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { canViewAsk } from "@/lib/permissions"
import { Box, Text, Heading, Badge, Stack, Flex } from "@chakra-ui/react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { formatDistanceToNow, formatTimeRemaining } from "@/lib/utils"
import { trackAskViewed } from "@/lib/analytics"

interface Props {
  params: { id: string }
}

export default async function AskDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const askId = params.id

  const allowed = await canViewAsk(userId, askId)
  if (!allowed) {
    return (
      <Box p={4} maxW="600px" mx="auto">
        <Box bg="red.50" borderWidth={1} borderColor="red.200" rounded="xl" p={6} textAlign="center">
          <Text fontSize="2xl" mb={2}>🔒</Text>
          <Heading size="sm" color="red.700" mb={2}>Bu suala giriş icazəniz yoxdur</Heading>
          <Text color="red.600" fontSize="sm">Bu sual sizin əlaqələriniz üçün deyil.</Text>
          <Link href="/feed">
            <Box as="span" display="inline-block" mt={4} color="brand.600" fontSize="sm" fontWeight="600">
              Axına qayıt
            </Box>
          </Link>
        </Box>
      </Box>
    )
  }

  const ask = await prisma.ask.findUnique({
    where: { id: askId },
    include: {
      author: { include: { profile: true } },
      category: true,
      city: true,
      replies: {
        where: { status: "ACTIVE" },
        include: { author: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { replies: { where: { status: "ACTIVE" } } } },
    },
  })

  if (!ask) notFound()

  // Track view (non-blocking)
  trackAskViewed(userId, askId).catch(console.error)

  const isAuthor = ask.authorId === userId
  const authorName = ask.author.profile?.displayName ?? ask.author.email

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Box mb={4}>
        <Link href="/feed">
          <Text fontSize="sm" color="brand.600" fontWeight="600">
            ← Axına qayıt
          </Text>
        </Link>
      </Box>

      <Box bg="white" rounded="xl" p={5} borderWidth={1} borderColor="gray.200" shadow="sm" mb={4}>
        {/* Author info */}
        <Flex align="center" mb={4} gap={3}>
          <Box
            w="44px" h="44px" bg="brand.100" rounded="full"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="md" fontWeight="bold" color="brand.700" flexShrink={0}
          >
            {authorName.charAt(0).toUpperCase()}
          </Box>
          <Box flex={1}>
            <Text fontWeight="600">{authorName}</Text>
            <Text fontSize="xs" color="gray.400">{formatDistanceToNow(ask.createdAt)}</Text>
          </Box>
          <Badge colorPalette="purple">{ask.category.label}</Badge>
        </Flex>

        {/* Ask text */}
        <Text fontSize="md" color="gray.800" lineHeight="tall" mb={4}>
          {ask.text}
        </Text>

        {/* Meta */}
        <Flex align="center" gap={3} mb={4} flexWrap="wrap">
          {ask.city && (
            <Text fontSize="xs" color="gray.500">📍 {ask.city.name}</Text>
          )}
          <Text fontSize="xs" color="gray.500">
            ⏱ {formatTimeRemaining(ask.expiresAt)}
          </Text>
          <Badge colorPalette={ask._count.replies > 0 ? "green" : "gray"} size="sm">
            {ask._count.replies} cavab
          </Badge>
        </Flex>

        {/* Actions */}
        <Flex gap={2} flexWrap="wrap">
          {!isAuthor && ask.status === "ACTIVE" && (
            <Link href={`/asks/${ask.id}/reply`}>
              <Box
                as="span"
                display="inline-block"
                bg="brand.600"
                color="white"
                px={4}
                py={2}
                rounded="lg"
                fontSize="sm"
                fontWeight="600"
                _hover={{ bg: "brand.700" }}
              >
                Cavab ver
              </Box>
            </Link>
          )}
        </Flex>
      </Box>

      {/* Replies — only visible to ask author */}
      {isAuthor && (
        <Box>
          <Heading size="sm" mb={3}>
            Cavablar ({ask._count.replies})
          </Heading>
          {ask.replies.length === 0 ? (
            <Box bg="white" rounded="xl" p={6} textAlign="center" borderWidth={1} borderColor="gray.200">
              <Text color="gray.400" fontSize="sm">Hələlik cavab yoxdur</Text>
            </Box>
          ) : (
            <Stack gap={3}>
              {ask.replies.map((reply) => {
                const replyAuthor = reply.author.profile?.displayName ?? reply.author.email
                return (
                  <Box
                    key={reply.id}
                    bg="white"
                    rounded="xl"
                    p={4}
                    borderWidth={1}
                    borderColor="gray.200"
                    shadow="sm"
                  >
                    <Flex align="center" mb={3} gap={2}>
                      <Box
                        w="32px" h="32px" bg="green.100" rounded="full"
                        display="flex" alignItems="center" justifyContent="center"
                        fontSize="sm" fontWeight="bold" color="green.700"
                      >
                        {replyAuthor.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Text fontWeight="600" fontSize="sm">{replyAuthor}</Text>
                        <Text fontSize="xs" color="gray.400">{formatDistanceToNow(reply.createdAt)}</Text>
                      </Box>
                    </Flex>

                    <Stack gap={2}>
                      {reply.recommendedName && (
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="600">Tövsiyə olunan şəxs</Text>
                          <Text fontSize="sm">{reply.recommendedName}</Text>
                        </Box>
                      )}
                      {reply.phone && (
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="600">Telefon</Text>
                          <Text fontSize="sm">
                            <a href={`tel:${reply.phone}`} style={{ color: "#6366f1" }}>{reply.phone}</a>
                          </Text>
                        </Box>
                      )}
                      {reply.url && (
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="600">Keçid</Text>
                          <Text fontSize="sm">
                            <a href={reply.url} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>
                              {reply.url}
                            </a>
                          </Text>
                        </Box>
                      )}
                      {reply.note && (
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="600">Qeyd</Text>
                          <Text fontSize="sm" color="gray.700">{reply.note}</Text>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          )}
        </Box>
      )}

      {/* Report button for non-authors */}
      {!isAuthor && (
        <Box mt={4} textAlign="center">
          <Link href={`/asks/${ask.id}/reply`}>
            <Text fontSize="xs" color="gray.400" _hover={{ color: "gray.600" }}>
              Bu sualu şikayət et
            </Text>
          </Link>
        </Box>
      )}
    </Box>
  )
}
