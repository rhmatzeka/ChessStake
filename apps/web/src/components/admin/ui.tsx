export const inputCls = "field !py-2 !text-sm";
export const btnCls = "btn btn-gold btn-sm";
export const ghostBtn = "btn btn-glass btn-sm";

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
  return <span className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider ${c}`}>{children}</span>;
}
