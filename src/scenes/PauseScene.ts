/**
 * PauseScene - Overlay di pausa
 * Si sovrappone alla scena attiva con opzioni per riprendere o uscire
 */

import Phaser from 'phaser';
import { GameState } from '@/systems/GameState';

interface PauseData {
  parentScene: string;
  gameState: GameState;
}

export class PauseScene extends Phaser.Scene {
  private parentScene!: string;
  private gameState!: GameState;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: PauseData) {
    this.parentScene = data.parentScene;
    this.gameState = data.gameState;
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Sfondo semi-trasparente
    const overlay = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.7);
    overlay.setDepth(200);

    // Titolo
    const title = this.add.text(cx, cy - 80, 'Pausa', {
      fontSize: '24px',
      color: '#c9d4b8',
      fontFamily: 'monospace',
    });
    title.setOrigin(0.5);
    title.setDepth(201);

    // Info partita
    const cycle = this.gameState.pond.cycle;
    const totalMs = this.gameState.totalPlayTime;
    const totalSec = Math.floor(totalMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;

    const info = this.add.text(cx, cy - 40, `Ciclo ${cycle}  ·  ${timeStr}`, {
      fontSize: '12px',
      color: '#8b9b78',
      fontFamily: 'monospace',
    });
    info.setOrigin(0.5);
    info.setDepth(201);

    // Bottoni
    this.createButton(cx, cy + 20, 'Riprendi', () => this.resumeGame());
    this.createButton(cx, cy + 70, 'Esci', () => this.quitToMenu());

    // ESC per riprendere
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resumeGame();
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const button = this.add.text(x, y, `[ ${text} ]`, {
      fontSize: '16px',
      color: '#c9d4b8',
      fontFamily: 'monospace',
    });
    button.setOrigin(0.5);
    button.setDepth(201);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setColor('#e9f4d8');
      button.setScale(1.05);
    });

    button.on('pointerout', () => {
      button.setColor('#c9d4b8');
      button.setScale(1);
    });

    button.on('pointerdown', callback);
  }

  private resumeGame() {
    this.scene.resume(this.parentScene);
    this.scene.stop();
  }

  private quitToMenu() {
    this.scene.stop(this.parentScene);
    this.scene.start('TitleScene');
  }
}
