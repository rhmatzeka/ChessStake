"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function HostPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [title, setTitle] = useState('Friday AI Boss Battle');
  const [creatorName, setCreatorName] = useState('ChessStake Creator');
  const [description, setDescription] = useState('A live AI chess arena for my community. Back a side, vote strategy, and follow every move together.');
  const [creatorFee, setCreatorFee] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          creatorName,
          description,
          creatorAddress: address,
          creatorFeeBps: Math.round(Number(creatorFee) * 100),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || 'Failed to create match');
      router.push(json.data.arenaUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#120d0a] px-6 py-16 text-[#f3dfbf]">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#b58863]">Creator Arena</p>
          <h1 className="mt-3 text-4xl font-black">Host a Match</h1>
          <p className="mt-4 leading-7 text-[#f3dfbf]/65">
            Create a shareable AI chess arena for your community. Fans join one link, back a team, vote strategy, and follow the live match together.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-[#f3dfbf]/70">
            <div className="rounded-xl bg-[#120d0a] p-4">Creator fee is tracked in product metadata for the hosted arena.</div>
            <div className="rounded-xl bg-[#120d0a] p-4">The current MVP uses demo/testnet accounting until mainnet legal review is complete.</div>
            <div className="rounded-xl bg-[#120d0a] p-4">Share the arena link with Discord, Telegram, Twitch chat, or X.</div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-8">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
              Match Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 normal-case text-[#f3dfbf] outline-none focus:border-[#d6a15f]" />
            </label>

            <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
              Creator Name
              <input value={creatorName} onChange={(event) => setCreatorName(event.target.value)} className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 normal-case text-[#f3dfbf] outline-none focus:border-[#d6a15f]" />
            </label>

            <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
              Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 normal-case text-[#f3dfbf] outline-none focus:border-[#d6a15f]" />
            </label>

            <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
              Creator Fee %
              <input type="number" min="0" max="10" step="0.5" value={creatorFee} onChange={(event) => setCreatorFee(event.target.value)} className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 normal-case text-[#f3dfbf] outline-none focus:border-[#d6a15f]" />
            </label>

            {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

            <button disabled={loading} className="rounded-xl bg-[#d6a15f] px-5 py-3 font-black text-[#120d0a] disabled:opacity-50">
              {loading ? 'Creating Match...' : 'Create Creator Arena'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
