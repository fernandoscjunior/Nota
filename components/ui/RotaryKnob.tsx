'use client';

/**
 * @file RotaryKnob.tsx
 * @description Tactile rotary micro-dial inspired by Apple / Logic Pro channel strips.
 * Supports vertical drag gestures, fine-tuning with Shift, and keyboard arrow adjustments.
 */

import React, { useRef, useState } from 'react';

interface RotaryKnobProps {
  readonly value: number; // 0.0 to 1.0
  readonly onChange: (value: number) => void;
  readonly size?: number;
  readonly label?: string;
  readonly disabled?: boolean;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  value,
  onChange,
  size = 28,
  label = 'Vol',
  disabled = false,
}) => {
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValRef = useRef(value);
  const [isHovered, setIsHovered] = useState(false);

  // Rotation angles: -135deg to +135deg (270 degree sweep)
  const minAngle = -135;
  const maxAngle = 135;
  const currentAngle = minAngle + value * (maxAngle - minAngle);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || disabled) return;
    const deltaY = startYRef.current - e.clientY;
    const stepScale = e.shiftKey ? 300 : 100; // Fine-tune when holding Shift
    const nextVal = Math.max(0, Math.min(1, startValRef.current + deltaY / stepScale));
    onChange(Number(nextVal.toFixed(2)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe capture release
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(Math.min(1, Number((value + step).toFixed(2))));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(Math.max(0, Number((value - step).toFixed(2))));
    }
  };

  // SVG Arc calculation for visual meter
  const radius = size / 2 - 3;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  // 270 degrees is 75% of circumference
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength * (1 - value);

  return (
    <div
      className={`flex flex-col items-center select-none group ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-ns-resize'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${label}: ${Math.round(value * 100)}% (Drag up/down)`}
    >
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded-full"
        style={{ width: size, height: size }}
      >
        {/* SVG Circular Meter */}
        <svg width={size} height={size} className="transform rotate-[135deg]">
          {/* Background Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            className="text-zinc-200 dark:text-zinc-800"
          />
          {/* Active Value Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-amber-500 transition-all duration-75"
          />
        </svg>

        {/* Center Knob Face */}
        <div
          className="absolute inset-[3.5px] rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/80 shadow-xs flex items-center justify-center transition-transform"
          style={{ transform: `rotate(${currentAngle}deg)` }}
        >
          {/* Indicator Dot */}
          <div className="w-1 h-1 rounded-full bg-amber-500 absolute top-0.5" />
        </div>
      </div>

      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 leading-none">
        {isHovered ? `${Math.round(value * 100)}%` : label}
      </span>
    </div>
  );
};
