'use client';

/**
 * @file ChannelStrip.tsx
 * @description Tactile channel strip card for the left Channel Rack.
 * Inspired by Soundtrap & FL Studio with Apple-grade typography and micro-interactions.
 */

import React from 'react';
import {
  Activity,
  Waves,
  Layers,
  Sparkles,
  Zap,
  Flame,
  Radio,
  Wind,
  Disc,
  Music,
  Trash2,
  VolumeX,
} from 'lucide-react';
import { RotaryKnob } from '@/components/ui/RotaryKnob';
import type { Track } from '@/lib/audio/types';

interface ChannelStripProps {
  readonly track: Track;
  readonly isActive: boolean;
  readonly canDelete: boolean;
  readonly onSelect: (trackId: string) => void;
  readonly onToggleMute: (trackId: string) => void;
  readonly onVolumeChange: (trackId: string, volume: number) => void;
  readonly onRemove: (trackId: string) => void;
}

// Map string icon names to Lucide icons
function renderChannelIcon(iconName?: string, kind?: string, category?: string) {
  const props = { className: 'w-4 h-4' };

  if (iconName === 'Drum' || kind === 'drums' || category === 'drums') {
    return <Disc {...props} />;
  }
  if (iconName === 'Activity' || category === 'lead') {
    return <Activity {...props} />;
  }
  if (iconName === 'Waves' || category === 'bass') {
    return <Waves {...props} />;
  }
  if (iconName === 'Layers' || category === 'chords') {
    return <Layers {...props} />;
  }
  if (iconName === 'Sparkles') return <Sparkles {...props} />;
  if (iconName === 'Zap') return <Zap {...props} />;
  if (iconName === 'Flame') return <Flame {...props} />;
  if (iconName === 'Radio') return <Radio {...props} />;
  if (iconName === 'Wind') return <Wind {...props} />;
  if (iconName === 'Music' || category === 'keys') return <Music {...props} />;

  return <Music {...props} />;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({
  track,
  isActive,
  canDelete,
  onSelect,
  onToggleMute,
  onVolumeChange,
  onRemove,
}) => {
  return (
    <div
      onClick={() => onSelect(track.id)}
      className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? 'bg-amber-50/50 dark:bg-amber-500/10 border-amber-500/60 shadow-xs'
          : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
      } ${track.muted ? 'opacity-60' : ''}`}
    >
      {/* Left: Icon Badge & Channel Details */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        {/* Instrument Icon Badge */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isActive
              ? 'bg-amber-500 text-zinc-950 font-bold'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
          }`}
        >
          {renderChannelIcon(track.iconName, track.kind, track.category)}
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-medium font-sans truncate ${
                isActive
                  ? 'text-zinc-950 dark:text-zinc-50 font-semibold'
                  : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {track.name}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            <span>{track.category || track.kind}</span>
            {track.notes.length > 0 && (
              <>
                <span>•</span>
                <span>{track.notes.length} notes</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Tactile Rotary Volume & Mute Controls */}
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()} // Keep knob/mute clicks from triggering row selection
      >
        {/* Individual Rotary Volume Dial */}
        <RotaryKnob
          value={track.volume}
          onChange={(newVol) => onVolumeChange(track.id, newVol)}
          size={26}
          label="Vol"
        />

        {/* Mute Button (M) */}
        <button
          onClick={() => onToggleMute(track.id)}
          className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
            track.muted
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          title={track.muted ? 'Unmute Track' : 'Mute Track'}
        >
          {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : 'M'}
        </button>

        {/* Delete Track Button (Reveals on hover) */}
        {canDelete && (
          <button
            onClick={() => onRemove(track.id)}
            className="w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
            title="Remove Instrument"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
