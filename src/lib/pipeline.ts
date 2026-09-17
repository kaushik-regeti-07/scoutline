import { callNemotron } from "./nebius";
import { tavilySearch, type TavilyResult } from "./tavily";

export interface Finding {
  sourceUrl: string;
  sourceTitle: string;
  category: "pricing" | "launch" | "funding" | "hiring" | "sentiment" | "other";
  summary: string;
  whyItMatters: string;
}

export interface Brief {
  companyName: string;
  summary: string;
  recommendedActions: string[];
  findings: Finding[];
  sourcesConsidered: number;
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Step 1 — Nemotron Nano triages every raw search hit in a single batched
 * call: cheap, fast, high-volume classification. Anything irrelevant never
 * reaches the more expensive tiers below.
 */
async function triage(results: TavilyResult[]): Promise<TavilyResult[]> {
  if (results.length === 0) return [];

  const prompt = `You are triaging web search results about a company for a competitive
intelligence brief. For each result, decide if it's relevant (a real signal:
pricing change, product launch, funding, hiring surge, notable sentiment/news)
or irrelevant (unrelated company with a similar name, generic boilerplate,
stale/duplicate content).

Return strict JSON: {"decisions": [{"index": number, "relevant": boolean}]}

Results:
${results.map((r, i) => `[${i}] ${r.title}\n${r.content.slice(0, 400)}`).join("\n\n")}`;

  const raw = await callNemotron(
    "nano",
    [{ role: "user", content: prompt }],
    { jsonMode: true, temperature: 0 }
  );

  const parsed = safeJsonParse<{ decisions: { index: number; relevant: boolean }[] }>(
    raw,
    { decisions: results.map((_, index) => ({ index, relevant: true })) }
  );

  const relevantIndexes = new Set(
    parsed.decisions.filter((d) => d.relevant).map((d) => d.index)
  );

  return results.filter((_, i) => relevantIndexes.has(i));
}

/**
 * Step 2 — Nemotron Super condenses each surviving source into a
 * structured finding (category + summary + why it matters).
 */
async function condense(companyName: string, results: TavilyResult[]): Promise<Finding[]> {
  if (results.length === 0) return [];

  const prompt = `You are condensing web sources into structured competitive-intelligence
findings about "${companyName}". For each source below, produce one finding.

Return strict JSON: {"findings": [{"index": number, "category": "pricing"|"launch"|"funding"|"hiring"|"sentiment"|"other", "summary": string, "whyItMatters": string}]}

Sources:
${results.map((r, i) => `[${i}] ${r.title} (${r.url})\n${r.content.slice(0, 800)}`).join("\n\n")}`;

  const raw = await callNemotron(
    "super",
    [{ role: "user", content: prompt }],
    { jsonMode: true, temperature: 0.2, maxTokens: 2048 }
  );

  const parsed = safeJsonParse<{
    findings: { index: number; category: Finding["category"]; summary: string; whyItMatters: string }[];
  }>(raw, { findings: [] });

  return parsed.findings
    .filter((f) => results[f.index])
    .map((f) => ({
      sourceUrl: results[f.index].url,
      sourceTitle: results[f.index].title,
      category: f.category,
      summary: f.summary,
      whyItMatters: f.whyItMatters,
    }));
}

/**
 * Step 3 — Nemotron 3 Ultra reasons over the condensed findings to produce
 * the final strategic brief. This is the only step that needs the largest
 * model, since it's the only step doing genuine synthesis.
 */
async function synthesize(companyName: string, findings: Finding[]): Promise<{ summary: string; recommendedActions: string[] }> {
  if (findings.length === 0) {
    return {
      summary: `No notable competitive signals found for ${companyName} in the last two weeks.`,
      recommendedActions: [],
    };
  }

  const prompt = `You are a competitive intelligence analyst briefing a founder about "${companyName}".
Given the findings below, write a concise executive summary (3-5 sentences) explaining
what changed and why it matters strategically, then list 2-5 specific, concrete
recommended actions the founder's team should take in response.

Return strict JSON: {"summary": string, "recommendedActions": string[]}

Findings:
${JSON.stringify(findings, null, 2)}`;

  const raw = await callNemotron(
    "ultra",
    [{ role: "user", content: prompt }],
    { jsonMode: true, temperature: 0.4, maxTokens: 1024 }
  );

  return safeJsonParse<{ summary: string; recommendedActions: string[] }>(raw, {
    summary: "Synthesis failed — see findings below for raw signals.",
    recommendedActions: [],
  });
}

export async function runIntelligencePipeline(companyName: string): Promise<Brief> {
  const rawResults = await tavilySearch(
    `${companyName} pricing OR launch OR funding OR hiring news`,
    { maxResults: 12, days: 14 }
  );

  const relevant = await triage(rawResults);
  const findings = await condense(companyName, relevant);
  const { summary, recommendedActions } = await synthesize(companyName, findings);

  return {
    companyName,
    summary,
    recommendedActions,
    findings,
    sourcesConsidered: rawResults.length,
  };
}
