# 🛠 Architettura Tecnica

## Panoramica

```
┌─────────────────────────────────────────────────────────────┐
│                         PHASER 3                            │
│                    (Game Engine Core)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    SCENES     │    │   SYSTEMS     │    │     DATA      │
│               │    │               │    │               │
│ TitleScene    │    │ GameState     │    │ traits.ts     │
│ IntroScene    │    │ (salvataggio) │    │ (genetica)    │
│ EggScene      │    │               │    │               │
│ LarvaScene    │    │               │    │ gameConfig.ts │
│ PauseScene    │    │               │    │ (costanti)    │
│ DevToolsScene*│    │               │    │               │
│ JuvenileScene │    │               │    │               │
│ AdultScene    │    │               │    │               │
│ GameOverScene │    │               │    │               │
│               │    │               │    │               │
│ * solo DEV    │    │               │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Struttura File

```
salamandra-cycles/
│
├── src/
│   ├── main.ts                 # Entry point, config Phaser
│   │
│   ├── config/
│   │   └── gameConfig.ts       # TUTTE le costanti di gioco
│   │
│   ├── data/
│   │   └── traits.ts           # Sistema genetico completo
│   │
│   ├── systems/
│   │   └── GameState.ts        # Stato globale, salvataggio
│   │
│   ├── scenes/
│   │   ├── TitleScene.ts       # Menu iniziale + New Game+
│   │   ├── BootScene.ts        # Caricamento assets
│   │   ├── EggScene.ts         # Fase 1
│   │   ├── LarvaScene.ts       # Fase 2
│   │   ├── PauseScene.ts       # Overlay pausa (ESC)
│   │   ├── DevToolsScene.ts    # Dev tools (solo DEV build)
│   │   ├── JuvenileScene.ts    # Fase 3 (placeholder)
│   │   └── AdultScene.ts       # Fase 4 (placeholder)
│   │
│   ├── entities/               # (TODO) Classi entità
│   ├── effects/                # (TODO) Effetti visivi
│   └── utils/                  # (TODO) Utility functions
│
├── public/
│   └── assets/
│       ├── sprites/            # Sprite salamandra e altri
│       ├── tiles/              # Tileset ambiente
│       └── ui/                 # Elementi UI
│
├── docs/
│   ├── GAME_DESIGN_DOCUMENT.md # Design del gioco
│   ├── ARCHITECTURE.md         # Questo file
│   └── inspiration.jpg         # Immagine di riferimento
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## Flusso delle Scene

```
                    ┌──────────────┐
                    │  TitleScene  │
                    │  (menu)      │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    [Nuovo Ciclo]    [Continua]      [New Game+]
           │               │               │
           ▼               │               ▼
    ┌──────────────┐       │        ┌──────────────┐
    │  IntroScene  │       │        │  IntroScene  │
    │  (testi)     │       │        │  (testi NG+) │
    └──────┬───────┘       │        └──────┬───────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   EggScene   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  LarvaScene  │◄────────────┐
                    └──────┬───────┘             │
                           │              [respawn fratello]
                           ▼                     │
                    ┌──────────────┐             │
                    │JuvenileScene │             │
                    └──────┬───────┘             │
                           │                     │
                           ▼                     │
                    ┌──────────────┐             │
                    │  AdultScene  │─────────────┤
                    └──────┬───────┘             │
                           │                     │
              ┌────────────┼────────────┐        │
              │            │            │        │
              ▼            ▼            ▼        │
        [deposizione] [deposizione] [nessuna    │
        [normale]     [crepe]       deposizione]│
              │            │            │        │
              │            │            ▼        │
              │            │     ┌──────────────┐│
              │            │     │ GameOverScene││
              │            │     └──────────────┘│
              │            │                     │
              │            ▼                     │
              │     ┌──────────────┐             │
              │     │  TitleScene  │             │
              │     │ (NG+ unlock) │             │
              │     └──────────────┘             │
              │                                  │
              └──────────► EggScene ◄────────────┘
                        (nuovo ciclo)
```

---

## GameState

### Struttura Principale

```typescript
interface GameState {
  // Fase corrente
  currentPhase: 'egg' | 'larva' | 'juvenile' | 'adult';
  phaseStartTime: number;
  
  // Player
  player: SalamanderState;
  
  // Fratelli (per respawn)
  siblings: SiblingState[];
  siblingsSurvived: number;
  canRespawnAsSibling: boolean;
  
  // Ambiente
  pond: PondState;
  
  // Sociale
  relationships: Relationship[];
  
  // Difficoltà adattiva
  difficultyMultiplier: number;
  consecutiveDeaths: number;
  
  // Meta
  totalPlayTime: number;
  cyclesCompleted: number;
  lastSaveTime: number;
}
```

