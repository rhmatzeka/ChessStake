"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Match = {
  gameId: string;
  title: string;
  host: string;
  status: string;
  turnNumber: number;
  totalPoolWei: string;
  creatorFeeBps?: number;
};

function formatEth(wei: string) {
  const value = Number(BigInt(wei)) / 1e18;
  return `${value.toFixed(4)} ETH`;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await fetch('/api/matches', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error?.message || 'Failed to load matches');
        setMatches(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  return (
    <main className="min-h-screen bg-[#120d0a] px-6 py-16 text-[#f3dfbf]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#b58863]">Live And Recent Arenas</p>
            <h1 className="mt-3 text-4xl font-black">Matches</h1>
            <p className="mt-3 max-w-2xl text-[#f3dfbf]/65">Discover active creator arenas, recent community battles, and upcoming match formats.</p>
          </div>
          <Link href="/host" className="rounded-xl bg-[#d6a15f] px-5 py-3 text-center font-black text-[#120d0a]">Host a Match</Link>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-100">
            {error}. You can still enter the live arena or host a new match.
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && <div className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6 text-[#f3dfbf]/60">Loading matches...</div>}

          {!loading && matches.map((match) => (
            <article key={match.gameId} className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#b58863]/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#d6a15f]">{match.status}</span>
                <span className="text-xs text-[#f3dfbf]/45">Turn {match.turnNumber}</span>
              </div>
              <h2 className="mt-4 text-xl font-black">{match.title}</h2>
              <p className="mt-1 text-sm text-[#f3dfbf]/55">Hosted by {match.host}</p>
              {(match.creatorFeeBps || 0) > 0 && <p className="mt-2 text-xs font-bold text-[#d6a15f]">Creator share target: {((match.creatorFeeBps || 0) / 100).toFixed(1)}%</p>}
              <div className="mt-5 rounded-xl bg-[#120d0a] p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#f3dfbf]/45">Prize Pool</div>
                <div className="mt-1 font-mono text-2xl font-black text-[#d6a15f]">{formatEth(match.totalPoolWei)}</div>
              </div>
              <Link href={`/arena/${match.gameId}`} className="mt-5 block rounded-xl border border-[#d6a15f]/40 px-4 py-3 text-center font-black text-[#f3dfbf] transition hover:bg-[#d6a15f]/10">
                Join Arena
              </Link>
            </article>
          ))}

          {!loading && matches.length === 0 && (
            <div className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6 text-[#f3dfbf]/60">No matches yet. Start with the live arena or host a new event.</div>
          )}
        </div>
      </div>
    </main>
  );
}
