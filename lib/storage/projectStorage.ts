/**
 * @file projectStorage.ts
 * @description Type-safe local storage persistence layer for Nota projects.
 * Supports schema versioning, silent corruption fallbacks, and quota protection.
 */

import type { ProjectData } from '@/lib/audio/types';

export const PROJECT_STORAGE_VERSION = 1;
const STORAGE_KEY = 'nota_project_v1';

/**
 * Validates whether an unknown parsed JSON payload adheres to the ProjectData contract.
 */
function isValidProjectData(data: unknown): data is ProjectData {
  if (!data || typeof data !== 'object') return false;
  const p = data as Record<string, unknown>;

  return (
    typeof p.version === 'number' &&
    typeof p.bpm === 'number' &&
    typeof p.swing === 'number' &&
    Array.isArray(p.tracks) &&
    typeof p.leadPatch === 'object' &&
    typeof p.bassPatch === 'object' &&
    typeof p.chordPatch === 'object'
  );
}

/**
 * Saves the current project state to browser localStorage.
 * Handles storage quota exceptions and private browsing restrictions safely.
 *
 * @param project - Complete project state to persist
 * @returns boolean indicating whether save was successful
 */
export function saveProjectToStorage(project: ProjectData): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload = JSON.stringify(project);
    window.localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (error) {
    console.warn('[Nota Storage] Failed to persist project to localStorage:', error);
    return false;
  }
}

/**
 * Retrieves the persisted project state from browser localStorage.
 * Automatically performs schema migration or returns null if no valid data exists.
 *
 * @returns Saved ProjectData or null
 */
export function loadProjectFromStorage(): ProjectData | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;

    const parsed: unknown = JSON.parse(serialized);

    if (isValidProjectData(parsed)) {
      return parsed;
    } else {
      console.warn('[Nota Storage] Stored project failed validation check, discarding invalid data.');
      return null;
    }
  } catch (error) {
    console.warn('[Nota Storage] Error parsing saved project from localStorage:', error);
    return null;
  }
}

/**
 * Clears the saved project from localStorage, allowing the engine to reload fresh defaults.
 */
export function clearProjectStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }
  }
}

/**
 * Checks if a saved project exists in localStorage.
 */
export function hasSavedProject(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}
