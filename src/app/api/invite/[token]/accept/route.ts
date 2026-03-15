import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createInviteAcceptedNotification } from "@/lib/notifications"
import { trackConnectionInviteAccepted } from "@/lib/analytics"

// POST /api/invite/[token]/accept
// Accepts a link-based invite. Requires the recipient to be logged in.
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 })

  const recipientId = session.user.id

  const invite = await prisma.connectionInvite.findUnique({
    where: { token: params.token },
  })

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "Dəvət tapılmadı və ya artıq istifadə edilib" }, { status: 404 })
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Dəvətin müddəti bitib" }, { status: 410 })
  }

  if (invite.senderId === recipientId) {
    return NextResponse.json({ error: "Öz dəvətinizi qəbul edə bilməzsiniz" }, { status: 400 })
  }

  // Check not already connected
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { userAId: invite.senderId, userBId: recipientId },
        { userAId: recipientId, userBId: invite.senderId },
      ],
      status: "ACTIVE",
    },
  })
  if (existing) {
    // Already connected — just mark invite used and succeed
    await prisma.connectionInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", recipientId, decidedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  // Accept: update invite + create connection in a transaction
  await prisma.$transaction([
    prisma.connectionInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", recipientId, decidedAt: new Date() },
    }),
    prisma.connection.create({
      data: { userAId: invite.senderId, userBId: recipientId },
    }),
  ])

  await createInviteAcceptedNotification(invite.senderId, invite.id)
  await trackConnectionInviteAccepted(recipientId)

  return NextResponse.json({ ok: true })
}
