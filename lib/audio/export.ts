/**
 * @file export.ts
 * @description High-fidelity offline audio rendering and WAV/JSON file exporter for Nota.
 * Uses Web Audio's OfflineAudioContext to render studio-grade 16-bit PCM WAV audio files
 * without realtime playback waiting.
 */

import { midiToFrequency } from './synth';
import type { ProjectData, DrumVoiceType, ScheduledNote } from './types';

/**
 * Encodes an AudioBuffer into standard 16-bit PCM stereo WAV format.
 *
 * @param buffer - Rendered AudioBuffer from OfflineAudioContext
 * @returns Blob containing standard RIFF WAV binary audio data
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const bufferLength = 44 + length;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII strings to DataView
  const writeString = (offset: number, string: string): void => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // --- RIFF Header ---
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true); // File length - 8
  writeString(8, 'WAVE');

  // --- "fmt " Subchunk ---
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // --- "data" Subchunk ---
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Interleave audio channel data and write 16-bit samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      // Convert float [-1.0, 1.0] to signed 16-bit integer [-32768, 32767]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Triggers a browser file download for a given Blob.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Renders the current project offline into a WAV audio file.
 *
 * @param project - Project state containing tracks, notes, and synth patches
 * @param loopCount - Number of times to loop the 16-step pattern (default 2)
 * @returns Promise resolving to a downloadable WAV Blob
 */
