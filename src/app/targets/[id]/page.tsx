import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Finding } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

const CATEGORY_STYLES: Record<string, string> = {
  pricing: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  launch: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  funding: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  hiring: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  sentiment: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  career: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  statement: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  recognition: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  other: "bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60",
};

const TYPE_LABEL: Record<string, string> = { COMPANY: "Company", PERSON: "Person" };

export default async function TargetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const target = await prisma.target.findUnique({
    where: { id },
    include: { briefs: { orderBy: { createdAt: "desc" } } },
  });

  if (!target) notFound();

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
      <Link href="/" className="text-sm w-fit hover:underline" style={{ color: "var(--muted)" }}>
        ← Dashboard
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{target.name}</h1>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {TYPE_LABEL[target.type]}
          </span>
        </div>
        {target.domain && <p className="text-sm" style={{ color: "var(--muted)" }}>{target.domain}</p>}
      </header>

      {target.briefs.length === 0 ? (
        <p className="text-sm italic" style={{ color: "var(--muted)" }}>
          No briefs yet. Run a scan from the dashboard to generate one.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {target.briefs.map((brief) => {
            const findings = (brief.findings as unknown as Finding[]) ?? [];
            return (
              <article
                key={brief.id}
                className="rounded-xl border p-6 flex flex-col gap-4"
                style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
                  <span>{new Date(brief.createdAt).toLocaleString()}</span>
                  <span>{brief.sourcesConsidered} sources considered</span>
                </div>

                <p className="text-sm leading-relaxed">{brief.summary}</p>

                {brief.recommendedActions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                      {target.type === "PERSON" ? "Talking points" : "Recommended actions"}
                    </h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {brief.recommendedActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {findings.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                      Findings
                    </h3>
                    <div className="flex flex-col gap-2">
                      {findings.map((finding, i) => (
                        <div
                          key={i}
                          className="rounded-lg border p-3 text-sm"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wide rounded px-1.5 py-0.5 ${CATEGORY_STYLES[finding.category] ?? CATEGORY_STYLES.other}`}
                            >
                              {finding.category}
                            </span>
                            <a
                              href={finding.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs hover:underline truncate"
                              style={{ color: "var(--muted)" }}
                            >
                              {finding.sourceTitle}
                            </a>
                          </div>
                          <p>{finding.summary}</p>
                          <p className="mt-1" style={{ color: "var(--muted)" }}>{finding.whyItMatters}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
