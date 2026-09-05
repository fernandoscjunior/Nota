'use client';

/**
 * @file AudioVisualizer.tsx
 * @description High-performance 60fps HTML5 Canvas audio oscilloscope & spectrum visualizer.
 * Completely decoupled from React virtual DOM renders to achieve zero-latency fluid animation.
 */

import React, { useEffect, useRef } from 'react';
import { AudioContextManager } from '@/lib/audio/context';

interface AudioVisualizerProps {
  readonly mode?: 'waveform' | 'frequency';
  readonly className?: string;
  readonly strokeColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode = 'waveform',
  className = 'w-full h-24 rounded-lg bg-zinc-900 border border-zinc-800',
  strokeColor = '#f59e0b', // warm amber
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const ctxManager = AudioContextManager.getInstance();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      // Handle Retina / HiDPI crisp scaling
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      if (mode === 'waveform') {
        const timeData = ctxManager.getTimeDomainData();
        if (!timeData) {
          // Draw subtle flat center line when idle
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          return;
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0; // Normalized [0, 2] with 1.0 at center
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
      } else {
        // Frequency bars / curve
        const freqData = ctxManager.getFrequencyData();
        if (!freqData) return;

        const barCount = 48;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(freqData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] / 255;
          const barHeight = val * (height - 8);

          ctx.fillStyle = strokeColor;
          ctx.fillRect(
            i * (barWidth + 2) + 1,
            height - barHeight - 4,
            barWidth,
            barHeight
          );
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, strokeColor]);

  return <canvas ref={canvasRef} className={className} />;
};
