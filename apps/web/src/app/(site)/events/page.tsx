import type { Metadata } from "next";
import { listEvents, type LobbyItem } from "@/server/events";
import { EventCard } from "@/components/site/EventCard";
import { PageHead } from "@/components/site/PageHead";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "Live, upcoming and past PawnPool Boss Battles.",
};

function Group({ title, items, empty }: { title: string; items: LobbyItem[]; empty: string }) {
  return (
    <section className="mt-14">
      <h2 className="kicker" data-reveal>{title}</h2>
      {items.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
          {items.map((e) => (
            <EventCard key={e.slug} e={e} />
          ))}
        </div>
      ) : (
        <p className="panel mt-4 px-5 py-4 text-muted" data-reveal>{empty}</p>
      )}
    </section>
  );
}

export default async function Events() {
  let data: Awaited<ReturnType<typeof listEvents>> | null = null;
  try {
    data = await listEvents();
  } catch {
    data = null;
  }
  return (
    <>
      <PageHead kicker="Boss Battles" title="Events" lead="Jump into a live battle, or set a reminder for the next one." />
      <div className="mx-auto max-w-6xl px-5 pb-8">
        {data ? (
          <>
            <Group title="Live now" items={data.live} empty="Nothing live right now." />
            <Group title="Upcoming" items={data.upcoming} empty="No event is scheduled yet. Practice Arena is always open." />
            <Group title="Past" items={data.past} empty="No finished events yet." />
          </>
        ) : (
          <p role="alert" className="panel px-4 py-3 text-muted">
            We could not load events. Refresh in a moment.
          </p>
        )}
      </div>
    </>
  );
}
