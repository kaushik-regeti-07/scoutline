import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { briefs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ companies });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.create({ data: parsed.data });
  return NextResponse.json({ company }, { status: 201 });
}
