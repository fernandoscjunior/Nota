'use client';

/**
 * @file BrandIntro.tsx
 * @description Pixar-style letter bounce animation ('n', 'o', 't', 'a') in crisp light mode,
 * followed by a 3-note harmonic bliss chime before dissolving into the studio.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { playBrandChime } from '@/lib/audio/chime';

interface BrandIntroProps {
  readonly onComplete: () => void;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'bouncing' | 'ready' | 'dissolving'>('bouncing');

  const handleEnter = useCallback(async () => {
    if (stage === 'dissolving') return;
    setStage('dissolving');

    try {
      await playBrandChime();
    } catch {
      // Ignore audio policy errors
    }

    setTimeout(() => {
      onComplete();
    }, 500);
  }, [stage, onComplete]);

  useEffect(() => {
    // Stage 1: Letters bounce for 1.2s, then transition to ready state
    const timer = setTimeout(() => {
      setStage('ready');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={handleEnter}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 text-zinc-900 cursor-pointer select-none transition-all duration-600 ease-out ${
        stage === 'dissolving' ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex items-center gap-1.5 font-sans font-extrabold tracking-tighter text-6xl sm:text-7xl">
        <span
          className="inline-block animate-bounce text-zinc-900"
          style={{ animationDuration: '0.8s', animationDelay: '0.0s' }}
        >
          n
        </span>
        <span
          className="inline-block animate-bounce text-zinc-900"
          style={{ animationDuration: '0.8s', animationDelay: '0.12s' }}
        >
          o
        </span>
        <span
          className="inline-block animate-bounce text-amber-500"
          style={{ animationDuration: '0.8s', animationDelay: '0.24s' }}
        >
          t
        </span>
        <span
          className="inline-block animate-bounce text-zinc-900"
          style={{ animationDuration: '0.8s', animationDelay: '0.36s' }}
        >
          a
        </span>
      </div>

      {/* Minimalist Click Indicator */}
      <div
        className={`mt-8 flex items-center gap-2 text-xs font-mono tracking-widest text-zinc-400 transition-all duration-500 ${
          stage === 'ready' ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>tap to enter</span>
      </div>
    </div>
  );
};
