/**
 * BootScene - Caricamento iniziale e setup
 */

import Phaser from 'phaser';
import { createInitialGameState, loadGame, GameState } from '@/systems/GameState';
import { COLORS, DEBUG } from '@/config/gameConfig';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'BootScene' });
  }
  
  preload() {
    // Mostra loading
    this.createLoadingUI();
    
    // Per ora generiamo texture procedurali
    this.createProceduralTextures();
  }
  
  create() {
    // Prova a caricare un salvataggio esistente
    let gameState: GameState | null = loadGame();
    
    if (gameState) {
      // Mostra messaggio salvataggio trovato
      this.showSaveFoundMessage(gameState);
    } else {
      // Nuovo gioco
      gameState = createInitialGameState();
      this.startGame(gameState);
    }
  }
  
  private createLoadingUI() {
    const { width, height } = this.cameras.main;
    
    // Sfondo
    this.cameras.main.setBackgroundColor(COLORS.water.deep);
    
    // Testo loading
    this.loadingText = this.add.text(width / 2, height / 2, 'Caricamento...', {
      fontSize: '16px',
      color: '#8fa67a',
      fontFamily: 'monospace',
    });
    this.loadingText.setOrigin(0.5);
    
    // Progress bar semplice
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    
    progressBox.fillStyle(0x4a6b3a, 0.8);
    progressBox.fillRect(width / 2 - 100, height / 2 + 30, 200, 10);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x8fa67a, 1);
      progressBar.fillRect(width / 2 - 98, height / 2 + 32, 196 * value, 6);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      this.loadingText.setText('Pronto');
    });
  }
  
  private createProceduralTextures() {
    // Texture particella per luccichio
    this.generateSparkTexture();
    
    // Texture bolla
    this.generateBubbleTexture();
    
    // Texture uovo (placeholder)
    this.generateEggTexture();
    
    // Texture salamandra placeholder
    this.generateSalamanderTextures();
  }
  
  private generateSparkTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Stella a 4 punte
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(8, 8, 2);
    
    // Raggi
    graphics.lineStyle(1, 0xffffff, 0.8);
    graphics.moveTo(8, 2);
    graphics.lineTo(8, 14);
    graphics.moveTo(2, 8);
    graphics.lineTo(14, 8);
    graphics.strokePath();
    
    graphics.generateTexture('spark', 16, 16);
    graphics.destroy();
  }
  
  private generateBubbleTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Bolla con riflesso
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(6, 6, 5);
    
    graphics.fillStyle(0xffffff, 0.7);
    graphics.fillCircle(4, 4, 1);
    
    graphics.generateTexture('bubble', 12, 12);
    graphics.destroy();
  }
  
  private generateEggTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Uovo stilizzato
    graphics.fillStyle(COLORS.egg.shell);
    graphics.fillEllipse(16, 18, 20, 28);
    
    // Ombra interna
    graphics.fillStyle(COLORS.egg.embryo, 0.3);
    graphics.fillEllipse(16, 18, 10, 14);
    
    graphics.generateTexture('egg', 32, 36);
    graphics.destroy();
  }
  
  private generateSalamanderTextures() {
    // Larva (forma semplice)
    this.generateLarvaTexture();
    
    // Giovane
    this.generateJuvenileTexture();
    
    // Adulto
    this.generateAdultTexture();
  }
  
  private generateLarvaTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Corpo piccolo con branchie
    graphics.fillStyle(COLORS.salamander.body);
    
    // Testa
    graphics.fillEllipse(12, 8, 10, 8);
    
    // Corpo
    graphics.fillEllipse(12, 16, 8, 12);
    
    // Coda
    graphics.fillTriangle(12, 22, 8, 22, 12, 32);
    
    // Branchie (linee)
    graphics.lineStyle(1, COLORS.salamander.belly);
    graphics.moveTo(6, 6);
    graphics.lineTo(2, 4);
    graphics.moveTo(6, 8);
    graphics.lineTo(2, 8);
    graphics.moveTo(18, 6);
    graphics.lineTo(22, 4);
    graphics.moveTo(18, 8);
    graphics.lineTo(22, 8);
    graphics.strokePath();
    
    // Occhi
    graphics.fillStyle(0x000000);
    graphics.fillCircle(9, 6, 2);
    graphics.fillCircle(15, 6, 2);
    
    graphics.generateTexture('larva', 24, 32);
    graphics.destroy();
  }
  
  private generateJuvenileTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Salamandra giovane - più definita
    graphics.fillStyle(COLORS.salamander.body);
    
    // Testa
    graphics.fillEllipse(16, 10, 14, 10);
    
    // Corpo
    graphics.fillEllipse(16, 24, 10, 18);
    
    // Coda
    graphics.fillTriangle(16, 33, 10, 33, 16, 48);
    
    // Zampe anteriori
    graphics.fillRect(4, 14, 8, 3);
    graphics.fillRect(20, 14, 8, 3);
    
    // Zampe posteriori
    graphics.fillRect(6, 28, 6, 4);
    graphics.fillRect(20, 28, 6, 4);
    
    // Ventre
    graphics.fillStyle(COLORS.salamander.belly);
    graphics.fillEllipse(16, 24, 6, 12);
    
    // Occhi
    graphics.fillStyle(0x000000);
    graphics.fillCircle(12, 8, 2);
    graphics.fillCircle(20, 8, 2);
    
    graphics.generateTexture('juvenile', 32, 48);
    graphics.destroy();
  }
  
  private generateAdultTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Salamandra adulta - completa
    graphics.fillStyle(COLORS.salamander.body);
    
    // Testa
    graphics.fillEllipse(24, 12, 18, 12);
    
    // Corpo
    graphics.fillEllipse(24, 32, 14, 24);
    
    // Coda lunga
    graphics.fillTriangle(24, 44, 16, 44, 24, 70);
    
    // Zampe anteriori
    graphics.fillRect(4, 20, 12, 4);
    graphics.fillRect(32, 20, 12, 4);
    
    // Zampe posteriori
    graphics.fillRect(6, 38, 10, 5);
    graphics.fillRect(32, 38, 10, 5);
    
    // Dita (dettaglio)
    graphics.fillStyle(COLORS.salamander.body);
    for (let i = 0; i < 3; i++) {
      graphics.fillRect(2 + i * 3, 24, 2, 3);
      graphics.fillRect(44 + i * 3, 24, 2, 3);
    }
    
    // Ventre
    graphics.fillStyle(COLORS.salamander.belly);
    graphics.fillEllipse(24, 32, 8, 16);
    
    // Pattern (spots)
    graphics.fillStyle(COLORS.salamander.spots);
    graphics.fillCircle(20, 28, 2);
    graphics.fillCircle(28, 26, 2);
    graphics.fillCircle(22, 36, 2);
    graphics.fillCircle(26, 40, 1.5);
    
    // Occhi
    graphics.fillStyle(0x000000);
    graphics.fillCircle(18, 10, 3);
    graphics.fillCircle(30, 10, 3);
    
    // Riflesso occhi
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(17, 9, 1);
    graphics.fillCircle(29, 9, 1);
    
    graphics.generateTexture('adult', 48, 72);
    graphics.destroy();
  }
  
  private showSaveFoundMessage(gameState: GameState) {
    const { width, height } = this.cameras.main;
    
    this.loadingText.destroy();
    
    // Box info
    const box = this.add.graphics();
    box.fillStyle(0x2d3a22, 0.9);
    box.fillRoundedRect(width / 2 - 120, height / 2 - 60, 240, 120, 8);
    box.lineStyle(2, 0x8fa67a);
    box.strokeRoundedRect(width / 2 - 120, height / 2 - 60, 240, 120, 8);
    
    // Info salvataggio
    const phaseNames = {
      egg: 'Uovo',
      larva: 'Larva',
      juvenile: 'Giovane',
      adult: 'Adulto',
    };
    
    const info = this.add.text(width / 2, height / 2 - 40, [
      'Salvataggio trovato!',
      `Ciclo: ${gameState.pond.cycle}`,
      `Fase: ${phaseNames[gameState.currentPhase]}`,
      `Generazione: ${gameState.player.traits.generation}`,
    ].join('\n'), {
      fontSize: '12px',
      color: '#8fa67a',
      fontFamily: 'monospace',
      align: 'center',
    });
    info.setOrigin(0.5, 0);
    
    // Bottoni
    this.createButton(
      width / 2 - 60,
      height / 2 + 40,
      'Continua',
      () => this.startGame(gameState)
    );
    
    this.createButton(
      width / 2 + 60,
      height / 2 + 40,
      'Nuovo',
      () => {
        const newState = createInitialGameState();
        this.startGame(newState);
      }
    );
  }
  
  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x4a6b3a);
    bg.fillRoundedRect(-40, -12, 80, 24, 4);
    
    const label = this.add.text(0, 0, text, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    label.setOrigin(0.5);
    
    container.add([bg, label]);
    container.setSize(80, 24);
    container.setInteractive({ useHandCursor: true });
    
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x6b8c5a);
      bg.fillRoundedRect(-40, -12, 80, 24, 4);
    });
    
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x4a6b3a);
      bg.fillRoundedRect(-40, -12, 80, 24, 4);
    });
    
    container.on('pointerdown', callback);
    
    return container;
  }
  
  private startGame(gameState: GameState) {
    // Debug info
    if (DEBUG.enabled) {
      console.log('Starting game with state:', gameState);
    }
    
    // Determina la scena corretta in base alla fase
    const sceneMap = {
      egg: 'EggScene',
      larva: 'LarvaScene',
      juvenile: 'JuvenileScene',
      adult: 'AdultScene',
    };
    
    const targetScene = sceneMap[gameState.currentPhase];
    
    // Fade out e transizione
    this.cameras.main.fadeOut(500, 30, 40, 30);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(targetScene, { gameState });
    });
  }
}
