/**
 * EggScene - Prima fase del gioco
 * Sei un uovo di salamandra, puoi solo scuoterti per respingere predatori
 */

import Phaser from 'phaser';
import { EGG_CONFIG, VIEWPORT, COLORS, EFFECTS, CURRENT_DURATION, MS_PER_MINUTE } from '@/config/gameConfig';
import { GameState } from '@/systems/GameState';

export class EggScene extends Phaser.Scene {
  // Stato del gioco (passato dalla scena precedente)
  private gameState!: GameState;
  
  // Elementi grafici
  private playerEgg!: Phaser.GameObjects.Container;
  private siblingEggs: Phaser.GameObjects.Image[] = [];
  private eggSprite!: Phaser.GameObjects.Image;
  
  // Predatori
  private predatorShadow: Phaser.GameObjects.Ellipse | null = null;
  private predatorWarning = false;
  
  // Camera e viewport
  private currentViewportSize: number = VIEWPORT.egg.initial;
  
  // Stato locale
  private energy: number = EGG_CONFIG.maxEnergy;
  private lastShakeTime: number = 0;
  private developmentStage: number = 0;
  private daysPassed: number = 0;
  private isPredatorNearby: boolean = false;
  
  // Timer
  private phaseTimer!: Phaser.Time.TimerEvent;
  private dayTimer!: Phaser.Time.TimerEvent;
  private energyDrainTimer!: Phaser.Time.TimerEvent;
  
