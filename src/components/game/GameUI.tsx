// Game UI overlay components

'use client';

import React, { useEffect, useState } from 'react';
import { GameState } from '@/types/game';
import { PowerUpManager } from '@/lib/game/PowerUpManager';

interface GameUIProps {
  gameState: GameState;
  powerUpManager: PowerUpManager | null;
  userId: string;
  onSettingsClick: () => void;
  className?: string;
}

export function GameUI({ 
  gameState, 
  powerUpManager, 
  userId, 
  onSettingsClick, 
  className = '' 
}: GameUIProps) {
  const [powerUpDisplay, setPowerUpDisplay] = useState<{
    type: string;
    timeLeft: number;
    emoji: string;
  } | null>(null);

  const [comboDisplay, setComboDisplay] = useState<{
    text: string;
    visible: boolean;
  }>({ text: '', visible: false });

  // Update power-up display
  useEffect(() => {
    if (powerUpManager) {
      const display = powerUpManager.getPrimaryPowerUpDisplay();
      setPowerUpDisplay(display);
    }
  }, [powerUpManager]);

  // Format lives display
  const formatLives = (lives: number): string => {
    return '❤️'.repeat(Math.max(0, lives));
  };

  // Show combo animation
  const showCombo = (comboCount: number) => {
    if (comboCount <= 1) return;
    
    const points = comboCount * 10;
    setComboDisplay({
      text: `COMBO x${comboCount}! +${points}`,
      visible: true
    });

    // Hide after animation
    setTimeout(() => {
      setComboDisplay(prev => ({ ...prev, visible: false }));
    }, 800);
  };

  // Listen for combo changes
  useEffect(() => {
    if (gameState.combo > 1) {
      showCombo(gameState.combo);
    }
  }, [gameState.combo]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-40 ${className}`}>
      {/* Animated clouds background */}
      <div className="absolute inset-0 opacity-90 animate-clouds">
        <div className="absolute top-[20%] left-[15%] w-16 h-12 bg-white rounded-full opacity-70 blur-sm"></div>
        <div className="absolute top-[25%] left-[40%] w-20 h-14 bg-white rounded-full opacity-70 blur-sm"></div>
        <div className="absolute top-[18%] left-[70%] w-14 h-11 bg-white rounded-full opacity-70 blur-sm"></div>
        <div className="absolute top-[30%] left-[90%] w-18 h-13 bg-white rounded-full opacity-70 blur-sm"></div>
        <div className="absolute top-[45%] left-[5%] w-15 h-12 bg-white rounded-full opacity-70 blur-sm"></div>
        <div className="absolute top-[40%] left-[60%] w-16 h-12 bg-white rounded-full opacity-70 blur-sm"></div>
      </div>

      {/* Center UI - Score and High Score */}
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-center">
        <div 
          className={`bg-white/90 backdrop-blur-sm px-7 py-3.5 rounded-3xl font-black text-2xl text-gray-800 shadow-lg transition-transform duration-200 ${
            gameState.score > 0 ? 'animate-bounce-score' : ''
          }`}
        >
          Score: {gameState.score.toLocaleString()}
        </div>
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl font-bold text-lg text-gray-600 shadow-md">
          High Score: {gameState.highScore.toLocaleString()}
        </div>
      </div>

      {/* Left UI - Lives */}
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <div className="bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-2xl font-bold text-xl text-gray-800 shadow-lg">
          {formatLives(gameState.lives)}
        </div>
      </div>

      {/* Right UI - Settings Button */}
      <div className="absolute top-5 right-5 flex flex-col gap-2">
        <button
          onClick={onSettingsClick}
          className="bg-white/85 backdrop-blur-sm px-5 py-2.5 rounded-2xl font-semibold text-base text-gray-800 shadow-lg hover:bg-white/100 transition-colors pointer-events-auto"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Power-up Display */}
      {powerUpDisplay && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 transition-opacity duration-500">
          <div className={`px-4 py-2 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center gap-2 ${
            powerUpManager?.getThemeClass().includes('slow') ? 'bg-purple-600' :
            powerUpManager?.getThemeClass().includes('multiplier') ? 'bg-yellow-500' :
            powerUpManager?.getThemeClass().includes('freeze') ? 'bg-blue-400' :
            powerUpManager?.getThemeClass().includes('magnet') ? 'bg-blue-600' :
            powerUpManager?.getThemeClass().includes('defuser') ? 'bg-red-500' :
            'bg-gray-600'
          }`}>
            <span className="text-xl">{powerUpDisplay.emoji}</span>
            <span>Power-up: {powerUpDisplay.type}!</span>
            <span className="bg-white/30 px-2 py-1 rounded-xl text-sm font-black">
              {Math.ceil(powerUpDisplay.timeLeft)}s
            </span>
          </div>
        </div>
      )}

      {/* Combo Display */}
      {comboDisplay.visible && (
        <div className="absolute top-36 left-1/2 transform -translate-x-1/2 animate-combo-pop">
          <div className="font-black text-4xl text-yellow-400 text-shadow-lg">
            {comboDisplay.text}
          </div>
        </div>
      )}

      {/* Bottom Left - User ID */}
      <div className="absolute bottom-2.5 left-3 text-xs text-black/35">
        User ID: <span className="font-medium">{userId}</span>
      </div>

      {/* Bottom Right - Credit */}
      <div className="absolute bottom-2.5 right-3 text-xs text-black/35">
        Balloon Pop Ultimate • Open in browser
      </div>
    </div>
  );
}

// CSS animations (to be added to globals.css)
export const gameUIStyles = `
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

@keyframes clouds {
  0% { background-position: -100% 0; }
  100% { background-position: 100% 0; }
}

.animate-bounce-score {
  animation: bounce-score 0.4s ease-in-out;
}

.animate-combo-pop {
  animation: combo-pop 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
}

.animate-clouds {
  animation: clouds 40s linear infinite;
}

.text-shadow-lg {
  text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
}
`;