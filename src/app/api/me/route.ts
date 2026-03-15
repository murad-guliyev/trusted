import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { updateProfileSchema } from "@/lib/validation"

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: {
        include: { city: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.profile?.displayName ?? null,
    cityId: user.profile?.cityId ?? null,
    cityName: user.profile?.city?.name ?? null,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { displayName, cityId } = parsed.data

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {
      displayName,
      cityId: cityId ?? null,
    },
    create: {
      userId: session.user.id,
      displayName,
      cityId: cityId ?? null,
    },
    include: { city: true },
  })

  return NextResponse.json({
    displayName: profile.displayName,
    cityId: profile.cityId,
    cityName: profile.city?.name ?? null,
    updatedAt: profile.updatedAt,
  })
}
