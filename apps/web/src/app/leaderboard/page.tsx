"use client";

import { useEffect, useState } from 'react';

function formatEth(wei: string) {
  const value = Number(BigInt(wei)) / 1e18;
  return `${value.toFixed(4)} ETH`;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error?.message || 'Failed to load leaderboard');
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <main className="min-h-screen bg-[#120d0a] px-6 py-16 text-[#f3dfbf]">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#b58863]">Community Rankings</p>
        <h1 className="mt-3 text-4xl font-black">Leaderboard</h1>
        <p className="mt-3 max-w-2xl text-[#f3dfbf]/65">
          Track the most active backers, biggest match pools, and recent arena results.
        </p>

        {loading && <div className="mt-8 rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6 text-[#f3dfbf]/60">Loading leaderboard...</div>}
        {error && <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-100">{error}</div>}

        {!loading && !error && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6">
              <h2 className="text-xl font-black">Top Backers</h2>
              <div className="mt-4 grid gap-3">
                {(data?.topBackers || []).map((entry: any, index: number) => (
                  <div key={entry.address} className="flex items-center justify-between rounded-xl bg-[#120d0a] px-4 py-3 text-sm">
                    <span className="font-mono text-[#f3dfbf]/80">#{index + 1} {shortAddress(entry.address)}</span>
                    <span className="font-black text-[#d6a15f]">{formatEth(entry.totalWei)}</span>
                  </div>
                ))}
                {(!data?.topBackers || data.topBackers.length === 0) && <p className="text-sm text-[#f3dfbf]/55">No backers yet.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6">
              <h2 className="text-xl font-black">Biggest Match Pools</h2>
              <div className="mt-4 grid gap-3">
                {(data?.biggestPools || []).map((game: any) => (
                  <div key={game.gameId} className="flex items-center justify-between gap-3 rounded-xl bg-[#120d0a] px-4 py-3 text-sm">
                    <span className="truncate font-mono text-[#f3dfbf]/80">{game.gameId}</span>
                    <span className="font-black text-[#d6a15f]">{formatEth(game.totalWei)}</span>
                  </div>
                ))}
                {(!data?.biggestPools || data.biggestPools.length === 0) && <p className="text-sm text-[#f3dfbf]/55">No matches yet.</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
