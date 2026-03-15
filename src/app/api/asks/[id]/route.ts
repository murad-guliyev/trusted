import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { canViewAsk } from "@/lib/permissions"

interface Params {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const askId = params.id

  const allowed = await canViewAsk(userId, askId)
  if (!allowed) {
    return NextResponse.json({ error: "Bu suala giriş icazəniz yoxdur" }, { status: 403 })
  }

  const ask = await prisma.ask.findUnique({
    where: { id: askId },
    include: {
      author: { include: { profile: true } },
      category: true,
      city: true,
      _count: { select: { replies: { where: { status: "ACTIVE" } } } },
    },
  })

  if (!ask) {
    return NextResponse.json({ error: "Sual tapılmadı" }, { status: 404 })
  }

  const isAuthor = ask.authorId === userId

  // Fetch replies only for the ask author
  let replies = undefined
  if (isAuthor) {
    replies = await prisma.reply.findMany({
      where: { askId, status: "ACTIVE" },
      include: { author: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    })
  }

  return NextResponse.json({ ...ask, replies })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const askId = params.id
  const ask = await prisma.ask.findUnique({ where: { id: askId } })

  if (!ask) {
    return NextResponse.json({ error: "Sual tapılmadı" }, { status: 404 })
  }

  if (ask.authorId !== session.user.id) {
    return NextResponse.json({ error: "Bu əməliyyat üçün icazəniz yoxdur" }, { status: 403 })
  }

  const body = await req.json()
  const { status } = body

  if (!["REMOVED", "HIDDEN"].includes(status)) {
    return NextResponse.json({ error: "Düzgün status deyil" }, { status: 400 })
  }

  const updated = await prisma.ask.update({
    where: { id: askId },
    data: { status },
  })

  return NextResponse.json(updated)
}
