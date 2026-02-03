# Salamandra: Cicli di Vita

Gioco survival ciclico in Phaser 3 + TypeScript + Vite. Vivi la vita di una salamandra, generazione dopo generazione.

## Comandi

```bash
pnpm dev          # Avvia dev server (http://localhost:3000)
pnpm dev:trial    # Avvia in modalità trial (cicli veloci, debug attivo)
pnpm build        # Build produzione (tsc + vite build)
pnpm preview      # Preview build locale
```

## Struttura

```
src/
  main.ts                  # Entry point, config Phaser, scene placeholder
  config/gameConfig.ts     # Tutte le costanti e parametri di bilanciamento
  data/traits.ts           # Sistema genetico
  systems/GameState.ts     # Stato globale e salvataggio (localStorage)
  scenes/
    TitleScene.ts          # Menu iniziale + IntroScene (nello stesso file)
    BootScene.ts           # Caricamento assets
    EggScene.ts            # Fase 1: uovo
    LarvaScene.ts          # Fase 2: larva
    PauseScene.ts          # Overlay pausa (ESC)
```

JuvenileScene, AdultScene e GameOverScene sono placeholder definiti in `main.ts`.

## Canvas e viewport

- Canvas: 400x600, pixel art mode, scale FIT con center both
- Il viewport di gioco si espande progressivamente durante le fasi (zoom camera dinamico)
- Le dimensioni viewport per fase sono in `VIEWPORT` dentro `gameConfig.ts`

## Scene

- Le scene di gameplay ricevono `{ gameState: GameState }` via `init(data)`
- PauseScene si sovrappone alla scena attiva tramite `scene.launch()` / `scene.pause()`, riceve `{ parentScene: string }`
- TitleScene e IntroScene sono nello stesso file (`TitleScene.ts`)
- Transizioni tra scene usano `cameras.main.fadeIn/fadeOut`

## Stile UI

- Font menu/UI: `monospace`
- Font titoli: `Georgia, serif`, italic
- Bottoni: formato `[ Testo ]`, colore `#c9d4b8`, hover `#e9f4d8` con scale 1.05
- Sfondo scuro, palette verdi naturali (vedi `COLORS` in gameConfig)

## Convenzioni

- Lingua del codice: commenti e stringhe UI in italiano
- Nessuna barra vita/fame visibile: feedback solo visuale sul personaggio
- Path alias: `@/` mappa a `src/` (configurato in tsconfig e vite)
- Quando una modifica ha impatto su architettura, scene, flussi o struttura del progetto, aggiornare i file in `docs/` (ARCHITECTURE.md, GAME_DESIGN_DOCUMENT.md, CHANGELOG.md)
