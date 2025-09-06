// Particle system for visual effects in Balloon Pop Ultimate

import { Particle as ParticleInterface } from '@/types/game';

export class Particle implements ParticleInterface {
  id: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: [number, number, number];
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  friction: number;

  constructor(x: number, y: number, color: [number, number, number]) {
    this.id = Math.random().toString(36).substring(2, 15);
    this.x = x;
    this.y = y;
    this.size = 2 + Math.random() * 4; // Size between 2-6
    this.vx = (Math.random() - 0.5) * 4; // Horizontal velocity
    this.vy = (Math.random() - 0.5) * 4; // Vertical velocity
    this.color = color;
    this.alpha = 1;
    this.life = 1;
    this.maxLife = 60 + Math.random() * 60; // 60-120 frames
    this.gravity = 0.1;
    this.friction = 0.98;
  }

  update(deltaTime: number): void {
    const frameRate = 60;
    const dt = deltaTime * frameRate;

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Apply gravity and friction
    this.vy += this.gravity * dt;
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Update life and alpha
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Create gradient for particle
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size
    );
    gradient.addColorStop(0, `rgba(${this.color.join(',')}, ${this.alpha})`);
    gradient.addColorStop(1, `rgba(${this.color.join(',')}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  isDead(): boolean {
    return this.life <= 0 || this.alpha <= 0;
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];

  addParticles(x: number, y: number, color: [number, number, number], count: number = 15): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  addFireworks(x: number, y: number, color: [number, number, number]): void {
    // Create a burst of particles in all directions
    for (let i = 0; i < 20; i++) {
      const particle = new Particle(x, y, color);
      const angle = (i / 20) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.size = 3 + Math.random() * 3;
      this.particles.push(particle);
    }
  }

  addSparkles(x: number, y: number): void {
    // Create sparkly particles for special effects
    const sparkleColors: [number, number, number][] = [
      [255, 255, 0],   // Yellow
      [255, 255, 255], // White
      [255, 215, 0],   // Gold
      [255, 192, 203]  // Pink
    ];

    for (let i = 0; i < 10; i++) {
      const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      const particle = new Particle(x, y, color);
      particle.size = 1 + Math.random() * 2;
      particle.gravity = 0.05; // Less gravity for sparkles
      particle.maxLife = 40 + Math.random() * 40;
      this.particles.push(particle);
    }
  }

  update(deltaTime: number): void {
    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);

      // Remove dead particles
      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw all particles
    this.particles.forEach(particle => {
      particle.draw(ctx);
    });
  }

  clear(): void {
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  // Create explosion effect for combo
  addComboExplosion(x: number, y: number, comboCount: number): void {
    const colors: [number, number, number][] = [
      [255, 215, 0],   // Gold
      [255, 165, 0],   // Orange
      [255, 20, 147],  // Pink
      [0, 255, 255]    // Cyan
    ];

    const particleCount = Math.min(30, 10 + comboCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particle = new Particle(x, y, color);
      
      // Randomize explosion direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.size = 3 + Math.random() * 4;
      particle.maxLife = 60 + Math.random() * 60;
      
      this.particles.push(particle);
    }
  }

  // Add trail effect for power-ups
  addTrail(x: number, y: number, color: [number, number, number]): void {
    const particle = new Particle(x, y, color);
    particle.size = 1 + Math.random() * 2;
    particle.vx = (Math.random() - 0.5) * 0.5;
    particle.vy = (Math.random() - 0.5) * 0.5;
    particle.gravity = 0;
    particle.friction = 0.95;
    particle.maxLife = 30 + Math.random() * 20;
    this.particles.push(particle);
  }
}