export const dynamic = "force-dynamic"

import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Box, Text, Heading, Badge, Stack, Flex } from "@chakra-ui/react"
import Link from "next/link"
import { formatDistanceToNow } from "@/lib/utils"

async function getFeedAsks(userId: string) {
  // Get all active connections for the user
  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      status: "ACTIVE",
    },
  })

  const connectionUserIds = connections.map((c) =>
    c.userAId === userId ? c.userBId : c.userAId
  )

  // Get blocked user IDs (both directions)
  const blocks = await prisma.blockRelation.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
      status: "ACTIVE",
    },
  })
  const blockedUserIds = new Set(
    blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId))
  )

  const now = new Date()

  const asks = await prisma.ask.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: now },
      OR: [
        {
          visibilityMode: "ALL_CONNECTIONS",
          authorId: { in: connectionUserIds },
        },
        {
          visibilityMode: "SELECTED_CONNECTIONS",
          audience: { some: { targetUserId: userId } },
        },
        { authorId: userId },
      ],
      author: {
        id: { notIn: Array.from(blockedUserIds) },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        include: { profile: true },
      },
      category: true,
      city: true,
      _count: { select: { replies: { where: { status: "ACTIVE" } } } },
    },
    take: 30,
  })

  return asks
}

export default async function FeedPage() {
  const session = await getAuthSession()
  if (!session?.user?.id) return null

  const asks = await getFeedAsks(session.user.id)

  if (asks.length === 0) {
    return (
      <Box p={4} maxW="600px" mx="auto">
        <Heading size="md" mb={2}>
          Axın
        </Heading>
        <Box
          bg="white"
          rounded="xl"
          p={8}
          textAlign="center"
          borderWidth={1}
          borderColor="gray.200"
          mt={6}
        >
          <Text fontSize="3xl" mb={3}>
            🔍
          </Text>
          <Heading size="sm" mb={2} color="gray.700">
            Hələlik heç bir sual yoxdur
          </Heading>
          <Text color="gray.500" fontSize="sm" mb={4}>
            Əlaqə əlavə edin ki, onların suallarını görəsiniz.
          </Text>
          <Link href="/connections">
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
              Əlaqə əlavə et
            </Box>
          </Link>
        </Box>
      </Box>
    )
  }

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Heading size="md" mb={4}>
        Axın
      </Heading>
      <Stack gap={3}>
        {asks.map((ask) => {
          const authorName =
            ask.author.profile?.displayName ?? ask.author.email
          const truncatedText =
            ask.text.length > 120
              ? ask.text.slice(0, 120) + "…"
              : ask.text
          const timeAgo = formatDistanceToNow(ask.createdAt)

          return (
            <Link key={ask.id} href={`/asks/${ask.id}`}>
              <Box
                bg="white"
                rounded="xl"
                p={4}
                borderWidth={1}
                borderColor="gray.200"
                shadow="sm"
                _hover={{ shadow: "md", borderColor: "brand.200" }}
                transition="all 0.15s"
              >
                <Flex align="center" mb={2} gap={2}>
                  <Box
                    w="36px"
                    h="36px"
                    bg="brand.100"
                    rounded="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="sm"
                    fontWeight="bold"
                    color="brand.700"
                    flexShrink={0}
                  >
                    {authorName.charAt(0).toUpperCase()}
                  </Box>
                  <Box flex={1} minW={0}>
                    <Text fontWeight="600" fontSize="sm" truncate>
                      {authorName}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {timeAgo}
                    </Text>
                  </Box>
                  <Badge colorPalette="purple" size="sm">
                    {ask.category.label}
                  </Badge>
                </Flex>

                <Text fontSize="sm" color="gray.700" mb={3} lineClamp={3}>
                  {truncatedText}
                </Text>

                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2}>
                    {ask.city && (
                      <Text fontSize="xs" color="gray.400">
                        📍 {ask.city.name}
                      </Text>
                    )}
                  </Flex>
                  <Badge
                    colorPalette={ask._count.replies > 0 ? "green" : "gray"}
                    size="sm"
                  >
                    {ask._count.replies} cavab
                  </Badge>
                </Flex>
              </Box>
            </Link>
          )
        })}
      </Stack>
    </Box>
  )
}
