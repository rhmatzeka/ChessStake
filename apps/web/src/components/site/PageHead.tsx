import Image from "next/image";

/** Page head: kicker + huge uppercase title over a darkened board photo band. */
export function PageHead({
  title,
  lead,
  kicker,
  photo = "settled",
}: {
  title: string;
  lead?: string;
  kicker?: string;
  photo?: "settled" | "flight" | "board";
}) {
  return (
    <div className="photo-band border-b border-line">
      <div className="photo-band-img" aria-hidden="true">
        <Image src={`/assets/hero/${photo}.webp`} alt="" fill sizes="100vw" className="object-cover object-[50%_30%]" />
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-14 md:pb-16 md:pt-20">
        {kicker && (
          <p className="kicker flex items-center gap-2">
            <span className="live-dot" aria-hidden="true" />
            {kicker}
          </p>
        )}
        <h1 className="display mt-4 max-w-4xl text-[clamp(2.4rem,7vw,5.25rem)]">{title}</h1>
        {lead && <p className="mt-5 max-w-xl text-lg text-[#c9c0b3]">{lead}</p>}
      </div>
    </div>
  );
}
