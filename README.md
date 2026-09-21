# Scoutline

**An autonomous intelligence agent, built for the Nebius x NVIDIA Global AI Hackathon.**

Point Scoutline at a company or a person, and it turns noisy web signals into a decision-ready brief: a competitor's pricing change and funding history, or exactly what to know before you meet someone — what changed, why it matters, and what to do about it.

**Track:** Best Apps and Agents

## How it works

Scoutline doesn't send everything to one big model. It routes work across three tiers of NVIDIA Nemotron models served on **Nebius Token Factory**, matching model cost/latency to task difficulty, and streams its progress live to the UI as it works:

1. **Search** — [Tavily](https://tavily.com) pulls live web results for the target (news, pricing pages, interviews, public profiles — the query shape adapts to whether the target is a company or a person).
2. **Triage — Nemotron Nano** — fast, cheap pass over every raw result to filter out noise and irrelevant hits.
3. **Condense — Nemotron Super** — per-source summarization of everything that survived triage into structured, categorized findings.
4. **Synthesize — Nemotron 3 Ultra** — final reasoning pass: what these findings mean together, plus specific recommended actions (or talking points, for a person).

This keeps the pipeline fast and inexpensive on the high-volume triage step, and reserves the expensive reasoning model for the step that actually needs it. The UI streams each step live (via a chunked HTTP response) so you watch the agent search, triage, condense, and synthesize in real time instead of staring at a spinner.

## Stack

- **Frontend/backend:** Next.js (App Router, TypeScript, Tailwind)
- **Inference:** Nebius Token Factory (OpenAI-compatible API) — Nemotron Nano / Super / 3 Ultra, all on Public endpoints
- **Web research:** Tavily API
- **Database:** Postgres (Neon)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in NEBIUS_API_KEY, TAVILY_API_KEY, DATABASE_URL
npm run db:push              # sync the schema to your database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See [.env.example](.env.example). You'll need:
- A Nebius Token Factory API key ([dev.nebius.com](https://dev.nebius.com/)) — the hackathon promo code `NEBIUS-DEVPOST-GLOBAL26` (see hackathon Resources page) unlocks starter credits.
- A [Tavily](https://tavily.com) API key.
- A Postgres connection string (e.g. from [Neon](https://neon.tech)).

## What was built during the Submission Period

This project was created from scratch during the Nebius x NVIDIA Global AI Hackathon Submission Period (2026-08-26 to 2026-10-30).

## License

MIT — see [LICENSE](LICENSE).
