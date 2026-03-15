import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status")

  const where = statusFilter
    ? { status: statusFilter as "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED" }
    : {}

  const reports = await prisma.report.findMany({
    where,
    include: {
      reporter: { include: { profile: true } },
      moderationActions: {
        include: { actor: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "asc" },
    ],
  })

  return NextResponse.json({ reports })
}
