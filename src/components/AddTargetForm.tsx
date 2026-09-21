"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TargetType = "COMPANY" | "PERSON";

export function AddTargetForm() {
  const router = useRouter();
  const [type, setType] = useState<TargetType>("COMPANY");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, domain: domain.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to add target");
      setName("");
      setDomain("");
      router.refresh();
    } catch {
      setError("Couldn't add that. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-lg border p-1 w-fit" style={{ borderColor: "var(--border)" }}>
        {(["COMPANY", "PERSON"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            style={
              type === t
                ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                : { color: "var(--muted)" }
            }
          >
            {t === "COMPANY" ? "Company" : "Person"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-start">
        <input
          type="text"
          placeholder={type === "COMPANY" ? "Company name (e.g. Linear)" : "Person's name (e.g. Karri Saarinen)"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
          required
        />
        <input
          type="text"
          placeholder={type === "COMPANY" ? "Domain (optional)" : "LinkedIn / affiliation (optional)"}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1 min-w-[160px] rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {submitting ? "Adding…" : "Track"}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
