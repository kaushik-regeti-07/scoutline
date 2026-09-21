import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const target = await prisma.target.findUnique({
    where: { id },
    include: { briefs: { orderBy: { createdAt: "desc" } } },
  });

  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  return NextResponse.json({ target });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.target.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
