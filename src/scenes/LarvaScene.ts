/**
 * LarvaScene - Seconda fase del gioco
 * Sei una piccola larva, puoi muoverti lentamente e devi mangiare per sopravvivere
 */

import Phaser from 'phaser';
import { 
  VIEWPORT, 
  COLORS, 
  MOVEMENT, 
  HUNGER, 
  CURRENT_DURATION, 
  MS_PER_MINUTE,
  EFFECTS 
} from '@/config/gameConfig';
import { GameState, saveGame, respawnAsSibling } from '@/systems/GameState';
import { calculateCamouflage } from '@/data/traits';

interface FoodItem {
  sprite: Phaser.GameObjects.Arc;
  type: 'microorganism' | 'smallInsect';
  value: number;
}

interface Predator {
  sprite: Phaser.GameObjects.Container;
  type: string;
  speed: number;
  detectionRadius: number;
  isHunting: boolean;
}

export class LarvaScene extends Phaser.Scene {
  private gameState!: GameState;
  
  // Player
  private player!: Phaser.GameObjects.Sprite;
  private targetX: number | null = null;
  private targetY: number | null = null;
  private targetMarker: Phaser.GameObjects.Arc | null = null;
  private isMoving: boolean = false;
  
  // Ambiente
  private plants: Phaser.GameObjects.Ellipse[] = [];
  private foods: FoodItem[] = [];
  private predators: Predator[] = [];
  
  // UI minimale
  private saveIcon!: Phaser.GameObjects.Container;
  
  // Camera
  private currentViewportSize: number = VIEWPORT.larva.initial;
  
  // Timer
  private phaseTimer!: Phaser.Time.TimerEvent;
  private hungerTimer!: Phaser.Time.TimerEvent;
  private foodSpawnTimer!: Phaser.Time.TimerEvent;
  
  // Stato
  private isHiding: boolean = false;
  private growthMilestones: number[] = [25, 50, 75, 100];
  private currentMilestone: number = 0;
  
