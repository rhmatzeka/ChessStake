"use client";

import { useState } from "react";

type Kind = "SPONSOR" | "CREATOR";
type State = { s: "idle" } | { s: "sending" } | { s: "done" } | { s: "error"; msg: string };

const field =
  "w-full rounded-md border border-line bg-panel-hi px-3 py-2.5 text-base text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none";

export function LeadForm({
  type,
  submitLabel,
  messageLabel,
  successText,
}: {
  type: Kind;
  submitLabel: string;
  messageLabel: string;
  successText: string;
}) {
  const [state, setState] = useState<State>({ s: "idle" });

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    setState({ s: "sending" });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          name: fd.get("name"),
          contact: fd.get("contact"),
          organization: fd.get("organization") || undefined,
          message: fd.get("message"),
          website: fd.get("website") ?? "",
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: { message?: string } } | null;
      if (res.ok && json?.ok) return setState({ s: "done" });
      if (res.status === 429) return setState({ s: "error", msg: "You sent a few already. Please try again in an hour." });
      if (res.status === 400) return setState({ s: "error", msg: "Some fields are missing or too long. Check the form and send again." });
      setState({ s: "error", msg: "We could not send this. Please try again in a minute." });
    } catch {
      setState({ s: "error", msg: "No connection. Check your network and send again." });
    }
  }

  if (state.s === "done") {
    return (
      <div role="status" className="rounded-xl border border-gold/50 bg-panel p-6">
        <p className="font-display text-xl font-bold text-gold">Thanks, we got it.</p>
        <p className="mt-2 text-muted">{successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-muted">
          Your name
          <input name="name" required maxLength={80} autoComplete="name" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm text-muted">
          Email, Telegram or X handle
          <input name="contact" required maxLength={120} className={field} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm text-muted">
        Community or company (optional)
        <input name="organization" maxLength={120} autoComplete="organization" className={field} />
      </label>
      <label className="grid gap-1.5 text-sm text-muted">
        {messageLabel}
        <textarea name="message" required maxLength={1000} rows={5} className={field} />
      </label>
      {/* Honeypot: real people never see or fill this. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {state.s === "error" && (
        <p role="alert" className="rounded-md border border-red-900/70 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.msg}
        </p>
      )}
      <button
        type="submit"
        disabled={state.s === "sending"}
        className="justify-self-start rounded-md bg-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-[#f0b96a] disabled:opacity-60"
      >
        {state.s === "sending" ? "Sending..." : submitLabel}
      </button>
    </form>
  );
}
