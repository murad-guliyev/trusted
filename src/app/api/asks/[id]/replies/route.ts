import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createReplySchema } from "@/lib/validation"
import { canViewAsk } from "@/lib/permissions"
import { createNewReplyNotification } from "@/lib/notifications"
import { trackReplySubmitted } from "@/lib/analytics"

interface Params {
  params: { id: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const askId = params.id

  const ask = await prisma.ask.findUnique({ where: { id: askId } })
  if (!ask) {
    return NextResponse.json({ error: "Sual tapılmadı" }, { status: 404 })
  }

  if (ask.status !== "ACTIVE") {
    return NextResponse.json({ error: "Bu suala cavab vermək mümkün deyil" }, { status: 400 })
  }

  if (ask.expiresAt < new Date()) {
    return NextResponse.json({ error: "Bu sualın müddəti bitib" }, { status: 400 })
  }

  if (ask.authorId === userId) {
    return NextResponse.json({ error: "Öz sualınıza cavab verə bilməzsiniz" }, { status: 400 })
  }

  const allowed = await canViewAsk(userId, askId)
  if (!allowed) {
    return NextResponse.json({ error: "Bu suala giriş icazəniz yoxdur" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createReplySchema.safeParse(body)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { note, recommendedName, phone, url } = parsed.data

  const reply = await prisma.reply.create({
    data: {
      askId,
      authorId: userId,
      note: note || null,
      recommendedName: recommendedName || null,
      phone: phone || null,
      url: url || null,
    },
    include: {
      author: { include: { profile: true } },
    },
  })

  // Notify ask author (non-blocking)
  createNewReplyNotification(ask.authorId, askId, reply.id).catch(console.error)

  // Track analytics (non-blocking)
  trackReplySubmitted(userId, askId, {
    hasPhone: !!phone,
    hasLink: !!url,
    hasName: !!recommendedName,
    hasNote: !!note,
  }).catch(console.error)

  return NextResponse.json(reply, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const askId = params.id

  const ask = await prisma.ask.findUnique({ where: { id: askId } })
  if (!ask) {
    return NextResponse.json({ error: "Sual tapılmadı" }, { status: 404 })
  }

  const isAskAuthor = ask.authorId === userId

  if (!isAskAuthor) {
    // Reply authors can only see their own reply
    const myReply = await prisma.reply.findFirst({
      where: { askId, authorId: userId, status: "ACTIVE" },
      include: { author: { include: { profile: true } } },
    })
    if (!myReply) {
      return NextResponse.json({ error: "Cavabınız tapılmadı" }, { status: 403 })
    }
    return NextResponse.json([myReply])
  }

  const replies = await prisma.reply.findMany({
    where: { askId, status: "ACTIVE" },
    include: { author: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(replies)
}
