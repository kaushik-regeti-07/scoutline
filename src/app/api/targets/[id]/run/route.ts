import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runIntelligencePipeline, type PipelineEvent } from "@/lib/pipeline";
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
  const target = await prisma.target.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: PipelineEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const result = await runIntelligencePipeline(target.name, target.type, emit);

        await prisma.brief.create({
          data: {
            targetId: target.id,
            summary: result.summary,
            recommendedActions: result.recommendedActions,
            findings: result.findings as unknown as Prisma.InputJsonValue,
            sourcesConsidered: result.sourcesConsidered,
          },
        });
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : "Scan failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
