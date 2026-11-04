/** The letter coin that ties a candidate card to its arrow on the board. */
export function CandidateMark({ letter, active = false }: { letter: string; active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[0.7rem] font-bold ${
        active ? "border-gold bg-gold text-black" : "border-foreground/35 text-foreground/85"
      }`}
    >
      {letter}
    </span>
  );
}
