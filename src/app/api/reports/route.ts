import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { submitReportSchema } from "@/lib/validation"
import { trackReportSubmitted } from "@/lib/analytics"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const body = await req.json()
  const parsed = submitReportSchema.safeParse(body)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { targetType, targetId, reasonCode, note } = parsed.data

  // Verify target exists
  if (targetType === "ASK") {
    const ask = await prisma.ask.findUnique({ where: { id: targetId } })
    if (!ask) {
      return NextResponse.json({ error: "Sual tapılmadı" }, { status: 404 })
    }
    if (ask.authorId === userId) {
      return NextResponse.json({ error: "Öz sualınızı şikayət edə bilməzsiniz" }, { status: 400 })
    }
  } else if (targetType === "REPLY") {
    const reply = await prisma.reply.findUnique({ where: { id: targetId } })
    if (!reply) {
      return NextResponse.json({ error: "Cavab tapılmadı" }, { status: 404 })
    }
    if (reply.authorId === userId) {
      return NextResponse.json({ error: "Öz cavabınızı şikayət edə bilməzsiniz" }, { status: 400 })
    }
  } else if (targetType === "USER") {
    const user = await prisma.user.findUnique({ where: { id: targetId } })
    if (!user) {
      return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 })
    }
    if (targetId === userId) {
      return NextResponse.json({ error: "Özünüzü şikayət edə bilməzsiniz" }, { status: 400 })
    }
  }

  const report = await prisma.report.create({
    data: {
      reporterId: userId,
      targetType,
      targetId,
      reasonCode,
      note: note ?? null,
    },
  })

  // Track analytics (non-blocking)
  trackReportSubmitted(userId).catch(console.error)

  return NextResponse.json(report, { status: 201 })
}
