import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { randomBytes } from "crypto"

// POST /api/connections/invites/link
// Generates (or refreshes) a shareable invite link for the current user.
// A user has at most one active link invite at a time.
export async function POST() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 })

  const senderId = session.user.id
  const token = randomBytes(16).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Cancel any existing pending link invites from this sender, then create a fresh one
  await prisma.connectionInvite.updateMany({
    where: { senderId, recipientId: null, status: "PENDING" },
    data: { status: "CANCELLED" },
  })

  await prisma.connectionInvite.create({
    data: { senderId, token, expiresAt, status: "PENDING" },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const url = `${baseUrl}/invite/${token}`

  return NextResponse.json({ url, expiresAt })
}
