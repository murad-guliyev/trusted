import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { resolveReportSchema } from "@/lib/validation"

interface Params {
  params: { id: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 403 })
  }

  const reportId = params.id
  const body = await req.json()
  const parsed = resolveReportSchema.safeParse(body)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { actionType, actionNote } = parsed.data

  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) {
    return NextResponse.json({ error: "Şikayət tapılmadı" }, { status: 404 })
  }

  // Determine new report status based on action
  let newReportStatus: "RESOLVED" | "DISMISSED" = "RESOLVED"
  if (actionType === "DISMISS") {
    newReportStatus = "DISMISSED"
  }

  await prisma.$transaction(async (tx) => {
    // Create moderation action
    await tx.moderationAction.create({
      data: {
        reportId,
        actorId: session.user.id,
        actionType,
        actionNote: actionNote ?? null,
      },
    })

    // Update report status
    await tx.report.update({
      where: { id: reportId },
      data: { status: newReportStatus },
    })

    // Apply content actions
    if (actionType === "HIDE_CONTENT") {
      if (report.targetType === "ASK") {
        await tx.ask.update({
          where: { id: report.targetId },
          data: { status: "HIDDEN" },
        })
      } else if (report.targetType === "REPLY") {
        await tx.reply.update({
          where: { id: report.targetId },
          data: { status: "REMOVED" },
        })
      }
    } else if (actionType === "REMOVE_CONTENT") {
      if (report.targetType === "ASK") {
        await tx.ask.update({
          where: { id: report.targetId },
          data: { status: "REMOVED" },
        })
      } else if (report.targetType === "REPLY") {
        await tx.reply.update({
          where: { id: report.targetId },
          data: { status: "REMOVED" },
        })
      }
    } else if (actionType === "SUSPEND_USER") {
      // Determine the target user ID
      let targetUserId: string | null = null
      if (report.targetType === "USER") {
        targetUserId = report.targetId
      } else if (report.targetType === "ASK") {
        const ask = await tx.ask.findUnique({ where: { id: report.targetId } })
        targetUserId = ask?.authorId ?? null
      } else if (report.targetType === "REPLY") {
        const reply = await tx.reply.findUnique({ where: { id: report.targetId } })
        targetUserId = reply?.authorId ?? null
      }

      if (targetUserId) {
        await tx.user.update({
          where: { id: targetUserId },
          data: { status: "SUSPENDED" },
        })
      }
    }
  })

  const updatedReport = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: { include: { profile: true } },
      moderationActions: {
        include: { actor: { include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return NextResponse.json(updatedReport)
}
