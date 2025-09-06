// React hook for Firebase integration

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  initializeFirebase, 
  getCurrentUserId, 
  saveHighScore, 
  getHighScore,
  isAuthenticated,
  isGuest
} from '@/lib/firebase';

interface FirebaseState {
  initialized: boolean;
  userId: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
  error: string | null;
}

export function useFirebase() {
  const [state, setState] = useState<FirebaseState>({
    initialized: false,
    userId: null,
    isAuthenticated: false,
    isGuest: false,
    loading: true,
    error: null
  });

  // Initialize Firebase on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        await initializeFirebase();
        
        const userId = getCurrentUserId();
        const authenticated = isAuthenticated();
        const guest = isGuest();
        
        setState(prev => ({
          ...prev,
          initialized: true,
          userId,
          isAuthenticated: authenticated,
          isGuest: guest,
          loading: false
        }));
        
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setState(prev => ({
          ...prev,
          initialized: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Firebase initialization failed'
        }));
      }
    };

    initialize();
  }, []);

  // Save high score
  const saveScore = useCallback(async (score: number): Promise<boolean> => {
    if (!state.initialized) {
      console.warn('Firebase not initialized, cannot save score');
      return false;
    }

    try {
      const success = await saveHighScore(score);
      return success;
    } catch (error) {
      console.error('Failed to save high score:', error);
      return false;
    }
  }, [state.initialized]);

  // Get high score
  const fetchHighScore = useCallback(async (): Promise<number> => {
    if (!state.initialized) {
      console.warn('Firebase not initialized, returning 0');
      return 0;
    }

    try {
      const score = await getHighScore();
      return score;
    } catch (error) {
      console.error('Failed to fetch high score:', error);
      return 0;
    }
  }, [state.initialized]);

  // Check if high score should be saved
  const shouldSaveScore = useCallback((currentScore: number, highScore: number): boolean => {
    return currentScore > highScore;
  }, []);

  // Get display user ID
  const getDisplayUserId = useCallback((): string => {
    if (!state.userId) return 'Loading...';
    
    if (state.isGuest) {
      return `${state.userId} (Guest)`;
    }
    
    return state.userId;
  }, [state.userId, state.isGuest]);

  // Get authentication status message
  const getAuthStatus = useCallback((): string => {
    if (state.loading) return 'Connecting...';
    if (state.error) return 'Offline Mode';
    if (state.isGuest) return 'Guest Mode';
    if (state.isAuthenticated) return 'Connected';
    return 'Offline';
  }, [state.loading, state.error, state.isGuest, state.isAuthenticated]);

  // Retry initialization
  const retryInitialization = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await initializeFirebase();
      
      const userId = getCurrentUserId();
      const authenticated = isAuthenticated();
      const guest = isGuest();
      
      setState(prev => ({
        ...prev,
        initialized: true,
        userId,
        isAuthenticated: authenticated,
        isGuest: guest,
        loading: false,
        error: null
      }));
      
      return true;
    } catch (error) {
      console.error('Firebase retry failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Retry failed'
      }));
      return false;
    }
  }, []);

  return {
    // State
    ...state,
    
    // Methods
    saveScore,
    fetchHighScore,
    shouldSaveScore,
    getDisplayUserId,
    getAuthStatus,
    retryInitialization,
    
    // Computed properties
    canSave: state.initialized && !state.loading,
    hasError: !!state.error,
    isReady: state.initialized && !state.loading
  };
}