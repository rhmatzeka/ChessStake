"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';

type Settlement = {
  gameId: string;
  address: string;
  gameStatus: string;
  result: string | null;
  winner: string | null;
  type: 'REWARD' | 'REFUND' | 'NONE';
  claimableWei: string;
  totalUserBetWei: string;
  totalPoolWei: string;
  rewardPoolWei: string;
  alreadyClaimed: boolean;
  reason: string;
  claimedAt?: string;
};

function formatEth(wei: string) {
  const value = Number(wei) / 1e18;
  return `${value.toFixed(6)} ETH`;
}

export default function ClaimPage() {
  const { address } = useAccount();
  const [gameId, setGameId] = useState('');
  const [claimAddress, setClaimAddress] = useState('');
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedAddress = claimAddress || address || '';

  const loadSettlement = async () => {
    if (!gameId || !resolvedAddress) {
      setError('Game ID and address are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/settlement?address=${encodeURIComponent(resolvedAddress)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || 'Failed to load settlement');
      setSettlement(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settlement');
    } finally {
      setLoading(false);
    }
  };

  const claimSettlement = async () => {
    if (!gameId || !resolvedAddress) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: resolvedAddress }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || 'Failed to claim settlement');
      setSettlement(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#120d0a] px-6 py-16 text-[#f3dfbf]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#b58863]/20 bg-[#211713] p-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#b58863]">ChessStake Demo Settlement</p>
        <h1 className="mt-3 text-3xl font-black">Claim Rewards / Refunds</h1>
        <p className="mt-3 text-sm leading-6 text-[#f3dfbf]/65">
          Vercel-only mode uses demo accounting in PostgreSQL. This marks rewards or refunds as claimed in the database; it does not transfer on-chain ETH.
        </p>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
            Game ID
            <input
              value={gameId}
              onChange={(event) => setGameId(event.target.value)}
              placeholder="game_1783750346541"
              className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 font-mono text-sm text-[#f3dfbf] outline-none focus:border-[#d6a15f]"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
            Address
            <input
              value={claimAddress}
              onChange={(event) => setClaimAddress(event.target.value)}
              placeholder={address || '0x...'}
              className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 font-mono text-sm text-[#f3dfbf] outline-none focus:border-[#d6a15f]"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={loadSettlement}
              disabled={loading}
              className="rounded-xl bg-[#d6a15f] px-5 py-3 font-black text-[#120d0a] disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Eligibility'}
            </button>
            <button
              onClick={claimSettlement}
              disabled={loading || !settlement || settlement.type === 'NONE' || settlement.claimableWei === '0'}
              className="rounded-xl border border-[#d6a15f]/40 px-5 py-3 font-black text-[#f3dfbf] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Claim Demo Settlement
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {settlement && (
          <div className="mt-6 rounded-2xl border border-[#b58863]/20 bg-[#120d0a] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b58863]/10 pb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#f3dfbf]/45">Settlement Type</div>
                <div className="text-xl font-black text-[#d6a15f]">{settlement.type}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-[#f3dfbf]/45">Claimable</div>
                <div className="font-mono text-xl font-black">{formatEth(settlement.claimableWei)}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-[#f3dfbf]/70 sm:grid-cols-2">
              <div>Game Status: <span className="font-bold text-[#f3dfbf]">{settlement.gameStatus}</span></div>
              <div>Winner: <span className="font-bold text-[#f3dfbf]">{settlement.winner || settlement.result || '-'}</span></div>
              <div>Your Bet: <span className="font-mono text-[#f3dfbf]">{formatEth(settlement.totalUserBetWei)}</span></div>
              <div>Reward Pool: <span className="font-mono text-[#f3dfbf]">{formatEth(settlement.rewardPoolWei)}</span></div>
              <div>Total Pool: <span className="font-mono text-[#f3dfbf]">{formatEth(settlement.totalPoolWei)}</span></div>
              <div>Claimed: <span className="font-bold text-[#f3dfbf]">{settlement.alreadyClaimed ? 'Yes' : 'No'}</span></div>
            </div>

            <p className="mt-4 rounded-xl bg-[#211713] p-4 text-sm text-[#f3dfbf]/70">{settlement.reason}</p>
          </div>
        )}
      </div>
    </main>
  );
}
