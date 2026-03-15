import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/invite/[token] — public endpoint
// Returns sender info for the invite landing page.
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const invite = await prisma.connectionInvite.findUnique({
    where: { token: params.token },
    include: { sender: { include: { profile: true } } },
  })

  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "Dəvət tapılmadı və ya artıq istifadə edilib" }, { status: 404 })
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Dəvətin müddəti bitib" }, { status: 410 })
  }

  return NextResponse.json({
    inviteId: invite.id,
    senderId: invite.senderId,
    senderName: invite.sender.profile?.displayName ?? invite.sender.email,
    expiresAt: invite.expiresAt,
  })
}
