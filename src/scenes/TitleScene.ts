/**
 * TitleScene - Schermata iniziale
 * Sfondo: stagno asciutto con crepe
 * Il gioco inizia con una transizione poetica
 */

import Phaser from 'phaser';
import { createInitialGameState, loadGame, GameState } from '@/systems/GameState';

// Chiave per salvare lo stato New Game+
const NEW_GAME_PLUS_KEY = 'salamandra_newgameplus';

interface NewGamePlusData {
  unlocked: boolean;
  lastTraits: unknown;  // Tratti dell'ultima salamandra
  cycle: number;
  era: number;
}

export class TitleScene extends Phaser.Scene {
  private canContinue: boolean = false;
  private canNewGamePlus: boolean = false;
  private newGamePlusData: NewGamePlusData | null = null;
  private savedGame: GameState | null = null;
  
  constructor() {
    super({ key: 'TitleScene' });
  }
  
  preload() {
    // Genera texture per lo sfondo
    this.createDriedPondTexture();
    this.createCrackTextures();
  }
  
  create() {
    this.cameras.main.setBackgroundColor(0x000000);

    // Centro della finestra
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Controlla salvataggi
    this.checkSaveData();

    // Crea lo sfondo dello stagno asciutto
    this.createDriedPondBackground(cx, cy);

    // Titolo
    this.createTitle(cx, cy);

    // Menu
    this.createMenu(cx, cy);
    
    // Fade in
    this.cameras.main.fadeIn(2000, 20, 15, 10);
  }
  
  // ============================================
  // SALVATAGGI
  // ============================================
  
  private checkSaveData() {
    // Controlla se c'è un gioco salvato
    this.savedGame = loadGame();
    this.canContinue = this.savedGame !== null;
    
    // Controlla se New Game+ è sbloccato
    try {
      const ngpData = localStorage.getItem(NEW_GAME_PLUS_KEY);
      if (ngpData) {
        this.newGamePlusData = JSON.parse(ngpData);
        this.canNewGamePlus = this.newGamePlusData?.unlocked ?? false;
      }
    } catch {
      this.canNewGamePlus = false;
    }
  }
  
  // ============================================
  // SFONDO STAGNO ASCIUTTO
  // ============================================
  
  private createDriedPondTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Base color - fango secco
    graphics.fillStyle(0x8b7355);
    graphics.fillRect(0, 0, 400, 600);

    // Variazioni di colore
    for (let i = 0; i < 50; i++) {
      const shade = 0x7a6548 + Math.floor(Math.random() * 0x202020);
      graphics.fillStyle(shade, 0.3);
      graphics.fillCircle(
        Math.random() * 400,
        Math.random() * 600,
        20 + Math.random() * 40
      );
    }

