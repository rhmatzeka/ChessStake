import type { Metadata } from "next";
import { PageHead } from "@/components/site/PageHead";
import { LeadForm } from "@/components/site/LeadForm";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Sponsor a PawnPool Boss Battle: your name and prizes in front of an engaged crowd, from Rp3.000.000 per event.",
};

export default function Sponsor() {
  return (
    <>
      <PageHead
        kicker="For sponsors"
        title="Sponsor a Boss Battle"
        lead="Put up the prizes for a live crowd game. Players see your name on every turn and your prizes on the leaderboard."
      />
      <div className="mx-auto max-w-6xl px-5 pt-12">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="panel panel-gold p-7">
            <p className="kicker">Sponsored Event</p>
            <h2 className="display display-md mt-3 text-gold">From Rp3.000.000</h2>
            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">per event, about US$190</p>
            <p className="mt-4 text-muted">One scheduled Boss Battle, branded with you.</p>
            <ul className="mt-4 grid list-disc gap-2 pl-5 text-[#c9c0b3]">
              <li>Your name, logo and link on the event page</li>
              <li>Your prize text shown to every player</li>
              <li>The top 10 players win the prizes</li>
              <li>A list of winners and their wallets after the event</li>
            </ul>
            <p className="mt-4 text-sm text-muted">Example split: Rp1.500.000 goes to prizes, Rp1.500.000 to the platform.</p>
          </article>
          <article className="panel p-7">
            <p className="kicker">Season Sponsor</p>
            <h2 className="display display-md mt-3 text-gold">From Rp10.000.000</h2>
            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">per month</p>
            <p className="mt-4 text-muted">Be the name behind the whole month.</p>
            <ul className="mt-4 grid list-disc gap-2 pl-5 text-[#c9c0b3]">
              <li>Your logo on every event that month</li>
              <li>Your logo on the season leaderboard</li>
              <li>A season prize pool for the top players</li>
            </ul>
          </article>
        </div>
        <p className="mt-5 text-sm text-muted">
          Prices are starting points and can change. Creator Pro and cosmetics are coming later and are not part of sponsoring.
        </p>

        <section className="mt-24 grid gap-10 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="kicker">Get in touch</p>
            <h2 className="display display-md mt-3">Tell us what you have in mind</h2>
            <p className="mt-4 max-w-sm text-muted">
              Send a short note. We reply by chat or email, agree the details, and you receive an invoice by bank transfer or USDC. We then set up the event with your name and prizes.
            </p>
          </div>
          <LeadForm
            type="SPONSOR"
            submitLabel="Send to PawnPool"
            messageLabel="What would you like to sponsor?"
            successText="We will reply through the contact you left, usually within two working days."
          />
        </section>
      </div>
    </>
  );
}
