# Cycles

Gioco survival ciclico in Phaser 3 + TypeScript + Vite. Vivi la vita di una salamandra, generazione dopo generazione.

## Comandi

```bash
pnpm dev          # Avvia dev server (http://localhost:3000)
pnpm dev:trial    # Avvia in modalità trial (cicli veloci, debug attivo)
pnpm build        # Build produzione (tsc + vite build)
pnpm preview      # Preview build locale
pnpm surge        # Build + deploy su cycles.pedrodim.dev via surge.sh
```

## Struttura

```
src/
  main.ts                  # Entry point, config Phaser, scene placeholder
  vite-env.d.ts            # Tipi Vite (import.meta.env/hot)
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

- Canvas: fullscreen (`width: '100%'`, `height: '100%'`), scale RESIZE, sfondo nero
- Pixel art disabilitato (`pixelArt: false`, `antialias: true`)
- Le scene usano coordinate dinamiche (`this.scale.width/height`) e non valori hardcoded
- EggScene usa `cam.setViewport()` per creare un viewport quadrato centrato che parte piccolo (35%) e cresce (75%)
- Le dimensioni viewport mondo per fase sono in `VIEWPORT` dentro `gameConfig.ts`

## Scene

- Le scene di gameplay ricevono `{ gameState: GameState }` via `init(data)`
- PauseScene si sovrappone alla scena attiva tramite `scene.launch()` / `scene.pause()`, riceve `{ parentScene: string, gameState: GameState }`
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

## IMPORTANTE: checklist pre-commit

Queste regole vanno SEMPRE seguite prima di ogni commit:

1. **Verificare TypeScript**: eseguire `npx tsc --noEmit` e correggere tutti gli errori prima di committare
2. **Aggiornare docs/**: se la modifica ha impatto su architettura, scene, flussi o struttura del progetto, aggiornare i file in `docs/` (ARCHITECTURE.md, GAME_DESIGN_DOCUMENT.md, CHANGELOG.md)
