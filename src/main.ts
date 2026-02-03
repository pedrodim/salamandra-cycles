/**
 * Salamandra: Cicli di Vita
 * Entry point del gioco
 */

import Phaser from 'phaser';
import { TitleScene, IntroScene } from '@/scenes/TitleScene';
import { BootScene } from '@/scenes/BootScene';
import { EggScene } from '@/scenes/EggScene';
import { LarvaScene } from '@/scenes/LarvaScene';
import { VIEWPORT, COLORS, DEBUG, GAME_MODE } from '@/config/gameConfig';

// Scene placeholder per le fasi non ancora implementate
class JuvenileScene extends Phaser.Scene {
  constructor() {
    super({ key: 'JuvenileScene' });
  }
  
  init(data: { gameState: unknown }) {
    console.log('JuvenileScene - TODO', data);
  }
  
  create() {
    this.cameras.main.setBackgroundColor(COLORS.water.mid);
    
    const text = this.add.text(200, 280, '🦎 Fase Giovane', {
      fontSize: '20px',
      color: '#8fa67a',
      fontFamily: 'monospace',
    });
    text.setOrigin(0.5);
    
    const subtext = this.add.text(200, 320, 'Coming soon...', {
      fontSize: '14px',
      color: '#6b8c5a',
      fontFamily: 'monospace',
    });
    subtext.setOrigin(0.5);
    
    // Torna al titolo dopo un po'
    this.time.delayedCall(3000, () => {
      this.scene.start('TitleScene');
    });
  }
}

class AdultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AdultScene' });
  }
  
  init(data: { gameState: unknown }) {
    console.log('AdultScene - TODO', data);
  }
  
  create() {
    this.cameras.main.setBackgroundColor(COLORS.water.surface);
    
    const text = this.add.text(200, 280, '🦎 Fase Adulta', {
      fontSize: '20px',
      color: '#8fa67a',
      fontFamily: 'monospace',
    });
    text.setOrigin(0.5);
    
    const subtext = this.add.text(200, 320, 'Coming soon...', {
      fontSize: '14px',
      color: '#6b8c5a',
      fontFamily: 'monospace',
    });
    subtext.setOrigin(0.5);
  }
}

class GameOverScene extends Phaser.Scene {
  private gameState: unknown;
  
  constructor() {
    super({ key: 'GameOverScene' });
  }
  
  init(data: { gameState: unknown }) {
    this.gameState = data.gameState;
  }
  
  create() {
    this.cameras.main.setBackgroundColor(0x1a1a1a);
    
    const title = this.add.text(200, 200, 'La tua linea si è estinta', {
      fontSize: '16px',
      color: '#666666',
      fontFamily: 'monospace',
    });
    title.setOrigin(0.5);
    
    const subtitle = this.add.text(200, 240, 'Il ciclo si interrompe qui.', {
      fontSize: '12px',
      color: '#444444',
      fontFamily: 'monospace',
    });
    subtitle.setOrigin(0.5);
    
    // Mostra stats se disponibili
    if (this.gameState && typeof this.gameState === 'object') {
      const state = this.gameState as { 
        cyclesCompleted?: number; 
        player?: { traits?: { generation?: number } };
        pond?: { cycle?: number };
      };
      
      const stats = this.add.text(200, 300, [
        `Cicli completati: ${state.cyclesCompleted || 0}`,
        `Generazione: ${state.player?.traits?.generation || 1}`,
        `Ciclo stagno: ${state.pond?.cycle || 1}`,
      ].join('\n'), {
        fontSize: '10px',
        color: '#555555',
        fontFamily: 'monospace',
        align: 'center',
      });
      stats.setOrigin(0.5);
    }
    
    // Restart button
    const restartBtn = this.add.text(200, 400, '[ Ricomincia ]', {
      fontSize: '14px',
      color: '#8fa67a',
      fontFamily: 'monospace',
    });
    restartBtn.setOrigin(0.5);
    restartBtn.setInteractive({ useHandCursor: true });
    
    restartBtn.on('pointerover', () => restartBtn.setColor('#afc69a'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#8fa67a'));
    restartBtn.on('pointerdown', () => {
      // Cancella salvataggio e torna al titolo
      localStorage.removeItem('salamandra_cycles_save');
      this.scene.start('TitleScene');
    });
    
    // Fade in
    this.cameras.main.fadeIn(2000, 0, 0, 0);
  }
}

// Configurazione Phaser
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  
  // Dimensioni base - il gioco scalerà
  width: VIEWPORT.maxWidth,
  height: VIEWPORT.maxHeight,
  
  // Pixel art mode!
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  
  // Colore sfondo
  backgroundColor: COLORS.water.deep,
  
  // Scaling per responsività
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 480,
    },
    max: {
      width: 800,
      height: 1200,
    },
  },
  
  // Physics (per collisioni semplici)
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },  // Niente gravità - siamo in acqua!
      debug: DEBUG.showHitboxes,
    },
  },
  
  // Scene - TitleScene è ora la prima!
  scene: [
    TitleScene,     // Schermata iniziale con stagno asciutto
    IntroScene,     // Sequenza introduttiva poetica
    BootScene,      // Caricamento assets (usato internamente)
    EggScene,
    LarvaScene,
    JuvenileScene,
    AdultScene,
    GameOverScene,
  ],
  
  // Input
  input: {
    activePointers: 1,  // Single touch/click
  },
  
  // Performance
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  
  // Audio disabilitato per ora
  audio: {
    disableWebAudio: true,
  },
};

// Avvia il gioco
const game = new Phaser.Game(config);

// Debug info
if (DEBUG.enabled) {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  Salamandra: Cicli di Vita            ║
  ║  Mode: ${GAME_MODE.padEnd(30)}║
  ║  Debug: ${DEBUG.enabled ? 'ON' : 'OFF'}                           ║
  ╚═══════════════════════════════════════╝
  `);
  
  // Esponi game per debug console
  (window as unknown as { game: Phaser.Game }).game = game;
}

// Hot Module Replacement per sviluppo
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('HMR update');
  });
}

export { game };
