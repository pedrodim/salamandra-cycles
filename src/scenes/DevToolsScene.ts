/**
 * DevToolsScene - Pannello strumenti sviluppatore
 * Disponibile solo in build di sviluppo (import.meta.env.DEV)
 * Toggle: tasto backtick (`)
 */

import Phaser from 'phaser';
import {
  GameState,
  createInitialGameState,
  saveGame,
  loadGame,
  deleteSave,
} from '@/systems/GameState';
import type { LifePhase } from '@/systems/GameState';

// ============================================
// COSTANTI UI
// ============================================
const PANEL_W = 250;
const PANEL_PAD = 12;
const LINE_H = 22;
const TAB_H = 28;
const TITLE_H = 30;
const DEPTH = 900;

const COL = {
  panelBg: 0x111820,
  panelBorder: 0x2a3a4a,
  tabBg: 0x1a2530,
  tabActive: 0x2a4050,
  text: '#9ab09a',
  textDim: '#5a6a5a',
  value: '#e9f4d8',
  btn: '#c9d4b8',
  btnHover: '#e9f4d8',
  accent: '#6abf8a',
  danger: '#bf6a6a',
  toggle_on: '#6abf6a',
  toggle_off: '#5a5a5a',
} as const;

const FONT = 'monospace';

type TabId = 'scene' | 'stats' | 'time' | 'save' | 'debug';

const TABS: { id: TabId; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'stats', label: 'Stats' },
  { id: 'time', label: 'Time' },
  { id: 'save', label: 'Save' },
  { id: 'debug', label: 'Debug' },
];

const GAMEPLAY_SCENES: LifePhase[] = ['egg', 'larva', 'juvenile', 'adult'];
const SCENE_KEYS: Record<LifePhase, string> = {
  egg: 'EggScene',
  larva: 'LarvaScene',
  juvenile: 'JuvenileScene',
  adult: 'AdultScene',
};

// ============================================
// SCENE
// ============================================
export class DevToolsScene extends Phaser.Scene {
  // Stato pannello
  private panelOpen = false;
  private activeTab: TabId = 'scene';

  // Elementi pannello
  private panelContainer!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private tabButtons: Phaser.GameObjects.Text[] = [];

  // Overlay debug persistenti
  private fpsText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private viewportGfx!: Phaser.GameObjects.Graphics;
  private cameraInfoText!: Phaser.GameObjects.Text;

  // Stato overlay (mappa per accesso dinamico)
  private overlayFlags: Record<string, boolean> = {
    showFps: true,
    showStateOverlay: false,
    showLog: false,
    showHitboxes: false,
    showCameraInfo: false,
    showViewportEdges: false,
  };

  // Controllo tempo
  private gameTimeScale = 1;
  private isTimePaused = false;

  // Log buffer
  private logEntries: string[] = [];

  // Riferimenti valore per aggiornamento live
  private liveValueTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor() {
    super({ key: 'DevToolsScene' });
  }

  create() {
    this.scene.bringToTop();

    // Hint in alto a sinistra
    this.hintText = this.add.text(8, 8, 'DEV', {
      fontSize: '10px',
      color: COL.textDim,
      fontFamily: FONT,
    }).setDepth(DEPTH).setAlpha(0.6).setScrollFactor(0);

    // Overlay FPS (alto a destra)
    this.fpsText = this.add.text(0, 8, '', {
      fontSize: '10px',
      color: COL.accent,
      fontFamily: FONT,
    }).setDepth(DEPTH).setScrollFactor(0).setVisible(this.overlayFlags.showFps);
    this.positionFps();

    // Overlay stato (sotto FPS)
    this.stateText = this.add.text(0, 24, '', {
      fontSize: '9px',
      color: COL.text,
      fontFamily: FONT,
    }).setDepth(DEPTH).setScrollFactor(0).setVisible(false);

    // Overlay log (basso)
    this.logText = this.add.text(8, 0, '', {
      fontSize: '9px',
      color: COL.textDim,
      fontFamily: FONT,
      wordWrap: { width: 380 },
    }).setDepth(DEPTH).setScrollFactor(0).setVisible(false);

    // Camera info
    this.cameraInfoText = this.add.text(0, 0, '', {
      fontSize: '9px',
      color: COL.accent,
      fontFamily: FONT,
    }).setDepth(DEPTH).setScrollFactor(0).setVisible(false);

    // Viewport edges graphics
    this.viewportGfx = this.add.graphics().setDepth(DEPTH - 1).setScrollFactor(0).setVisible(false);

    // Pannello principale (container)
    this.panelContainer = this.add.container(0, 0).setDepth(DEPTH).setScrollFactor(0).setVisible(false);
    this.contentContainer = this.add.container(0, 0).setDepth(DEPTH + 1).setScrollFactor(0).setVisible(false);

    // Evento da PauseScene per aprire il pannello
    this.events.on('toggle-panel', () => {
      if (!this.panelOpen) this.togglePanel();
    });

    // Shortcut: backtick (`) per toggle pannello
    this.input.keyboard?.on('keydown-BACKQUOTE', () => {
      this.togglePanel();
    });

    // Resize handler
    this.scale.on('resize', () => {
      this.positionFps();
      this.positionOverlays();
      if (this.panelOpen) {
        this.buildPanel();
      }
    });

    // Log
    this.setupLogInterceptor();
    this.devLog('DevTools pronto');
  }

