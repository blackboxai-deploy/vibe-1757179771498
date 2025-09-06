// Main game canvas component for Balloon Pop Ultimate

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';

interface GameCanvasProps {
  gameEngine: GameEngine | null;
  width: number;
  height: number;
  dpr: number;
  onInput: (event: MouseEvent | TouchEvent) => void;
  className?: string;
}

export function GameCanvas({ 
  gameEngine, 
  width, 
  height, 
  dpr, 
  onInput, 
  className = '' 
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Set up canvas dimensions and DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual canvas size in memory (scaled by DPR)
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale the context to match DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Set default canvas properties
    ctx.imageSmoothingEnabled = true;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
  }, [width, height, dpr]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameEngine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);

    // Let the game engine render
    gameEngine.render(ctx);

    // Continue rendering if needed
    animationFrameRef.current = requestAnimationFrame(render);
  }, [gameEngine, width, height]);

  // Start/stop rendering based on game state
  useEffect(() => {
    if (gameEngine) {
      animationFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameEngine, render]);

  // Handle mouse input
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    onInput(event.nativeEvent);
  }, [onInput]);

  // Handle touch input
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    onInput(event.nativeEvent);
  }, [onInput]);

  // Prevent context menu on right click
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full touch-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onContextMenu={handleContextMenu}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        touchAction: 'none'
      }}
    />
  );
}