export async function renderProjectToWav(
  project: ProjectData,
  loopCount: number = 2
): Promise<Blob> {
  const sampleRate = 44100;
  const stepDuration = 60 / project.bpm / 4;
  const totalSteps = 16 * loopCount;
  const totalDuration = totalSteps * stepDuration + 1.0; // 1s tail for reverb/release decay

  const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

  // Master Limiter to prevent clipping during offline bounce
  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-0.5, 0);
  limiter.knee.setValueAtTime(0, 0);
  limiter.ratio.setValueAtTime(20, 0);
  limiter.attack.setValueAtTime(0.001, 0);
  limiter.release.setValueAtTime(0.05, 0);
  limiter.connect(offlineCtx.destination);

  // Create White Noise Buffer for drums
  const noiseBufferSize = sampleRate * 2;
  const noiseBuffer = offlineCtx.createBuffer(1, noiseBufferSize, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  // Iterate through each loop iteration and schedule all audio events
  for (let loop = 0; loop < loopCount; loop++) {
    const loopOffsetTime = loop * 16 * stepDuration;

    for (const track of project.tracks) {
      if (track.muted) continue;

      if (track.kind === 'drums' && track.drumSteps) {
        // Render drum steps
        (Object.keys(track.drumSteps) as DrumVoiceType[]).forEach((voice) => {
          const steps = track.drumSteps?.[voice] || [];
          steps.forEach((active, stepIdx) => {
            if (!active) return;
            const time = loopOffsetTime + stepIdx * stepDuration;

            if (voice === 'kick') {
              const osc = offlineCtx.createOscillator();
              const gain = offlineCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(160, time);
              osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);
              gain.gain.setValueAtTime(0.85 * track.volume, time);
              gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
              osc.connect(gain);
              gain.connect(limiter);
              osc.start(time);
              osc.stop(time + 0.36);
            } else if (voice === 'snare') {
              const body = offlineCtx.createOscillator();
              const bodyGain = offlineCtx.createGain();
              body.type = 'triangle';
              body.frequency.setValueAtTime(185, time);
              body.frequency.exponentialRampToValueAtTime(80, time + 0.1);
              bodyGain.gain.setValueAtTime(0.5 * track.volume, time);
              bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
              body.connect(bodyGain);
              bodyGain.connect(limiter);
              body.start(time);
              body.stop(time + 0.16);

              const noiseSource = offlineCtx.createBufferSource();
              noiseSource.buffer = noiseBuffer;
              const filter = offlineCtx.createBiquadFilter();
              filter.type = 'highpass';
              filter.frequency.setValueAtTime(1200, time);
              const noiseGain = offlineCtx.createGain();
              noiseGain.gain.setValueAtTime(0.7 * track.volume, time);
              noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
              noiseSource.connect(filter);
              filter.connect(noiseGain);
              noiseGain.connect(limiter);
              noiseSource.start(time);
              noiseSource.stop(time + 0.23);
            } else if (voice === 'hihat') {
              const noiseSource = offlineCtx.createBufferSource();
              noiseSource.buffer = noiseBuffer;
              const filter = offlineCtx.createBiquadFilter();
              filter.type = 'highpass';
              filter.frequency.setValueAtTime(7500, time);
              const gain = offlineCtx.createGain();
              gain.gain.setValueAtTime(0.55 * track.volume, time);
              gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
              noiseSource.connect(filter);
              filter.connect(gain);
              gain.connect(limiter);
              noiseSource.start(time);
              noiseSource.stop(time + 0.06);
            } else if (voice === 'clap') {
              const noiseSource = offlineCtx.createBufferSource();
              noiseSource.buffer = noiseBuffer;
              const filter = offlineCtx.createBiquadFilter();
              filter.type = 'bandpass';
              filter.frequency.setValueAtTime(1100, time);
              const gain = offlineCtx.createGain();
              const v = 0.6 * track.volume;
              gain.gain.setValueAtTime(v * 0.7, time);
              gain.gain.exponentialRampToValueAtTime(0.01, time + 0.01);
              gain.gain.setValueAtTime(v * 0.85, time + 0.012);
              gain.gain.exponentialRampToValueAtTime(0.01, time + 0.022);
              gain.gain.setValueAtTime(v, time + 0.024);
              gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);
              noiseSource.connect(filter);
              filter.connect(gain);
              gain.connect(limiter);
              noiseSource.start(time);
              noiseSource.stop(time + 0.28);
            }
          });
        });
      } else if (track.kind === 'synth') {
        // Render melody, bass, or chords with their respective patches
        const patch =
          track.id === 'track-bass'
            ? project.bassPatch
            : track.id === 'track-chords'
            ? project.chordPatch
            : project.leadPatch;

        track.notes.forEach((note: ScheduledNote) => {
          const startTime = loopOffsetTime + note.step * stepDuration;
          const noteDuration = note.durationSteps * stepDuration;
          const stopTime = startTime + noteDuration + patch.ampEnvelope.release;
          const baseFreq = midiToFrequency(note.midi);

          const voiceGain = offlineCtx.createGain();
          const filter = offlineCtx.createBiquadFilter();
          filter.type = patch.filter.type;
          filter.Q.setValueAtTime(patch.filter.resonance, startTime);

          const baseCutoff = Math.max(20, Math.min(20000, patch.filter.cutoff));
          const modAmount = patch.filter.envelopeAmount * 5000;
          const peakCutoff = Math.max(20, Math.min(20000, baseCutoff + modAmount));
          const sustainCutoff = Math.max(
            20,
            Math.min(20000, baseCutoff + modAmount * patch.filterEnvelope.sustain)
          );

          filter.frequency.setValueAtTime(baseCutoff, startTime);
          filter.frequency.linearRampToValueAtTime(peakCutoff, startTime + patch.filterEnvelope.attack);
          filter.frequency.exponentialRampToValueAtTime(
            Math.max(20, sustainCutoff),
            startTime + patch.filterEnvelope.attack + patch.filterEnvelope.decay
          );

          // Amplitude envelope
          const targetVol = patch.masterGain * note.velocity * track.volume;
          const sustainVol = targetVol * patch.ampEnvelope.sustain;
          voiceGain.gain.setValueAtTime(0.0001, startTime);
          voiceGain.gain.linearRampToValueAtTime(targetVol, startTime + patch.ampEnvelope.attack);
          voiceGain.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, sustainVol),
            startTime + patch.ampEnvelope.attack + patch.ampEnvelope.decay
          );
          voiceGain.gain.setValueAtTime(sustainVol, startTime + noteDuration);
          voiceGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

          // Oscillators
          const osc1 = offlineCtx.createOscillator();
          osc1.type = patch.osc1.type;
          osc1.frequency.setValueAtTime(baseFreq * Math.pow(2, patch.osc1.octaveOffset), startTime);
          osc1.detune.setValueAtTime(patch.osc1.detune, startTime);

          const osc2 = offlineCtx.createOscillator();
          osc2.type = patch.osc2.type;
          osc2.frequency.setValueAtTime(baseFreq * Math.pow(2, patch.osc2.octaveOffset), startTime);
          osc2.detune.setValueAtTime(patch.osc2.detune, startTime);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(voiceGain);
          voiceGain.connect(limiter);

          osc1.start(startTime);
          osc1.stop(stopTime);
          osc2.start(startTime);
          osc2.stop(stopTime);
        });
      }
    }
  }

  // Render the audio graph to buffer
  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

/**
 * Serializes the current project into a downloadable JSON file (.nota format).
 */
export function exportProjectToJson(project: ProjectData): void {
  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  triggerFileDownload(blob, `nota-project-${Date.now()}.nota`);
}
