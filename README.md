# Scoutline

**An autonomous competitive-intelligence agent, built for the Nebius x NVIDIA Global AI Hackathon.**

Founders and PMs burn hours every week manually checking competitor pricing pages, changelogs, and launch announcements. Scoutline tracks a list of companies for you and turns noisy web signals into a decision-ready brief: what changed, why it matters, and what to do about it.

**Track:** Best Apps and Agents

## How it works

Scoutline doesn't send everything to one big model. It routes work across three tiers of NVIDIA Nemotron models served on **Nebius Token Factory**, matching model cost/latency to task difficulty:

1. **Search** — [Tavily](https://tavily.com) pulls live web results for each tracked company (news, pricing pages, changelogs, social mentions).
2. **Triage — Nemotron Nano** — fast, cheap pass over every raw result to classify relevance and category (pricing change, launch, hiring, funding, sentiment).
3. **Condense — Nemotron Super** — per-source summarization of everything that survived triage into structured findings.
4. **Synthesize — Nemotron 3 Ultra** — final strategic reasoning pass: what these findings mean together, and specific recommended actions.
5. A scheduled pass runs as a **Nebius Serverless Job**; on-demand runs hit the Token Factory inference API directly from the app.

This keeps the pipeline fast and inexpensive on the high-volume triage step, and reserves the expensive reasoning model for the step that actually needs it.

## Stack

- **Frontend/backend:** Next.js (App Router, TypeScript, Tailwind)
- **Inference:** Nebius Token Factory (OpenAI-compatible API) — Nemotron Nano / Super / 3 Ultra
- **Web research:** Tavily API
- **Background jobs:** Nebius Serverless Jobs (scheduled monitoring runs)
- **Database:** Postgres (Neon)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in NEBIUS_API_KEY, TAVILY_API_KEY, DATABASE_URL
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