  update() {
    // FPS
    if (this.overlayFlags.showFps && this.fpsText.visible) {
      this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }

    // Stato
    if (this.overlayFlags.showStateOverlay) {
      const gs = this.getGameState();
      if (gs) {
        this.stateText.setText([
          `Fase: ${gs.currentPhase}`,
          `Salute: ${Math.round(gs.player.health)}`,
          `Fame: ${Math.round(gs.player.hunger)}`,
          `Pos: ${Math.round(gs.player.x)},${Math.round(gs.player.y)}`,
          `Crescita: ${Math.round(gs.player.growthProgress)}%`,
          `Ciclo: ${gs.pond.cycle} | Stagno: ${gs.pond.sizePercent}%`,
          `Diff: ${gs.difficultyMultiplier.toFixed(2)}`,
          `TimeScale: ${this.gameTimeScale}x${this.isTimePaused ? ' [PAUSA]' : ''}`,
        ].join('\n'));
        this.stateText.setVisible(true);
      }
    } else {
      this.stateText.setVisible(false);
    }

    // Log
    if (this.overlayFlags.showLog) {
      this.logText.setText(this.logEntries.slice(-12).join('\n'));
      this.logText.setY(this.scale.height - 120);
      this.logText.setVisible(true);
    } else {
      this.logText.setVisible(false);
    }

    // Camera info
    if (this.overlayFlags.showCameraInfo) {
      const activeScene = this.getActiveGameplayScene();
      if (activeScene) {
        const cam = activeScene.cameras.main;
        this.cameraInfoText.setText([
          `Camera: ${Math.round(cam.scrollX)},${Math.round(cam.scrollY)}`,
          `Zoom: ${cam.zoom.toFixed(2)}`,
          `Viewport: ${cam.width}x${cam.height}`,
          `Bounds: ${cam.getBounds().width}x${cam.getBounds().height}`,
        ].join('\n'));
        this.cameraInfoText.setPosition(8, this.scale.height - 60);
        this.cameraInfoText.setVisible(true);
      }
    } else {
      this.cameraInfoText.setVisible(false);
    }

    // Viewport edges
    if (this.overlayFlags.showViewportEdges) {
      this.drawViewportEdges();
    } else {
      this.viewportGfx.setVisible(false);
    }

    // Applica timescale
    this.applyTimeScale();

    // Aggiorna valori live nel pannello stats
    if (this.panelOpen && this.activeTab === 'stats') {
      this.updateLiveValues();
    }
  }

