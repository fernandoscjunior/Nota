'use client';

/**
 * @file ExportModal.tsx
 * @description Dedicated, animated dialog for audio and project file exports.
 * Features 16-bit PCM WAV rendering and portable .nota file backup.
 */

import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileCode, Loader2, Check } from 'lucide-react';
import { renderProjectToWav, triggerFileDownload, exportProjectToJson } from '@/lib/audio/export';
import { AudioEngine } from '@/lib/audio/engine';
import type { ProjectData } from '@/lib/audio/types';

interface ExportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onProjectImported: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onProjectImported,
}) => {
  const [isRenderingWav, setIsRenderingWav] = useState(false);
  const [loopCount, setLoopCount] = useState<number>(2);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportWav = async () => {
    setIsRenderingWav(true);
    try {
      const engine = AudioEngine.getInstance();
      const project = engine.exportProjectData();
      const wavBlob = await renderProjectToWav(project, loopCount);
      const filename = `nota-${project.bpm}bpm.wav`;
      triggerFileDownload(wavBlob, filename);
    } catch (error) {
      console.error('[Nota Export] Failed to render WAV:', error);
    } finally {
      setIsRenderingWav(false);
    }
  };

  const handleExportJson = () => {
    const engine = AudioEngine.getInstance();
    const project = engine.exportProjectData();
    exportProjectToJson(project);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: unknown = JSON.parse(text);

        if (parsed && typeof parsed === 'object' && 'tracks' in parsed) {
          const project = parsed as ProjectData;
          AudioEngine.getInstance().loadProjectData(project, true, true);
          onProjectImported();
          setImportStatus('Project loaded');
          setTimeout(() => setImportStatus(null), 2500);
        } else {
          setImportStatus('Invalid file format');
        }
      } catch {
        setImportStatus('Failed to load file');
      }
    };
    reader.readAsText(file);
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight font-sans">Export & Download</h2>
            <p className="text-[11px] text-zinc-500">Lossless audio bounce & project backup</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Export Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Studio WAV</div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <span className="text-[10px] text-zinc-400 mr-1">Loop:</span>
              {[1, 2, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setLoopCount(count)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    loopCount === count
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {count}x
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExportWav}
            disabled={isRenderingWav}
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-medium font-sans flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isRenderingWav ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Rendering 16-bit WAV...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Download Studio WAV (16-bit)
              </>
            )}
          </button>
        </div>

        {/* Project File Section */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Project File</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJson}
              className="py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-xs font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-zinc-400" />
              Save .nota
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-xs font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              Open .nota
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".nota,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className="p-2 bg-emerald-500/10 text-emerald-500 text-xs font-mono rounded-lg flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {importStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
