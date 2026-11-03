"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { adminErrorMessage, formatWib } from "@/lib/adminHelpers";
import { Badge, ErrorLine, ghostBtn } from "./ui";

type Lead = {
  id: string;
  type: string;
  name: string;
  contact: string;
  organization: string | null;
  message: string;
  createdAt: string;
  handledAt: string | null;
};

export function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [unhandledOnly, setUnhandledOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLeads(await apiFetch<Lead[]>(`/api/admin/leads?handled=${unhandledOnly ? "false" : "true"}`));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? adminErrorMessage(e.code, e.message) : "Could not load leads");
    }
  }, [unhandledOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setHandled(id: string, handled: boolean) {
    try {
      await apiFetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, handled }),
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? adminErrorMessage(e.code, e.message) : "Could not update lead");
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="display display-sm">Leads</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={unhandledOnly} onChange={(e) => setUnhandledOnly(e.target.checked)} />
          Only unhandled
        </label>
      </div>
      <ErrorLine msg={error} />
      {leads === null ? (
        <p className="mt-4 text-muted">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="mt-4 text-muted">No leads.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {leads.map((l) => (
            <li key={l.id} className="panel p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={l.type === "SPONSOR" ? "gold" : "muted"}>{l.type}</Badge>
                <span className="font-semibold">{l.name}</span>
                {l.organization && <span className="text-sm text-muted">{l.organization}</span>}
                <span className="text-sm text-gold">{l.contact}</span>
                <span className="ml-auto text-xs text-muted">{formatWib(l.createdAt)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{l.message}</p>
              <div className="mt-3">
                {l.handledAt ? (
                  <button className={ghostBtn} onClick={() => setHandled(l.id, false)}>
                    Handled, undo
                  </button>
                ) : (
                  <button className={ghostBtn} onClick={() => setHandled(l.id, true)}>
                    Mark handled
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