  // ============================================
  // PANEL TOGGLE
  // ============================================
  private togglePanel() {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen) {
      this.buildPanel();
      this.panelContainer.setVisible(true);
      this.contentContainer.setVisible(true);
      this.hintText.setVisible(false);
    } else {
      this.panelContainer.setVisible(false);
      this.contentContainer.setVisible(false);
      this.hintText.setVisible(true);
    }
  }

  // ============================================
  // PANEL BUILD
  // ============================================
  private buildPanel() {
    // Pulisci
    this.panelContainer.removeAll(true);
    this.clearContent();
    this.tabButtons = [];

    const w = PANEL_W;
    const h = this.scale.height;

    // Sfondo pannello
    const bg = this.add.rectangle(w / 2, h / 2, w, h, COL.panelBg, 0.94);
    bg.setInteractive(); // blocca click
    this.panelContainer.add(bg);

    // Bordo destro
    const border = this.add.rectangle(w, h / 2, 2, h, COL.panelBorder, 1);
    this.panelContainer.add(border);

    // Titolo
    const title = this.add.text(PANEL_PAD, 8, 'DEV TOOLS', {
      fontSize: '12px',
      fontStyle: 'bold',
      color: COL.accent,
      fontFamily: FONT,
    });
    this.panelContainer.add(title);

    // Chiudi [X]
    const closeBtn = this.add.text(w - PANEL_PAD - 16, 8, '[X]', {
      fontSize: '11px',
      color: COL.danger,
      fontFamily: FONT,
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.togglePanel());
    closeBtn.on('pointerover', () => closeBtn.setColor(COL.btnHover));
    closeBtn.on('pointerout', () => closeBtn.setColor(COL.danger));
    this.panelContainer.add(closeBtn);

    // Tab bar
    let tabX = PANEL_PAD;
    const tabY = TITLE_H + 4;
    for (const tab of TABS) {
      const isActive = tab.id === this.activeTab;
      const tabText = this.add.text(tabX, tabY, tab.label, {
        fontSize: '10px',
        color: isActive ? COL.value : COL.textDim,
        fontFamily: FONT,
        backgroundColor: isActive ? COL.tabActive.toString(16).padStart(6, '0').replace(/^/, '#') : undefined,
        padding: { x: 4, y: 3 },
      }).setInteractive({ useHandCursor: true });

      tabText.on('pointerdown', () => {
        this.activeTab = tab.id;
        this.buildPanel();
      });
      tabText.on('pointerover', () => {
        if (tab.id !== this.activeTab) tabText.setColor(COL.btn);
      });
      tabText.on('pointerout', () => {
        if (tab.id !== this.activeTab) tabText.setColor(COL.textDim);
      });

      this.panelContainer.add(tabText);
      this.tabButtons.push(tabText);
      tabX += tabText.width + 6;
    }

    // Separatore
    const sep = this.add.rectangle(w / 2, tabY + TAB_H, w - PANEL_PAD * 2, 1, COL.panelBorder, 0.5);
    this.panelContainer.add(sep);

    // Contenuto tab
    const contentY = tabY + TAB_H + 8;
    this.renderTab(contentY);
  }

  private clearContent() {
    this.contentContainer.removeAll(true);
    this.liveValueTexts.clear();
  }

  private renderTab(startY: number) {
    this.clearContent();
    switch (this.activeTab) {
      case 'scene': this.renderSceneTab(startY); break;
      case 'stats': this.renderStatsTab(startY); break;
      case 'time': this.renderTimeTab(startY); break;
      case 'save': this.renderSaveTab(startY); break;
      case 'debug': this.renderDebugTab(startY); break;
    }
  }

  // ============================================
  // TAB: SCENE CONTROL
  // ============================================
  private renderSceneTab(y: number) {
    let cy = y;

    // Scena attiva
    const activeKey = this.getActiveSceneKey();
    this.addLabel(PANEL_PAD, cy, `Attiva: ${activeKey || '—'}`);
    cy += LINE_H + 4;

    // Fase corrente
    const gs = this.getGameState();
    if (gs) {
      this.addLabel(PANEL_PAD, cy, `Fase: ${gs.currentPhase}`);
      cy += LINE_H;
    }

    cy += 4;
    this.addSectionTitle(PANEL_PAD, cy, '— Vai a fase —');
    cy += LINE_H;

    // Bottoni per ogni fase gameplay
    for (const phase of GAMEPLAY_SCENES) {
      const sceneKey = SCENE_KEYS[phase];
      const btn = this.addButton(PANEL_PAD, cy, `[ ${phase.charAt(0).toUpperCase() + phase.slice(1)} ]`, () => {
        this.goToScene(sceneKey, phase);
      });
      // Evidenzia la scena attiva
      if (activeKey === sceneKey) {
        btn.setColor(COL.accent);
      }
      cy += LINE_H;
    }

    cy += 8;
    this.addSectionTitle(PANEL_PAD, cy, '— Altre scene —');
    cy += LINE_H;

    // Title e GameOver
    this.addButton(PANEL_PAD, cy, '[ Title ]', () => {
      this.resetTimeControl();
      this.stopAllGameplayScenes();
      this.scene.manager.start('TitleScene');
    });
    cy += LINE_H;

    this.addButton(PANEL_PAD, cy, '[ GameOver ]', () => {
      this.resetTimeControl();
      const state = this.getGameState() || createInitialGameState();
      this.stopAllGameplayScenes();
      this.scene.manager.start('GameOverScene', { gameState: state });
    });
    cy += LINE_H + 8;

    this.addSectionTitle(PANEL_PAD, cy, '— Condizioni iniziali —');
    cy += LINE_H;

    // Health/Hunger iniziali quando si cambia scena
    this.addLabel(PANEL_PAD, cy, 'Le scene si avviano con');
    cy += LINE_H - 4;
    this.addLabel(PANEL_PAD, cy, 'stato fresco (default).');
    cy += LINE_H - 4;
    this.addLabel(PANEL_PAD, cy, 'Usa tab Stats per modificare');
    cy += LINE_H - 4;
    this.addLabel(PANEL_PAD, cy, 'lo stato dopo il cambio.');
  }

  private goToScene(sceneKey: string, phase: LifePhase) {
    // Reset time control per evitare che la nuova scena parta congelata
    this.isTimePaused = false;
    this.gameTimeScale = 1;

    // Crea o recupera un GameState
    let gs = this.getGameState();
    if (!gs) {
      gs = createInitialGameState();
    }
    gs.currentPhase = phase;
    gs.phaseStartTime = Date.now();

    // Ferma tutte le scene di gameplay
    this.stopAllGameplayScenes();

    // Avvia la scena target
    this.scene.manager.start(sceneKey, { gameState: gs });
    this.scene.bringToTop();
    this.devLog(`Scena: ${sceneKey} (time reset 1x)`);

    // Aggiorna pannello
    if (this.panelOpen) {
      this.time.delayedCall(100, () => this.buildPanel());
    }
  }

  // ============================================
  // TAB: STATS & TRAITS
  // ============================================
  private renderStatsTab(y: number) {
    let cy = y;
    const gs = this.getGameState();

    if (!gs) {
      this.addLabel(PANEL_PAD, cy, 'Nessuna partita attiva.');
      cy += LINE_H;
      this.addLabel(PANEL_PAD, cy, 'Avvia una scena dal tab Scene.');
      return;
    }

    // Vitali
    this.addSectionTitle(PANEL_PAD, cy, '— Vitali —');
    cy += LINE_H;

    cy = this.addStatRow(cy, 'health', 'Salute', gs.player.health, 0, 100, (v) => { gs.player.health = v; });
    cy = this.addStatRow(cy, 'hunger', 'Fame', gs.player.hunger, 0, 100, (v) => { gs.player.hunger = v; });
    cy = this.addStatRow(cy, 'eggEnergy', 'Energia', gs.player.eggEnergy, 0, 100, (v) => { gs.player.eggEnergy = v; });

    // Reset vitali
    this.addButton(PANEL_PAD, cy, '[ Max tutti ]', () => {
      gs.player.health = 100;
      gs.player.hunger = 100;
      gs.player.eggEnergy = 100;
      this.devLog('Vitali al massimo');
      this.buildPanel();
    });
    cy += LINE_H + 8;

    // Stats genetici
    this.addSectionTitle(PANEL_PAD, cy, '— Stats (1-10) —');
    cy += LINE_H;

    const statKeys: (keyof Pick<typeof gs.player.traits, 'speed' | 'size' | 'stamina' | 'perception'>)[] =
      ['speed', 'size', 'stamina', 'perception'];

    for (const key of statKeys) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      cy = this.addStatRow(cy, `trait_${key}`, label, gs.player.traits[key], 1, 10, (v) => {
        gs.player.traits[key] = v;
      });
    }

    cy += 8;

    // Crescita e sviluppo
    this.addSectionTitle(PANEL_PAD, cy, '— Progresso —');
    cy += LINE_H;

    cy = this.addStatRow(cy, 'growth', 'Crescita', gs.player.growthProgress, 0, 100, (v) => {
      gs.player.growthProgress = v;
    });
    cy = this.addStatRow(cy, 'devProg', 'Sviluppo', gs.player.developmentProgress, 0, 100, (v) => {
      gs.player.developmentProgress = v;
    });

    cy += 8;

    // Mutazioni
    this.addSectionTitle(PANEL_PAD, cy, '— Mutazioni —');
    cy += LINE_H;

    const mutations: { key: keyof typeof gs.player.traits.mutations; label: string }[] = [
      { key: 'albino', label: 'Albino' },
      { key: 'gigantism', label: 'Gigantismo' },
      { key: 'neoteny', label: 'Neotenia' },
      { key: 'iridescent', label: 'Iridescente' },
    ];

    for (const mut of mutations) {
      const active = gs.player.traits.mutations[mut.key];
      this.addToggle(PANEL_PAD, cy, mut.label, active, () => {
        gs.player.traits.mutations[mut.key] = !gs.player.traits.mutations[mut.key];
        this.devLog(`${mut.label}: ${!active ? 'ON' : 'OFF'}`);
        this.buildPanel();
      });
      cy += LINE_H;
    }

    cy += 8;

    // Ambiente
    this.addSectionTitle(PANEL_PAD, cy, '— Stagno —');
    cy += LINE_H;

    cy = this.addStatRow(cy, 'pondSize', 'Dim. %', gs.pond.sizePercent, 5, 100, (v) => {
      gs.pond.sizePercent = v;
    }, 5);
    cy = this.addStatRow(cy, 'cycle', 'Ciclo', gs.pond.cycle, 1, 999, (v) => {
      gs.pond.cycle = v;
    });
    cy = this.addStatRow(cy, 'diff', 'Difficoltà', Math.round(gs.difficultyMultiplier * 100), 10, 300, (v) => {
      gs.difficultyMultiplier = v / 100;
    }, 10);
  }

  private addStatRow(
    cy: number,
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    setter: (v: number) => void,
    step = 1,
  ): number {
    const displayVal = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    const labelText = this.add.text(PANEL_PAD, cy, `${label}:`, {
      fontSize: '10px',
      color: COL.text,
      fontFamily: FONT,
    });
    this.contentContainer.add(labelText);

    const valText = this.add.text(PANEL_PAD + 90, cy, displayVal, {
      fontSize: '10px',
      color: COL.value,
      fontFamily: FONT,
    });
    this.contentContainer.add(valText);
    this.liveValueTexts.set(id, valText);

    // Bottone -
    const minusBtn = this.addSmallButton(PANEL_PAD + 130, cy, '-', () => {
      const newVal = Math.max(min, value - step);
      setter(newVal);
      value = newVal;
      valText.setText(Number.isInteger(newVal) ? newVal.toString() : newVal.toFixed(1));
    });
    this.contentContainer.add(minusBtn);

    // Bottone +
    const plusBtn = this.addSmallButton(PANEL_PAD + 155, cy, '+', () => {
      const newVal = Math.min(max, value + step);
      setter(newVal);
      value = newVal;
      valText.setText(Number.isInteger(newVal) ? newVal.toString() : newVal.toFixed(1));
    });
    this.contentContainer.add(plusBtn);

    // Bottone max
    const maxBtn = this.addSmallButton(PANEL_PAD + 180, cy, 'M', () => {
      setter(max);
      value = max;
      valText.setText(max.toString());
    });
    this.contentContainer.add(maxBtn);

    return cy + LINE_H;
  }

  // ============================================
  // TAB: TIME CONTROL
  // ============================================
  private renderTimeTab(y: number) {
    let cy = y;

    this.addSectionTitle(PANEL_PAD, cy, '— Velocità gioco —');
    cy += LINE_H;

    const scaleLabel = this.add.text(PANEL_PAD, cy, `Attuale: ${this.gameTimeScale}x${this.isTimePaused ? ' [PAUSA]' : ''}`, {
      fontSize: '11px',
      color: COL.value,
      fontFamily: FONT,
    });
    this.contentContainer.add(scaleLabel);
    cy += LINE_H + 4;

    // Bottoni velocità
    const speeds = [0.25, 0.5, 1, 2, 4, 8];
    let sx = PANEL_PAD;
    for (const speed of speeds) {
      const isActive = this.gameTimeScale === speed && !this.isTimePaused;
      const btn = this.addButton(sx, cy, `${speed}x`, () => {
        this.gameTimeScale = speed;
        this.isTimePaused = false;
        this.devLog(`Velocità: ${speed}x`);
        this.buildPanel();
      });
      if (isActive) btn.setColor(COL.accent);
      sx += btn.width + 6;
      if (sx > PANEL_W - PANEL_PAD - 20) {
        sx = PANEL_PAD;
        cy += LINE_H;
      }
    }
    cy += LINE_H + 8;

    // Pausa
    this.addSectionTitle(PANEL_PAD, cy, '— Controllo tempo —');
    cy += LINE_H;

    const pauseLabel = this.isTimePaused ? 'Riprendi' : 'Pausa';
    this.addButton(PANEL_PAD, cy, `[ ${pauseLabel} ]`, () => {
      this.isTimePaused = !this.isTimePaused;
      this.devLog(this.isTimePaused ? 'Tempo in pausa' : 'Tempo ripreso');
      this.buildPanel();
    });
    cy += LINE_H;

    // Frame step (solo quando in pausa)
    if (this.isTimePaused) {
      this.addButton(PANEL_PAD, cy, '[ Step +1 frame ]', () => {
        this.stepOneFrame();
      });
      cy += LINE_H;
    }

    cy += 4;

    // Avanzamento tempo
    this.addSectionTitle(PANEL_PAD, cy, '— Avanza tempo —');
    cy += LINE_H;

    const advances = [
      { label: '+10s', ms: 10_000 },
      { label: '+30s', ms: 30_000 },
      { label: '+60s', ms: 60_000 },
      { label: '+5min', ms: 300_000 },
    ];

    sx = PANEL_PAD;
    for (const adv of advances) {
      this.addButton(sx, cy, `[${adv.label}]`, () => {
        this.advanceTime(adv.ms);
      });
      sx += 55;
      if (sx > PANEL_W - PANEL_PAD - 30) {
        sx = PANEL_PAD;
        cy += LINE_H;
      }
    }
    cy += LINE_H + 8;

    // Info
    this.addLabel(PANEL_PAD, cy, 'Nota: avanza il timer della');
    cy += LINE_H - 6;
    this.addLabel(PANEL_PAD, cy, 'fase corrente (phaseStartTime).');
  }

  // ============================================
  // TAB: SAVE MANAGEMENT
  // ============================================
  private renderSaveTab(y: number) {
    let cy = y;

    this.addSectionTitle(PANEL_PAD, cy, '— Salvataggio —');
    cy += LINE_H;

    // Info save corrente
    const savedState = loadGame();
    if (savedState) {
      const date = new Date(savedState.lastSaveTime);
      this.addLabel(PANEL_PAD, cy, `Ultimo: ${date.toLocaleString('it-IT')}`);
      cy += LINE_H - 4;
      this.addLabel(PANEL_PAD, cy, `Fase: ${savedState.currentPhase} | Ciclo: ${savedState.pond.cycle}`);
      cy += LINE_H;
    } else {
      this.addLabel(PANEL_PAD, cy, 'Nessun salvataggio trovato.');
      cy += LINE_H;
    }

    cy += 4;

    // Esporta JSON
    this.addButton(PANEL_PAD, cy, '[ Esporta stato corrente ]', () => {
      const gs = this.getGameState();
      if (!gs) {
        this.devLog('Nessuno stato da esportare');
        return;
      }
      const json = JSON.stringify(gs, null, 2);
      this.copyToClipboard(json);
      this.devLog('Stato copiato in clipboard');
    });
    cy += LINE_H;

    // Esporta save da localStorage
    this.addButton(PANEL_PAD, cy, '[ Esporta save localStorage ]', () => {
      const raw = localStorage.getItem('salamandra_cycles_save');
      if (!raw) {
        this.devLog('Nessun save in localStorage');
        return;
      }
      this.copyToClipboard(raw);
      this.devLog('Save copiato in clipboard');
    });
    cy += LINE_H + 4;

    // Importa JSON
    this.addButton(PANEL_PAD, cy, '[ Importa JSON ]', () => {
      const json = window.prompt('Incolla il JSON del GameState:');
      if (!json) return;
      try {
        const state = JSON.parse(json) as GameState;
        saveGame(state);
        this.devLog('Save importato con successo');
        // Ricarica nella scena corretta
        this.resetTimeControl();
        this.stopAllGameplayScenes();
        const sceneKey = SCENE_KEYS[state.currentPhase] || 'EggScene';
        this.scene.manager.start(sceneKey, { gameState: state });
        this.scene.bringToTop();
        this.buildPanel();
      } catch (e) {
        this.devLog(`Errore import: ${e}`);
        window.alert('JSON non valido');
      }
    });
    cy += LINE_H + 4;

    // Salva ora
    this.addButton(PANEL_PAD, cy, '[ Salva stato corrente ]', () => {
      const gs = this.getGameState();
      if (gs) {
        saveGame(gs);
        this.devLog('Stato salvato');
        this.buildPanel();
      } else {
        this.devLog('Nessuno stato da salvare');
      }
    });
    cy += LINE_H;

    // Cancella save
    this.addButton(PANEL_PAD, cy, '[ Cancella save ]', () => {
      deleteSave();
      this.devLog('Save cancellato');
      this.buildPanel();
    }, COL.danger);
    cy += LINE_H + 4;

    // Nuovo GameState
    this.addButton(PANEL_PAD, cy, '[ Nuovo GameState fresco ]', () => {
      this.resetTimeControl();
      const gs = createInitialGameState();
      this.stopAllGameplayScenes();
      this.scene.manager.start('EggScene', { gameState: gs });
      this.scene.bringToTop();
      this.devLog('Nuovo GameState creato');
      this.buildPanel();
    });
    cy += LINE_H + 4;

    // Scarica file
    this.addButton(PANEL_PAD, cy, '[ Scarica come file ]', () => {
      const gs = this.getGameState();
      if (!gs) {
        this.devLog('Nessuno stato da scaricare');
        return;
      }
      const json = JSON.stringify(gs, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cycles_save_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.devLog('File scaricato');
    });
  }

  // ============================================
  // TAB: DEBUG OVERLAY
  // ============================================
  private renderDebugTab(y: number) {
    let cy = y;

    this.addSectionTitle(PANEL_PAD, cy, '— Overlay —');
    cy += LINE_H;

    const toggles: { key: string; label: string }[] = [
      { key: 'showFps', label: 'FPS' },
      { key: 'showStateOverlay', label: 'Stato giocatore' },
      { key: 'showHitboxes', label: 'Hitboxes (physics)' },
      { key: 'showCameraInfo', label: 'Info camera' },
      { key: 'showViewportEdges', label: 'Bordi viewport' },
      { key: 'showLog', label: 'Log eventi' },
    ];

    for (const toggle of toggles) {
      const active = this.overlayFlags[toggle.key];
      this.addToggle(PANEL_PAD, cy, toggle.label, active, () => {
        this.overlayFlags[toggle.key] = !active;
        if (toggle.key === 'showHitboxes') {
          this.togglePhysicsDebug(!active);
        }
        if (toggle.key === 'showFps') {
          this.fpsText.setVisible(!active);
        }
        this.buildPanel();
      });
      cy += LINE_H;
    }

    cy += 8;

    this.addSectionTitle(PANEL_PAD, cy, '— Azioni —');
    cy += LINE_H;

    // Mostra tutti gli oggetti della scena attiva
    this.addButton(PANEL_PAD, cy, '[ Log oggetti scena ]', () => {
      const scene = this.getActiveGameplayScene();
      if (scene) {
        const children = scene.children.list;
        this.devLog(`Oggetti: ${children.length}`);
        for (const child of children.slice(0, 20)) {
          const go = child as Phaser.GameObjects.GameObject & { x?: number; y?: number };
          this.devLog(`  ${child.type} @ ${Math.round(go.x || 0)},${Math.round(go.y || 0)}`);
        }
      }
    });
    cy += LINE_H;

    // Log GameState completo
    this.addButton(PANEL_PAD, cy, '[ Log GameState ]', () => {
      const gs = this.getGameState();
      if (gs) {
        console.log('GameState:', gs);
        this.devLog('GameState stampato in console');
      }
    });
    cy += LINE_H;

    // Pulisci log
    this.addButton(PANEL_PAD, cy, '[ Pulisci log ]', () => {
      this.logEntries = [];
      this.devLog('Log pulito');
    });
    cy += LINE_H + 8;

    // Info performance
    this.addSectionTitle(PANEL_PAD, cy, '— Performance —');
    cy += LINE_H;

    const renderer = this.game.renderer;
    if (renderer) {
      this.addLabel(PANEL_PAD, cy, `Renderer: ${renderer.type === 1 ? 'Canvas' : 'WebGL'}`);
      cy += LINE_H - 4;
      this.addLabel(PANEL_PAD, cy, `Canvas: ${this.scale.width}x${this.scale.height}`);
      cy += LINE_H - 4;

      const sceneCount = this.scene.manager.scenes.length;
      const activeCount = this.scene.manager.scenes.filter(
        s => s.scene.isActive()
      ).length;
      this.addLabel(PANEL_PAD, cy, `Scene: ${activeCount}/${sceneCount} attive`);
    }
  }

  // ============================================
  // HELPER: GameState e Scene
  // ============================================
  private getGameState(): GameState | null {
    const scene = this.getActiveGameplayScene();
    if (scene && 'gameState' in scene) {
      return (scene as unknown as { gameState: GameState }).gameState;
    }
    return null;
  }

  private getActiveGameplayScene(): Phaser.Scene | null {
    const keys = ['EggScene', 'LarvaScene', 'JuvenileScene', 'AdultScene', 'GameOverScene'];
    for (const key of keys) {
      const scene = this.scene.manager.getScene(key);
      if (scene && (scene.scene.isActive() || scene.scene.isPaused())) {
        return scene;
      }
    }
    return null;
  }

  private getActiveSceneKey(): string | null {
    const allKeys = [
      'TitleScene', 'IntroScene', 'BootScene',
      'EggScene', 'LarvaScene', 'JuvenileScene', 'AdultScene',
      'GameOverScene', 'PauseScene',
    ];
    for (const key of allKeys) {
      const scene = this.scene.manager.getScene(key);
      if (scene && scene.scene.isActive() && key !== 'DevToolsScene') {
        return key;
      }
    }
    return null;
  }

  private stopAllGameplayScenes() {
    const keys = [
      'TitleScene', 'IntroScene', 'BootScene',
      'EggScene', 'LarvaScene', 'JuvenileScene', 'AdultScene',
      'GameOverScene', 'PauseScene',
    ];
    for (const key of keys) {
      const scene = this.scene.manager.getScene(key);
      if (scene && scene.scene.isActive()) {
        this.scene.manager.stop(key);
      }
    }
  }

  // ============================================
  // HELPER: Time Control
  // ============================================
  private resetTimeControl() {
    // Riprendi la scena se era in pausa tempo
    if (this.isTimePaused) {
      const scene = this.getActiveGameplayScene();
      if (scene && scene.scene.isPaused()) {
        scene.scene.resume();
      }
    }
    this.isTimePaused = false;
    this.gameTimeScale = 1;
  }

  private applyTimeScale() {
    const scene = this.getActiveGameplayScene();
    if (!scene) return;

    if (this.isTimePaused) {
      // Pausa completa: ferma update, input, timer, tweens
      if (scene.scene.isActive()) {
        scene.scene.pause();
      }
    } else {
      // Riprendi se era in pausa
      if (scene.scene.isPaused()) {
        scene.scene.resume();
      }
      scene.time.timeScale = this.gameTimeScale;
      scene.tweens.timeScale = this.gameTimeScale;
      if (scene.physics?.world) {
        // Physics timeScale è invertito: valore alto = più lento
        scene.physics.world.timeScale = 1 / this.gameTimeScale;
      }
    }
  }

  private stepOneFrame() {
    const scene = this.getActiveGameplayScene();
    if (!scene) return;

    // Riprendi per un frame, poi ripausa
    if (scene.scene.isPaused()) {
      scene.scene.resume();
    }

    this.time.delayedCall(20, () => {
      if (scene.scene.isActive()) {
        scene.scene.pause();
      }
    });

    this.devLog('Step +1 frame');
  }

  private advanceTime(ms: number) {
    const gs = this.getGameState();
    if (gs) {
      // Anticipiamo il phaseStartTime per far credere alla scena
      // che sia passato più tempo
      gs.phaseStartTime -= ms;
      this.devLog(`Tempo avanzato: +${ms / 1000}s`);
    }
  }

  // ============================================
  // HELPER: Debug Overlay
  // ============================================
  private positionFps() {
    const x = this.panelOpen ? PANEL_W + 8 : this.scale.width - 70;
    this.fpsText.setPosition(x, 8);
  }

  private positionOverlays() {
    const x = this.panelOpen ? PANEL_W + 8 : this.scale.width - 160;
    this.stateText.setPosition(x, 24);
  }

  private togglePhysicsDebug(enable: boolean) {
    const scene = this.getActiveGameplayScene();
    if (!scene || !scene.physics?.world) return;

    if (enable) {
      scene.physics.world.drawDebug = true;
      if (!scene.physics.world.debugGraphic) {
        scene.physics.world.createDebugGraphic();
      }
      scene.physics.world.debugGraphic?.setVisible(true);
    } else {
      scene.physics.world.drawDebug = false;
      scene.physics.world.debugGraphic?.clear();
      scene.physics.world.debugGraphic?.setVisible(false);
    }
    this.devLog(`Hitboxes: ${enable ? 'ON' : 'OFF'}`);
  }

  private drawViewportEdges() {
    this.viewportGfx.clear();
    this.viewportGfx.setVisible(true);

    const scene = this.getActiveGameplayScene();
    if (!scene) return;

    const cam = scene.cameras.main;

    // Usa le proprietà x, y, width, height della camera
    this.viewportGfx.lineStyle(1, 0xff6600, 0.6);
    this.viewportGfx.strokeRect(cam.x, cam.y, cam.width, cam.height);

    // Centro camera
    const cx = cam.x + cam.width / 2;
    const cy = cam.y + cam.height / 2;
    this.viewportGfx.lineStyle(1, 0xffcc00, 0.4);
    this.viewportGfx.lineBetween(cx - 10, cy, cx + 10, cy);
    this.viewportGfx.lineBetween(cx, cy - 10, cx, cy + 10);
  }

  // ============================================
  // HELPER: UI Components
  // ============================================
  private addLabel(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, text, {
      fontSize: '10px',
      color: COL.text,
      fontFamily: FONT,
    });
    this.contentContainer.add(t);
    return t;
  }

  private addSectionTitle(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, text, {
      fontSize: '10px',
      color: COL.accent,
      fontFamily: FONT,
    });
    this.contentContainer.add(t);
    return t;
  }

  private addButton(x: number, y: number, text: string, callback: () => void, color?: string): Phaser.GameObjects.Text {
    const btnColor = color || COL.btn;
    const btn = this.add.text(x, y, text, {
      fontSize: '10px',
      color: btnColor,
      fontFamily: FONT,
    }).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor(COL.btnHover));
    btn.on('pointerout', () => btn.setColor(btnColor));
    btn.on('pointerdown', callback);

    this.contentContainer.add(btn);
    return btn;
  }

  private addSmallButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, `[${text}]`, {
      fontSize: '10px',
      color: COL.btn,
      fontFamily: FONT,
    }).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor(COL.btnHover));
    btn.on('pointerout', () => btn.setColor(COL.btn));
    btn.on('pointerdown', callback);

    return btn;
  }

  private addToggle(x: number, y: number, label: string, active: boolean, callback: () => void) {
    const prefix = active ? '[x]' : '[ ]';
    const color = active ? COL.toggle_on : COL.toggle_off;
    const btn = this.add.text(x, y, `${prefix} ${label}`, {
      fontSize: '10px',
      color,
      fontFamily: FONT,
    }).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor(COL.btnHover));
    btn.on('pointerout', () => btn.setColor(color));
    btn.on('pointerdown', callback);

    this.contentContainer.add(btn);
    return btn;
  }

  // ============================================
  // HELPER: Update live values
  // ============================================
  private updateLiveValues() {
    const gs = this.getGameState();
    if (!gs) return;

    const updates: Record<string, number> = {
      health: gs.player.health,
      hunger: gs.player.hunger,
      eggEnergy: gs.player.eggEnergy,
      trait_speed: gs.player.traits.speed,
      trait_size: gs.player.traits.size,
      trait_stamina: gs.player.traits.stamina,
      trait_perception: gs.player.traits.perception,
      growth: gs.player.growthProgress,
      devProg: gs.player.developmentProgress,
      pondSize: gs.pond.sizePercent,
      cycle: gs.pond.cycle,
      diff: Math.round(gs.difficultyMultiplier * 100),
    };

    for (const [id, val] of Object.entries(updates)) {
      const text = this.liveValueTexts.get(id);
      if (text) {
        const display = Number.isInteger(val) ? val.toString() : val.toFixed(1);
        text.setText(display);
      }
    }
  }

  // ============================================
  // HELPER: Log & Clipboard
  // ============================================
  private devLog(message: string) {
    const ts = new Date().toLocaleTimeString('it-IT', { hour12: false });
    this.logEntries.push(`[${ts}] ${message}`);
    if (this.logEntries.length > 50) {
      this.logEntries = this.logEntries.slice(-50);
    }
  }

  private setupLogInterceptor() {
    const originalLog = console.log.bind(console);
    const self = this;
    console.log = function (...args: unknown[]) {
      originalLog(...args);
      const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      self.devLog(msg);
    };
  }

  private copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
