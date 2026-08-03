"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import WalletConnectButton from '../components/layout/WalletConnectButton';

// Types
type Match = {
  gameId: string;
  title: string;
  host: string;
  status: string;
  turnNumber: number;
  totalPoolWei: string;
  creatorFeeBps?: number;
};

// Simulation Constants
const MOCK_BOARD_FEN_1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const MOCK_BOARD_FEN_2 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

function formatEth(wei: string) {
  const value = Number(BigInt(wei)) / 1e18;
  return `${value.toFixed(4)} ETH`;
}

export default function Home() {
  const { isConnected, address } = useAccount();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

  // Agent Customizer State
  const [agentName, setAgentName] = useState('PawnStormer');
  const [personality, setPersonality] = useState('Aggressive attacker focused on pawn majorities and quick kingside checks.');
  const [aggression, setAggression] = useState(80);
  const [defense, setDefense] = useState(20);
  const [randomness, setRandomness] = useState(10);

  // Live Simulator Loop State
  const [simStep, setSimStep] = useState<'IDLE' | 'VOTING' | 'THINKING' | 'RESOLVING' | 'MOVED'>('IDLE');
  const [simTally, setSimTally] = useState({ PAWN: 25, KNIGHT: 65, BISHOP: 10 });
  const [simFen, setSimFen] = useState(MOCK_BOARD_FEN_1);
  const [simLog, setSimLog] = useState<string[]>(['Match created. Waiting for team White strategy.']);

  // Fetch Matches
  useEffect(() => {
    let active = true;
    fetch('/api/matches')
      .then((res) => res.json())
      .then((json) => {
        if (active && json.ok) {
          setMatches(json.data.slice(0, 4) || []);
        }
      })
      .catch((err) => console.error('Failed to load landing page matches:', err))
      .finally(() => {
        if (active) setMatchesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Simulator Loop Effect
  useEffect(() => {
    let timer: any;
    const runSimulator = () => {
      if (simStep === 'IDLE') {
        timer = setTimeout(() => {
          setSimStep('VOTING');
          setSimLog((prev) => [...prev.slice(-3), 'White team voting opened. BACK dynamic strategies.']);
        }, 3000);
      } else if (simStep === 'VOTING') {
        let count = 0;
        const interval = setInterval(() => {
          setSimTally((prev) => {
            const addedPawn = Math.floor(Math.random() * 15);
            const addedKnight = Math.floor(Math.random() * 30);
            return {
              PAWN: prev.PAWN + addedPawn,
              KNIGHT: prev.KNIGHT + addedKnight,
              BISHOP: prev.BISHOP,
            };
          });
          count++;
          if (count >= 5) {
            clearInterval(interval);
            setSimStep('THINKING');
            setSimLog((prev) => [...prev.slice(-3), 'Voting closed. Winning piece: KNIGHT (74% support). AI resolving…']);
          }
        }, 800);
      } else if (simStep === 'THINKING') {
        timer = setTimeout(() => {
          setSimStep('RESOLVING');
          setSimLog((prev) => [...prev.slice(-3), 'AI tactical resolver selected move: e2e4 (Knight advance opportunity).']);
        }, 2000);
      } else if (simStep === 'RESOLVING') {
        timer = setTimeout(() => {
          setSimFen(MOCK_BOARD_FEN_2);
          setSimStep('MOVED');
          setSimLog((prev) => [...prev.slice(-3), 'Move confirmed on-chain. White Knight moved to e4.']);
        }, 1500);
      } else if (simStep === 'MOVED') {
        timer = setTimeout(() => {
          // Reset loop but flip team or just repeat
          setSimFen(MOCK_BOARD_FEN_1);
          setSimTally({ PAWN: 25, KNIGHT: 65, BISHOP: 10 });
          setSimStep('IDLE');
          setSimLog(['Resetting simulator. Match restarted.']);
        }, 4000);
      }
    };

    runSimulator();
    return () => {
      clearTimeout(timer);
    };
  }, [simStep]);

  const handleCreateAgentMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert('Please connect your wallet first!');
      return;
    }
    // Submit real API
    fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerAddress: address,
        name: agentName,
        personality,
        riskLevel: aggression > 60 ? 'AGGRESSIVE' : defense > 60 ? 'DEFENSIVE' : 'BALANCED',
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          alert(`Success! Agent "${json.data.name}" created. You can view it in the Agent Dashboard.`);
        } else {
          alert(`Error: ${json.error?.message}`);
        }
      })
      .catch((err) => alert(`Failed to create agent: ${err.message}`));
  };

  return (
    <main className="min-h-screen bg-[#120d0a] text-[#f3dfbf] antialiased">
      {/* Skip to content accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-[#d6a15f] focus:text-[#120d0a] focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to main content
      </a>

      {/* Hero Section */}
      <section id="main-content" className="mx-auto max-w-7xl px-4 pt-16 pb-20 md:px-6 lg:pt-24 lg:pb-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Hero Left */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span className="mb-4 inline-flex self-start rounded-full border border-[#b58863]/30 bg-[#211713] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-[#d6a15f]">
              Interactive AI Chess Arena
            </span>
            <h1 className="text-4xl font-black tracking-tight text-[#f3dfbf] sm:text-5xl md:text-6xl lg:text-7xl text-wrap-balance">
              Twitch Plays Chess with <span className="text-[#d6a15f] underline decoration-[#b58863]/40">Real Stakes</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#f3dfbf]/70 md:text-lg">
              PawnPool lets creators host live AI chess arenas where communities back a team, vote on per-turn piece strategies, and share reward pools from every outcome.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/arena/live"
                className="inline-flex items-center justify-center rounded-xl bg-[#d6a15f] px-6 py-3.5 text-center text-sm font-black text-[#120d0a] transition-all hover:bg-[#f0c178] active:scale-98 focus-visible:ring-2 focus-visible:ring-[#d6a15f] outline-none"
              >
                Enter Live Arena
              </Link>
              <Link
                href="/host"
                className="inline-flex items-center justify-center rounded-xl border border-[#b58863]/40 px-6 py-3.5 text-center text-sm font-black text-[#f3dfbf] transition-all hover:bg-[#b58863]/10 active:scale-98 focus-visible:ring-2 focus-visible:ring-[#b58863] outline-none"
              >
                Host a Match
              </Link>
            </div>

            {/* Micro details */}
            <div className="mt-10 border-t border-[#b58863]/10 pt-8 flex gap-6 items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="h-8 w-8 rounded-full border border-[#120d0a] bg-[#211713] flex items-center justify-center text-[10px] font-black text-[#d6a15f]">
                    AI
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#f3dfbf]/50 max-w-sm">
                No human blunders. Deterministic chess.js engine enforcement with custom strategic AI resolvers.
              </p>
            </div>
          </div>

          {/* Hero Right: Live Interactive Chess Simulator (Branding Signature) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-[#b58863]/25 bg-[#1a1310] p-4 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-[#d6a15f]/5 rounded-full filter blur-3xl pointer-events-none" />

              {/* Simulator Header */}
              <div className="flex items-center justify-between border-b border-[#b58863]/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d6a15f] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d6a15f]"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#eedcbf]/80">
                    Interactive Simulator
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#d6a15f] bg-[#d6a15f]/10 px-2 py-0.5 rounded border border-[#d6a15f]/25">
                  STATUS: {simStep}
                </div>
              </div>

              {/* Mini Chessboard Grid representation */}
              <div className="aspect-square w-full max-w-[280px] mx-auto grid grid-cols-4 grid-rows-4 border border-[#b58863]/30 bg-[#2d241e]">
                {Array.from({ length: 16 }).map((_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isDark = (row + col) % 2 === 1;
                  const hasPiece = simFen === MOCK_BOARD_FEN_1 && row === 3 && col === 1;
                  const hasMovedPiece = simFen === MOCK_BOARD_FEN_2 && row === 2 && col === 2;

                  return (
                    <div
                      key={i}
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        isDark ? 'bg-[#2b1f1a]' : 'bg-[#e9d6bc]'
                      }`}
                    >
                      {/* Represent Knight on b1 (coords row 3, col 1 in 4x4 mock) */}
                      {hasPiece && (
                        <div className="relative h-10 w-10 animate-pulse transition-all">
                          <Image
                            src="/assets/chess/WhiteKnight.png"
                            alt="Knight piece"
                            fill
                            className="object-contain [image-rendering:pixelated]"
                          />
                        </div>
                      )}
                      {/* Represent Knight moved to c3 (coords row 2, col 2 in 4x4 mock) */}
                      {hasMovedPiece && (
                        <div className="relative h-10 w-10 transition-all scale-110">
                          <Image
                            src="/assets/chess/WhiteKnight.png"
                            alt="Knight piece moved"
                            fill
                            className="object-contain [image-rendering:pixelated]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Voting Bars Sim */}
              <div className="mt-4 grid gap-2">
                <div className="text-[10px] font-bold text-[#eedcbf]/60 uppercase tracking-wider">
                  Live Vote Simulation
                </div>
                {Object.entries(simTally).map(([piece, count]) => {
                  const max = Math.max(...Object.values(simTally));
                  const progress = (count / max) * 100;
                  const leading = count === max && simStep !== 'IDLE';

                  return (
                    <div key={piece} className="text-xs">
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          {piece} {leading && <span className="text-[9px] bg-[#d6a15f] text-[#120d0a] px-1 rounded font-black">LEADING</span>}
                        </span>
                        <span className="font-mono text-[#eedcbf]/60">{count} votes</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#120d0a] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${leading ? 'bg-[#d6a15f]' : 'bg-[#b58863]/40'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Console logs */}
              <div className="mt-4 rounded-lg bg-[#120d0a] p-3 font-mono text-[10px] text-[#eedcbf]/60 h-20 overflow-y-auto">
                {simLog.map((log, idx) => (
                  <div key={idx} className="mb-1 leading-normal">
                    <span className="text-[#d6a15f]">&gt;</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid: B2B Creator Monetization focus */}
      <section className="bg-[#1a1310] border-y border-[#b58863]/25 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#d6a15f]">
              For Creators &amp; Communities
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Turn Passive Spectators Into active strategy teams
            </h2>
            <p className="mt-4 text-[#f3dfbf]/75">
              Traditional streams are passive. PawnPool provides a repeatable event package where every viewer has an active financial or points influence on the chess match outcome.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#b58863]/20 bg-[#120d0a] p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-[#d6a15f]/10 border border-[#d6a15f]/30 flex items-center justify-center text-[#d6a15f] font-black font-mono">
                  01
                </div>
                <h3 className="mt-4 text-lg font-black">Creator Fee Share</h3>
                <p className="mt-2 text-sm text-[#f3dfbf]/65 leading-relaxed">
                  Every match supports a custom creator metadata fee. Earn up to 10% of the prize pool directly to your payout address for hosting the arena.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#b58863]/10 text-xs text-[#d6a15f] font-bold">
                B2B SaaS ready &amp; configurable
              </div>
            </div>

            <div className="rounded-2xl border border-[#b58863]/20 bg-[#120d0a] p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-[#d6a15f]/10 border border-[#d6a15f]/30 flex items-center justify-center text-[#d6a15f] font-black font-mono">
                  02
                </div>
                <h3 className="mt-4 text-lg font-black">Stream Overlay Ready</h3>
                <p className="mt-2 text-sm text-[#f3dfbf]/65 leading-relaxed">
                  PawnPool formats cleanly on small screens and includes transparent overlays for Twitch, YouTube, or Kick. Share one simple link to launch.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#b58863]/10 text-xs text-[#d6a15f] font-bold">
                Low friction guest access
              </div>
            </div>

            <div className="rounded-2xl border border-[#b58863]/20 bg-[#120d0a] p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-[#d6a15f]/10 border border-[#d6a15f]/30 flex items-center justify-center text-[#d6a15f] font-black font-mono">
                  03
                </div>
                <h3 className="mt-4 text-lg font-black">Sponsor Prize boosts</h3>
                <p className="mt-2 text-sm text-[#f3dfbf]/65 leading-relaxed">
                  Secure protocol or brand sponsorships. Boost matches with fixed prizes, sponsor-customized AI bosses, and dedicated post-match recaps.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#b58863]/10 text-xs text-[#d6a15f] font-bold">
                Transparent campaign tracking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Agent Builder section */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Customizer Panel */}
          <div className="lg:col-span-6 rounded-2xl border border-[#b58863]/25 bg-[#1a1310] p-6 shadow-xl">
            <h3 className="text-xl font-black">Agent Builder</h3>
            <p className="text-xs text-[#eedcbf]/60 mt-1">Configure your personal AI strategy agent.</p>

            <form onSubmit={handleCreateAgentMock} className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#eedcbf]/70">
                Agent Name
                <input
                  type="text"
                  required
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. PawnStormer"
                  className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-3.5 py-2.5 normal-case text-sm text-[#eedcbf] outline-none focus:border-[#d6a15f]"
                />
              </label>

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#eedcbf]/70">
                Personality / Reasoning Instructions
                <textarea
                  rows={2}
                  required
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="e.g. Prefers fast capture moves…"
                  className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-3.5 py-2.5 normal-case text-sm text-[#eedcbf] outline-none focus:border-[#d6a15f]"
                />
              </label>

              <div className="grid gap-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#eedcbf]/70">Weights</div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Aggression</span>
                    <span className="font-mono text-[#d6a15f]">{aggression}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={aggression}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAggression(val);
                      setDefense(100 - val);
                    }}
                    className="w-full accent-[#d6a15f]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Defense / King Safety</span>
                    <span className="font-mono text-[#d6a15f]">{defense}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={defense}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDefense(val);
                      setAggression(100 - val);
                    }}
                    className="w-full accent-[#d6a15f]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Randomness Heuristic</span>
                    <span className="font-mono text-[#d6a15f]">{randomness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={randomness}
                    onChange={(e) => setRandomness(Number(e.target.value))}
                    className="w-full accent-[#d6a15f]"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#b58863]/10 flex justify-between items-center">
                <WalletConnectButton />
                <button
                  type="submit"
                  className="rounded-xl bg-[#d6a15f] px-5 py-2.5 text-xs font-black text-[#120d0a] transition-all hover:bg-[#f0c178] active:scale-98"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>

          {/* Copy details */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#d6a15f]">
              Autonomous Playstyle Assist
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl text-wrap-balance">
              Deploy personal strategy agents
            </h2>
            <p className="mt-4 text-[#f3dfbf]/75">
              PawnPool supports player-owned AI agents. Instead of choosing strategies manually on every turn, you can create and configure an agent to recommend the best tactical candidates matching your playstyle.
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="flex gap-2">
                <span className="text-[#d6a15f] font-black">✔</span>
                <span>Balanced: combines material gains and safe development.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#d6a15f] font-black">✔</span>
                <span>Aggressive: favors material captures and kingside pressure.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#d6a15f] font-black">✔</span>
                <span>Defensive: focuses on king safety and solid pawn structures.</span>
              </div>
            </div>
            <div className="mt-8">
              <Link href="/agents/leaderboard" className="text-sm font-black text-[#d6a15f] hover:underline flex items-center gap-1">
                Browse Agent Leaderboard &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Match Lobby Section */}
      <section className="bg-[#1a1310] border-t border-[#b58863]/25 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-[#d6a15f]">
                Lobby discovery
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Live &amp; Scheduled Arenas
              </h2>
            </div>
            <Link
              href="/matches"
              className="rounded-xl border border-[#b58863]/40 px-4 py-2.5 text-xs font-black text-[#eedcbf] transition-all hover:bg-[#b58863]/10"
            >
              Browse All Matches
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {matchesLoading && (
              <div className="col-span-full rounded-xl border border-[#b58863]/20 bg-[#120d0a] p-6 text-sm text-[#f3dfbf]/60 text-center">
                Loading live lobbies…
              </div>
            )}

            {!matchesLoading && matches.map((match) => (
              <article key={match.gameId} className="rounded-xl border border-[#b58863]/20 bg-[#120d0a] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-[#b58863]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#d6a15f]">
                      {match.status}
                    </span>
                    <span className="text-[10px] text-[#f3dfbf]/45 font-mono">Turn {match.turnNumber}</span>
                  </div>
                  <h3 className="text-base font-black truncate text-[#eedcbf]">{match.title}</h3>
                  <p className="text-xs text-[#f3dfbf]/55 truncate mt-1">Hosted by {match.host}</p>
                  {match.creatorFeeBps ? (
                    <p className="text-[10px] text-[#d6a15f] font-bold mt-1">Creator fee: {(match.creatorFeeBps / 100).toFixed(1)}%</p>
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className="bg-[#1a1310] border border-[#b58863]/10 rounded-lg p-3 mb-3">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#f3dfbf]/40">Prize Pool</div>
                    <div className="font-mono text-base font-black text-[#d6a15f] mt-0.5">{formatEth(match.totalPoolWei)}</div>
                  </div>
                  <Link
                    href={`/arena/${match.gameId}`}
                    className="block w-full rounded-lg bg-[#d6a15f]/10 border border-[#d6a15f]/40 px-3 py-2 text-center text-xs font-black text-[#eedcbf] transition-all hover:bg-[#d6a15f]/20"
                  >
                    Join Arena
                  </Link>
                </div>
              </article>
            ))}

            {!matchesLoading && matches.length === 0 && (
              <div className="col-span-full rounded-xl border border-[#b58863]/20 bg-[#120d0a] p-8 text-sm text-[#f3dfbf]/60 text-center">
                No active creator lobbies found. Start with the live arena or host a new event.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust & Legal disclaimers */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center text-xs text-[#eedcbf]/40 leading-relaxed">
        <p>
          PawnPool is an entertainment strategy game. Current public versions use demo/testnet accounting on supported EVM testnets. Platform operations are governed by deterministic chess validation rules. Real-money reward pools require legal opinion and regulatory approval for specific jurisdictions before commercial launch.
        </p>
      </section>
    </main>
  );
}
