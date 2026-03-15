import { prisma } from "@/lib/db"
import { Box, Text, Heading, Badge, Stack, Flex } from "@chakra-ui/react"
import Link from "next/link"

const STATUS_COLOR: Record<string, string> = {
  OPEN: "red",
  IN_REVIEW: "yellow",
  RESOLVED: "green",
  DISMISSED: "gray",
}

const TARGET_TYPE_LABEL: Record<string, string> = {
  ASK: "Sual",
  REPLY: "Cavab",
  USER: "İstifadəçi",
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Təhqir",
  unsafe: "Təhlükəli",
  fraud: "Aldadıcı",
  privacy: "Şəxsi məlumat",
}

async function getReports() {
  return prisma.report.findMany({
    where: {
      status: { in: ["OPEN", "IN_REVIEW"] },
    },
    include: {
      reporter: { include: { profile: true } },
      moderationActions: {
        include: { actor: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "asc" },
    ],
  })
}

export default async function AdminReportsPage() {
  const reports = await getReports()

  return (
    <Box maxW="800px">
      <Flex align="center" justify="space-between" mb={6}>
        <Heading size="md">Şikayətlər</Heading>
        <Badge colorPalette="red" size="lg">{reports.length} açıq</Badge>
      </Flex>

      {reports.length === 0 ? (
        <Box bg="white" rounded="xl" p={8} textAlign="center" borderWidth={1} borderColor="gray.200">
          <Text color="gray.500">Açıq şikayət yoxdur</Text>
        </Box>
      ) : (
        <Stack gap={3}>
          {reports.map((report) => {
            const reporterName = report.reporter.profile?.displayName ?? report.reporter.email

            return (
              <Box
                key={report.id}
                bg="white"
                rounded="xl"
                p={5}
                borderWidth={1}
                borderColor={report.status === "OPEN" ? "red.200" : "yellow.200"}
                shadow="sm"
              >
                <Flex align="center" justify="space-between" mb={3}>
                  <Flex align="center" gap={2}>
                    <Badge colorPalette={STATUS_COLOR[report.status] ?? "gray"}>
                      {report.status}
                    </Badge>
                    <Badge colorPalette="purple">
                      {TARGET_TYPE_LABEL[report.targetType] ?? report.targetType}
                    </Badge>
                    <Badge colorPalette="orange">
                      {REASON_LABELS[report.reasonCode] ?? report.reasonCode}
                    </Badge>
                  </Flex>
                  <Text fontSize="xs" color="gray.400">
                    {new Date(report.createdAt).toLocaleDateString("az-AZ", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Flex>

                <Text fontSize="sm" color="gray.700" mb={2}>
                  <strong>Şikayətçi:</strong> {reporterName}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  <strong>Hədəf ID:</strong>{" "}
                  <code style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                    {report.targetId}
                  </code>
                </Text>
                {report.note && (
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    <strong>Qeyd:</strong> {report.note}
                  </Text>
                )}

                <Flex gap={2} mt={3} flexWrap="wrap">
                  <Link href={`/admin/reports/${report.id}/resolve?action=DISMISS`}>
                    <Box
                      as="span"
                      display="inline-block"
                      px={3} py={1.5}
                      bg="gray.100"
                      color="gray.700"
                      rounded="lg"
                      fontSize="sm"
                      fontWeight="600"
                      _hover={{ bg: "gray.200" }}
                      cursor="pointer"
                    >
                      Rədd et
                    </Box>
                  </Link>
                  <Link href={`/admin/reports/${report.id}/resolve?action=HIDE_CONTENT`}>
                    <Box
                      as="span"
                      display="inline-block"
                      px={3} py={1.5}
                      bg="yellow.100"
                      color="yellow.800"
                      rounded="lg"
                      fontSize="sm"
                      fontWeight="600"
                      _hover={{ bg: "yellow.200" }}
                      cursor="pointer"
                    >
                      Məzmunu gizlət
                    </Box>
                  </Link>
                  <Link href={`/admin/reports/${report.id}/resolve?action=REMOVE_CONTENT`}>
                    <Box
                      as="span"
                      display="inline-block"
                      px={3} py={1.5}
                      bg="orange.100"
                      color="orange.800"
                      rounded="lg"
                      fontSize="sm"
                      fontWeight="600"
                      _hover={{ bg: "orange.200" }}
                      cursor="pointer"
                    >
                      Məzmunu sil
                    </Box>
                  </Link>
                  <Link href={`/admin/reports/${report.id}/resolve?action=SUSPEND_USER`}>
                    <Box
                      as="span"
                      display="inline-block"
                      px={3} py={1.5}
                      bg="red.100"
                      color="red.700"
                      rounded="lg"
                      fontSize="sm"
                      fontWeight="600"
                      _hover={{ bg: "red.200" }}
                      cursor="pointer"
                    >
                      İstifadəçini blokla
                    </Box>
                  </Link>
                </Flex>
              </Box>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
