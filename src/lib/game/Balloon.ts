// Balloon entity class for Balloon Pop Ultimate

import { Balloon as BalloonInterface, BalloonType, BALLOON_TYPES } from '@/types/game';

export class Balloon implements BalloonInterface {
  id: string;
  x: number;
  y: number;
  r: number;
  speed: number;
  type: BalloonType['type'];
  birth: number;
  lifespan: number;
  vx: number;
  vy: number;
  color: [number, number, number];
  xOffset: number;

  constructor(
    x: number,
    y: number,
    r: number,
    speed: number,
    type: BalloonType['type'] = 'normal'
  ) {
    this.id = Math.random().toString(36).substring(2, 15);
    this.x = x;
    this.y = y;
    this.r = r;
    this.speed = speed;
    this.type = type;
    this.birth = performance.now();
    this.lifespan = 50000; // 50 seconds
    this.vx = this.randomFloat(-0.2, 0.2);
    this.vy = -this.speed;
    this.color = this.generateColor();
    this.xOffset = this.randomFloat(-50, 50);
  }

  private randomFloat(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private generateColor(): [number, number, number] {
    // Generate pleasant balloon colors using HSV
    const hue = this.randomFloat(200, 300); // Blue to purple range
    const saturation = this.randomFloat(0.5, 1);
    const value = this.randomFloat(0.8, 1);
    
    return this.hsvToRgb(hue, saturation, value);
  }

  private hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [
      Math.round(f(5) * 255),
      Math.round(f(3) * 255),
      Math.round(f(1) * 255)
    ];
  }

  update(deltaTime: number, freezeActive: boolean, slowMotionActive: boolean, magnetActive: boolean, canvasWidth: number, canvasHeight: number): void {
    if (freezeActive) {
      // Don't move if frozen
      return;
    }

    const speedMultiplier = slowMotionActive ? 0.5 : 1;
    const frameRate = 60;

    if (magnetActive) {
      // Pull towards the center of the canvas
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const dx = centerX - this.x;
      const dy = centerY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) {
        const magnetForce = 0.5;
        this.x += (dx / distance) * this.speed * magnetForce * speedMultiplier * deltaTime * frameRate;
        this.y += (dy / distance) * this.speed * magnetForce * speedMultiplier * deltaTime * frameRate;
      }
    } else {
      // Normal movement
      this.y += this.vy * speedMultiplier * deltaTime * frameRate;
      this.x += this.vx * speedMultiplier * deltaTime * frameRate;
      
      // Add sine wave motion for more interesting movement
      const time = (performance.now() - this.birth) / 500;
      this.x += Math.sin(time) * 0.5;
    }
  }

  draw(ctx: CanvasRenderingContext2D, defuserActive: boolean): void {
    // Draw balloon body with gradient
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(
      this.x - this.r * 0.3,
      this.y - this.r * 0.3,
      this.r * 0.2,
      this.x,
      this.y,
      this.r
    );
    
    gradient.addColorStop(0, `rgba(${this.color.join(',')}, 0.9)`);
    gradient.addColorStop(0.7, `rgba(${this.color.join(',')}, 0.6)`);
    gradient.addColorStop(1, `rgba(${this.color.join(',')}, 0.2)`);
    
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add subtle border
    ctx.strokeStyle = `rgba(${this.color.join(',')}, 0.8)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw string
    this.drawString(ctx);

    // Draw emoji or special indicator
    this.drawEmoji(ctx, defuserActive);
  }

  private drawString(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.r);
    
    // Add slight curve to the string
    const stringLength = 20;
    const stringEndX = this.x + this.randomFloat(-3, 3);
    const stringEndY = this.y + this.r + stringLength;
    
    ctx.quadraticCurveTo(
      this.x + this.randomFloat(-2, 2),
      this.y + this.r + stringLength / 2,
      stringEndX,
      stringEndY
    );
    
    ctx.strokeStyle = `rgba(${this.color.join(',')}, 0.6)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawEmoji(ctx: CanvasRenderingContext2D, defuserActive: boolean): void {
    const balloonType = BALLOON_TYPES[this.type];
    if (!balloonType.emoji) return;

    ctx.font = `${this.r * 1.0}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Special case for bombs when defuser is active
    if (this.type === 'bomb' && defuserActive) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `${this.r * 0.8}px Arial`;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeText('SAFE', this.x, this.y);
      ctx.fillText('SAFE', this.x, this.y);
    } else {
      ctx.fillText(balloonType.emoji, this.x, this.y);
    }
  }

  isOffScreen(canvasHeight: number): boolean {
    return this.y < -this.r;
  }

  isExpired(): boolean {
    return performance.now() - this.birth > this.lifespan;
  }

  containsPoint(x: number, y: number): boolean {
    const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
    return distance <= this.r;
  }

  getPoints(): number {
    return BALLOON_TYPES[this.type].points;
  }

  getDescription(): string {
    return BALLOON_TYPES[this.type].description;
  }

  // Create a static method for balloon type selection
  static selectBalloonType(bombChance: number, powerupChance: number): BalloonType['type'] {
    const random = Math.random();
    
    if (random < bombChance) {
      return 'bomb';
    } else if (random < bombChance + powerupChance) {
      const powerupTypes: BalloonType['type'][] = [
        'slow', 'multiplier', 'freeze', 'magnet', 'defuser', 'heart', 'special'
      ];
      return powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    }
    
    return 'normal';
  }

  // Create a static method for balloon creation
  static create(
    canvasWidth: number,
    canvasHeight: number,
    baseSpeed: number,
    bombChance: number,
    powerupChance: number
  ): Balloon {
    const r = 25 + Math.random() * 20; // Radius between 25-45
    const x = r + Math.random() * (canvasWidth - 2 * r);
    const y = canvasHeight + r; // Start below the canvas
    const speed = baseSpeed + (Math.random() - 0.5) * 0.4; // Speed variation
    const type = Balloon.selectBalloonType(bombChance, powerupChance);
    
    return new Balloon(x, y, r, speed, type);
  }
}