function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** A one-event iCalendar file as a data URL, for an "Add to calendar" link. */
export function buildIcsDataUrl(e: { slug: string; title: string; startsAt: string; url: string; minutes?: number }): string {
  const start = new Date(e.startsAt);
  const end = new Date(start.getTime() + (e.minutes ?? 45) * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PawnPool//Boss Battle//EN",
    "BEGIN:VEVENT",
    `UID:${e.slug}@pawnpool`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${e.title} (PawnPool)`)}`,
    `DESCRIPTION:${esc(`Play chess with the crowd against the AI Boss: ${e.url}`)}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
