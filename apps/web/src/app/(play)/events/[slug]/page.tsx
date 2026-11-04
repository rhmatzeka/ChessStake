import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPublicState } from "@/server/events";
import { AppError } from "@/server/errors";
import { Arena } from "@/components/arena/Arena";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const load = cache(async (slug: string) => {
  try {
    return await getPublicState(slug);
  } catch (e) {
    if (e instanceof AppError && e.code === "EVENT_NOT_FOUND") notFound();
    throw e;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await load(slug);
  return {
    title: s.title,
    description: `Join ${s.hostName} and the crowd against the AI Boss. Free to play.`,
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initial = await load(slug);
  return <Arena slug={slug} initial={initial} />;
}
