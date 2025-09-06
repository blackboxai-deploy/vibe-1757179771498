// Audio management for Balloon Pop Ultimate

import { AudioConfig, DEFAULT_AUDIO_CONFIG } from '@/types/game';

class AudioManager {
  private config: AudioConfig = DEFAULT_AUDIO_CONFIG;
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    if (typeof window === 'undefined') return;

    const createAudioContext = () => {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Remove event listeners after first interaction
        document.removeEventListener('click', createAudioContext);
        document.removeEventListener('touchstart', createAudioContext);
      } catch (error) {
        console.warn('AudioContext creation failed:', error);
      }
    };

    // Create audio context on first user interaction
    document.addEventListener('click', createAudioContext, { once: true });
    document.addEventListener('touchstart', createAudioContext, { once: true });
  }

  setConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('balloonpop_audio_enabled', enabled.toString());
    }
  }

  loadAudioPreference(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('balloonpop_audio_enabled');
      if (stored !== null) {
        this.config.enabled = stored === 'true';
      }
    }
  }

  private playSound(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.config.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(this.config.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  playPopSound(): void {
    const { frequency, duration, type } = this.config.effects.pop;
    // Add slight random variation to make it more interesting
    const randomFreq = frequency + (Math.random() - 0.5) * 200;
    this.playSound(randomFreq, duration, type);
  }

  playMissSound(): void {
    const { frequency, duration, type } = this.config.effects.miss;
    this.playSound(frequency, duration, type);
  }

  playPowerupSound(): void {
    const { frequency, duration, type } = this.config.effects.powerup;
    this.playSound(frequency, duration, type);
  }

  playComboSound(comboCount: number): void {
    const { frequency, duration, type } = this.config.effects.combo;
    // Increase frequency with combo count
    const comboFreq = frequency + (comboCount * 50);
    this.playSound(comboFreq, duration, type);
  }

  playSequence(frequencies: number[], duration: number = 0.1, gap: number = 0.05): void {
    if (!this.config.enabled || !this.audioContext) return;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playSound(freq, duration);
      }, index * (duration + gap) * 1000);
    });
  }

  // Play victory sound sequence
  playVictorySound(): void {
    this.playSequence([523, 659, 784, 1047], 0.2, 0.1); // C, E, G, C
  }

  // Play game over sound
  playGameOverSound(): void {
    this.playSequence([392, 349, 311, 262], 0.3, 0.1); // G, F, Eb, C
  }

  // Dispose audio context
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Haptic feedback utility
export function hapticFeedback(duration: number = 50): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch (error) {
      // Ignore errors for devices that don't support vibration
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

// Convenience functions
export const playPopSound = (): void => audioManager.playPopSound();
export const playMissSound = (): void => audioManager.playMissSound();
export const playPowerupSound = (): void => audioManager.playPowerupSound();
export const playComboSound = (combo: number): void => audioManager.playComboSound(combo);
export const playVictorySound = (): void => audioManager.playVictorySound();
export const playGameOverSound = (): void => audioManager.playGameOverSound();
export const setAudioEnabled = (enabled: boolean): void => audioManager.setEnabled(enabled);
export const isAudioEnabled = (): boolean => audioManager.isEnabled();
export const loadAudioPreference = (): void => audioManager.loadAudioPreference();