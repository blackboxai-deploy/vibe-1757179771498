// React hooks for game state management

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, GameEvents, GameDimensions, InputEvent, ModalState } from '@/types/game';
import { GameEngine } from '@/lib/game/GameEngine';
import { playPopSound, playMissSound, playPowerupSound, playComboSound } from '@/lib/audio';
import { hapticFeedback } from '@/lib/audio';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    running: false,
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    combo: 0,
    gameStarted: false,
    gameOver: false
  });

  const [modalState, setModalState] = useState<ModalState>({
    startModal: true,
    gameOverModal: false,
    settingsModal: false,
    howToPlayModal: false
  });

  const [dimensions, setDimensions] = useState<GameDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1
  });

  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Game events
  const gameEvents: GameEvents = {
    onBalloonPop: useCallback((balloon, points) => {
      if (balloon.type === 'bomb' && points < 0) {
        playMissSound();
        hapticFeedback(100);
      } else {
        playPopSound();
        hapticFeedback(50);
      }
    }, []),

    onPowerUpActivate: useCallback((_powerUp) => {
      playPowerupSound();
      hapticFeedback(75);
    }, []),

    onLifeLost: useCallback(() => {
      playMissSound();
      hapticFeedback(150);
    }, []),

    onLifeGained: useCallback(() => {
      playPowerupSound();
      hapticFeedback(50);
    }, []),

    onGameOver: useCallback((_finalScore) => {
      setModalState(prev => ({ ...prev, gameOverModal: true }));
      hapticFeedback(200);
    }, []),

    onCombo: useCallback((comboCount) => {
      playComboSound(comboCount);
      hapticFeedback(75);
    }, []),

    onScoreUpdate: useCallback((score, _multiplier) => {
      setGameState(prev => ({ ...prev, score }));
    }, [])
  };

  // Initialize game engine
  useEffect(() => {
    if (!gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(gameEvents, dimensions);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameEvents, dimensions]);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      const newDimensions: GameDimensions = {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      };
      setDimensions(newDimensions);
      gameEngineRef.current?.updateDimensions(newDimensions);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.update(timestamp);
      
      // Update React state with engine state
      const engineState = gameEngineRef.current.getState();
      setGameState(prev => ({
        ...prev,
        ...engineState
      }));
    }

    if (gameState.running) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.running]);

  // Game control functions
  const startGame = useCallback((difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame(difficulty);
      setModalState(prev => ({ 
        ...prev, 
        startModal: false, 
        gameOverModal: false 
      }));
      setGameState(prev => ({ 
        ...prev, 
        running: true, 
        gameStarted: true, 
        gameOver: false 
      }));
      
      // Start game loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop]);

  const pauseGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame();
      setGameState(prev => ({ ...prev, running: false }));
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame();
      setGameState(prev => ({ ...prev, running: true }));
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop]);

  const restartGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resetGame();
      setModalState(prev => ({ 
        ...prev, 
        startModal: true, 
        gameOverModal: false 
      }));
      setGameState(prev => ({
        ...prev,
        running: false,
        gameStarted: false,
        gameOver: false,
        score: 0,
        lives: 3,
        combo: 0
      }));
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Input handling
  const handleInput = useCallback((event: MouseEvent | TouchEvent) => {
    if (!gameEngineRef.current || !gameState.running) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
    
    const inputEvent: InputEvent = {
      x: (clientX - rect.left) * (dimensions.width / rect.width) / dimensions.dpr,
      y: (clientY - rect.top) * (dimensions.height / rect.height) / dimensions.dpr,
      type: 'clientX' in event ? 'click' : 'touch',
      timestamp: performance.now()
    };

    gameEngineRef.current.handleInput(inputEvent);
  }, [gameState.running, dimensions]);

  // Modal controls
  const showModal = useCallback((modal: keyof ModalState) => {
    setModalState(prev => ({ ...prev, [modal]: true }));
    if (modal === 'settingsModal') {
      pauseGame();
    }
  }, [pauseGame]);

  const hideModal = useCallback((modal: keyof ModalState) => {
    setModalState(prev => ({ ...prev, [modal]: false }));
  }, []);

  const setHighScore = useCallback((score: number) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setHighScore(score);
    }
    setGameState(prev => ({ ...prev, highScore: score }));
  }, []);

  return {
    // State
    gameState,
    modalState,
    dimensions,
    
    // Game controls
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    handleInput,
    
    // Modal controls
    showModal,
    hideModal,
    
    // Data
    setHighScore,
    
    // Engine access
    gameEngine: gameEngineRef.current,
    
    // Debug
    getDebugInfo: () => gameEngineRef.current?.getDebugInfo() || ''
  };
}