### Flusso Dati

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Scene     │────►│  GameState  │────►│ LocalStorage│
│  (update)   │     │  (memoria)  │     │  (persist)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Entità    │     │   Traits    │
│  (player,   │     │ (genetica)  │
│  predatori) │     │             │
└─────────────┘     └─────────────┘
```

### Salvataggio

**Chiavi LocalStorage:**
- `salamandra_cycles_save` - Stato gioco principale
- `salamandra_newgameplus` - Dati New Game+

**Quando si salva:**
- Fine di ogni fase
- Icona rotante come feedback

**Formato:**
```typescript
// Serializzato come JSON
localStorage.setItem('salamandra_cycles_save', JSON.stringify(gameState));
```

---

## Sistema Genetico

### Flusso Eredità

```
     Parent 1                    Parent 2
        │                           │
        │    ┌─────────────────┐    │
        └───►│  inheritTraits  │◄───┘
             │                 │
             │  - Stats        │
             │  - Colori       │
             │  - Albinismo    │
             │  - Mutazioni    │
             └────────┬────────┘
                      │
                      ▼
                ┌───────────┐
                │   Child   │
                │  Traits   │
                └───────────┘
```

### Albinismo (Mendeliano)

```typescript
// Genotipo
type AlbinismAllele = 'A' | 'a';
interface AlbinismGenotype {
  alleles: [AlbinismAllele, AlbinismAllele];
}

// Eredità
function inheritAlbinism(g1, g2): AlbinismGenotype {
  const allele1 = g1.alleles[random() < 0.5 ? 0 : 1];
  const allele2 = g2.alleles[random() < 0.5 ? 0 : 1];
  return { alleles: [allele1, allele2] };
}

// Fenotipo
function isAlbino(g): boolean {
  return g.alleles[0] === 'a' && g.alleles[1] === 'a';
}
```

---

## Scene: Pattern Comune

Ogni scena di gameplay segue questo pattern:

```typescript
class PhaseScene extends Phaser.Scene {
  private gameState!: GameState;
  
  // Elementi grafici
  private player!: Phaser.GameObjects.Sprite;
  
  // Timer
  private phaseTimer!: Phaser.Time.TimerEvent;
  
  // ===== LIFECYCLE =====
  
  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
  }
  
  create() {
    this.createWorld();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.setupTimers();
    this.cameras.main.fadeIn(1000);
  }
  
  update(time: number, delta: number) {
    this.updateMovement(delta);
    this.checkCollisions();
    this.gameState.totalPlayTime += delta;
  }
  
  // ===== SETUP =====
  
  private createWorld() { /* ... */ }
  private createPlayer() { /* ... */ }
  private setupCamera() { /* ... */ }
  private setupInput() { /* ... */ }
  private setupTimers() { /* ... */ }
  
  // ===== GAMEPLAY =====
  
  private updateMovement(delta: number) { /* ... */ }
  private checkCollisions() { /* ... */ }
  
  // ===== TRANSIZIONI =====
  
  private onPhaseComplete() {
    saveGame(this.gameState);
    this.cameras.main.fadeOut(1000);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('NextScene', { gameState: this.gameState });
    });
  }
  
  private onDeath(cause: string) { /* ... */ }
}
```

---

## Configurazione Phaser

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  // Canvas fullscreen
  width: '100%',
  height: '100%',

  // Rendering (no pixel art)
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  backgroundColor: 0x000000,

  // Scaling: riempie la finestra
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  // Physics semplice (no gravità)
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } },
  },

  // Scene in ordine
  scene: [
    TitleScene,
    IntroScene,
    BootScene,
    EggScene,
    LarvaScene,
    JuvenileScene,
    AdultScene,
    GameOverScene,
    PauseScene,
  ],
};
```

---

## Effetti Visivi

### Bollicine

```typescript
emitBubbles(count: number) {
  for (let i = 0; i < count; i++) {
    const bubble = this.add.circle(x, y, 2 + random() * 2, 0xffffff, 0.5);
    
    this.tweens.add({
      targets: bubble,
      y: y - 30 - random() * 20,
      alpha: 0,
      duration: 800,
      onComplete: () => bubble.destroy(),
    });
  }
}
```

### Luccichio (Sparkles)

```typescript
emitSparkles() {
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const spark = this.add.circle(x, y, 2, 0xffffff);
    
    this.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * 25,
      y: y + Math.sin(angle) * 25,
      alpha: 0,
      duration: 600,
      onComplete: () => spark.destroy(),
    });
  }
}
```

### Scuotimento Crescita

```typescript
shakeGrowth() {
  this.tweens.add({
    targets: this.player,
    scaleX: 1.15,
    scaleY: 1.15,
    duration: 100,
    yoyo: true,
    repeat: 2,
    onComplete: () => {
      this.player.setScale(newScale);
      this.emitSparkles();
    },
  });
}
```

