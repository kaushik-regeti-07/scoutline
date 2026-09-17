import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NEBIUS_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  client = new OpenAI({
    apiKey,
    baseURL: process.env.NEBIUS_API_BASE_URL ?? "https://api.studio.nebius.com/v1",
  });
  return client;
}

export type NemotronTier = "nano" | "super" | "ultra";

const TIER_MODEL: Record<NemotronTier, string | undefined> = {
  nano: process.env.NEMOTRON_NANO_MODEL,
  super: process.env.NEMOTRON_SUPER_MODEL,
  ultra: process.env.NEMOTRON_ULTRA_MODEL,
};

const TIER_DEFAULTS: Record<NemotronTier, string> = {
  nano: "nvidia/nemotron-nano",
  super: "nvidia/nemotron-super",
  ultra: "nvidia/nemotron-3-ultra",
};

/**
 * Calls the given Nemotron tier on Nebius Token Factory.
 * Tier choice is the whole point of the pipeline: nano triages high-volume,
 * low-difficulty classification; super condenses; ultra reasons over the
 * condensed findings. Using ultra everywhere would be slower and burn
 * hackathon credits for no quality gain on the triage step.
 */
export async function callNemotron(
  tier: NemotronTier,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const model = TIER_MODEL[tier] ?? TIER_DEFAULTS[tier];

  const completion = await getClient().chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 1024,
    ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return completion.choices[0]?.message?.content ?? "";
}

export function isNebiusConfigured(): boolean {
  return Boolean(process.env.NEBIUS_API_KEY);
}
