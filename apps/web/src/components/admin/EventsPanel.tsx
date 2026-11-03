"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { adminErrorMessage, formatWib } from "@/lib/adminHelpers";
import { Badge, ErrorLine, ghostBtn, btnCls } from "./ui";
import { EventForm, type AdminEvent } from "./EventForm";
import { ScoresPanel } from "./ScoresPanel";

const tone = (s: string) => (s === "LIVE" ? "green" : s === "SCHEDULED" ? "gold" : s === "ABANDONED" ? "red" : "muted");

export function EventsPanel() {
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<"none" | "new" | AdminEvent>("none");
  const [selected, setSelected] = useState<AdminEvent | null>(null);

  const load = useCallback(async () => {
    try {
      setEvents(await apiFetch<AdminEvent[]>("/api/admin/events"));
    } catch (e) {
      setError(e instanceof ApiError ? adminErrorMessage(e.code, e.message) : "Could not load events");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(ev: AdminEvent) {
    if (!confirm(`Cancel "${ev.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      setError(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? adminErrorMessage(e.code, e.message) : "Could not cancel");
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">Events</h2>
        <button className={btnCls} onClick={() => setForm("new")}>
          New event
        </button>
      </div>
      <ErrorLine msg={error} />
      {form !== "none" && (
        <EventForm
          key={form === "new" ? "new" : form.id}
          event={form === "new" ? null : form}
          onClose={() => setForm("none")}
          onSaved={() => {
            setForm("none");
            setError(null);
            void load();
          }}
        />
      )}
      {events === null ? (
        <p className="mt-4 text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-muted">No events yet.</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Starts</th>
                <th className="px-3 py-2">Players</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{ev.title}</td>
                  <td className="px-3 py-2 text-muted">{ev.slug}</td>
                  <td className="px-3 py-2">
                    <Badge tone={tone(ev.status)}>{ev.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{formatWib(ev.startsAt)}</td>
                  <td className="px-3 py-2">{ev.playersCount}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button className={ghostBtn} onClick={() => setSelected(ev)}>
                        Scores
                      </button>
                      {ev.status === "SCHEDULED" && (
                        <button className={ghostBtn} onClick={() => setForm(ev)}>
                          Edit
                        </button>
                      )}
                      {(ev.status === "SCHEDULED" || ev.status === "LIVE") && (
                        <button className={ghostBtn} onClick={() => cancel(ev)}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <ScoresPanel key={selected.id} event={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
