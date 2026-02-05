/**
 * Cycles
 * Entry point del gioco
 */

import Phaser from 'phaser';
import { TitleScene, IntroScene } from '@/scenes/TitleScene';
import { BootScene } from '@/scenes/BootScene';
import { EggScene } from '@/scenes/EggScene';
import { LarvaScene } from '@/scenes/LarvaScene';
import { PauseScene } from '@/scenes/PauseScene';
import { COLORS, DEBUG, GAME_MODE } from '@/config/gameConfig';
import { deleteSave } from '@/systems/GameState';

// Fix testi sfuocati su display HiDPI (#3)
// Phaser Text usa resolution 1 di default, causando sfuocatura su schermi Retina/HiDPI.
// Override della factory per applicare automaticamente devicePixelRatio.
const _dpr = window.devicePixelRatio || 1;
if (_dpr > 1) {
  const _origTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
  Phaser.GameObjects.GameObjectFactory.prototype.text = function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ) {
    return _origTextFactory.call(this, x, y, text, { ...style, resolution: _dpr });
  };
}

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
    // Cancella il salvataggio della partita
    deleteSave();

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

    // Ricomincia
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
  
  // Canvas occupa tutta la finestra
  width: '100%',
  height: '100%',

  // Rendering
  pixelArt: false,
  antialias: true,
  roundPixels: false,

  // Colore sfondo
  backgroundColor: 0x000000,

  // Scaling: riempie la finestra
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
    PauseScene,
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

// Dev tools - attivi in development e PR preview (VITE_DEVTOOLS)
if (import.meta.env.DEV || import.meta.env.VITE_DEVTOOLS) {
  import('@/scenes/DevToolsScene').then(({ DevToolsScene }) => {
    game.scene.add('DevToolsScene', DevToolsScene, true);
  });
}

// Debug info
if (DEBUG.enabled) {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  Cycles                               ║
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
