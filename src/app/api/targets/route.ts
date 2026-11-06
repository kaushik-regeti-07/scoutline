import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createTargetSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["COMPANY", "PERSON"]).default("COMPANY"),
  domain: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET() {
  const targets = await prisma.target.findMany({
    orderBy: { createdAt: "desc" },
    include: { briefs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ targets });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createTargetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.target.create({ data: parsed.data });
  return NextResponse.json({ target }, { status: 201 });
}
