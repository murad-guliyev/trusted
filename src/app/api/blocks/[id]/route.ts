import { getAuthSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface Params {
  params: { id: string }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAuthSession()
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
