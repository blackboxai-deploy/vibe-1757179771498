// Power-up management system for Balloon Pop Ultimate

import { PowerUp } from '@/types/game';

export class PowerUpManager {
  private activePowerUps: Map<string, PowerUp> = new Map();
  private callbacks: {
    onActivate?: (powerUp: PowerUp) => void;
    onDeactivate?: (powerUp: PowerUp) => void;
    onUpdate?: (powerUp: PowerUp) => void;
  } = {};

  constructor(callbacks?: {
    onActivate?: (powerUp: PowerUp) => void;
    onDeactivate?: (powerUp: PowerUp) => void;
    onUpdate?: (powerUp: PowerUp) => void;
  }) {
    this.callbacks = callbacks || {};
  }

  activatePowerUp(type: PowerUp['type'], duration: number): void {
    // Deactivate any existing power-up of the same type
    if (this.activePowerUps.has(type)) {
      this.deactivatePowerUp(type);
    }

    const powerUp: PowerUp = {
      type,
      duration,
      active: true,
      timeLeft: duration
    };

    this.activePowerUps.set(type, powerUp);
    this.callbacks.onActivate?.(powerUp);
  }

  deactivatePowerUp(type: PowerUp['type']): void {
    const powerUp = this.activePowerUps.get(type);
    if (powerUp) {
      powerUp.active = false;
      powerUp.timeLeft = 0;
      this.activePowerUps.delete(type);
      this.callbacks.onDeactivate?.(powerUp);
    }
  }

  update(deltaTime: number): void {
    const toRemove: string[] = [];

    this.activePowerUps.forEach((powerUp, type) => {
      powerUp.timeLeft -= deltaTime;
      
      if (powerUp.timeLeft <= 0) {
        powerUp.active = false;
        toRemove.push(type);
        this.callbacks.onDeactivate?.(powerUp);
      } else {
        this.callbacks.onUpdate?.(powerUp);
      }
    });

    // Remove expired power-ups
    toRemove.forEach(type => this.activePowerUps.delete(type));
  }

  isActive(type: PowerUp['type']): boolean {
    const powerUp = this.activePowerUps.get(type);
    return powerUp?.active || false;
  }

  getTimeLeft(type: PowerUp['type']): number {
    const powerUp = this.activePowerUps.get(type);
    return powerUp?.timeLeft || 0;
  }

  getActivePowerUps(): PowerUp[] {
    return Array.from(this.activePowerUps.values()).filter(p => p.active);
  }

  clearAll(): void {
    const activePowerUps = Array.from(this.activePowerUps.values());
    this.activePowerUps.clear();
    
    // Trigger deactivate callbacks for all active power-ups
    activePowerUps.forEach(powerUp => {
      powerUp.active = false;
      this.callbacks.onDeactivate?.(powerUp);
    });
  }

  hasAnyActive(): boolean {
    return this.activePowerUps.size > 0;
  }

  // Game state effects
  getSlowMotionMultiplier(): number {
    return this.isActive('slow') ? 0.5 : 1;
  }

  getScoreMultiplier(): number {
    return this.isActive('multiplier') ? 2 : 1;
  }

  isFreezeActive(): boolean {
    return this.isActive('freeze');
  }

  isMagnetActive(): boolean {
    return this.isActive('magnet');
  }

  isDefuserActive(): boolean {
    return this.isActive('defuser');
  }

  // Get CSS theme class for background effects
  getThemeClass(): string {
    if (this.isActive('slow')) return 'slow-theme';
    if (this.isActive('multiplier')) return 'multiplier-theme';
    if (this.isActive('freeze')) return 'freeze-theme';
    if (this.isActive('magnet')) return 'magnet-theme';
    if (this.isActive('defuser')) return 'defuser-theme';
    return '';
  }

  // Get display information for UI
  getPrimaryPowerUpDisplay(): { type: string; timeLeft: number; emoji: string } | null {
    const active = this.getActivePowerUps();
    if (active.length === 0) return null;

    // Prioritize certain power-ups for display
    const priority = ['freeze', 'slow', 'multiplier', 'magnet', 'defuser'];
    const prioritized = active.find(p => priority.includes(p.type)) || active[0];

    const emojiMap: Record<string, string> = {
      slow: '⏳',
      multiplier: '✨',
      freeze: '❄️',
      magnet: '➡️',
      defuser: '💣'
    };

    return {
      type: prioritized.type.charAt(0).toUpperCase() + prioritized.type.slice(1),
      timeLeft: prioritized.timeLeft,
      emoji: emojiMap[prioritized.type] || '⭐'
    };
  }

  // Static helper methods
  static getPowerUpDescription(type: PowerUp['type']): string {
    const descriptions: Record<PowerUp['type'], string> = {
      slow: 'Slows down all balloons',
      multiplier: 'Doubles your score for a short time',
      freeze: 'Temporarily stops all balloons',
      magnet: 'Pulls balloons towards the center',
      defuser: 'Makes all bombs harmless'
    };

    return descriptions[type] || 'Unknown power-up';
  }

  static getPowerUpPoints(): number {
    // Points awarded when collecting a power-up balloon
    return 10;
  }

  static getDefaultDuration(): number {
    return 10; // 10 seconds
  }

  // Debug information
  getDebugInfo(): string {
    const active = this.getActivePowerUps();
    if (active.length === 0) return 'No active power-ups';

    return active
      .map(p => `${p.type}: ${p.timeLeft.toFixed(1)}s`)
      .join(', ');
  }
}