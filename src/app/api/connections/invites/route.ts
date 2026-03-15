import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendInviteSchema } from "@/lib/validation"
import { createConnectionInviteNotification } from "@/lib/notifications"
import { trackConnectionInviteSent } from "@/lib/analytics"
import { isBlocked } from "@/lib/permissions"

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const body = await req.json()
  const parsed = sendInviteSchema.safeParse(body)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { recipientId } = parsed.data

  if (recipientId === userId) {
    return NextResponse.json({ error: "Özünüzə dəvət göndərə bilməzsiniz" }, { status: 400 })
  }

  // Check recipient exists
  const recipient = await prisma.user.findUnique({ where: { id: recipientId } })
  if (!recipient) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 })
  }

  // Check not blocked
  const blocked = await isBlocked(userId, recipientId)
  if (blocked) {
    return NextResponse.json({ error: "Bu istifadəçiyə dəvət göndərə bilməzsiniz" }, { status: 400 })
  }

  // Check already connected
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: recipientId },
        { userAId: recipientId, userBId: userId },
      ],
      status: "ACTIVE",
    },
  })
  if (existing) {
    return NextResponse.json({ error: "Bu istifadəçi artıq əlaqənizdir" }, { status: 400 })
  }

  // Check no existing pending invite
  const existingInvite = await prisma.connectionInvite.findFirst({
    where: {
      OR: [
        { senderId: userId, recipientId, status: "PENDING" },
        { senderId: recipientId, recipientId: userId, status: "PENDING" },
      ],
    },
  })
  if (existingInvite) {
    return NextResponse.json({ error: "Artıq gözləyən dəvət var" }, { status: 400 })
  }

  const invite = await prisma.connectionInvite.create({
    data: {
      senderId: userId,
      recipientId,
    },
  })

  // Notify recipient (non-blocking)
  createConnectionInviteNotification(recipientId, invite.id).catch(console.error)
  trackConnectionInviteSent(userId).catch(console.error)

  return NextResponse.json(invite, { status: 201 })
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id

  const [incoming, outgoing] = await Promise.all([
    prisma.connectionInvite.findMany({
      where: { recipientId: userId, status: "PENDING" },
      include: { sender: { include: { profile: true } } },
      orderBy: { sentAt: "desc" },
    }),
    prisma.connectionInvite.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: { recipient: { include: { profile: true } } },
      orderBy: { sentAt: "desc" },
    }),
  ])

  const invites = [
    ...incoming.map((inv) => ({
      id: inv.id,
      type: "incoming" as const,
      userId: inv.senderId,
      displayName: inv.sender.profile?.displayName ?? inv.sender.email,
      status: inv.status,
      sentAt: inv.sentAt,
    })),
    ...outgoing
      .filter((inv) => inv.recipient !== null)
      .map((inv) => ({
        id: inv.id,
        type: "outgoing" as const,
        userId: inv.recipientId,
        displayName: inv.recipient!.profile?.displayName ?? inv.recipient!.email,
        status: inv.status,
        sentAt: inv.sentAt,
      })),
  ]

  return NextResponse.json({ invites })
}