---

## Camera e Viewport

### Viewport Dinamico (EggScene)

```typescript
// Il viewport su schermo è un quadrato centrato che cresce
// screenViewportSize: dimensione su schermo (35% → 75% di min(width, height))
// currentViewportSize: dimensione mondo visibile (64 → 96 pixel)
// zoom = screenViewportSize / currentViewportSize

expandViewport(progress: number) {
  const maxSquare = Math.min(this.scale.width, this.scale.height);
  const targetScreenSize = Phaser.Math.Linear(maxSquare * 0.35, maxSquare * 0.75, progress);
  const targetWorldSize = Phaser.Math.Linear(VIEWPORT.egg.initial, VIEWPORT.egg.final, progress);

  this.tweens.add({
    targets: this,
    screenViewportSize: targetScreenSize,
    currentViewportSize: targetWorldSize,
    duration: 2000,
    onUpdate: () => this.applyViewport(),
  });
}
```

### Follow Player

```typescript
this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
```

---

## Input

### Point-and-Click

```typescript
this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  this.setMoveTarget(worldPoint.x, worldPoint.y);
});
```

### Movimento

```typescript
updateMovement(delta: number) {
  if (!this.isMoving || !this.targetX || !this.targetY) return;
  
  const distance = Phaser.Math.Distance.Between(
    this.player.x, this.player.y,
    this.targetX, this.targetY
  );
  
  if (distance < 5) {
    this.isMoving = false;
    return;
  }
  
  const moveDistance = MOVEMENT.larva.speed * (delta / 1000);
  const angle = Phaser.Math.Angle.Between(
    this.player.x, this.player.y,
    this.targetX, this.targetY
  );
  
  this.player.x += Math.cos(angle) * moveDistance;
  this.player.y += Math.sin(angle) * moveDistance;
}
```

---

## Testing

### Modalità Trial

```bash
# Avvia in modalità trial (cicli veloci)
pnpm dev:trial
```

Differenze:
- Cicli 2.5x più veloci
- Debug overlay abilitato
- Console logging attivo

### Dev Tools (build sviluppo e PR preview)

In build di sviluppo (`pnpm dev`, `pnpm dev:trial`) e nelle PR preview,
è disponibile un pannello strumenti sviluppatore accessibile dal **menu pausa**.

**Accesso:** Bottone pausa `||` (alto a sinistra) → `[ Dev Tools ]`

**Funzionalità:**
- **Scene Control** - Navigazione diretta a qualsiasi scena/fase
- **Stats Editor** - Modifica in tempo reale di vitali, stats, mutazioni, stagno
- **Time Control** - Velocità (0.25x–8x), pausa completa (`scene.pause()`), frame-step, avanzamento tempo
- **Save Management** - Export/import JSON, download file, copia clipboard
- **Debug Overlay** - FPS, stato giocatore, hitboxes, info camera, bordi viewport, log eventi

**Gating:** Il pannello è importato dinamicamente con `import.meta.env.DEV || import.meta.env.VITE_DEVTOOLS`.
In sviluppo è sempre attivo. Nelle PR preview si attiva tramite `VITE_DEVTOOLS=true` nel workflow.
In produzione viene completamente eliminato dal bundle (tree-shaking).

### Debug Console

In modalità trial, il gioco è esposto globalmente:

```javascript
// Browser console
game.scene.scenes  // Lista scene
game.scene.getScene('EggScene').gameState  // Stato corrente
```

---

## Performance

### Ottimizzazioni Applicate

1. **Antialias mode** - Rendering smooth per sprite ad alta risoluzione
2. **Object pooling** - (TODO) Per particelle e proiettili
3. **Lazy loading** - Assets caricati on-demand
4. **Minimal DOM** - Solo un canvas

### Target

- 60 FPS su desktop
- 30+ FPS su mobile medio
- < 50MB memoria

---

## Build e Deploy

### Sviluppo

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

### Produzione

```bash
pnpm build      # Output in /dist
pnpm preview    # Test build locale
```

### Deploy

Il contenuto di `/dist` può essere servito da qualsiasi hosting statico:
- Netlify
- Vercel
- GitHub Pages
- itch.io

---

## TODO Tecnici

### Priorità Alta
- [ ] Sistema particelle poolato
- [ ] Sprite atlas per performance
- [ ] Service worker per offline

### Priorità Media
- [ ] Salvataggio cloud (opzionale)
- [ ] Analytics eventi (opzionale)
- [ ] Internazionalizzazione

### Priorità Bassa
- [ ] Replay system
- [ ] Screenshot sharing
- [ ] Achievements
