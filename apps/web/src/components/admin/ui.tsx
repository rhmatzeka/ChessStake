export const inputCls =
  "w-full rounded-md border border-line bg-panel-hi px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none";
export const btnCls = "rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#f0b868] disabled:opacity-60";
export const ghostBtn = "rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-60";

export function ErrorLine({ msg }: { msg: string | null }) {
  return msg ? (
    <p role="alert" className="mt-3 text-sm text-red-300">
      {msg}
    </p>
  ) : null;
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: "gold" | "green" | "red" | "muted" }) {
  const c = {
    gold: "border-gold/50 text-gold",
    green: "border-emerald-500/50 text-emerald-300",
    red: "border-red-500/50 text-red-300",
    muted: "border-line text-muted",
  }[tone];
  return <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
}