  constructor() {
    super({ key: 'LarvaScene' });
  }
  
  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
  }
  
  create() {
    this.createWorld();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.setupTimers();
    this.createUI();
    this.spawnInitialFood();
    this.spawnPredators();
    this.cameras.main.fadeIn(1000, 30, 60, 40);
  }
  
  private createWorld() {
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.water.mid);
    bg.fillRect(0, 0, 800, 1200);
    bg.setDepth(-10);
    
    this.gameState.pond.plantPositions.forEach(plant => {
      const p = this.add.ellipse(
        plant.x, plant.y,
        10 + Math.random() * 20,
        30 + Math.random() * 40,
        COLORS.water.deep, 0.6
      );
      p.setDepth(0);
      this.plants.push(p);
    });
  }
  
  private createPlayer() {
    const { x, y } = this.gameState.player;
    this.player = this.add.sprite(x, y, 'larva');
    this.player.setDepth(10);
    
    const tint = this.hslToHex(this.gameState.player.traits.colors.primary);
    this.player.setTint(tint);
    
    this.tweens.add({
      targets: this.player,
      scaleX: 1.05, scaleY: 0.95,
      duration: 1000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  private setupCamera() {
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.1, 0.1);
    const zoom = VIEWPORT.maxWidth / this.currentViewportSize;
    cam.setZoom(zoom);
  }
  
  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.setMoveTarget(worldPoint.x, worldPoint.y);
    });
  }
  
  private setupTimers() {
    const phaseDurationMs = CURRENT_DURATION.larva * MS_PER_MINUTE;
    
    this.phaseTimer = this.time.addEvent({
      delay: phaseDurationMs,
      callback: this.onPhaseComplete,
      callbackScope: this,
    });
    
    this.hungerTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateHunger,
      callbackScope: this,
      loop: true,
    });
    
    this.foodSpawnTimer = this.time.addEvent({
      delay: 5000,
      callback: this.spawnFood,
      callbackScope: this,
      loop: true,
    });
  }
  
  private createUI() {
    this.saveIcon = this.add.container(20, 20);
    const iconBg = this.add.circle(0, 0, 8, 0xffffff, 0.3);
    const iconInner = this.add.circle(0, 0, 4, 0x8fa67a, 0.8);
    this.saveIcon.add([iconBg, iconInner]);
    this.saveIcon.setScrollFactor(0);
    this.saveIcon.setAlpha(0);
    this.saveIcon.setDepth(100);
  }
  
  private setMoveTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
    this.isMoving = true;
    
    if (this.targetMarker) this.targetMarker.destroy();
    
    this.targetMarker = this.add.circle(x, y, 3, 0xffffff, 0.3);
    this.tweens.add({
      targets: this.targetMarker,
      alpha: 0, scale: 2, duration: 500,
      onComplete: () => {
        this.targetMarker?.destroy();
        this.targetMarker = null;
      },
    });
    
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, x, y);
    this.player.setRotation(angle + Math.PI / 2);
  }
  
  private updateMovement(delta: number) {
    if (!this.isMoving || this.targetX === null || this.targetY === null) return;
    
    const speed = MOVEMENT.larva.speed;
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.targetX, this.targetY
    );
    
    if (distance < 5) {
      this.isMoving = false;
      this.targetX = null;
      this.targetY = null;
      this.emitBubbles(1);
      return;
    }
    
    const moveDistance = speed * (delta / 1000);
    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, this.targetX, this.targetY
    );
    
    this.player.x += Math.cos(angle) * moveDistance;
    this.player.y += Math.sin(angle) * moveDistance;
    
    this.gameState.player.x = this.player.x;
    this.gameState.player.y = this.player.y;
    
    if (Math.random() < 0.02) this.emitBubbles(1);
  }
  
  private updateHunger() {
    if (this.gameState.player.isDead) return;
    
    this.gameState.player.hunger -= HUNGER.drainRate.larva;
    
    if (this.gameState.player.hunger < HUNGER.warningThreshold) {
      this.player.setAlpha(0.7 + (this.gameState.player.hunger / HUNGER.warningThreshold) * 0.3);
    }
    
    if (this.gameState.player.hunger <= 0) {
      this.onDeath('starvation');
    }
  }
  
  private spawnInitialFood() {
    for (let i = 0; i < 10; i++) this.spawnFood();
  }
  
  private spawnFood() {
    if (this.foods.length > 15) return;
    
    const x = 50 + Math.random() * 300;
    const y = 50 + Math.random() * 500;
    const isMicro = Math.random() < 0.7;
    
    const food: FoodItem = {
      sprite: this.add.circle(x, y, isMicro ? 2 : 4, isMicro ? 0xaaffaa : 0xffaa66, 0.8),
      type: isMicro ? 'microorganism' : 'smallInsect',
      value: isMicro ? HUNGER.foodValues.microorganism : HUNGER.foodValues.smallInsect,
    };
    
    food.sprite.setDepth(5);
    
    this.tweens.add({
      targets: food.sprite,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      duration: 2000 + Math.random() * 2000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    
    this.foods.push(food);
  }
  
  private checkFoodCollision() {
    const eatRadius = 15;
    
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, food.sprite.x, food.sprite.y
      );
      
      if (dist < eatRadius) this.eatFood(food, i);
    }
  }
  
  private eatFood(food: FoodItem, index: number) {
    this.gameState.player.hunger = Math.min(100, this.gameState.player.hunger + food.value);
    this.gameState.player.growthProgress += food.value / 10;
    this.checkGrowthMilestone();
    food.sprite.destroy();
    this.foods.splice(index, 1);
    this.emitBubbles(2);
  }
  
  private checkGrowthMilestone() {
    const progress = this.gameState.player.growthProgress;
    
    if (this.currentMilestone < this.growthMilestones.length) {
      const nextMilestone = this.growthMilestones[this.currentMilestone];
      
      if (progress >= nextMilestone) {
        this.currentMilestone++;
        this.onGrowthMilestone();
      }
    }
  }
  
  private onGrowthMilestone() {
    this.tweens.add({
      targets: this.player,
      scaleX: 1.15, scaleY: 1.15,
      duration: 100, yoyo: true, repeat: 2,
      onComplete: () => {
        this.player.setScale(1 + this.currentMilestone * 0.05);
        this.expandViewport();
      },
    });
    this.emitSparkles();
  }
  
  private spawnPredators() {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) this.spawnPredator();
  }
  
  private spawnPredator() {
    const container = this.add.container(
      Math.random() < 0.5 ? -30 : 430,
      100 + Math.random() * 400
    );
    
    const body = this.add.ellipse(0, 0, 30, 15, 0x444466, 0.8);
    const eye = this.add.circle(10, -2, 3, 0xff0000, 0.6);
    container.add([body, eye]);
    container.setDepth(8);
    
    const predator: Predator = {
      sprite: container,
      type: 'fish',
      speed: 20 + Math.random() * 20,
      detectionRadius: 80,
      isHunting: false,
    };
    
    this.predators.push(predator);
    this.createPredatorPatrol(predator);
  }
  
  private createPredatorPatrol(predator: Predator) {
    const patrol = () => {
      if (predator.isHunting) return;
      
      const targetX = 50 + Math.random() * 300;
      const targetY = 50 + Math.random() * 500;
      
      const duration = Phaser.Math.Distance.Between(
        predator.sprite.x, predator.sprite.y, targetX, targetY
      ) / predator.speed * 1000;
      
      const angle = Phaser.Math.Angle.Between(
        predator.sprite.x, predator.sprite.y, targetX, targetY
      );
      predator.sprite.setRotation(angle);
      
      this.tweens.add({
        targets: predator.sprite,
        x: targetX, y: targetY,
        duration, ease: 'Linear',
        onComplete: () => {
          this.time.delayedCall(1000 + Math.random() * 2000, patrol);
        },
      });
    };
    
    patrol();
  }
  
  private updatePredators() {
    this.predators.forEach(predator => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        predator.sprite.x, predator.sprite.y
      );
      
      if (dist < 20 && !this.isHiding) {
        this.onDeath('predator');
      }
    });
  }
  
  private checkHiding() {
    let nearPlant = false;
    
    this.plants.forEach(plant => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, plant.x, plant.y
      );
      if (dist < 25) nearPlant = true;
    });
    
    const camouflage = calculateCamouflage(
      this.gameState.player.traits,
      nearPlant ? 'plants' : 'open'
    );
    
    this.isHiding = nearPlant && camouflage >= 5;
    this.player.setAlpha(this.isHiding ? 0.5 : 1);
  }
  
  private onDeath(cause: 'predator' | 'starvation') {
    if (this.gameState.player.isDead) return;
    
    this.gameState.player.isDead = true;
    this.gameState.player.deathCause = cause;
    this.isMoving = false;
    this.hungerTimer.destroy();
    
    this.tweens.add({
      targets: this.player,
      alpha: 0, rotation: this.player.rotation + Math.PI,
      duration: 1000,
      onComplete: () => this.handleDeath(cause),
    });
  }
  
  private handleDeath(cause: 'predator' | 'starvation') {
    if (cause === 'predator') {
      const newState = respawnAsSibling(this.gameState);
      if (newState) {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.restart({ gameState: newState });
        });
        return;
      }
    }
    this.showGameOver();
  }
  
  private showGameOver() {
    this.cameras.main.fadeOut(2000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOverScene', { gameState: this.gameState });
    });
  }
  
  private emitBubbles(count: number) {
    for (let i = 0; i < count; i++) {
      const bubble = this.add.circle(
        this.player.x + (Math.random() - 0.5) * 10,
        this.player.y,
        2 + Math.random() * 2,
        0xffffff, 0.5
      );
      bubble.setDepth(15);
      
      this.tweens.add({
        targets: bubble,
        y: bubble.y - 30 - Math.random() * 20,
        alpha: 0, duration: 800, ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }
  
  private emitSparkles() {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = this.add.circle(
        this.player.x, this.player.y,
        2, EFFECTS.sparkle.colors[i % 3], 1
      );
      spark.setDepth(20);
      
      this.tweens.add({
        targets: spark,
        x: this.player.x + Math.cos(angle) * 25,
        y: this.player.y + Math.sin(angle) * 25,
        alpha: 0, duration: 600, ease: 'Sine.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }
  
  private expandViewport() {
    const progress = this.currentMilestone / this.growthMilestones.length;
    const targetSize = Phaser.Math.Linear(
      VIEWPORT.larva.initial, VIEWPORT.larva.final, progress
    );
    const newZoom = VIEWPORT.maxWidth / targetSize;
    
    this.tweens.add({
      targets: this.cameras.main,
      zoom: newZoom, duration: 1500, ease: 'Sine.easeInOut',
    });
    
    this.currentViewportSize = targetSize;
  }
  
  private onPhaseComplete() {
    this.showSaveIcon();
    saveGame(this.gameState);
    
    this.cameras.main.fadeOut(1500, 30, 60, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.gameState.currentPhase = 'juvenile';
      this.gameState.phaseStartTime = Date.now();
      this.scene.start('JuvenileScene', { gameState: this.gameState });
    });
  }
  
  private showSaveIcon() {
    this.saveIcon.setAlpha(1);
    this.tweens.add({
      targets: this.saveIcon,
      angle: 360, duration: 1000,
      onComplete: () => {
        this.tweens.add({
          targets: this.saveIcon,
          alpha: 0, delay: 500, duration: 500,
        });
      },
    });
  }
  
  private hslToHex(hsl: { h: number; s: number; l: number }): number {
    const color = Phaser.Display.Color.HSLToColor(hsl.h / 360, hsl.s / 100, hsl.l / 100);
    return color.color;
  }
  
  update(_time: number, delta: number) {
    if (this.gameState.player.isDead) return;
    
    this.updateMovement(delta);
    this.checkFoodCollision();
    this.updatePredators();
    this.checkHiding();
    this.gameState.totalPlayTime += delta;
  }
}
