import { callNemotron } from "./nebius";
import { tavilySearch, type TavilyResult } from "./tavily";

export type TargetType = "COMPANY" | "PERSON";

export type Category =
  | "pricing"
  | "launch"
  | "funding"
  | "hiring"
  | "sentiment"
  | "career"
  | "statement"
  | "recognition"
  | "other";

export interface Finding {
  sourceUrl: string;
  sourceTitle: string;
  category: Category;
  summary: string;
  whyItMatters: string;
}

export interface Brief {
  targetName: string;
  summary: string;
  recommendedActions: string[];
  findings: Finding[];
  sourcesConsidered: number;
}

export type PipelineEvent =
  | { type: "status"; step: "searching" | "triaging" | "condensing" | "synthesizing"; message: string }
  | { type: "search_complete"; count: number }
  | { type: "triage_complete"; relevantCount: number; totalCount: number }
  | { type: "condense_complete"; findingsCount: number }
  | { type: "done"; brief: Brief }
  | { type: "error"; message: string };

type Emit = (event: PipelineEvent) => void;

const TYPE_CONFIG: Record<
  TargetType,
  { searchQuery: (name: string) => string; categories: Category[]; briefNoun: string; actionsNoun: string }
> = {
  COMPANY: {
    searchQuery: (name) => `${name} pricing OR launch OR funding OR hiring news`,
    categories: ["pricing", "launch", "funding", "hiring", "sentiment", "other"],
    briefNoun: "competitive intelligence brief",
    actionsNoun: "recommended actions the founder's team should take in response",
  },
  PERSON: {
    searchQuery: (name) => `${name} interview OR profile OR recent news OR talk OR career`,
    categories: ["career", "statement", "recognition", "sentiment", "other"],
    briefNoun: "meeting-prep briefing",
    actionsNoun: "specific talking points or things worth knowing before meeting them",
  },
};

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

  const prompt = `You are triaging web search results for an intelligence brief. For each
result, decide if it's relevant (a real signal worth including) or irrelevant
(unrelated entity with a similar name, generic boilerplate, stale/duplicate
content).

Return strict JSON: {"decisions": [{"index": number, "relevant": boolean}]}

Results:
${results.map((r, i) => `[${i}] ${r.title}\n${r.content.slice(0, 400)}`).join("\n\n")}`;

  const raw = await callNemotron(
    "nano",
    [{ role: "user", content: prompt }],
    // Nemotron is a reasoning model — its hidden "thinking" tokens count
    // against maxTokens, so the budget needs real headroom above just the
    // visible JSON output or the response gets cut off mid-object.
    { jsonMode: true, temperature: 0, maxTokens: 3000 }
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
async function condense(
  targetName: string,
  targetType: TargetType,
  results: TavilyResult[]
): Promise<Finding[]> {
  if (results.length === 0) return [];

  const config = TYPE_CONFIG[targetType];
  const prompt = `You are condensing web sources into structured findings for a ${config.briefNoun}
about "${targetName}". For each source below, produce one finding.

Return strict JSON: {"findings": [{"index": number, "category": ${config.categories.map((c) => `"${c}"`).join("|")}, "summary": string, "whyItMatters": string}]}

Sources:
${results.map((r, i) => `[${i}] ${r.title} (${r.url})\n${r.content.slice(0, 800)}`).join("\n\n")}`;

  const raw = await callNemotron(
    "super",
    [{ role: "user", content: prompt }],
    { jsonMode: true, temperature: 0.2, maxTokens: 8000 }
  );

  const parsed = safeJsonParse<{
    findings: { index: number; category: Category; summary: string; whyItMatters: string }[];
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
async function synthesize(
  targetName: string,
  targetType: TargetType,
  findings: Finding[]
): Promise<{ summary: string; recommendedActions: string[] }> {
  const config = TYPE_CONFIG[targetType];

  if (findings.length === 0) {
    return {
      summary: `No notable signals found for ${targetName} in the last two weeks.`,
      recommendedActions: [],
    };
  }

  const prompt = `You are an analyst writing a ${config.briefNoun} about "${targetName}".
Given the findings below, write a concise summary (3-5 sentences) explaining
what's notable and why it matters, then list 2-5 ${config.actionsNoun}.

Return strict JSON: {"summary": string, "recommendedActions": string[]}

Findings:
${JSON.stringify(findings, null, 2)}`;

  const raw = await callNemotron(
    "ultra",
    [{ role: "user", content: prompt }],
    { jsonMode: true, temperature: 0.4, maxTokens: 4000 }
  );

  return safeJsonParse<{ summary: string; recommendedActions: string[] }>(raw, {
    summary: "Synthesis failed — see findings below for raw signals.",
    recommendedActions: [],
  });
}

export async function runIntelligencePipeline(
  targetName: string,
  targetType: TargetType,
  emit: Emit = () => {}
): Promise<Brief> {
  const config = TYPE_CONFIG[targetType];

  emit({ type: "status", step: "searching", message: `Searching the web for ${targetName}...` });
  const rawResults = await tavilySearch(config.searchQuery(targetName), { maxResults: 12, days: 14 });
  emit({ type: "search_complete", count: rawResults.length });

  emit({ type: "status", step: "triaging", message: "Triaging results with Nemotron Nano..." });
  const relevant = await triage(rawResults);
  emit({ type: "triage_complete", relevantCount: relevant.length, totalCount: rawResults.length });

  emit({ type: "status", step: "condensing", message: "Condensing findings with Nemotron Super..." });
  const findings = await condense(targetName, targetType, relevant);
  emit({ type: "condense_complete", findingsCount: findings.length });

  emit({ type: "status", step: "synthesizing", message: "Synthesizing the brief with Nemotron 3 Ultra..." });
  const { summary, recommendedActions } = await synthesize(targetName, targetType, findings);

  const brief: Brief = {
    targetName,
    summary,
    recommendedActions,
    findings,
    sourcesConsidered: rawResults.length,
  };

  emit({ type: "done", brief });
  return brief;
}
