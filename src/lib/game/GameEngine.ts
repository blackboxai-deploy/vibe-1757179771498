// Core game engine for Balloon Pop Ultimate

import { 
  GameState, 
  GameConfig, 
  GameEvents, 
  GameDimensions,
  InputEvent,
  DEFAULT_GAME_CONFIG
} from '@/types/game';
import { Balloon } from './Balloon';
import { ParticleSystem } from './Particle';
import { PowerUpManager } from './PowerUpManager';

export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  private balloons: Balloon[] = [];
  private particleSystem: ParticleSystem;
  private powerUpManager: PowerUpManager;
  private events: GameEvents;
  private dimensions: GameDimensions;
  private lastUpdateTime: number = 0;
  private lastSpawnTime: number = 0;
  private comboTimer: number = 0;
  private comboCount: number = 0;

  constructor(
    events: GameEvents,
    dimensions: GameDimensions,
    config: Partial<GameConfig> = {}
  ) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.events = events;
    this.dimensions = dimensions;
    
    this.state = {
      running: false,
      score: 0,
      highScore: 0,
      lives: this.config.maxLives,
      level: 1,
      combo: 0,
      gameStarted: false,
      gameOver: false
    };

    this.particleSystem = new ParticleSystem();
    this.powerUpManager = new PowerUpManager({
      onActivate: this.onPowerUpActivate.bind(this),
      onDeactivate: this.onPowerUpDeactivate.bind(this),
      onUpdate: this.onPowerUpUpdate.bind(this)
    });
  }

  // Game lifecycle methods
  startGame(difficulty: 'easy' | 'medium' | 'hard' = 'easy'): void {
    this.resetGame();
    this.state.running = true;
    this.state.gameStarted = true;
    this.lastUpdateTime = performance.now();
    this.lastSpawnTime = performance.now();
    
    // Update config based on difficulty
    this.updateDifficulty(difficulty);
  }

  pauseGame(): void {
    this.state.running = false;
  }

  resumeGame(): void {
    this.state.running = true;
    this.lastUpdateTime = performance.now();
  }

  resetGame(): void {
    this.state = {
      running: false,
      score: 0,
      highScore: this.state.highScore,
      lives: this.config.maxLives,
      level: 1,
      combo: 0,
      gameStarted: false,
      gameOver: false
    };

    this.balloons = [];
    this.particleSystem.clear();
    this.powerUpManager.clearAll();
    this.comboTimer = 0;
    this.comboCount = 0;
  }

  gameOver(): void {
    this.state.running = false;
    this.state.gameOver = true;
    this.powerUpManager.clearAll();
    this.events.onGameOver(this.state.score);
  }

  // Update loop
  update(currentTime: number): void {
    if (!this.state.running) return;

    const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = currentTime;

    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Spawn balloons
    this.spawnBalloons(currentTime);

    // Update balloons
    this.updateBalloons(deltaTime);

    // Update particles
    this.particleSystem.update(deltaTime);

    // Update power-ups
    this.powerUpManager.update(deltaTime);

    // Check game over condition
    if (this.state.lives <= 0) {
      this.gameOver();
    }
  }

  // Rendering
  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);

    // Draw balloons
    this.balloons.forEach(balloon => {
      balloon.draw(ctx, this.powerUpManager.isDefuserActive());
    });

    // Draw particles
    this.particleSystem.draw(ctx);
  }

  // Input handling
  handleInput(event: InputEvent): void {
    if (!this.state.running) return;

    let hitBalloon = false;

    // Check balloon collisions (iterate backwards to handle overlapping balloons)
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const balloon = this.balloons[i];
      
      if (balloon.containsPoint(event.x, event.y)) {
        hitBalloon = true;
        this.popBalloon(balloon, i, event);
        break; // Only pop one balloon per click
      }
    }

    if (!hitBalloon) {
      // Missed click - reset combo
      this.resetCombo();
    }
  }

  // Balloon management
  private spawnBalloons(currentTime: number): void {
    const spawnInterval = this.config.spawnRate[this.getCurrentDifficulty()];
    
    if (currentTime - this.lastSpawnTime > spawnInterval) {
      const balloon = Balloon.create(
        this.dimensions.width,
        this.dimensions.height,
        this.config.baseSpeed[this.getCurrentDifficulty()],
        this.config.bombChance[this.getCurrentDifficulty()],
        this.config.powerupChance[this.getCurrentDifficulty()]
      );
      
      this.balloons.push(balloon);
      this.lastSpawnTime = currentTime;
    }
  }

  private updateBalloons(deltaTime: number): void {
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const balloon = this.balloons[i];
      
      balloon.update(
        deltaTime,
        this.powerUpManager.isFreezeActive(),
        this.powerUpManager.isActive('slow'),
        this.powerUpManager.isMagnetActive(),
        this.dimensions.width,
        this.dimensions.height
      );

      // Remove balloons that are off-screen or expired
      if (balloon.isOffScreen(this.dimensions.height) || balloon.isExpired()) {
        this.balloons.splice(i, 1);
        
        // Only lose life for missed non-bomb, non-heart balloons
        if (!balloon.isOffScreen(this.dimensions.height) && 
            balloon.type !== 'bomb' && 
            balloon.type !== 'heart') {
          this.loseLife();
        }
      }
    }
  }

  private popBalloon(balloon: Balloon, index: number, _event: InputEvent): void {
    const points = balloon.getPoints();

    // Create particles
    this.particleSystem.addParticles(balloon.x, balloon.y, balloon.color);

    // Handle different balloon types
    switch (balloon.type) {
      case 'normal':
      case 'special':
        this.addScore(Math.abs(points));
        this.incrementCombo();
        break;
        
      case 'heart':
        this.gainLife();
        break;
        
      case 'bomb':
        if (!this.powerUpManager.isDefuserActive()) {
          this.loseLife();
        } else {
          this.addScore(1); // Small reward for defusing
        }
        break;
        
      default:
        // Power-up balloons
        this.activatePowerUp(balloon.type as any);
        this.addScore(10);
        this.incrementCombo();
        break;
    }

    // Remove balloon
    this.balloons.splice(index, 1);
    
    // Trigger event
    this.events.onBalloonPop(balloon, points);
  }

  // Scoring and lives
  private addScore(points: number): void {
    const multiplier = this.powerUpManager.getScoreMultiplier();
    const finalPoints = points * multiplier;
    this.state.score += finalPoints;
    this.events.onScoreUpdate(this.state.score, multiplier);
  }

  private loseLife(): void {
    this.state.lives--;
    this.resetCombo();
    this.events.onLifeLost();
  }

  private gainLife(): void {
    this.state.lives = Math.min(this.state.lives + 1, this.config.maxLives);
    this.events.onLifeGained();
  }

  // Combo system
  private incrementCombo(): void {
    this.comboCount++;
    this.comboTimer = this.config.comboTimeout / 1000;
    
    if (this.comboCount > 1) {
      const comboPoints = this.comboCount * 10;
      this.addScore(comboPoints);
      this.particleSystem.addComboExplosion(
        this.dimensions.width / 2, 
        this.dimensions.height / 4, 
        this.comboCount
      );
      this.events.onCombo(this.comboCount);
    }
  }

  private resetCombo(): void {
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  // Power-up management
  private activatePowerUp(type: 'slow' | 'multiplier' | 'freeze' | 'magnet' | 'defuser'): void {
    this.powerUpManager.activatePowerUp(type, this.config.powerupDuration);
  }

  private onPowerUpActivate(powerUp: any): void {
    this.events.onPowerUpActivate(powerUp);
  }

  private onPowerUpDeactivate(_powerUp: any): void {
    // Power-up deactivated - handled by UI
  }

  private onPowerUpUpdate(_powerUp: any): void {
    // Power-up time updated - handled by UI
  }

  // Getters
  getState(): GameState {
    return { ...this.state };
  }

  getBalloons(): Balloon[] {
    return [...this.balloons];
  }

  getPowerUpManager(): PowerUpManager {
    return this.powerUpManager;
  }

  getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }

  getComboCount(): number {
    return this.comboCount;
  }

  getComboTimeLeft(): number {
    return Math.max(0, this.comboTimer);
  }

  // Configuration
  updateDimensions(dimensions: GameDimensions): void {
    this.dimensions = dimensions;
  }

  setHighScore(score: number): void {
    this.state.highScore = score;
  }

  private getCurrentDifficulty(): 'easy' | 'medium' | 'hard' {
    // For now, return easy - this can be enhanced to scale with score/level
    return 'easy';
  }

  private updateDifficulty(_difficulty: 'easy' | 'medium' | 'hard'): void {
    // Update internal difficulty settings if needed
    // This could adjust spawn rates, speeds, etc.
  }

  // Debug methods
  getDebugInfo(): string {
    return `Balloons: ${this.balloons.length}, Particles: ${this.particleSystem.getParticleCount()}, PowerUps: ${this.powerUpManager.getDebugInfo()}`;
  }
}