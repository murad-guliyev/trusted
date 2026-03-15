import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Box, Heading, Text } from "@chakra-ui/react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/feed")
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="gray.900" px={6} py={4}>
        <Heading size="md" color="white">
          Admin Panel
        </Heading>
        <Text color="gray.400" fontSize="sm">
          {session.user.email}
        </Text>
      </Box>
      <Box p={6}>{children}</Box>
    </Box>
  )
}
