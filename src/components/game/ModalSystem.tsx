// Modal system for game states

'use client';

import React, { useState } from 'react';
import { ModalState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ModalSystemProps {
  modalState: ModalState;
  onStartGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onRestartGame: () => void;
  onCloseModal: (modal: keyof ModalState) => void;
  finalScore: number;
  audioEnabled: boolean;
  onAudioToggle: (enabled: boolean) => void;
}

export function ModalSystem({
  modalState,
  onStartGame,
  onRestartGame,
  onCloseModal,
  finalScore,
  audioEnabled,
  onAudioToggle
}: ModalSystemProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleStartGame = () => {
    onStartGame(selectedDifficulty);
  };

  const TutorialItem: React.FC<{ emoji: string; title: string; description: string }> = ({ 
    emoji, 
    title, 
    description 
  }) => (
    <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
      <span className="text-3xl flex-shrink-0">{emoji}</span>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-gray-600 text-sm mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Start Game Modal */}
      <Dialog open={modalState.startModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center text-gray-800 mb-2">
              Balloon Pop Ultimate
            </DialogTitle>
            <p className="text-center text-gray-600 text-lg">Ready to get poppin&apos;?</p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold text-gray-700 mb-3 block">
                Choose Difficulty:
              </Label>
              <RadioGroup
                value={selectedDifficulty}
                onValueChange={(value) => setSelectedDifficulty(value as 'easy' | 'medium' | 'hard')}
                className="flex justify-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label htmlFor="easy" className="cursor-pointer">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label htmlFor="hard" className="cursor-pointer">Hard</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={handleStartGame}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl text-lg"
            >
              Start Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Over Modal */}
      <Dialog open={modalState.gameOverModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center text-gray-800 mb-2">
              Game Over!
            </DialogTitle>
            <p className="text-center text-gray-600 text-xl">
              Final Score: <span className="font-bold text-blue-600">{finalScore.toLocaleString()}</span>
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button 
              onClick={onRestartGame}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl text-lg"
            >
              Restart
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={modalState.settingsModal} onOpenChange={(open) => !open && onCloseModal('settingsModal')}>
        <DialogContent className="max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center text-gray-800 mb-4">
              Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Sound Settings */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="sound-toggle" className="text-lg font-semibold text-gray-700">
                Sound Effects
              </Label>
              <Switch
                id="sound-toggle"
                checked={audioEnabled}
                onCheckedChange={onAudioToggle}
              />
            </div>

            {/* How to Play Toggle */}
            <Button
              onClick={() => setShowHowToPlay(!showHowToPlay)}
              variant="outline"
              className="w-full py-3 rounded-2xl font-semibold"
            >
              {showHowToPlay ? 'Hide How to Play' : 'How to Play'}
            </Button>

            {/* How to Play Content */}
            {showHowToPlay && (
              <div className="max-h-64 overflow-y-auto space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-lg text-gray-800 mb-3">How to Play</h3>
                <p className="text-gray-600 mb-4">
                  Tap or click on a balloon to pop it! Watch out for special balloons:
                </p>
                
                <div className="space-y-2">
                  <TutorialItem 
                    emoji="🔵" 
                    title="Normal Balloon" 
                    description="Gives 1 point." 
                  />
                  <TutorialItem 
                    emoji="⭐" 
                    title="Special Balloon" 
                    description="Gives extra points!" 
                  />
                  <TutorialItem 
                    emoji="❤️" 
                    title="Extra Life" 
                    description="Restores one life!" 
                  />
                  <TutorialItem 
                    emoji="✨" 
                    title="Multiplier" 
                    description="Doubles your score for a short time!" 
                  />
                  <TutorialItem 
                    emoji="⏳" 
                    title="Slow Motion" 
                    description="Slows down all balloons." 
                  />
                  <TutorialItem 
                    emoji="❄️" 
                    title="Freeze" 
                    description="Temporarily stops all balloons." 
                  />
                  <TutorialItem 
                    emoji="➡️" 
                    title="Magnet" 
                    description="Pulls balloons towards the center." 
                  />
                  <TutorialItem 
                    emoji="💣" 
                    title="Defuser" 
                    description="Makes all bombs harmless." 
                  />
                  <TutorialItem 
                    emoji="☠️" 
                    title="Bomb" 
                    description="Tap this and you lose a life!" 
                  />
                </div>
              </div>
            )}

            <Button
              onClick={() => onCloseModal('settingsModal')}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-2xl text-lg"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}