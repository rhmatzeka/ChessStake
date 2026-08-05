"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

export const ScrollFrameAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameIndex, setFrameIndex] = useState(1);

  // Memantau scroll window global untuk menghitung index frame di background
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"]
  });

  // Map progress scroll (0 ke 0.35) ke index frame (1 ke 128)
  // 0.35 adalah perkiraan ketika user melewati section Hero pertama
  const rawIndex = useTransform(scrollYProgress, [0, 0.28], [1, 128]);

  // Efek fade out background saat scroll mendekati section kedua
  const opacity = useTransform(scrollYProgress, [0.15, 0.28], [0.85, 0]);

  useMotionValueEvent(rawIndex, "change", (latest) => {
    const rounded = Math.max(1, Math.min(128, Math.round(latest)));
    setFrameIndex(rounded);
  });

  // Preload batch frame
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const preloadBatch = async () => {
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
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
    >
      {/* Background Frame rendering */}
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#070605]"
        style={{ opacity: opacity as any }}
      >
        <img
          src={imageSrc}
          alt="PawnPool tactical background sequence"
          className="w-full h-full object-cover transition-opacity duration-75 select-none pointer-events-none"
          style={{ 
            imageRendering: 'pixelated'
          }}
        />
        {/* Dark overlay to make hero text highly readable */}
        <div className="absolute inset-0 bg-[#070605]/60 mix-blend-multiply" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#26211e_1px,transparent_1px),linear-gradient(to_bottom,#26211e_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-35" 
          style={{ mixBlendMode: 'overlay' }}
        />
      </div>
    </div>
  );
};
export default ScrollFrameAnimation;
