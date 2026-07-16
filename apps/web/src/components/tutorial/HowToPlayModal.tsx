"use client";

import { useEffect, useState } from 'react';

const TUTORIAL_SEEN_KEY = 'chessstake_tutorial_seen';

type TutorialStep = {
  target: string;
  title: string;
  body: string;
  action: string;
};

const STEPS: TutorialStep[] = [
  {
    target: 'board',
    title: 'This is the live board',
    body: 'You do not drag pieces manually. The board updates after voting and AI resolution.',
    action: 'Watch this area to follow the match position.',
  },
  {
    target: 'team-selector',
    title: 'Start here: choose a team',
    body: 'Click WHITE or BLACK first. You can vote only when it is your team turn.',
    action: 'Choose one team before backing a piece.',
  },
  {
    target: 'turn-status',
    title: 'Check whose turn it is',
    body: 'If your team is not moving, your piece buttons stay locked. Wait for your team turn.',
    action: 'Use this status to know when you can vote.',
  },
  {
    target: 'piece-grid',
    title: 'Choose a piece to back',
    body: 'Pick the piece type your team should move. The highest-backed legal piece controls the turn.',
    action: 'Click one active piece card when your team is moving.',
  },
  {
    target: 'piece-grid',
    title: 'Dark cards mean unavailable',
    body: 'A dark card means it is not your turn, or that piece has no legal move right now.',
    action: 'Only active cards can be selected.',
  },
  {
    target: 'agent-panel',
    title: 'Optional: use your agent',
    body: 'Your AI agent can recommend which piece to back. You still confirm before submitting.',
    action: 'Create an agent later or play manually now.',
  },
  {
    target: 'timer',
    title: 'The timer closes voting',
    body: 'When this reaches 0, voting closes and AI resolves the winning piece.',
    action: 'Submit before the timer ends.',
  },
  {
    target: 'reward-pool',
    title: 'This is the reward pool',
    body: 'It shows how much support each team has. MVP mode may use demo accounting.',
    action: 'Use it to understand match momentum.',
  },
  {
    target: 'move-history',
    title: 'Moves appear here',
    body: 'After AI moves, the move history records what happened each turn.',
    action: 'Check this to follow the match.',
  },
];