    graphics.generateTexture('driedPond', 400, 600);
    graphics.destroy();
  }
  
  private createCrackTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Crepa singola
    graphics.lineStyle(2, 0x5a4a3a, 0.8);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    
    // Linea irregolare
    let x = 0, y = 0;
    for (let i = 0; i < 5; i++) {
      x += 10 + Math.random() * 20;
      y += (Math.random() - 0.5) * 15;
      graphics.lineTo(x, y);
      
      // Ramificazione occasionale
      if (Math.random() < 0.3) {
        const branchX = x + 5 + Math.random() * 10;
        const branchY = y + (Math.random() - 0.5) * 20;
        graphics.lineTo(branchX, branchY);
        graphics.moveTo(x, y);
      }
    }
    
    graphics.strokePath();
    graphics.generateTexture('crack', 100, 50);
    graphics.destroy();
  }
  
  private createDriedPondBackground(cx: number, cy: number) {
    const w = this.scale.width;
    const h = this.scale.height;

    // Sfondo scala per coprire tutta la finestra
    const bg = this.add.image(cx, cy, 'driedPond');
    bg.setScale(Math.max(w / 400, h / 600));
    bg.setDepth(-10);

    // Crepe multiple (relative al centro)
    const crackPositions = [
      { x: cx - 120, y: cy - 150, angle: 15, scale: 1 },
      { x: cx + 120, y: cy - 100, angle: -20, scale: 1.2 },
      { x: cx - 50, y: cy + 50, angle: 45, scale: 0.8 },
      { x: cx + 80, y: cy + 120, angle: -10, scale: 1.1 },
      { x: cx - 100, y: cy + 200, angle: 30, scale: 0.9 },
      { x: cx + 150, y: cy + 180, angle: -35, scale: 1 },
      { x: cx, y: cy - 50, angle: 0, scale: 1.3 },
      { x: cx - 140, y: cy + 80, angle: 60, scale: 0.7 },
    ];

    crackPositions.forEach(pos => {
      const crack = this.add.image(pos.x, pos.y, 'crack');
      crack.setAngle(pos.angle);
      crack.setScale(pos.scale);
      crack.setAlpha(0.6);
      crack.setDepth(-5);
    });

    // Bordi più scuri (ombra)
    const vignette = this.add.graphics();
    const maxR = Math.max(w, h) * 0.6;
    for (let r = maxR; r > maxR * 0.5; r -= 10) {
      const alpha = (maxR - r) / maxR * 0.5;
      vignette.fillStyle(0x000000, alpha);
      vignette.fillCircle(cx, cy, r);
    }
    vignette.setDepth(-3);

    // Leggera foschia/polvere
    const dust = this.add.graphics();
    for (let i = 0; i < 30; i++) {
      dust.fillStyle(0xd4c4a8, 0.1 + Math.random() * 0.1);
      dust.fillCircle(
        Math.random() * w,
        Math.random() * h,
        30 + Math.random() * 50
      );
    }
    dust.setDepth(-2);
  }
  
  // ============================================
  // TITOLO
  // ============================================
  
  private createTitle(cx: number, cy: number) {
    // Titolo principale
    const title = this.add.text(cx, cy - 150, 'Cycles', {
      fontSize: '36px',
      color: '#c9d4b8',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    });
    title.setOrigin(0.5);
    title.setShadow(2, 2, '#2a2a1a', 4);
    
    // Sottotitolo
    const subtitle = this.add.text(cx, cy - 105, 'Cicli di vita', {
      fontSize: '16px',
      color: '#8b9b78',
      fontFamily: 'Georgia, serif',
    });
    subtitle.setOrigin(0.5);
    
    // Linea decorativa
    const line = this.add.graphics();
    line.lineStyle(1, 0x8b9b78, 0.5);
    line.moveTo(cx - 100, cy - 80);
    line.lineTo(cx + 100, cy - 80);
    line.strokePath();
    
    // Animazione leggera sul titolo
    this.tweens.add({
      targets: [title, subtitle],
      alpha: { from: 0.8, to: 1 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  // ============================================
  // MENU
  // ============================================
  
  private createMenu(cx: number, cy: number) {
    const menuY = cy + 50;
    const spacing = 50;
    let currentY = menuY;

    // Nuovo Ciclo (sempre visibile)
    this.createMenuButton(cx, currentY, 'Nuovo Ciclo', () => {
      this.startIntroSequence(false);
    });
    currentY += spacing;
    
    // Continua (solo se c'è salvataggio)
    if (this.canContinue) {
      this.createMenuButton(cx, currentY, 'Continua', () => {
        this.continueGame();
      });
      currentY += spacing;
    }
    
    // New Game+ (solo se sbloccato)
    if (this.canNewGamePlus) {
      this.createMenuButton(cx, currentY, 'New Game+', () => {
        this.startIntroSequence(true);
      }, true);  // Stile speciale
      currentY += spacing;
      
      // Info era
      if (this.newGamePlusData) {
        const eraText = this.add.text(cx, currentY - 15, `Era ${this.newGamePlusData.era + 1}`, {
          fontSize: '10px',
          color: '#6b7b58',
          fontFamily: 'monospace',
        });
        eraText.setOrigin(0.5);
        eraText.setAlpha(0.6);
      }
    }
  }
  
  private createMenuButton(
    x: number, 
    y: number, 
    text: string, 
    callback: () => void,
    special: boolean = false
  ): Phaser.GameObjects.Text {
    const color = special ? '#afc69a' : '#c9d4b8';
    const hoverColor = special ? '#cfe6ba' : '#e9f4d8';
    
    const button = this.add.text(x, y, `[ ${text} ]`, {
      fontSize: '16px',
      color: color,
      fontFamily: 'monospace',
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    
    // Effetto hover
    button.on('pointerover', () => {
      button.setColor(hoverColor);
      button.setScale(1.05);
    });
    
    button.on('pointerout', () => {
      button.setColor(color);
      button.setScale(1);
    });
    
    button.on('pointerdown', callback);
    
    return button;
  }
  
  // ============================================
  // TRANSIZIONI
  // ============================================
  
  private continueGame() {
    if (!this.savedGame) return;
    
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Vai direttamente alla scena corretta
      const sceneMap: Record<string, string> = {
        egg: 'EggScene',
        larva: 'LarvaScene',
        juvenile: 'JuvenileScene',
        adult: 'AdultScene',
      };
      
      this.scene.start(sceneMap[this.savedGame!.currentPhase] || 'EggScene', {
        gameState: this.savedGame,
      });
    });
  }
  
  private startIntroSequence(isNewGamePlus: boolean) {
    this.cameras.main.fadeOut(2000, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('IntroScene', {
        isNewGamePlus,
        newGamePlusData: isNewGamePlus ? this.newGamePlusData : null,
      });
    });
  }
}

/**
 * IntroScene - Sequenza introduttiva poetica
 */
export class IntroScene extends Phaser.Scene {
  private isNewGamePlus: boolean = false;
  private newGamePlusData: NewGamePlusData | null = null;
  private textIndex: number = 0;
  private texts: string[] = [];
  
  constructor() {
    super({ key: 'IntroScene' });
  }
  
  init(data: { isNewGamePlus: boolean; newGamePlusData: NewGamePlusData | null }) {
    this.isNewGamePlus = data.isNewGamePlus;
    this.newGamePlusData = data.newGamePlusData;
    
    // Testi diversi per nuovo gioco vs New Game+
    if (this.isNewGamePlus) {
      const era = this.newGamePlusData?.era ?? 1;
      this.texts = [
        'Il tempo passa...',
        `${era > 1 ? 'Ancora una volta, l' : 'L'}o stagno si è prosciugato.`,
        'Ma nelle crepe, qualcosa attende.',
        'Anni passano...',
        'Decenni...',
        'Un giorno, la pioggia torna.',
        'Le crepe si riempiono d\'acqua.',
        'E la vita riprende.',
      ];
    } else {
      this.texts = [
        'In uno stagno dimenticato...',
        'dove l\'acqua incontra la terra...',
        'la vita trova sempre un modo.',
        '',
        'Sei un piccolo uovo.',
        'Fragile. Indifeso.',
        'Ma vivo.',
      ];
    }
  }
  
  create() {
    this.cameras.main.setBackgroundColor(0x000000);
    this.createPauseButton();
    this.createSkipButton();
    this.showNextText();
  }

  private createPauseButton() {
    const btn = this.add.text(12, 12, '||', {
      fontSize: '18px',
      color: '#c9d4b8',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setDepth(100).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#e9f4d8'));
    btn.on('pointerout', () => btn.setColor('#c9d4b8'));
    btn.on('pointerdown', () => this.openPause());

    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
  }

  private openPause() {
    this.scene.pause();
    // GameState minimale per PauseScene
    const gs = createInitialGameState();
    this.scene.launch('PauseScene', { parentScene: this.scene.key, gameState: gs });
  }

  private createSkipButton() {
    const button = this.add.text(this.scale.width / 2, this.scale.height - 40, '[ Skip ]', {
      fontSize: '12px',
      color: '#8b9b78',
      fontFamily: 'monospace',
    });
    button.setOrigin(0.5);
    button.setAlpha(0.5);
    button.setDepth(100);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setAlpha(1));
    button.on('pointerout', () => button.setAlpha(0.5));
    button.on('pointerdown', () => this.startGame());
  }
  
  private showNextText() {
    if (this.textIndex >= this.texts.length) {
      this.startGame();
      return;
    }
    
    const text = this.texts[this.textIndex];
    this.textIndex++;
    
    // Testo vuoto = pausa più lunga
    if (text === '') {
      this.time.delayedCall(1500, () => this.showNextText());
      return;
    }
    
    const displayText = this.add.text(this.scale.width / 2, this.scale.height / 2, text, {
      fontSize: '14px',
      color: '#8b9b78',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: 300 },
    });
    displayText.setOrigin(0.5);
    displayText.setAlpha(0);
    
    // Fade in
    this.tweens.add({
      targets: displayText,
      alpha: 1,
      duration: 1500,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Hold
        this.time.delayedCall(2000, () => {
          // Fade out
          this.tweens.add({
            targets: displayText,
            alpha: 0,
            duration: 1000,
            ease: 'Sine.easeOut',
            onComplete: () => {
              displayText.destroy();
              this.showNextText();
            },
          });
        });
      },
    });
  }
  
  private startGame() {
    // Transizione finale - luce che appare
    const light = this.add.circle(this.scale.width / 2, this.scale.height / 2, 5, 0x8fa67a, 0);
    
    this.tweens.add({
      targets: light,
      alpha: 0.8,
      scale: 100,
      duration: 3000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Crea lo stato del gioco
        let gameState: GameState;
        
        if (this.isNewGamePlus && this.newGamePlusData) {
          // New Game+ - eredita alcuni dati
          gameState = createInitialGameState();
          gameState.pond.cycle = this.newGamePlusData.cycle;
          gameState.pond.era = this.newGamePlusData.era + 1;
          gameState.pond.sizePercent = 100;  // Stagno pieno!
          
          // Eredita tratti se disponibili
          if (this.newGamePlusData.lastTraits) {
            // Mescola con variazione
            // TODO: implementare eredità tratti NG+
          }
        } else {
          gameState = createInitialGameState();
        }
        
        // Vai alla scena uovo
        this.scene.start('EggScene', { gameState });
      },
    });
  }
}

/**
 * Funzione per sbloccare New Game+
 * Chiamata quando il giocatore depone uova nelle crepe
 */
export function unlockNewGamePlus(gameState: GameState): void {
  const data: NewGamePlusData = {
    unlocked: true,
    lastTraits: gameState.player.traits,
    cycle: gameState.pond.cycle,
    era: gameState.pond.era,
  };
  
  try {
    localStorage.setItem(NEW_GAME_PLUS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Errore salvataggio New Game+:', e);
  }
}

/**
 * Controlla se New Game+ è sbloccato
 */
export function isNewGamePlusUnlocked(): boolean {
  try {
    const data = localStorage.getItem(NEW_GAME_PLUS_KEY);
    if (data) {
      const parsed = JSON.parse(data) as NewGamePlusData;
      return parsed.unlocked;
    }
  } catch {
    // Ignora errori
  }
  return false;
}
