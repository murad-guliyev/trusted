import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (!email || !email.trim()) {
    return NextResponse.json({ error: "E-poçt tələb olunur" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { profile: true },
  })

  if (!user || user.id === session.user.id) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 })
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Bu istifadəçi mövcud deyil" }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id,
    displayName: user.profile?.displayName ?? user.email,
  })
}
