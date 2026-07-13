"use client";

import React from 'react';
import LiveChessBoard from './LiveChessBoard';
import GameStatusPanel from './GameStatusPanel';
import RewardPoolPanel from './RewardPoolPanel';
import MoveHistoryPanel from './MoveHistoryPanel';
import AiThinkingPanel from './AiThinkingPanel';
import VotingTimer from '../voting/VotingTimer';
import VotingPanel from '../voting/VotingPanel';
import WalletConnectButton from '../layout/WalletConnectButton';
import { useArenaSocket } from '../../hooks/useArenaSocket';
import ShareArenaButton from '../share/ShareArenaButton';
import { useArenaStore } from '../../stores/arena-store';

export const ArenaPage: React.FC = () => {
  useArenaSocket();
  const { spectatorCount, activeGameId, title, description, creatorName, creatorFeeBps } = useArenaStore();

  return (
    <div className="min-h-screen bg-[#1e1713] text-[#eedcbf] flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#110d0a] border-b border-[#b58863]/20 py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <div className="bg-[#b58863] text-[#110d0a] font-extrabold px-3 py-1.5 rounded-lg text-lg uppercase tracking-wider font-mono">
            ChessStake
          </div>
          <span className="text-xs uppercase tracking-wider font-bold opacity-40 ml-2 hidden sm:inline">
            Interactive AI Chess Arena
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs bg-[#b58863]/10 border border-[#b58863]/30 px-3 py-1.5 rounded-lg font-bold text-[#b58863] hidden md:inline-block">
            {spectatorCount} watching
          </div>
          <WalletConnectButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Board + Status (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-4 w-full">
          <section className="w-full rounded-xl border border-[#b58863]/25 bg-[#2d241e] p-5 shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">Live Creator Arena</p>
                <h1 className="mt-1 text-2xl font-black text-[#eedcbf]">{title || 'AI Boss Battle'}</h1>
                <p className="mt-1 text-sm text-[#eedcbf]/60">
                  Hosted by {creatorName || 'ChessStake'}. {description || 'Back a side, vote strategy, and follow every AI-resolved move.'}
                </p>
                {creatorFeeBps > 0 && (
                  <p className="mt-2 text-xs font-bold text-[#d6a15f]">Creator share target: {(creatorFeeBps / 100).toFixed(1)}%</p>
                )}
              </div>
              <ShareArenaButton gameId={activeGameId} />
            </div>
          </section>
          <GameStatusPanel />

          <div className="relative w-full flex justify-center">
            <LiveChessBoard />
            <AiThinkingPanel />
          </div>

          <MoveHistoryPanel />
        </div>

        {/* Right Column: Betting + Timer (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4 w-full">
          <VotingTimer />
          
          <RewardPoolPanel />

          <VotingPanel />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-[#110d0a] border-t border-[#b58863]/10 py-4 px-6 text-center text-xs text-[#eedcbf]/40">
        ChessStake &copy; {new Date().getFullYear()} - Interactive AI chess arenas for creators and communities.
      </footer>
    </div>
  );
};
export default ArenaPage;
