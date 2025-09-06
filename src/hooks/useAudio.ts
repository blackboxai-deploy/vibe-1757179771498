// React hook for audio management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  audioManager, 
  setAudioEnabled, 
  isAudioEnabled, 
  loadAudioPreference 
} from '@/lib/audio';

interface AudioState {
  enabled: boolean;
  initialized: boolean;
}

export function useAudio() {
  const [state, setState] = useState<AudioState>({
    enabled: true, // Default to enabled
    initialized: false
  });

  // Initialize audio on mount
  useEffect(() => {
    // Load saved preference
    loadAudioPreference();
    const enabled = isAudioEnabled();
    
    setState({
      enabled,
      initialized: true
    });
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const newEnabled = !state.enabled;
    setAudioEnabled(newEnabled);
    setState(prev => ({ ...prev, enabled: newEnabled }));
  }, [state.enabled]);

  // Set audio enabled state
  const setEnabled = useCallback((enabled: boolean) => {
    setAudioEnabled(enabled);
    setState(prev => ({ ...prev, enabled }));
  }, []);

  // Play specific sounds
  const playPopSound = useCallback(() => {
    if (state.enabled) {
      audioManager.playPopSound();
    }
  }, [state.enabled]);

  const playMissSound = useCallback(() => {
    if (state.enabled) {
      audioManager.playMissSound();
    }
  }, [state.enabled]);

  const playPowerupSound = useCallback(() => {
    if (state.enabled) {
      audioManager.playPowerupSound();
    }
  }, [state.enabled]);

  const playComboSound = useCallback((comboCount: number) => {
    if (state.enabled) {
      audioManager.playComboSound(comboCount);
    }
  }, [state.enabled]);

  const playVictorySound = useCallback(() => {
    if (state.enabled) {
      audioManager.playVictorySound();
    }
  }, [state.enabled]);

  const playGameOverSound = useCallback(() => {
    if (state.enabled) {
      audioManager.playGameOverSound();
    }
  }, [state.enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioManager.dispose();
    };
  }, []);

  return {
    // State
    enabled: state.enabled,
    initialized: state.initialized,
    
    // Controls
    toggleAudio,
    setEnabled,
    
    // Sound effects
    playPopSound,
    playMissSound,
    playPowerupSound,
    playComboSound,
    playVictorySound,
    playGameOverSound,
    
    // Utility
    isEnabled: state.enabled
  };
}