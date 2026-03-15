import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAskSchema } from "@/lib/validation"
import { trackAskCreated } from "@/lib/analytics"

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createAskSchema.safeParse(body)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { text, categoryId, cityId, visibilityMode, audienceIds } = parsed.data

  // Verify category exists
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) {
    return NextResponse.json({ errors: { categoryId: "Kateqoriya tapılmadı" } }, { status: 400 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const ask = await prisma.$transaction(async (tx) => {
    const newAsk = await tx.ask.create({
      data: {
        authorId: session.user.id,
        text,
        categoryId,
        cityId: cityId ?? null,
        visibilityMode,
        expiresAt,
      },
      include: {
        author: { include: { profile: true } },
        category: true,
        city: true,
      },
    })

    if (visibilityMode === "SELECTED_CONNECTIONS" && audienceIds && audienceIds.length > 0) {
      await tx.askAudience.createMany({
        data: audienceIds.map((targetUserId) => ({
          askId: newAsk.id,
          targetUserId,
        })),
        skipDuplicates: true,
      })
    }

    return newAsk
  })

  // Track analytics (non-blocking)
  trackAskCreated(session.user.id, {
    categoryId,
    visibilityMode,
    cityId,
    textLength: text.length,
  }).catch(console.error)

  return NextResponse.json(ask, { status: 201 })
}
