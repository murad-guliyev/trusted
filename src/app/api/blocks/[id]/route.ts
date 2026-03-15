import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface Params {
  params: { id: string }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "İcazəsiz giriş" }, { status: 401 })
  }

  const userId = session.user.id
  const blockId = params.id

  const block = await prisma.blockRelation.findUnique({
    where: { id: blockId },
  })

  if (!block) {
    return NextResponse.json({ error: "Blok tapılmadı" }, { status: 404 })
  }

  if (block.blockerId !== userId) {
    return NextResponse.json({ error: "Bu əməliyyat üçün icazəniz yoxdur" }, { status: 403 })
  }

  await prisma.blockRelation.update({
    where: { id: blockId },
    data: { status: "LIFTED" },
  })

  return NextResponse.json({ success: true })
}
