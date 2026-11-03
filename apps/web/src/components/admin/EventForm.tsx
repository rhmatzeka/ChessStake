"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { adminErrorMessage, isoToWibLocal, wibLocalToIso } from "@/lib/adminHelpers";
import { btnCls, ErrorLine, ghostBtn, inputCls } from "./ui";

export type AdminEvent = {
  id: string;
  title: string;
  slug: string;
  hostName: string;
  startsAt: string;
  bossLevel: number;
  maxCrowdMoves: number;
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  sponsorUrl: string | null;
  prizeText: string | null;
  status: string;
  playersCount: number;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}

export function EventForm({ event, onClose, onSaved }: { event: AdminEvent | null; onClose: () => void; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const opt = (k: string) => String(fd.get(k) ?? "").trim() || null;
    setError(null);
    let body;
    try {
      body = {
        title: String(fd.get("title")).trim(),
        slug: String(fd.get("slug")).trim(),
        hostName: String(fd.get("hostName")).trim(),
        startsAt: wibLocalToIso(String(fd.get("startsAt"))),
        bossLevel: Number(fd.get("bossLevel")),
        maxCrowdMoves: Number(fd.get("maxCrowdMoves")),
        sponsorName: opt("sponsorName"),
        sponsorLogoUrl: opt("sponsorLogoUrl"),
        sponsorUrl: opt("sponsorUrl"),
        prizeText: opt("prizeText"),
      };
    } catch (err) {
      setError((err as Error).message);
      return;
    }
    setBusy(true);
    try {
      await apiFetch(event ? `/api/admin/events/${event.id}` : "/api/admin/events", {
        method: event ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? adminErrorMessage(err.code, err.message) : "Could not save the event");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 rounded-lg border border-line bg-panel p-5">
      <h3 className="font-display text-lg font-bold">{event ? "Edit event" : "New event"}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input name="title" required minLength={3} maxLength={80} defaultValue={event?.title} className={inputCls} />
        </Field>
        <Field label="Slug (a-z, 0-9, dash)">
          <input name="slug" required pattern="[a-z0-9\-]{3,48}" defaultValue={event?.slug} className={inputCls} />
        </Field>
        <Field label="Host name">
          <input name="hostName" required minLength={2} maxLength={50} defaultValue={event?.hostName} className={inputCls} />
        </Field>
        <Field label="Starts at (WIB, UTC+7)">
          <input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={event ? isoToWibLocal(event.startsAt) : ""}
            className={inputCls}
          />
        </Field>
        <Field label="Boss level (1 to 5)">
          <input name="bossLevel" type="number" min={1} max={5} required defaultValue={event?.bossLevel ?? 3} className={inputCls} />
        </Field>
        <Field label="Max crowd moves (10 to 60)">
          <input
            name="maxCrowdMoves"
            type="number"
            min={10}
            max={60}
            required
            defaultValue={event?.maxCrowdMoves ?? 30}
            className={inputCls}
          />
        </Field>
        <Field label="Sponsor name">
          <input name="sponsorName" maxLength={60} defaultValue={event?.sponsorName ?? ""} className={inputCls} />
        </Field>
        <Field label="Sponsor URL (https)">
          <input name="sponsorUrl" type="url" pattern="https://.*" defaultValue={event?.sponsorUrl ?? ""} className={inputCls} />
        </Field>
        <Field label="Sponsor logo URL (https)">
          <input
            name="sponsorLogoUrl"
            type="url"
            pattern="https://.*"
            defaultValue={event?.sponsorLogoUrl ?? ""}
            className={inputCls}
          />
        </Field>
        <Field label="Prize text">
          <input name="prizeText" maxLength={200} defaultValue={event?.prizeText ?? ""} className={inputCls} />
        </Field>
      </div>
      <ErrorLine msg={error} />
      <div className="mt-5 flex gap-2">
        <button className={btnCls} disabled={busy}>
          {busy ? "Saving…" : event ? "Save changes" : "Create event"}
        </button>
        <button type="button" className={ghostBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </form>
  );
}
