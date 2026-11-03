"use client";

import { useState } from "react";
import { EventsPanel } from "./EventsPanel";
import { LeadsPanel } from "./LeadsPanel";

export function AdminConsole() {
  const [tab, setTab] = useState<"events" | "leads">("events");
  const tabCls = (t: string) =>
    `rounded-md px-4 py-2 text-sm font-semibold ${tab === t ? "bg-gold text-black" : "border border-line text-muted hover:text-foreground"}`;
  return (
    <div>
      <div className="mb-8 flex gap-2" role="tablist">
        <button role="tab" aria-selected={tab === "events"} className={tabCls("events")} onClick={() => setTab("events")}>
          Events
        </button>
        <button role="tab" aria-selected={tab === "leads"} className={tabCls("leads")} onClick={() => setTab("leads")}>
          Leads
        </button>
      </div>
      {tab === "events" ? <EventsPanel /> : <LeadsPanel />}
    </div>
  );
}
