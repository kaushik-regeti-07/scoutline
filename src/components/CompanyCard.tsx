"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LatestBrief {
  id: string;
  summary: string;
  createdAt: string;
}

export function CompanyCard({
  id,
  name,
  domain,
  latestBrief,
}: {
  id: string;
  name: string;
  domain: string | null;
  latestBrief: LatestBrief | null;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${id}/run`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Scan failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/15 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/companies/${id}`} className="font-semibold hover:underline">
            {name}
          </Link>
          {domain && <p className="text-xs text-black/50 dark:text-white/50">{domain}</p>}
        </div>
        <button
          onClick={runScan}
          disabled={running}
          className="shrink-0 rounded-lg border border-black/15 dark:border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          {running ? "Scanning…" : "Run scan"}
        </button>
      </div>

      {latestBrief ? (
        <p className="text-sm text-black/70 dark:text-white/70 line-clamp-3">
          {latestBrief.summary}
        </p>
      ) : (
        <p className="text-sm text-black/40 dark:text-white/40 italic">
          No scans yet — run one to generate the first brief.
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
