"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddCompanyForm() {
  const router = useRouter();
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
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), domain: domain.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to add company");
      setName("");
      setDomain("");
      router.refresh();
    } catch {
      setError("Couldn't add that company. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-start">
      <input
        type="text"
        placeholder="Company name (e.g. Linear)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 min-w-[200px] rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
        required
      />
      <input
        type="text"
        placeholder="Domain (optional)"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="flex-1 min-w-[160px] rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/40"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Track company"}
      </button>
      {error && <p className="w-full text-sm text-red-500">{error}</p>}
    </form>
  );
}
