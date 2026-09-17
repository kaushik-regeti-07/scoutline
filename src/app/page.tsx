import { prisma } from "@/lib/db";
import { AddCompanyForm } from "@/components/AddCompanyForm";
import { CompanyCard } from "@/components/CompanyCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { briefs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Scoutline</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Autonomous competitive intelligence. Tavily searches the web, Nemotron Nano
          triages noise, Super condenses findings, and Nemotron 3 Ultra writes the brief —
          all served on Nebius Token Factory.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
          Track a company
        </h2>
        <AddCompanyForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
          Tracked companies
        </h2>
        {companies.length === 0 ? (
          <p className="text-sm text-black/40 dark:text-white/40 italic">
            Nothing tracked yet — add a company above to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                id={company.id}
                name={company.name}
                domain={company.domain}
                latestBrief={
                  company.briefs[0]
                    ? {
                        id: company.briefs[0].id,
                        summary: company.briefs[0].summary,
                        createdAt: company.briefs[0].createdAt.toISOString(),
                      }
                    : null
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
