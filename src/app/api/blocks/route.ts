import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { trackUserBlocked } from "@/lib/analytics"

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const body = await req.json()
  const { blockedId } = body

  if (!blockedId) {
    return NextResponse.json({ error: "blockedId tələb olunur" }, { status: 400 })
  }

  if (blockedId === userId) {
    return NextResponse.json({ error: "Özünüzü bloklaya bilməzsiniz" }, { status: 400 })
  }

  // Check user exists
  const target = await prisma.user.findUnique({ where: { id: blockedId } })
  if (!target) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 })
  }

  // Check not already blocked
  const existing = await prisma.blockRelation.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId } },
  })

  if (existing?.status === "ACTIVE") {
    return NextResponse.json({ error: "Bu istifadəçi artıq bloklanıb" }, { status: 400 })
  }

  const block = await prisma.blockRelation.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId } },
    update: { status: "ACTIVE" },
    create: { blockerId: userId, blockedId, status: "ACTIVE" },
  })

  // Track analytics (non-blocking)
  trackUserBlocked(userId).catch(console.error)

  return NextResponse.json(block, { status: 201 })
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id

  const blocks = await prisma.blockRelation.findMany({
    where: { blockerId: userId, status: "ACTIVE" },
    include: {
      blocked: { include: { profile: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const result = blocks.map((b) => ({
    id: b.id,
    userId: b.blockedId,
    displayName: b.blocked.profile?.displayName ?? b.blocked.email,
    createdAt: b.createdAt,
  }))

  return NextResponse.json({ blocks: result })
}
