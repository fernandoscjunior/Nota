'use client';

/**
 * @file AddInstrumentModal.tsx
 * @description Apple-inspired animated modal for browsing and adding instruments.
 * Categorized sound library with instant audio auditions and one-click rack addition.
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  Plus,
  Disc,
  Activity,
  Waves,
  Layers,
  Sparkles,
  Zap,
  Flame,
  Radio,
  Wind,
  Music,
} from 'lucide-react';
import { INSTRUMENT_PRESETS, type InstrumentPreset } from '@/lib/audio/presets';
import { AudioEngine } from '@/lib/audio/engine';
import type { InstrumentCategory } from '@/lib/audio/types';

interface AddInstrumentModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelectPreset: (presetId: string) => void;
}

type FilterCategory = 'all' | InstrumentCategory;

const CATEGORY_TABS: { readonly id: FilterCategory; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'drums', label: 'Drums' },
  { id: 'lead', label: 'Leads' },
  { id: 'bass', label: 'Basses' },
  { id: 'chords', label: 'Chords' },
  { id: 'keys', label: 'Keys' },
  { id: 'acoustic', label: 'Acoustic' },
];

function renderPresetIcon(iconName: string) {
  const props = { className: 'w-4 h-4' };
  switch (iconName) {
    case 'Drum':
    case 'Disc':
      return <Disc {...props} />;
    case 'Activity':
      return <Activity {...props} />;
    case 'Waves':
      return <Waves {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'Radio':
      return <Radio {...props} />;
    case 'Wind':
      return <Wind {...props} />;
    case 'Music':
    case 'Piano':
    case 'Guitar':
    default:
      return <Music {...props} />;
  }
}

export const AddInstrumentModal: React.FC<AddInstrumentModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPresets = INSTRUMENT_PRESETS.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  const handlePreview = async (preset: InstrumentPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewingId(preset.id);
    try {
      await AudioEngine.getInstance().previewPreset(preset);
    } catch (err) {
      console.error('[AudioEngine] Preview failed:', err);
    } finally {
      setTimeout(() => setPreviewingId(null), 400);
    }
  };

  const handleAdd = (presetId: string) => {
    onSelectPreset(presetId);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 text-zinc-900 dark:text-zinc-100 transition-all duration-200 ease-out animate-in fade-in zoom-in-95 slide-in-from-bottom-2 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold tracking-tight font-sans">Add Instrument</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Choose a sound engine preset to add a new lane to your channel rack
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Presets List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1">
          {filteredPresets.map((preset) => {
            const isPreviewing = previewingId === preset.id;

            return (
              <div
                key={preset.id}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                        {renderPresetIcon(preset.iconName)}
                      </div>
                      <span className="text-xs font-semibold font-sans text-zinc-900 dark:text-zinc-100">
                        {preset.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                      {preset.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2 line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    onClick={(e) => handlePreview(preset, e)}
                    className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      isPreviewing
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                    }`}
                    title="Audition Sound"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Preview
                  </button>

                  <button
                    onClick={() => handleAdd(preset.id)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all cursor-pointer font-sans shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
