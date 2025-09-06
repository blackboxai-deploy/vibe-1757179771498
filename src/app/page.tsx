// Main game page for Balloon Pop Ultimate

'use client';

import React, { useEffect } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameUI } from '@/components/game/GameUI';
import { ModalSystem } from '@/components/game/ModalSystem';
import { useGameState } from '@/hooks/useGameState';
import { useFirebase } from '@/hooks/useFirebase';
import { useAudio } from '@/hooks/useAudio';

export default function BalloonPopGame() {
  const {
    gameState,
    modalState,
    dimensions,
    startGame,
    restartGame,
    handleInput,
    showModal,
    hideModal,
    setHighScore,
    gameEngine
  } = useGameState();

  const {
    fetchHighScore,
    saveScore,
    shouldSaveScore,
    getDisplayUserId,
    isReady: firebaseReady
  } = useFirebase();

  const {
    enabled: audioEnabled,
    setEnabled: setAudioEnabled
  } = useAudio();

  // Load high score on Firebase ready
  useEffect(() => {
    if (firebaseReady) {
      const loadHighScore = async () => {
        try {
          const highScore = await fetchHighScore();
          setHighScore(highScore);
        } catch (error) {
          console.error('Failed to load high score:', error);
        }
      };
      
      loadHighScore();
    }
  }, [firebaseReady, fetchHighScore, setHighScore]);

  // Save high score when game ends
  useEffect(() => {
    if (gameState.gameOver && shouldSaveScore(gameState.score, gameState.highScore)) {
      const saveHighScore = async () => {
        try {
          const success = await saveScore(gameState.score);
          if (success) {
            setHighScore(gameState.score);
          }
        } catch (error) {
          console.error('Failed to save high score:', error);
        }
      };
      
      saveHighScore();
    }
  }, [gameState.gameOver, gameState.score, gameState.highScore, shouldSaveScore, saveScore, setHighScore]);

  // Dynamic background theme based on power-ups
  const getBackgroundTheme = (): string => {
    const powerUpManager = gameEngine?.getPowerUpManager();
    if (!powerUpManager) return 'bg-gradient-to-b from-sky-200 to-pink-200';

    const themeClass = powerUpManager.getThemeClass();
    
    if (themeClass.includes('slow')) {
      return 'bg-gradient-to-b from-purple-200 to-purple-300';
    } else if (themeClass.includes('multiplier')) {
      return 'bg-gradient-to-b from-yellow-200 to-yellow-300';
    } else if (themeClass.includes('freeze')) {
      return 'bg-gradient-to-b from-cyan-200 to-blue-200';
    } else if (themeClass.includes('magnet')) {
      return 'bg-gradient-to-b from-blue-200 to-blue-300';
    } else if (themeClass.includes('defuser')) {
      return 'bg-gradient-to-b from-orange-200 to-red-200';
    }
    
    return 'bg-gradient-to-b from-sky-200 to-pink-200';
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden touch-none">
      {/* Dynamic Background with Smooth Transitions */}
      <div 
        className={`absolute inset-0 transition-all duration-1500 ease-in-out ${getBackgroundTheme()}`}
      />

      {/* Game Canvas */}
      <div className="absolute inset-0">
        <GameCanvas
          gameEngine={gameEngine}
          width={dimensions.width}
          height={dimensions.height}
          dpr={dimensions.dpr}
          onInput={handleInput}
          className="absolute inset-0"
        />
      </div>

      {/* Game UI Overlay */}
      <GameUI
        gameState={gameState}
        powerUpManager={gameEngine?.getPowerUpManager() || null}
        userId={getDisplayUserId()}
        onSettingsClick={() => showModal('settingsModal')}
      />

      {/* Modal System */}
      <ModalSystem
        modalState={modalState}
        onStartGame={startGame}
        onRestartGame={restartGame}
        onCloseModal={hideModal}
        finalScore={gameState.score}
        audioEnabled={audioEnabled}
        onAudioToggle={setAudioEnabled}
      />

      {/* Prevent scrolling and zooming on mobile */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          touch-action: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        input, textarea {
          -webkit-user-select: text;
          -khtml-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }

        /* Prevent zoom on iOS */
        input[type="text"],
        input[type="email"],
        input[type="number"],
        input[type="tel"],
        input[type="url"],
        input[type="password"],
        textarea,
        select {
          font-size: 16px;
        }

        /* Game-specific animations */
        @keyframes bounce-score {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        @keyframes combo-pop {
          0% { transform: translateX(-50%) scale(0); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 0; }
        }

        .animate-bounce-score {
          animation: bounce-score 0.4s ease-in-out;
        }

        .animate-combo-pop {
          animation: combo-pop 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }

        .text-shadow-lg {
          text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </main>
  );
}