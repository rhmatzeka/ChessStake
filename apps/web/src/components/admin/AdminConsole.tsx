"use client";

import { useState } from "react";
import { EventsPanel } from "./EventsPanel";
import { LeadsPanel } from "./LeadsPanel";

export function AdminConsole() {
  const [tab, setTab] = useState<"events" | "leads">("events");
  const tabCls = (t: string) =>
    `btn btn-sm ${tab === t ? "btn-gold" : "btn-glass"}`;
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
