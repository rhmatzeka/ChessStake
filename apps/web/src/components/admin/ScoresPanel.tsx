"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { adminErrorMessage } from "@/lib/adminHelpers";
import { Badge, ErrorLine, ghostBtn } from "./ui";
import type { AdminEvent } from "./EventForm";

type Row = {
  rank: number;
  userId: string;
  name: string;
  address: string;
  points: number;
  turnsPicked: number;
  eligible: boolean;
  disqualified: boolean;
  prizePaidAt: string | null;
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function ScoresPanel({ event, onClose }: { event: AdminEvent; onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/admin/events/${event.id}/scores`;

  const load = useCallback(async () => {
    try {
      setRows(await apiFetch<Row[]>(base));
    } catch (e) {
      setError(e instanceof ApiError ? adminErrorMessage(e.code, e.message) : "Could not load scores");
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(userId: string, action: "disqualify" | "reinstate" | "markPaid" | "unmarkPaid") {
    try {
      await apiFetch(base, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      setError(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? adminErrorMessage(e.code, e.message) : "Could not update");
    }
  }

  return (
    <div className="mt-10 panel p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="display display-sm">Scores: {event.title}</h3>
        <a href={`${base}?format=csv`} download className={`${ghostBtn} ml-auto`}>
          Download CSV
        </a>
        <button className={ghostBtn} onClick={onClose}>
          Close
        </button>
      </div>
      <ErrorLine msg={error} />
      {rows === null ? (
        <p className="mt-4 text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-muted">No players yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="th">
              <tr>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">Points</th>
                <th className="px-3 py-2">Turns</th>
                <th className="px-3 py-2">Prize</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-t border-line">
                  <td className="px-3 py-2">{r.rank}</td>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-muted" title={r.address}>
                    {short(r.address)}
                  </td>
                  <td className="px-3 py-2">{r.points}</td>
                  <td className="px-3 py-2">{r.turnsPicked}</td>
                  <td className="px-3 py-2">
                    {r.disqualified ? <Badge tone="red">Disqualified</Badge> : r.eligible ? <Badge tone="green">Eligible</Badge> : <Badge tone="muted">Not eligible</Badge>}
                  </td>
                  <td className="px-3 py-2">{r.prizePaidAt ? <Badge tone="green">Paid</Badge> : <span className="text-muted">No</span>}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      {r.disqualified ? (
                        <button className={ghostBtn} onClick={() => act(r.userId, "reinstate")}>
                          Reinstate
                        </button>
                      ) : (
                        <button className={ghostBtn} onClick={() => act(r.userId, "disqualify")}>
                          Disqualify
                        </button>
                      )}
                      {r.prizePaidAt ? (
                        <button className={ghostBtn} onClick={() => act(r.userId, "unmarkPaid")}>
                          Unmark paid
                        </button>
                      ) : (
                        <button className={ghostBtn} onClick={() => act(r.userId, "markPaid")}>
                          Mark paid
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
    </div>
  );
}
