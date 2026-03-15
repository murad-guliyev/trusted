import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { registerSchema } from "@/lib/validation"
import { trackUserSignedUp } from "@/lib/analytics"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string
        errors[field] = issue.message
      }
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { email, password, displayName } = parsed.data

    // Check if email is already taken
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { errors: { email: "Bu e-poçt artıq istifadə olunur" } },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
        },
      })

      await tx.profile.create({
        data: {
          userId: newUser.id,
          displayName,
        },
      })

      return newUser
    })

    // Track analytics (non-blocking)
    trackUserSignedUp(user.id).catch(console.error)

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Daxili server xətası" },
      { status: 500 }
    )
  }
}
