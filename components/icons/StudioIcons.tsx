import React from 'react';

/**
 * @file StudioIcons.tsx
 * @description Minimalist, high-craft monochrome SVG icons for tempo and volume analogies.
 * Pure vector geometries following Apple / Dieter Rams industrial design standards.
 */

interface IconProps extends React.SVGProps<SVGSVGElement> {
  readonly size?: number;
  readonly className?: string;
}

/**
 * Minimalist Turtle (Slow / Lento tempo indicator)
 */
export const TurtleIcon: React.FC<IconProps> = ({ size = 16, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Shell */}
    <path d="M6 14a6 6 0 0 1 12 0Z" />
    <path d="M9 14a3 3 0 0 1 6 0" />
    {/* Head */}
    <path d="M18 13.5c1.5 0 2.5-.5 3-1.5-.5-1-1.5-1.5-2.5-1" />
    {/* Feet & Tail */}
    <path d="M6.5 14.5c-.8.8-1.5 1.5-2.5 1" />
    <path d="M7 16v1.5a1 1 0 0 0 1 1h1" />
    <path d="M15 16v1.5a1 1 0 0 0 1 1h1" />
  </svg>
);

/**
 * Minimalist Hare / Rabbit (Fast / Presto tempo indicator)
 */
export const RabbitIcon: React.FC<IconProps> = ({ size = 16, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Ears */}
    <path d="M13 3c-.5 2 0 4.5 1.5 6.5" />
    <path d="M16 2.5c0 2.5-.5 5 1 7" />
    {/* Body / Leaping silhouette */}
    <path d="M8 18c-2.5 0-4-1.5-4-3.5 0-3 3-5.5 7-6 1.5-.2 3.5.5 4.5 1.5 1.5 1.5 2.5 4 1.5 6.5" />
    <path d="M6 18c2 0 4 1 7 1 3 0 4-1 6-2" />
    {/* Tail */}
    <circle cx="3.5" cy="14.5" r="1.25" />
  </svg>
);

/**
 * Minimalist Feather (Whisper-soft audio level indicator)
 */
export const FeatherIcon: React.FC<IconProps> = ({ size = 16, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M20.24 3.76a6 6 0 0 0-8.48 0L3 12.55v4.24h4.24l8.76-8.76a6 6 0 0 0 0-8.48z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </svg>
);

/**
 * Minimalist Acoustic Resonance Bell (Loud / Resonant audio level indicator)
 */
export const BellIcon: React.FC<IconProps> = ({ size = 16, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    {/* Subtle sonic waves */}
    <path d="M21 5a4 4 0 0 1 0 6" strokeWidth="1.25" opacity="0.6" />
    <path d="M3 5a4 4 0 0 0 0 6" strokeWidth="1.25" opacity="0.6" />
  </svg>
);
