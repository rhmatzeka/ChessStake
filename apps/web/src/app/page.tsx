"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import WalletConnectButton from '../components/layout/WalletConnectButton';
import ScrollFrameAnimation from '../components/arena/ScrollFrameAnimation';

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

// Custom SVG Chess Pieces for High-Fidelity Tactical Board Mockups
const KnightIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,24 16,28 C 17,29.5 19,30 20,29 C 21,28 20,26 19,25 C 18,24 19,22 21,22 C 23,22 24,24 23,26 C 22,28 24,29 25,29 C 26,29 27,27 27,25 C 27,23 26,21 28,21 C 30,21 31,23 31,25 C 31,27 30,30 27,33 C 24,36 19,37 19,37" />
    <path d="M 22,10 C 22,10 24,11 27,15 C 30,19 30,24 27,28 C 26,29.5 24,30 23,29 C 22,28 23,26 24,25" />
    <path d="M 9,39 L 36,39 C 36,39 38,39 38,37 C 38,35 36,34 36,34 L 9,34 C 9,34 7,34 7,36 C 7,38 9,39 9,39 z" />
    <path d="M 11,34 L 34,34 L 32,31 L 13,31 z" />
    <circle cx="17" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

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

  // Preset Selection
  const handlePreset = (preset: 'AGGRESSIVE' | 'DEFENSIVE' | 'BALANCED') => {
    if (preset === 'AGGRESSIVE') {
      setAgentName('Geller-Bot');
      setPersonality('Focuses on active counterplay, material exchange, and open files for rooks.');
      setAggression(90);
      setDefense(10);
      setRandomness(5);
    } else if (preset === 'DEFENSIVE') {
      setAgentName('Petrosian-Shield');
      setPersonality('Prophylactic strategy. Prevents checks, builds solid pawn chains, and values king safety above all.');
      setAggression(15);
      setDefense(85);
      setRandomness(15);
    } else {
      setAgentName('Rubinstein-Flow');
      setPersonality('Balanced positional play. Gradually improves square mobility and center control.');
      setAggression(50);
      setDefense(50);
      setRandomness(10);
    }
  };

  const handleCreateAgentMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert('Connect your wallet before creating an agent.');
      return;
    }
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
          alert(`Success! Agent "${json.data.name}" deployed to the registry.`);
        } else {
          alert(`Error: ${json.error?.message}`);
        }
      })
      .catch((err) => alert(`Failed to create agent: ${err.message}`));
  };

  return (
    <main className="min-h-screen bg-[#070605] text-[#ede6dc] font-sans selection:bg-[#e6a855] selection:text-[#070605] antialiased">
      {/* Skip to content accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-[#e6a855] focus:text-[#070605] focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to main content
      </a>

      {/* Header / Nav Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#26211e]/40 bg-[#070605]/90 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3 group outline-none">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6a855]/30 bg-[#e6a855]/5 text-[#e6a855] transition-transform group-hover:scale-105">
                <KnightIcon className="h-5 w-5" />
              </span>
              <span className="font-mono text-base font-extrabold uppercase tracking-[0.2em] text-[#ede6dc] transition-colors group-hover:text-[#e6a855]">
                PawnPool
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold text-[#8e8276]">
              <Link href="/matches" className="relative py-1 hover:text-[#ede6dc] transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 after:bg-[#e6a855] hover:after:w-full after:transition-all">Matches</Link>
              <Link href="/agents" className="relative py-1 hover:text-[#ede6dc] transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 after:bg-[#e6a855] hover:after:w-full after:transition-all">Agents</Link>
              <Link href="/how-to-play" className="relative py-1 hover:text-[#ede6dc] transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 after:bg-[#e6a855] hover:after:w-full after:transition-all">Rules</Link>
              <Link href="/leaderboard" className="relative py-1 hover:text-[#ede6dc] transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 after:bg-[#e6a855] hover:after:w-full after:transition-all">Rankings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <section id="main-content" className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
        {/* Background Scroll animation */}
        <ScrollFrameAnimation />

        <div className="mx-auto max-w-4xl px-4 md:px-8 relative z-10 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e6a855] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#8e8276] uppercase">
              Audience-Driven Strategy Engine
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-[#ede6dc] uppercase text-wrap-balance leading-[0.9]">
            Crowd Controlled Chess <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e6a855] to-[#c7883a]">Verifiable Rewards</span>
          </h1>
          
          <p className="mt-8 text-[#8e8276] text-base leading-relaxed md:text-lg max-w-2xl mx-auto">
            Host community-led chess arenas. Spectators pick a side, back dynamic turn-by-turn strategies with native tokens or points, and watch local AI resolvers enforce deterministic outcomes.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/arena/live"
              className="inline-flex items-center justify-center rounded-xl bg-[#e6a855] px-7 py-4 text-xs font-mono font-extrabold uppercase tracking-widest text-[#070605] transition-all hover:bg-[#ffbe6b] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#e6a855] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070605] outline-none"
            >
              Enter Live Arena
            </Link>
            <Link
              href="/host"
              className="inline-flex items-center justify-center rounded-xl border border-[#26211e] bg-[#141210]/50 px-7 py-4 text-xs font-mono font-extrabold uppercase tracking-widest text-[#ede6dc] transition-all hover:bg-[#26211e] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#8e8276] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070605] outline-none"
            >
              Host Match
            </Link>
          </div>

          {/* Stats block */}
          <div className="mt-16 grid grid-cols-3 gap-12 border-t border-[#26211e] pt-10 w-full max-w-xl mx-auto">
            <div>
              <div className="font-mono text-2xl font-extrabold text-[#ede6dc]">20s</div>
              <div className="text-[9px] uppercase tracking-wider text-[#8e8276] font-mono mt-1">Voting window</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-extrabold text-[#e6a855]">100%</div>
              <div className="text-[9px] uppercase tracking-wider text-[#8e8276] font-mono mt-1">On-chain escrow</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-extrabold text-[#ede6dc]">AI</div>
              <div className="text-[9px] uppercase tracking-wider text-[#8e8276] font-mono mt-1">Resolver path</div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Value Proposition */}
      <section className="border-t border-[#26211e] bg-[#0d0b0a] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-3xl mb-16 md:mb-24">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#e6a855]">
              CREATOR REVENUE &amp; ENGAGEMENT
            </span>
            <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl text-[#ede6dc] leading-[1.0]">
              Unlock B2B Stream monetization
            </h2>
            <p className="mt-4 text-[#8e8276] text-sm leading-relaxed max-w-2xl">
              PawnPool replaces static Twitch/YouTube polls with a decentralized strategy playground. Creators host community arenas, viewers back tactics, and smart contracts secure platform incentives.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            <div className="relative">
              <div className="font-mono text-[10px] font-extrabold text-[#e6a855] uppercase tracking-wider mb-2">01 / REVENUE</div>
              <h3 className="text-lg font-black text-[#ede6dc] uppercase tracking-tight">Creator fee split</h3>
              <p className="mt-3 text-xs text-[#8e8276] leading-relaxed">
                Matches support creator metadata locks. Direct 10% pool allocations route to host wallets automatically during database or contract settlements.
              </p>
            </div>
            
            <div className="relative">
              <div className="font-mono text-[10px] font-extrabold text-[#e6a855] uppercase tracking-wider mb-2">02 / INTEGRATION</div>
              <h3 className="text-lg font-black text-[#ede6dc] uppercase tracking-tight">Low friction overlays</h3>
              <p className="mt-3 text-xs text-[#8e8276] leading-relaxed">
                Responsive layouts align directly with Twitch overlays. Spectators register sessions dynamically, choosing teams without complex initial setups.
              </p>
            </div>

            <div className="relative">
              <div className="font-mono text-[10px] font-extrabold text-[#e6a855] uppercase tracking-wider mb-2">03 / SPONSORSHIP</div>
              <h3 className="text-lg font-black text-[#ede6dc] uppercase tracking-tight">Sponsored prize boosts</h3>
              <p className="mt-3 text-xs text-[#8e8276] leading-relaxed">
                Incorporate brand sponsorship models. Fund fixed-prize pools, customize AI commentator personas, and generate post-match reports for sponsors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Agent Builder Interface widget */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          
          {/* Customizer Terminal UI widget */}
          <div className="lg:col-span-5 rounded-2xl border border-[#26211e] bg-[#141210] p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-mono text-xs font-bold text-[#ede6dc] uppercase">AGENT PRESETS</h3>
                <p className="text-[9px] text-[#8e8276] uppercase tracking-wider font-mono">Select configuration profile</p>
              </div>
              <div className="flex gap-1.5">
                {['BALANCED', 'AGGRESSIVE', 'DEFENSIVE'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePreset(p as any)}
                    className="text-[8px] font-mono font-bold bg-[#070605] border border-[#26211e] px-2 py-1 rounded text-[#8e8276] hover:text-[#ede6dc] hover:border-[#ede6dc] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateAgentMock} className="grid gap-4 font-mono">
              <div className="border-t border-[#26211e] pt-4 grid gap-3">
                
                <label className="grid gap-1 text-[9px] font-bold text-[#8e8276] uppercase tracking-wider">
                  AGENT_NAME
                  <input
                    type="text"
                    required
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="rounded-lg border border-[#26211e] bg-[#070605] px-3 py-2 text-xs text-[#ede6dc] outline-none focus:border-[#e6a855] font-mono"
                  />
                </label>

                <label className="grid gap-1 text-[9px] font-bold text-[#8e8276] uppercase tracking-wider">
                  BEHAVIORAL_PROMPT
                  <textarea
                    rows={3}
                    required
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="rounded-lg border border-[#26211e] bg-[#070605] px-3 py-2 text-xs text-[#ede6dc] outline-none focus:border-[#e6a855] font-mono resize-none leading-relaxed"
                  />
                </label>

                <div>
                  <div className="flex justify-between text-[9px] text-[#8e8276] mb-1 font-mono uppercase tracking-wider">
                    <span>Aggression</span>
                    <span className="text-[#e6a855]">{aggression}%</span>
                  </div>
                  <div className="flex items-center gap-3">
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
                      className="w-full accent-[#e6a855] bg-[#070605] h-1 rounded-full cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] text-[#8e8276] mb-1 font-mono uppercase tracking-wider">
                    <span>Prophylaxis / defense</span>
                    <span className="text-[#e6a855]">{defense}%</span>
                  </div>
                  <div className="flex items-center gap-3">
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
                      className="w-full accent-[#e6a855] bg-[#070605] h-1 rounded-full cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] text-[#8e8276] mb-1 font-mono uppercase tracking-wider">
                    <span>Randomness</span>
                    <span className="text-[#e6a855]">{randomness}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={randomness}
                      onChange={(e) => setRandomness(Number(e.target.value))}
                      className="w-full accent-[#e6a855] bg-[#070605] h-1 rounded-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#26211e] flex items-center justify-between">
                <WalletConnectButton />
                <button
                  type="submit"
                  className="rounded-lg bg-[#e6a855] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#070605] hover:bg-[#ffbe6b] active:scale-95 transition-all"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>

          {/* Copy details right */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#e6a855]">
              AI DECISION DELEGATION
            </span>
            <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl text-[#ede6dc] leading-[1.0]">
              Player-Owned AI agents
            </h2>
            <p className="mt-4 text-[#8e8276] text-sm leading-relaxed max-w-xl">
              Don&apos;t want to click manually every turn? Deploy an autonomous playstyle agent. Agents analyze the FEN state, evaluate legal candidates, and suggest strategy picks with transparent scoring profiles.
            </p>
            <div className="mt-6 grid gap-4 max-w-lg">
              <div className="flex items-start gap-3">
                <span className="bg-[#e6a855]/10 border border-[#e6a855]/20 text-[#e6a855] rounded px-1.5 py-0.5 text-[8px] font-mono uppercase mt-0.5">Tactical</span>
                <p className="text-xs text-[#8e8276] leading-relaxed">
                  Evaluates capture opportunities, material differences, and positioning bonuses on every half-move.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-[#e6a855]/10 border border-[#e6a855]/20 text-[#e6a855] rounded px-1.5 py-0.5 text-[8px] font-mono uppercase mt-0.5">Custom</span>
                <p className="text-xs text-[#8e8276] leading-relaxed">
                  Provide custom instructions to guide your agent&apos;s personality. Combine with Grok API settings for rich commentary reasoning.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <Link href="/agents/leaderboard" className="font-mono text-xs font-bold text-[#e6a855] hover:underline flex items-center gap-1">
                Browse Agent Rankings &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Match Discovery Lobby list */}
      <section className="border-t border-[#26211e] bg-[#0d0b0a] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#e6a855]">
                ARENA REGISTRY
              </span>
              <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl text-[#ede6dc]">
                Live Matches
              </h2>
            </div>
            <Link
              href="/matches"
              className="rounded-xl border border-[#26211e] bg-[#141210] px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#ede6dc] hover:bg-[#26211e] transition-colors"
            >
              Browse All Matches
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {matchesLoading && (
              <div className="col-span-full rounded-xl border border-[#26211e]/60 bg-[#141210] p-12 text-xs font-mono text-[#8e8276] text-center uppercase tracking-widest">
                FETCHING LIVE ARENA STATES…
              </div>
            )}

            {!matchesLoading && matches.map((match) => {
              const statusColor = match.status === 'ACTIVE' 
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                : 'bg-[#26211e]/40 border-[#26211e]/80 text-[#8e8276]';

              return (
                <article key={match.gameId} className="rounded-xl border border-[#26211e] bg-[#141210] p-5 flex flex-col justify-between hover:border-[#e6a855]/40 transition-colors duration-200">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`rounded px-2 py-0.5 text-[8px] font-mono font-bold uppercase border ${statusColor}`}>
                        {match.status}
                      </span>
                      <span className="text-[10px] font-mono text-[#8e8276]">Turn {match.turnNumber}</span>
                    </div>
                    <h3 className="text-base font-bold truncate text-[#ede6dc] uppercase tracking-tight">{match.title}</h3>
                    <p className="text-xs text-[#8e8276] truncate mt-1">Hosted by {match.host}</p>
                    {match.creatorFeeBps ? (
                      <p className="text-[9px] font-mono text-[#e6a855] mt-2">CREATOR SHARE: {(match.creatorFeeBps / 100).toFixed(1)}%</p>
                    ) : null}
                  </div>

                  <div className="mt-6 border-t border-[#26211e] pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-[9px] text-[#8e8276] uppercase">Prize Pool</span>
                      <span className="font-mono text-xs font-extrabold text-[#e6a855]">{formatEth(match.totalPoolWei)}</span>
                    </div>
                    <Link
                      href={`/arena/${match.gameId}`}
                      className="block w-full rounded-lg bg-[#e6a855]/10 border border-[#e6a855]/25 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-[#ede6dc] hover:bg-[#e6a855]/20 transition-all active:scale-98"
                    >
                      Join Arena
                    </Link>
                  </div>
                </article>
              );
            })}

            {!matchesLoading && matches.length === 0 && (
              <div className="col-span-full rounded-xl border border-[#26211e] bg-[#141210] p-12 text-center text-xs font-mono text-[#8e8276]">
                NO ACTIVE ARENAS FOUND. INITIALIZE A MATCH ABOVE.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer disclaimers compliance */}
      <footer className="border-t border-[#26211e] py-12 px-6 bg-[#070605] text-center text-[10px] font-mono text-[#8e8276] leading-relaxed">
        <p className="max-w-4xl mx-auto">
          PawnPool &copy; {new Date().getFullYear()} - Play-money / EVM testnet demonstration. All payouts are mock settlements. Native rewards require regional legal review. Compliance with local gaming policies must be validated by match organizers.
        </p>
      </footer>
    </main>
  );
}
