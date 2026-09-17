export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
}

export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

/**
 * Live web search via Tavily — the "eyes" of the agent. Kept as a thin
 * fetch wrapper (no SDK) since the API surface we need is one endpoint.
 */
export async function tavilySearch(
  query: string,
  options: { maxResults?: number; days?: number } = {}
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: options.maxResults ?? 10,
      days: options.days ?? 14,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    results: { title: string; url: string; content: string; published_date?: string }[];
  };

  return data.results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    publishedDate: r.published_date,
  }));
}
