'use client';

/**
 * @file SettingsModal.tsx
 * @description Sleek, animated settings dialog for appearance and persistence preferences.
 * Includes toggling of the browser auto-save engine.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Save,
  Check,
} from 'lucide-react';
import { AudioEngine } from '@/lib/audio/engine';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onProjectImported: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nota_theme') as ThemeMode) || 'system';
    }
    return 'system';
  });

  const [autoSave, setAutoSave] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nota_autosave') !== 'false';
    }
    return true;
  });

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const selectTheme = useCallback((selectedTheme: ThemeMode) => {
    setTheme(selectedTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nota_theme', selectedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDom = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateDom();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateDom);
    return () => mediaQuery.removeEventListener('change', updateDom);
  }, [theme]);

  const handleToggleAutoSave = () => {
    const nextState = !autoSave;
    setAutoSave(nextState);
    AudioEngine.getInstance().setAutoSaveEnabled(nextState);
  };

  const handleManualSave = () => {
    AudioEngine.getInstance().manualSave();
    setSaveFeedback('Project saved to browser');
    setTimeout(() => setSaveFeedback(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 space-y-4 text-zinc-900 dark:text-zinc-100 transition-all duration-200 ease-out animate-in fade-in zoom-in-95 slide-in-from-bottom-2"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight font-sans">Settings</h2>
            <p className="text-[11px] text-zinc-500">Appearance and persistence preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Appearance */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Appearance</div>
          <div className="grid grid-cols-3 gap-1.5 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
            <button
              onClick={() => selectTheme('system')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Auto
            </button>

            <button
              onClick={() => selectTheme('light')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>

            <button
              onClick={() => selectTheme('dark')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>

        {/* Section 2: Persistence & Auto-Save */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Browser Storage</div>
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
            <div>
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Automatic Saving</div>
              <div className="text-[11px] text-zinc-500">Persist patterns automatically on change</div>
            </div>

            <button
              onClick={handleToggleAutoSave}
              className={`w-10 h-5.5 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                autoSave ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
              title={autoSave ? 'Auto-save enabled' : 'Auto-save disabled'}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                  autoSave ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {!autoSave && (
            <button
              onClick={handleManualSave}
              className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-xs font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-zinc-400" />
              Save Project Now
            </button>
          )}

          {saveFeedback && (
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono rounded-lg flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {saveFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
