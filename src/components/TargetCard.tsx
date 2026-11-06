"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RunProgress, initialRunProgress, reduceRunProgress, type RunProgressState } from "./RunProgress";

interface LatestBrief {
  summary: string;
}

const TYPE_LABEL: Record<"COMPANY" | "PERSON", string> = {
  COMPANY: "Company",
  PERSON: "Person",
};

export function TargetCard({
  id,
  name,
  type,
  domain,
  latestBrief,
}: {
  id: string;
  name: string;
  type: "COMPANY" | "PERSON";
  domain: string | null;
  latestBrief: LatestBrief | null;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<RunProgressState>(initialRunProgress());
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setRunning(true);
    setError(null);
    setProgress(initialRunProgress());

    try {
      const res = await fetch(`/api/targets/${id}/run`, { method: "POST" });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Scan failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "error") throw new Error(event.message);
          setProgress((prev) => reduceRunProgress(prev, event));
        }
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-5 transition-colors"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link href={`/targets/${id}`} className="font-semibold hover:underline">
              {name}
            </Link>
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {TYPE_LABEL[type]}
            </span>
          </div>
          {domain && <p className="text-xs" style={{ color: "var(--muted)" }}>{domain}</p>}
        </div>
        <button
          onClick={runScan}
          disabled={running}
          className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--border-strong)" }}
        >
          {running ? "Scanning…" : "Run scan"}
        </button>
      </div>

      {running ? (
        <RunProgress state={progress} />
      ) : latestBrief ? (
        <p className="text-sm line-clamp-3" style={{ color: "var(--foreground)", opacity: 0.75 }}>
          {latestBrief.summary}
        </p>
      ) : (
        <p className="text-sm italic" style={{ color: "var(--muted)" }}>
          No scans yet — run one to generate the first brief.
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
