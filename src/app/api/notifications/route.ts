import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unread") === "true"
  const countOnly = searchParams.get("count") === "true"

  const where = {
    recipientId: userId,
    ...(unreadOnly ? { isRead: false } : {}),
  }

  if (countOnly) {
    const count = await prisma.notification.count({ where })
    return NextResponse.json({ count })
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ notifications })
}
