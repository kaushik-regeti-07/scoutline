import { prisma } from "@/lib/db";
import { AddTargetForm } from "@/components/AddTargetForm";
import { TargetCard } from "@/components/TargetCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const targets = await prisma.target.findMany({
    orderBy: { createdAt: "desc" },
    include: { briefs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" style={{ color: "var(--accent)" }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="11" cy="11" r="2.5" fill="currentColor" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight">Scoutline</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Point it at a company or a person. Tavily searches the web, Nemotron Nano triages
          noise, Super condenses findings, and Nemotron 3 Ultra writes the brief — all served
          on Nebius Token Factory.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Track something
        </h2>
        <AddTargetForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Tracked
        </h2>
        {targets.length === 0 ? (
          <p className="text-sm italic" style={{ color: "var(--muted)" }}>
            Nothing tracked yet — add a company or person above to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {targets.map((target) => (
              <TargetCard
                key={target.id}
                id={target.id}
                name={target.name}
                type={target.type}
                domain={target.domain}
                latestBrief={target.briefs[0] ? { summary: target.briefs[0].summary } : null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
