import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicState } from "@/server/events";
import { AppError } from "@/server/errors";
import { OverlayArena } from "@/components/arena/OverlayArena";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const metadata: Metadata = { title: "Overlay", robots: { index: false, follow: false } };

export default async function Overlay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let initial;
  try {
    initial = await getPublicState(slug);
  } catch (e) {
    if (e instanceof AppError && e.code === "EVENT_NOT_FOUND") notFound();
    throw e;
  }
  return (
    <>
      {/* Browser sources need a see-through page: override the site background for this route only. */}
      <style>{`html,body{background:transparent!important}`}</style>
      <OverlayArena slug={slug} initial={initial} />
    </>
  );
}
