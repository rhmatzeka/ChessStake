"use client";

import { useState } from "react";

export type ArenaTab = { id: string; label: string; content: React.ReactNode };

/** The open tab, or the first one when it went away (a scheduled event's rules tab ends when the event starts). */
export const visibleTab = (tabs: ArenaTab[], open: string) => (tabs.some((t) => t.id === open) ? open : tabs[0]!.id);

/** One panel for everything secondary, so the arena fits a screen. Hidden tabs stay mounted: sign-in runs from one. */
export function ArenaTabs({ tabs }: { tabs: ArenaTab[] }) {
  const [open, setActive] = useState(tabs[0]!.id);
  const active = visibleTab(tabs, open);
  return (
    <section aria-label="Your game" className="panel flex min-h-0 flex-col lg:min-h-40 lg:flex-1">
      <div className="flex shrink-0 gap-5 border-b border-line px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === active}
            onClick={() => setActive(t.id)}
            className={`-mb-px border-b-2 py-2.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] transition-colors ${
              t.id === active ? "border-gold text-gold" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} hidden={t.id !== active} className="scroll-quiet max-h-72 min-h-0 flex-1 overflow-y-auto p-4 lg:max-h-none">
          {t.content}
        </div>
      ))}
    </section>
  );
}
