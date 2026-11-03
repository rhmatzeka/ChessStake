import type { Metadata } from "next";
import { PageHead } from "@/components/site/PageHead";
import { LeadForm } from "@/components/site/LeadForm";

export const metadata: Metadata = {
  title: "For creators",
  description: "Creator Pro is coming: run your own Boss Battle for your community. Join the waitlist.",
};

const INCLUDED = [
  "Create and schedule your own events",
  "Choose the Boss name and level",
  "Private events for your members only",
  "A stream overlay for OBS",
  "Numbers on who played and how long they stayed",
];

export default function Host() {
  return (
    <>
      <PageHead
        kicker="For creators"
        title="Run a Boss Battle for your community"
        lead="Creator Pro is coming. Join the waitlist and we will tell you when it opens."
      />
      <div className="mx-auto max-w-6xl px-5 pt-12">
        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="kicker">Creator Pro</p>
            <h2 className="display display-sm mt-3">What it will include</h2>
            <ul className="mt-4 grid list-disc gap-2 pl-5 text-[#c9c0b3]">
              {INCLUDED.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <p className="mt-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-gold">About Rp99.000 per month</p>
            <p className="mt-6 max-w-sm text-sm text-muted">
              Want to host a free event sooner? Tell us in the form. If you bring a sponsor, you earn 30% of the platform share of that event.
            </p>
          </div>
          <LeadForm
            type="CREATOR"
            submitLabel="Join the waitlist"
            messageLabel="Tell us about your community"
            successText="You are on the list. We will message you when Creator Pro opens."
          />
        </div>
      </div>
    </>
  );
}
