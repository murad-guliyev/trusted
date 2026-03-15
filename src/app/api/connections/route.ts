import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id

  const rawConnections = await prisma.connection.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      status: "ACTIVE",
    },
    include: {
      userA: { include: { profile: { include: { city: true } } } },
      userB: { include: { profile: { include: { city: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  const connections = rawConnections.map((conn) => {
    const other = conn.userAId === userId ? conn.userB : conn.userA
    return {
      id: conn.id,
      userId: other.id,
      displayName: other.profile?.displayName ?? other.email,
      cityName: other.profile?.city?.name ?? null,
      createdAt: conn.createdAt,
    }
  })

  return NextResponse.json({ connections })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const connectionId = searchParams.get("id")

  if (!connectionId) {
    return NextResponse.json({ error: "Connection ID tələb olunur" }, { status: 400 })
  }

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
  })

  if (!connection) {
    return NextResponse.json({ error: "Əlaqə tapılmadı" }, { status: 404 })
  }

  const userId = session.user.id
  if (connection.userAId !== userId && connection.userBId !== userId) {
    return NextResponse.json({ error: "Bu əməliyyat üçün icazəniz yoxdur" }, { status: 403 })
  }

  await prisma.connection.update({
    where: { id: connectionId },
    data: { status: "REMOVED" },
  })

  return NextResponse.json({ success: true })
}