type HowToPlayModalProps = {
  open: boolean;
  onClose: () => void;
};

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOOLTIP_WIDTH = 390;
const TOOLTIP_HEIGHT = 360;
const GAP = 18;
const EDGE = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getVisibleTutorialTarget(targetName: string) {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(`[data-tutorial="${targetName}"]`));
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return targets
    .map((target) => {
      const rect = target.getBoundingClientRect();
      const style = window.getComputedStyle(target);
      const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const visibleArea = Math.max(0, visibleWidth) * Math.max(0, visibleHeight);

      return { target, rect, visibleArea, style };
    })
    .filter(({ rect, visibleArea, style }) => {
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        visibleArea > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) !== 0
      );
    })
    .sort((a, b) => b.visibleArea - a.visibleArea)[0]?.target ?? null;
}

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
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const updateTargetRect = () => {
    const target = getVisibleTutorialTarget(current.target);
    if (!target) {
      setTargetRect(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  };

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setIsMobile(window.innerWidth < 768);
    trackTutorial('guided_tutorial_opened');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = getVisibleTutorialTarget(current.target);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const timers = [80, 300, 650].map((delay) => window.setTimeout(updateTargetRect, delay));
    trackTutorial('guided_tutorial_step_viewed', { step: step + 1, target: current.target, title: current.title });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [open, step, current.target, current.title]);

  useEffect(() => {
    if (!open) return;
    const onUpdate = () => {
      setIsMobile(window.innerWidth < 768);
      updateTargetRect();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleSkip();
    };
    window.addEventListener('scroll', onUpdate, true);
    window.addEventListener('resize', onUpdate);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onUpdate, true);
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, current.target, step]);

  if (!open) return null;

  const finish = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('guided_tutorial_completed');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('guided_tutorial_skipped', { step: step + 1, target: current.target });
    onClose();
  };

  const highlightStyle = targetRect
    ? {
        top: Math.max(EDGE, targetRect.top - 8),
        left: Math.max(EDGE, targetRect.left - 8),
        width: Math.min(window.innerWidth - EDGE * 2, targetRect.width + 16),
        height: Math.min(window.innerHeight - EDGE * 2, targetRect.height + 16),
      }
    : undefined;

  const getTooltipStyle = () => {
    if (!targetRect) return undefined;

    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - EDGE;
    const maxTop = window.innerHeight - TOOLTIP_HEIGHT - EDGE;
    const rightSpace = window.innerWidth - targetRect.left - targetRect.width;
    const leftSpace = targetRect.left;
    const bottomSpace = window.innerHeight - targetRect.top - targetRect.height;
    const topSpace = targetRect.top;
    const centeredLeft = clamp(targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2, EDGE, maxLeft);

    if (isMobile) {
      const preferBottom = targetRect.top + targetRect.height / 2 < window.innerHeight / 2;
      const maxMobileTop = Math.max(EDGE, window.innerHeight - 300);
      return preferBottom
        ? {
            top: clamp(targetRect.top + targetRect.height + GAP, EDGE, maxMobileTop),
            left: EDGE,
            right: EDGE,
          }
        : {
            bottom: clamp(window.innerHeight - targetRect.top + GAP, EDGE, maxMobileTop),
            left: EDGE,
            right: EDGE,
          };
    }

    if (rightSpace >= TOOLTIP_WIDTH + GAP) {
      return {
        top: clamp(targetRect.top + targetRect.height / 2 - TOOLTIP_HEIGHT / 2, EDGE, maxTop),
        left: targetRect.left + targetRect.width + GAP,
      };
    }

    if (leftSpace >= TOOLTIP_WIDTH + GAP) {
      return {
        top: clamp(targetRect.top + targetRect.height / 2 - TOOLTIP_HEIGHT / 2, EDGE, maxTop),
        left: targetRect.left - TOOLTIP_WIDTH - GAP,
      };
    }

    if (bottomSpace >= 260 || bottomSpace >= topSpace) {
      return {
        top: clamp(targetRect.top + targetRect.height + GAP, EDGE, maxTop),
        left: centeredLeft,
      };
    }

    return {
      top: clamp(targetRect.top - TOOLTIP_HEIGHT - GAP, EDGE, maxTop),
      left: centeredLeft,
    };
  };

  const tooltipStyle = getTooltipStyle();

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Guided tutorial">
      <div className="absolute inset-0 bg-black/72" />

      {highlightStyle && (
        <div
          className="fixed z-[60] rounded-2xl ring-2 ring-[#d6a15f] shadow-[0_0_42px_rgba(214,161,95,0.55)] pointer-events-none"
          style={highlightStyle}
        />
      )}

      <div
        className={`fixed z-[70] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-[#b58863]/30 bg-[#211713] p-4 text-[#f3dfbf] shadow-2xl ${isMobile ? '' : 'w-[390px]'}`}
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b58863]">Step {step + 1} of {STEPS.length}</p>
            <h2 className="mt-1 text-xl font-black">{current.title}</h2>
          </div>
          <button type="button" onClick={handleSkip} className="rounded-lg border border-[#b58863]/30 px-3 py-1.5 text-xs font-bold text-[#f3dfbf]/70 hover:text-[#f3dfbf]">
            Skip
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#f3dfbf]/70">{current.body}</p>
        <div className="mt-3 rounded-xl bg-[#120d0a] p-3 text-xs font-semibold text-[#d6a15f]">{current.action}</div>

        <div className="mt-4 flex gap-1.5">
          {STEPS.map((item, index) => (
            <div key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[#d6a15f]' : 'bg-[#120d0a]'}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl border border-[#d6a15f]/30 px-4 py-2 text-sm font-black text-[#f3dfbf] disabled:cursor-not-allowed disabled:opacity-30">
            Back
          </button>
          <div className="flex gap-2">
            <a href="/how-to-play" className="rounded-xl border border-[#d6a15f]/30 px-4 py-2 text-center text-sm font-black text-[#f3dfbf]">Guide</a>
            <button type="button" onClick={isLast ? finish : () => setStep(step + 1)} className="rounded-xl bg-[#d6a15f] px-4 py-2 text-sm font-black text-[#120d0a]">
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
