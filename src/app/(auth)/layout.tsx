import { Box, Flex, Heading } from "@chakra-ui/react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="gray.50"
      direction="column"
      px={4}
    >
      <Box mb={8} textAlign="center">
        <Heading size="2xl" color="brand.600" fontWeight="bold">
          Trusted
        </Heading>
        <Box color="gray.500" mt={1} fontSize="sm">
          Etibarlı tövsiyələr
        </Box>
      </Box>
      <Box w="full" maxW="400px">
        {children}
      </Box>
    </Flex>
  )
}
