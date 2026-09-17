import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runIntelligencePipeline } from "@/lib/pipeline";
import { isNebiusConfigured } from "@/lib/nebius";
import { isTavilyConfigured } from "@/lib/tavily";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isNebiusConfigured() || !isTavilyConfigured()) {
    return NextResponse.json(
      {
        error:
          "Missing API keys. Set NEBIUS_API_KEY and TAVILY_API_KEY in .env.local before running the agent.",
      },
      { status: 412 }
    );
  }

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const result = await runIntelligencePipeline(company.name);

  const brief = await prisma.brief.create({
    data: {
      companyId: company.id,
      summary: result.summary,
      recommendedActions: result.recommendedActions,
      findings: result.findings as unknown as Prisma.InputJsonValue,
      sourcesConsidered: result.sourcesConsidered,
    },
  });

  return NextResponse.json({ brief });
}
