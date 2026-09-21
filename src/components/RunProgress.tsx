"use client";

const STEP_ORDER = ["searching", "triaging", "condensing", "synthesizing"] as const;
type Step = (typeof STEP_ORDER)[number];

const STEP_LABEL: Record<Step, string> = {
  searching: "Searching the web (Tavily)",
  triaging: "Triaging results (Nemotron Nano)",
  condensing: "Condensing findings (Nemotron Super)",
  synthesizing: "Synthesizing the brief (Nemotron 3 Ultra)",
};

export interface RunProgressState {
  currentStep: Step | null;
  detail: Partial<Record<Step, string>>;
  completedSteps: Set<Step>;
}

export function initialRunProgress(): RunProgressState {
  return { currentStep: null, detail: {}, completedSteps: new Set() };
}

export function RunProgress({ state }: { state: RunProgressState }) {
  return (
    <div className="fade-in-up flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] p-3">
      {STEP_ORDER.map((step) => {
        const isDone = state.completedSteps.has(step);
        const isCurrent = state.currentStep === step;
        return (
          <div key={step} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                isDone
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : isCurrent
                    ? "bg-[var(--accent)] pulse-dot"
                    : "bg-[var(--border-strong)]"
              }`}
            >
              {isDone && (
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                  <path d="M2.5 6.5L4.75 8.75L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={isCurrent || isDone ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
              {STEP_LABEL[step]}
              {state.detail[step] && <span className="text-[var(--muted)]"> — {state.detail[step]}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function reduceRunProgress(state: RunProgressState, event: { type: string; [k: string]: unknown }): RunProgressState {
  const next: RunProgressState = {
    currentStep: state.currentStep,
    detail: { ...state.detail },
    completedSteps: new Set(state.completedSteps),
  };

  switch (event.type) {
    case "status":
      next.currentStep = event.step as Step;
      return next;
    case "search_complete":
      next.completedSteps.add("searching");
      next.detail.searching = `${event.count} sources found`;
      return next;
    case "triage_complete":
      next.completedSteps.add("triaging");
      next.detail.triaging = `${event.relevantCount} of ${event.totalCount} relevant`;
      return next;
    case "condense_complete":
      next.completedSteps.add("condensing");
      next.detail.condensing = `${event.findingsCount} findings`;
      return next;
    case "done":
      next.completedSteps.add("synthesizing");
      next.currentStep = null;
      return next;
    default:
      return next;
  }
}
