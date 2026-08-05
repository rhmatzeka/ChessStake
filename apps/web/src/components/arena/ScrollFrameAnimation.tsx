"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion, useMotionValueEvent } from 'framer-motion';

export const ScrollFrameAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameIndex, setFrameIndex] = useState(1);

  // Memantau scroll container ini
  const { scrollYProgress } = useScroll({
    target: containerRef as any,
    offset: ["start end", "end start"]
  });

  // Map progress scroll (0 ke 1) ke index frame (1 ke 128)
  const rawIndex = useTransform(scrollYProgress, [0, 1], [1, 128]);

  useMotionValueEvent(rawIndex, "change", (latest) => {
    const rounded = Math.max(1, Math.min(128, Math.round(latest)));
    setFrameIndex(rounded);
  });

  // Preload frames in background (browser-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const preloadBatch = async () => {
      // Preload 32 frame pertama secara kritis, sisanya menyusul
      for (let i = 1; i <= 128; i += 2) {
        const img = new Image();
        const pad = String(i).padStart(3, '0');
        img.src = `/assets/framecatur/ezgif-frame-${pad}.jpg`;
      }
    };
    preloadBatch();
  }, []);

  const paddedFrame = String(frameIndex).padStart(3, '0');
  const imageSrc = `/assets/framecatur/ezgif-frame-${paddedFrame}.jpg`;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full max-w-[420px] mx-auto py-8 flex flex-col items-center"
      data-tutorial="scroll-frames"
    >
      <div className="w-full bg-[#141210] border border-[#26211e] rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#e6a855]/5 rounded-full filter blur-[65px] pointer-events-none" />

        <div className="w-full flex items-center justify-between border-b border-[#26211e] pb-3 mb-4 font-mono text-[9px] text-[#8e8276] uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e6a855] animate-pulse" />
            Tactical Scroll Anim
          </span>
          <span>FRAME {paddedFrame} / 128</span>
        </div>

        {/* Frame image display with size constraint to prevent layout shift */}
        <div className="relative w-full aspect-square max-w-[280px] bg-[#070605] border border-[#26211e]/45 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
          <img
            src={imageSrc}
            alt="Tactical board frame sequence"
            className="w-full h-full object-cover transition-opacity duration-100"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="mt-4 w-full flex justify-between items-center text-[8px] font-mono text-[#8e8276]">
          <span>START SCROLL</span>
          <div className="h-0.5 flex-1 mx-3 bg-[#26211e] rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-[#e6a855] transition-all duration-150" 
              style={{ width: `${(frameIndex / 128) * 100}%` }}
            />
          </div>
          <span>END</span>
        </div>
      </div>
    </div>
  );
};
export default ScrollFrameAnimation;
