"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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

  // Live Simulator Loop State
  const [simStep, setSimStep] = useState<'IDLE' | 'VOTING' | 'THINKING' | 'RESOLVING' | 'MOVED'>('IDLE');
  const [simTally, setSimTally] = useState({ PAWN: 25, KNIGHT: 65, BISHOP: 10 });
  const [simMoveIndex, setSimMoveIndex] = useState(0); // 0 = start, 1 = Knight moved
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
          setSimLog((prev) => [...prev.slice(-4), 'White team voting opened. BACK dynamic strategies.']);
        }, 2500);
      } else if (simStep === 'VOTING') {
        let count = 0;
        const interval = setInterval(() => {
          setSimTally((prev) => {
            const addedPawn = Math.floor(Math.random() * 12);
            const addedKnight = Math.floor(Math.random() * 25);
            return {
              PAWN: prev.PAWN + addedPawn,
              KNIGHT: prev.KNIGHT + addedKnight,
              BISHOP: prev.BISHOP,
            };
          });
          count++;
          if (count >= 4) {
            clearInterval(interval);
            setSimStep('THINKING');
            setSimLog((prev) => [...prev.slice(-4), 'Voting closed. Winning strategy: KNIGHT. AI tactical resolver resolving…']);
          }
        }, 700);
      } else if (simStep === 'THINKING') {
        timer = setTimeout(() => {
          setSimStep('RESOLVING');
          setSimLog((prev) => [...prev.slice(-4), 'Selected move: Nb1-c3. Simulating FEN transitions…']);
        }, 1800);
      } else if (simStep === 'RESOLVING') {
        timer = setTimeout(() => {
          setSimMoveIndex(1); // Knight moves to c3
          setSimStep('MOVED');
          setSimLog((prev) => [...prev.slice(-4), 'Move confirmed by resolver. Knight deployed to c3.']);
        }, 1200);
      } else if (simStep === 'MOVED') {
        timer = setTimeout(() => {
          setSimMoveIndex(0);
          setSimTally({ PAWN: 25, KNIGHT: 65, BISHOP: 10 });
          setSimStep('IDLE');
          setSimLog(['Resetting simulator state. Match restarted.']);
        }, 4000);
      }
    };

    runSimulator();
    return () => {
      clearTimeout(timer);
    };
  }, [simStep]);

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
      <header className="sticky top-0 z-40 w-full border-b border-[#26211e]/60 bg-[#070605]/80 backdrop-blur-md px-4 py-3 md:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group outline-none">
              <span className="bg-gradient-to-r from-[#e6a855] to-[#c7883a] text-[#070605] font-extrabold px-3 py-1 rounded-md text-sm uppercase tracking-widest font-mono transition-transform group-hover:scale-105">
                PawnPool
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono font-bold text-[#8e8276] hidden md:inline transition-colors group-hover:text-[#ede6dc]">
                Tactical Chess Arena
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-bold text-[#8e8276]">
              <Link href="/matches" className="hover:text-[#ede6dc] transition-colors">Matches</Link>
              <Link href="/agents" className="hover:text-[#ede6dc] transition-colors">Agents</Link>
              <Link href="/how-to-play" className="hover:text-[#ede6dc] transition-colors">Rules</Link>
              <Link href="/leaderboard" className="hover:text-[#ede6dc] transition-colors">Rankings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <section id="main-content" className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#151311_1px,transparent_1px),linear-gradient(to_bottom,#151311_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            
            {/* Hero Left: Editorial style layout */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e6a855] animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#8e8276] uppercase">
                  Audience-Driven Strategy Engine
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-[#ede6dc] uppercase text-wrap-balance leading-[0.9]">
                Crowd Controlled Chess <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e6a855] to-[#c7883a]">Verifiable Rewards</span>
              </h1>
              
              <p className="mt-8 text-[#8e8276] text-base leading-relaxed md:text-lg max-w-xl">
                Host community-led chess arenas. Spectators pick a side, back dynamic turn-by-turn strategies with native tokens or points, and watch local AI resolvers enforce deterministic outcomes.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
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
              <div className="mt-16 grid grid-cols-3 gap-6 border-t border-[#26211e] pt-10">
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

            {/* Hero Right: Premium Tactical Terminal Board (Visual Signature) */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl border border-[#26211e] bg-[#141210] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Glowing subtle ambient amber aura */}
                <div className="absolute top-0 right-0 h-48 w-48 bg-[#e6a855]/5 rounded-full filter blur-[80px] pointer-events-none" />

                {/* Simulated game state bar */}
                <div className="flex items-center justify-between border-b border-[#26211e] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e6a855] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e6a855]"></span>
                    </span>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#8e8276]">
                      LIVE CONSOLE SIMULATION
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[#e6a855] uppercase tracking-widest px-2 py-0.5 rounded border border-[#e6a855]/20 bg-[#e6a855]/5">
                    STAGE: {simStep}
                  </span>
                </div>

                {/* The Chessboard Grid */}
                <div className="flex justify-center mb-6">
                  <div className="relative p-2 rounded-xl bg-[#0d0b0a] border border-[#26211e]">
                    
                    {/* File labels (A-D) */}
                    <div className="flex justify-between px-3 text-[8px] font-mono text-[#8e8276] mb-1">
                      <span>a</span>
                      <span>b</span>
                      <span>c</span>
                      <span>d</span>
                    </div>

                    <div className="flex gap-1">
                      {/* Rank labels (4-1) */}
                      <div className="flex flex-col justify-between text-[8px] font-mono text-[#8e8276] py-3 pr-1">
                        <span>4</span>
                        <span>3</span>
                        <span>2</span>
                        <span>1</span>
                      </div>

                      {/* 4x4 Grid Board */}
                      <div className="grid grid-cols-4 grid-rows-4 gap-1 w-[260px] h-[260px] bg-[#070605] rounded overflow-hidden">
                        {Array.from({ length: 16 }).map((_, i) => {
                          const row = Math.floor(i / 4);
                          const col = i % 4;
                          const isDark = (row + col) % 2 === 1;
                          
                          // Track simulated coordinates
                          // Knight starts on b1 (row 3, col 1 in our 4x4 grid representation)
                          const showKnightStart = simMoveIndex === 0 && row === 3 && col === 1;
                          // Knight moves to c3 (row 2, col 2)
                          const showKnightEnd = simMoveIndex === 1 && row === 2 && col === 2;
                          // Show path highlighting when thinking/resolving
                          const isHighlighted = (simStep === 'THINKING' || simStep === 'RESOLVING') && 
                            ((row === 3 && col === 1) || (row === 2 && col === 2));

                          return (
                            <div
                              key={i}
                              className={`relative flex items-center justify-center transition-colors duration-300 ${
                                isDark ? 'bg-[#181513]' : 'bg-[#292420]'
                              } ${isHighlighted ? 'ring-1 ring-[#e6a855]/40 bg-[#e6a855]/5' : ''}`}
                            >
                              {showKnightStart && (
                                <div className="absolute inset-0 flex items-center justify-center p-2 text-[#e6a855] animate-pulse">
                                  <KnightIcon className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(230,168,85,0.4)]" />
                                </div>
                              )}
                              {showKnightEnd && (
                                <div className="absolute inset-0 flex items-center justify-center p-2 text-[#e6a855] scale-110">
                                  <KnightIcon className="h-full w-full object-contain filter drop-shadow-[0_0_12px_rgba(230,168,85,0.6)]" />
                                </div>
                              )}
                              
                              {/* Square coord indicator in corner */}
                              <span className="absolute bottom-1 right-1 text-[6px] font-mono text-[#8e8276]/30">
                                {['a','b','c','d'][col]}{4-row}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voting interface simulator */}
                <div className="grid gap-3 border-t border-[#26211e] pt-5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] font-bold text-[#8e8276] uppercase">STRATEGIC VOTE SPECTRUM</span>
                    <span className="font-mono text-[9px] text-[#8e8276]">{simStep === 'VOTING' ? 'VOTES STREAMING' : 'LOCKED'}</span>
                  </div>

                  <div className="grid gap-2.5">
                    {Object.entries(simTally).map(([piece, count]) => {
                      const max = Math.max(...Object.values(simTally));
                      const percent = (count / max) * 100;
                      const isLeading = count === max && simStep !== 'IDLE';

                      return (
                        <div key={piece} className="text-xs">
                          <div className="flex justify-between items-center mb-1 font-mono text-[10px]">
                            <span className="font-bold flex items-center gap-1.5 text-[#ede6dc]">
                              {piece}
                              {isLeading && (
                                <span className="bg-[#e6a855] text-[#070605] text-[7px] px-1 rounded font-black tracking-widest scale-90">
                                  LEADING
                                </span>
                              )}
                            </span>
                            <span className="text-[#8e8276]">{count} votes</span>
                          </div>
                          <div className="h-1 w-full bg-[#070605] rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isLeading ? 'bg-gradient-to-r from-[#e6a855] to-[#c7883a]' : 'bg-[#26211e]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Console Output */}
                <div className="mt-5 rounded-lg bg-[#070605] p-3 font-mono text-[9px] text-[#8e8276] border border-[#26211e]/50 h-[84px] overflow-y-auto">
                  {simLog.map((log, index) => (
                    <div key={index} className="mb-1 leading-normal">
                      <span className="text-[#e6a855]">&gt;&nbsp;</span>{log}
                    </div>
                  ))}
                </div>

              </div>
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
