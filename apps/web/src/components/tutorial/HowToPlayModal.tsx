"use client";

import { useEffect, useState } from 'react';

const TUTORIAL_SEEN_KEY = 'chessstake_tutorial_seen';

const STEPS = [
  {
    title: 'Welcome to ChessStake',
    body: 'Join a team, back a piece, and watch the AI make the best legal move for the crowd decision.',
  },
  {
    title: 'Choose White or Black',
    body: 'Pick a team first. You can vote when it is your team\'s turn, and you wait when the other team moves.',
  },
  {
    title: 'Back a Legal Piece',
    body: 'Choose Pawn, Knight, Bishop, Rook, Queen, or King. The highest-backed legal piece controls the turn.',
  },
  {
    title: 'AI Resolves the Move',
    body: 'The AI chooses from legal chess moves only. The board updates automatically when the timer ends.',
  },
  {
    title: 'Optional: Use Your Agent',
    body: 'Create a personal AI agent to recommend what piece to back. You still confirm before submitting.',
  },
];

type HowToPlayModalProps = {
  open: boolean;
  onClose: () => void;
};

function trackTutorial(name: string, payload?: unknown) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, payload }),
  }).catch(() => undefined);
}

export function shouldShowTutorial() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TUTORIAL_SEEN_KEY) !== 'true';
}

export default function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    trackTutorial('tutorial_opened');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    trackTutorial('tutorial_step_viewed', { step: step + 1, title: STEPS[step].title });
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('tutorial_completed');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('tutorial_skipped', { step: step + 1 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-label="How to play ChessStake">
      <div className="w-full max-w-lg rounded-2xl border border-[#b58863]/30 bg-[#211713] p-5 text-[#f3dfbf] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">How to Play</p>
            <h2 className="mt-2 text-2xl font-black">{current.title}</h2>
          </div>
          <button type="button" onClick={handleSkip} className="rounded-lg border border-[#b58863]/30 px-3 py-1.5 text-xs font-bold text-[#f3dfbf]/70 hover:text-[#f3dfbf]">
            Skip
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#f3dfbf]/70">{current.body}</p>

        <div className="mt-5 flex gap-2">
          {STEPS.map((item, index) => (
            <div key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[#d6a15f]' : 'bg-[#120d0a]'}`} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl border border-[#d6a15f]/30 px-4 py-2 text-sm font-black text-[#f3dfbf] disabled:cursor-not-allowed disabled:opacity-30">
            Back
          </button>
          <button type="button" onClick={isLast ? finish : () => setStep(step + 1)} className="rounded-xl bg-[#d6a15f] px-4 py-2 text-sm font-black text-[#120d0a]">
            {isLast ? 'Start Playing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