  // Effetti
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  constructor() {
    super({ key: 'EggScene' });
  }
  
  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
  }

  preload() {
    this.load.image('egg_1', 'assets/sprites/egg_1.png');
    this.load.image('egg_2', 'assets/sprites/egg_2.png');
    this.load.image('egg_3', 'assets/sprites/egg_3.png');
  }

  create() {
    // Setup camera con viewport piccolo
    this.setupCamera();
    
    // Crea lo sfondo acquatico
    this.createWaterBackground();
    
    // Crea le uova fratelli
    this.createSiblingEggs();
    
    // Crea l'uovo del giocatore
    this.createPlayerEgg();
    
    // Setup input
    this.setupInput();
    
    // Setup timer
    this.setupTimers();
    
    // Effetti particelle
    this.setupParticles();
    
    // Fade in iniziale
    this.cameras.main.fadeIn(2000, 30, 40, 30);
  }
  
  // ============================================
  // SETUP
  // ============================================
  
  private setupCamera() {
    const cam = this.cameras.main;
    
    // Centra la camera sull'uovo del giocatore
    cam.centerOn(this.gameState.player.x, this.gameState.player.y);
    
    // Zoom iniziale per viewport piccolo
    const zoomLevel = VIEWPORT.maxWidth / this.currentViewportSize;
    cam.setZoom(zoomLevel);
    
    // Tinta iniziale calda (dentro l'uovo)
    cam.setBackgroundColor(COLORS.water.deep);
  }
  
  private createWaterBackground() {
    // Gradiente verticale per simulare profondità
    const bg = this.add.graphics();
    
    // Sfondo base
    bg.fillStyle(COLORS.water.deep);
    bg.fillRect(0, 0, 800, 1200);
    
    // Effetto nebbia/torbidità
    for (let i = 0; i < 20; i++) {
      const alpha = 0.05 + Math.random() * 0.1;
      const color = Phaser.Display.Color.IntegerToColor(COLORS.water.murky);
      bg.fillStyle(color.color, alpha);
      bg.fillCircle(
        Math.random() * 800,
        Math.random() * 1200,
        50 + Math.random() * 100
      );
    }
    
    bg.setDepth(-10);
  }
  
  private createSiblingEggs() {
    this.gameState.siblings.forEach((sibling, index) => {
      if (!sibling.isAlive) return;

      const egg = this.add.image(sibling.x, sibling.y, 'egg_1');
      egg.setScale(0.03);
      egg.setAlpha(0.7);

      // Leggera pulsazione per dare vita
      this.tweens.add({
        targets: egg,
        scaleX: 0.032,
        scaleY: 0.028,
        duration: 2000 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.siblingEggs.push(egg);
    });
  }
  
  private createPlayerEgg() {
    const { x, y } = this.gameState.player;

    // Container per l'uovo
    this.playerEgg = this.add.container(x, y);

    // Sprite uovo (stadio 1)
    this.eggSprite = this.add.image(0, 0, 'egg_1');
    this.eggSprite.setScale(0.05);

    this.playerEgg.add([this.eggSprite]);
    this.playerEgg.setDepth(10);

    // Pulsazione vitale
    this.tweens.add({
      targets: this.eggSprite,
      scaleX: 0.051,
      scaleY: 0.049,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  private setupInput() {
    // Click/tap per scuotere l'uovo
    this.input.on('pointerdown', () => {
      this.tryShake();
    });
    
    // Spazio come alternativa
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.tryShake();
    });

    // ESC per pausa
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { parentScene: this.scene.key, gameState: this.gameState });
    });
  }
  
  private setupTimers() {
    const phaseDurationMs = CURRENT_DURATION.egg * MS_PER_MINUTE;
    const dayDurationMs = phaseDurationMs / 10;  // 10 "giorni" per fase uovo
    
    // Timer fase completa
    this.phaseTimer = this.time.addEvent({
      delay: phaseDurationMs,
      callback: this.onPhaseComplete,
      callbackScope: this,
    });
    
    // Timer per simulare il passaggio dei giorni
    this.dayTimer = this.time.addEvent({
      delay: dayDurationMs,
      callback: this.onDayPass,
      callbackScope: this,
      repeat: 9,
    });
    
    // Timer per il drain dell'energia quando inattivo
    this.energyDrainTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateEnergy,
      callbackScope: this,
      loop: true,
    });
    
    // Timer per eventi predatore
    this.time.addEvent({
      delay: dayDurationMs * 2,  // Primo predatore al giorno 2
      callback: this.triggerPredatorEvent,
      callbackScope: this,
    });
  }
  
  private setupParticles() {
    // Particelle per luccichio
    this.particles = this.add.particles(0, 0, 'spark', {
      // Configurazione sarà aggiunta quando creiamo gli asset
      lifespan: 800,
      speed: { min: 10, max: 30 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    
    // Per ora usiamo un placeholder grafico
    const sparkTexture = this.make.graphics({ x: 0, y: 0, add: false });
    sparkTexture.fillStyle(0xffffff);
    sparkTexture.fillCircle(4, 4, 4);
    sparkTexture.generateTexture('spark', 8, 8);
    sparkTexture.destroy();
  }
  
  // ============================================
  // GAMEPLAY
  // ============================================
  
  private tryShake() {
    const now = Date.now();
    
    // Controlla cooldown
    if (now - this.lastShakeTime < EGG_CONFIG.shakeCooldownMs) {
      return;
    }
    
    // Controlla energia
    if (this.energy < EGG_CONFIG.shakeEnergyCost) {
      // Feedback che sei stanco
      this.tweens.add({
        targets: this.playerEgg,
        alpha: 0.7,
        duration: 100,
        yoyo: true,
      });
      return;
    }
    
    // Esegui scuotimento!
    this.performShake();
  }
  
  private performShake() {
    this.lastShakeTime = Date.now();
    this.energy -= EGG_CONFIG.shakeEnergyCost;
    
    // Animazione scuotimento
    this.tweens.add({
      targets: this.playerEgg,
      x: this.playerEgg.x + 3,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
    });
    
    // Se c'è un predatore vicino, respingilo
    if (this.isPredatorNearby && this.predatorShadow) {
      this.repelPredator();
    }
    
    // Bollicine!
    this.emitBubbles();
  }
  
  private emitBubbles() {
    const { x, y } = this.playerEgg;
    
    for (let i = 0; i < 3; i++) {
      const bubble = this.add.circle(
        x + (Math.random() - 0.5) * 10,
        y,
        2 + Math.random() * 2,
        0xffffff,
        0.6
      );
      
      this.tweens.add({
        targets: bubble,
        y: y - 50 - Math.random() * 30,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }
  
  private updateEnergy() {
    if (this.isPredatorNearby) {
      // Non drena energia quando c'è un predatore (tensione!)
      return;
    }
    
    // Drain lento quando inattivo
    this.energy -= EGG_CONFIG.energyDrainRate;
    
    // Se troppo basso, scuoti automaticamente (l'uovo "si muove da solo")
    if (this.energy <= 10) {
      this.autoShake();
    }
    
    // Ricarica graduale
    this.energy = Math.min(
      EGG_CONFIG.maxEnergy,
      this.energy + EGG_CONFIG.energyRechargeRate
    );
  }
  
  private autoShake() {
    // Scuotimento automatico leggero
    this.tweens.add({
      targets: this.playerEgg,
      x: this.playerEgg.x + 1,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    
    // Reset energia
    this.energy = 30;
  }
  
  // ============================================
  // PREDATORI
  // ============================================
  
  private triggerPredatorEvent() {
    if (this.isPredatorNearby) return;
    
    this.isPredatorNearby = true;
    
    // Colori più cupi
    this.tweens.add({
      targets: this.cameras.main,
      duration: 1000,
      onUpdate: () => {
        // Scurisci gradualmente
      },
    });
    
    // Crea l'ombra del predatore
    this.predatorShadow = this.add.ellipse(
      -50,
      this.gameState.player.y + (Math.random() - 0.5) * 100,
      60,
      30,
      0x000000,
      0.4
    );
    this.predatorShadow.setDepth(5);
    
    // Movimento predatore verso le uova
    this.tweens.add({
      targets: this.predatorShadow,
      x: this.gameState.player.x,
      duration: 3000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.isPredatorNearby) {
          this.predatorAttack();
        }
      },
    });
  }
  
  private predatorAttack() {
    // Se il giocatore non ha scosso, un fratello muore
    const aliveIndex = this.gameState.siblings.findIndex(s => s.isAlive);
    
    if (aliveIndex !== -1) {
      this.gameState.siblings[aliveIndex].isAlive = false;
      
      // Animazione uovo che sparisce
      const eggSprite = this.siblingEggs[aliveIndex];
      if (eggSprite) {
        this.tweens.add({
          targets: eggSprite,
          alpha: 0,
          scale: 0.5,
          duration: 500,
          onComplete: () => eggSprite.destroy(),
        });
      }
      
      this.gameState.siblingsSurvived--;
    }
    
    // Predatore se ne va
    this.predatorLeaves();
  }
  
  private repelPredator() {
    if (!this.predatorShadow) return;
    
    // Luccichio!
    this.emitSparkles();
    
    // Predatore scappa
    this.tweens.add({
      targets: this.predatorShadow,
      x: -100,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.predatorLeaves();
      },
    });
  }
  
  private predatorLeaves() {
    this.isPredatorNearby = false;
    
    if (this.predatorShadow) {
      this.predatorShadow.destroy();
      this.predatorShadow = null;
    }
    
    // Colori tornano normali
    // (il giorno 6-7 diventeranno più chiari comunque)
    
    // Prossimo attacco predatore
    const nextAttack = 5000 + Math.random() * 10000;
    this.time.delayedCall(nextAttack, this.triggerPredatorEvent, [], this);
  }
  
  private emitSparkles() {
    const { x, y } = this.playerEgg;
    
    for (let i = 0; i < EFFECTS.sparkle.particleCount; i++) {
      const angle = (i / EFFECTS.sparkle.particleCount) * Math.PI * 2;
      const spark = this.add.circle(x, y, 3, 0xffffff, 1);
      
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0,
        duration: EFFECTS.sparkle.duration,
        ease: 'Sine.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }
  
  // ============================================
  // PROGRESSIONE
  // ============================================
  
  private onDayPass() {
    this.daysPassed++;
    this.developmentStage++;
    
    // Aggiorna visuale embrione
    this.updateEmbryoVisual();
    
    // Espandi viewport gradualmente
    this.expandViewport();
    
    // Evento predatore possibile
    if (this.daysPassed >= 4 && Math.random() < EGG_CONFIG.predatorAttackChance) {
      this.triggerPredatorEvent();
    }
    
    // Abilita scuotimento al giorno 6
    if (this.daysPassed === 6) {
      this.showShakeHint();
    }
  }
  
  private updateEmbryoVisual() {
    // Cambia texture in base allo stadio di sviluppo
    // egg_1: stadi 1-3, egg_2: stadi 4-7, egg_3: stadi 8-10
    let textureKey: string;
    if (this.developmentStage <= 3) {
      textureKey = 'egg_1';
    } else if (this.developmentStage <= 7) {
      textureKey = 'egg_2';
    } else {
      textureKey = 'egg_3';
    }

    if (this.eggSprite.texture.key !== textureKey) {
      this.eggSprite.setTexture(textureKey);
    }

    // Luccichio per feedback crescita!
    if (this.developmentStage > 1) {
      this.emitSparkles();
    }
  }
  
  private expandViewport() {
    const progress = this.developmentStage / EGG_CONFIG.developmentStages;
    const targetSize = Phaser.Math.Linear(
      VIEWPORT.egg.initial,
      VIEWPORT.egg.final,
      progress
    );
    
    const newZoom = VIEWPORT.maxWidth / targetSize;
    
    this.tweens.add({
      targets: this.cameras.main,
      zoom: newZoom,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });
    
    this.currentViewportSize = targetSize;
  }
  
  private showShakeHint() {
    // Testo hint che scompare
    const hint = this.add.text(
      this.gameState.player.x,
      this.gameState.player.y + 40,
      'Tap / Spazio',
      {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }
    );
    hint.setOrigin(0.5);
    hint.setAlpha(0);
    hint.setDepth(100);
    
    this.tweens.add({
      targets: hint,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      hold: 2000,
      onComplete: () => hint.destroy(),
    });
  }
  
  // ============================================
  // TRANSIZIONE
  // ============================================
  
  private onPhaseComplete() {
    // Animazione schiusa!
    this.hatchAnimation();
  }
  
  private hatchAnimation() {
    // Stop tutti i timer
    this.phaseTimer.destroy();
    this.dayTimer.destroy();
    this.energyDrainTimer.destroy();
    
    // Scuotimento intenso
    this.tweens.add({
      targets: this.playerEgg,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        // Crepa!
        this.crackEgg();
      },
    });
  }
  
  private crackEgg() {
    // Effetto crepa
    const crack = this.add.graphics();
    crack.lineStyle(2, 0x000000, 0.5);
    crack.moveTo(this.playerEgg.x - 5, this.playerEgg.y - 10);
    crack.lineTo(this.playerEgg.x, this.playerEgg.y);
    crack.lineTo(this.playerEgg.x + 3, this.playerEgg.y + 8);
    crack.strokePath();
    
    // Flash e transizione
    this.time.delayedCall(500, () => {
      this.cameras.main.flash(500, 255, 255, 255);
      
      this.time.delayedCall(500, () => {
        this.cameras.main.fadeOut(1000, 30, 60, 40);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
          // Aggiorna stato
          this.gameState.currentPhase = 'larva';
          this.gameState.phaseStartTime = Date.now();
          
          // Passa alla scena larva
          this.scene.start('LarvaScene', { gameState: this.gameState });
        });
      });
    });
  }
  
  // ============================================
  // UPDATE LOOP
  // ============================================
  
  update(time: number, delta: number) {
    // Aggiorna tempo totale di gioco
    this.gameState.totalPlayTime += delta;
    
    // Leggero movimento organico dell'uovo
    this.playerEgg.y = this.gameState.player.y + Math.sin(time * 0.001) * 2;
  }
}
