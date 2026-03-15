import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface Params {
  params: { id: string }
}

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const inviteId = params.id

  const invite = await prisma.connectionInvite.findUnique({
    where: { id: inviteId },
  })

  if (!invite) {
    return NextResponse.json({ error: "Dəvət tapılmadı" }, { status: 404 })
  }

  if (invite.recipientId !== userId) {
    return NextResponse.json({ error: "Bu əməliyyat üçün icazəniz yoxdur" }, { status: 403 })
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "Bu dəvət artıq işlənib" }, { status: 400 })
  }

  await prisma.connectionInvite.update({
    where: { id: inviteId },
    data: { status: "REJECTED", decidedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
