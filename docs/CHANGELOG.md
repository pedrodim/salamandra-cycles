# 📝 Changelog e Note di Sviluppo

## Versione 0.4.0 (Corrente)

### Nuove Funzionalità

#### Controlli tastiera
- Movimento con **frecce direzionali** in LarvaScene (in aggiunta al click-to-move)
- Shortcut **backtick (`)** per aprire/chiudere i Dev Tools rapidamente
- Le frecce cancellano il target click-to-move, permettendo movimento continuo
- Supporto movimento diagonale normalizzato

#### Dev Tools in-game
- Pannello strumenti sviluppatore accessibile dal menu pausa (`||` → Dev Tools) o con tasto **`** (backtick)
- **Scene Control**: navigazione diretta a qualsiasi scena con stato personalizzabile
- **Stats Editor**: modifica in tempo reale di vitali, stats genetici, mutazioni, parametri stagno
- **Time Control**: velocità 0.25x–8x, pausa completa (`scene.pause()`), frame-step, avanzamento tempo
- **Save Management**: export/import JSON, download file, copia clipboard, cancellazione save
- **Debug Overlay**: FPS, stato giocatore live, hitboxes physics, info camera, bordi viewport, log eventi
- Gated con `import.meta.env.DEV || VITE_DEVTOOLS`, eliminato in produzione
- Attivo anche sulle PR preview (via `VITE_DEVTOOLS=true` nel workflow)
- Intercettazione console.log per visualizzazione log in-game
- Aggiornamento live dei valori nel pannello stats

#### Bottone pausa in-game
- Bottone `||` visibile in alto a sinistra in tutte le scene di gameplay (Egg, Larva) e nella IntroScene
- Accesso al menu pausa anche tramite ESC
- Dal menu pausa si accede ai Dev Tools (build sviluppo e PR preview)

### Bug Fix
- Cambio scena con tempo in pausa non congela più la nuova scena (reset automatico time control)
- La pausa tempo ora blocca completamente il gameplay (usa `scene.pause()` invece di `timeScale=0`)
- Il resume dopo pausa tempo funziona correttamente (ricerca scene anche in stato paused)

---

## Versione 0.3.0

### Nuove Funzionalità

#### Canvas Fullscreen
- Il canvas ora occupa tutta la finestra del browser (`Phaser.Scale.RESIZE`)
- Tutte le scene usano coordinate dinamiche (`this.scale.width/height`)
- Sfondo canvas nero, ogni scena gestisce il proprio viewport

#### Viewport Quadrato (EggScene)
- L'EggScene usa `cam.setViewport()` per un quadrato centrato
- Il viewport parte piccolo (35% dello schermo) e cresce fino al 75%
- Sia la dimensione su schermo che la dimensione mondo si espandono durante lo sviluppo

#### Sprite Uova
- Aggiunte 3 sprite uovo (egg_1, egg_2, egg_3) per gli stadi di sviluppo
- Disabilitato pixel art mode, attivato antialias per rendering smooth

### Modifiche
- PauseScene ora riceve anche `gameState` e mostra ciclo attuale e tempo trascorso
- IntroScene: aggiunto bottone Skip
- PauseScene e TitleScene: coordinate dinamiche per supporto fullscreen

---

## Versione 0.2.0

### Nuove Funzionalità

#### Schermata Titolo
- Aggiunta schermata iniziale con sfondo stagno asciutto
- Menu con opzioni: Nuovo Ciclo, Continua, New Game+
- New Game+ visibile solo se sbloccato dal giocatore

#### Sequenza Introduttiva
- Testi poetici che introducono il gioco
- Testi diversi per nuovo gioco vs New Game+
- Transizione luminosa verso la fase uovo

#### Sistema New Game+
- Meccanica basata su scelta del giocatore, non su tratti genetici
- Sbloccabile depositando uova nelle crepe quando stagno ≤15%
- Continua ciclo e tratti, stagno torna al 100%

### Modifiche

#### Sistema Genetico
- **Rimosso** tratto `dormantEggs` - sostituito dalla meccanica crepe
- Albinismo ora basato su genetica mendeliana reale
- Documentate tutte le probabilità di eredità

#### Configurazione Stagno
- Lo stagno ora ha un minimo del 5% (non arriva mai a 0%)
- Aggiunto `cracksAppearAt: 15%` per visibilità crepe
- Aggiunto `cracksCount: 3` per numero posti deposizione speciali

### Documentazione
- Aggiunto Game Design Document completo
- Aggiunto documento Architettura Tecnica
- Aggiunto questo Changelog

---

## Versione 0.1.0

### Setup Iniziale
- Struttura progetto con Vite + TypeScript + Phaser 3
- Configurazione pixel art mode
- Sistema di configurazione centralizzato (`gameConfig.ts`)

### Scene Implementate
- `BootScene` - Caricamento e gestione salvataggi
- `EggScene` - Prima fase completa
- `LarvaScene` - Seconda fase con movimento e fame

### Sistemi Core
- `GameState` - Gestione stato globale e persistenza
- `traits.ts` - Sistema genetico completo

### Meccaniche Funzionanti
- Scuotimento uovo per respingere predatori
- Movimento point-and-click
- Sistema fame con feedback visivo
- Crescita con milestone e effetti
- Morte e possibile respawn come fratello

---

## Note di Design

### Decisioni Chiave

#### 1. Perché Point-and-Click?
**Data:** Febbraio 2026

Discussione sulla scelta del sistema di controllo. Alternativa considerata: WASD.

**Ragioni per point-and-click:**
- Funziona identicamente su desktop e mobile
- Più naturale per un essere acquatico
- Meno stressante, si adatta al tono meditativo

---

#### 2. Perché Nessuna Barra Fame?
**Data:** Febbraio 2026

Decisione di non mostrare indicatori numerici.

**Ragioni:**
- L'atmosfera è più importante della precisione
- Il giocatore impara a "leggere" il personaggio
- Evita la sensazione di "gestionale"

**Implementazione:** Feedback tramite trasparenza e colore del personaggio.

---

#### 3. Perché New Game+ Basato su Scelta?
**Data:** Febbraio 2026

Originariamente era previsto un tratto genetico "uova dormienti" per sopravvivere alla siccità.

**Cambiamento:** Sostituito con meccanica delle crepe.

**Ragioni:**
- Dà agenzia al giocatore
- Più soddisfacente narrativamente
- Il giocatore deve CAPIRE il gioco per progredire
- Non basato sulla fortuna

---

#### 4. Fratelli per Respawn
**Data:** Febbraio 2026

Discussione su come gestire la morte.

**Soluzione finale:**
- I fratelli sopravvissuti in fase uovo = respawn futuri
- Solo morte da predatore permette respawn
- Un solo respawn per ciclo
- Difficoltà ridotta dopo respawn

**Ragioni:**
- Collega fase uovo alle conseguenze future
- Non è né troppo punitivo né troppo permissivo
- Crea tensione significativa

---

#### 5. Lo Stagno che Muore
**Data:** Febbraio 2026

Discussione sull'arco narrativo a lungo termine.

**Decisione:**
- Stagno si riduce ogni 5 cicli (-20%)
- Minimo 5% (crepe umide)
- Predatori aerei aumentano con riduzione
- New Game+ come "via di fuga"

**Ragioni:**
- Crea urgenza senza fretta
- Evita gameplay infinito senza conseguenze
- La fine è sempre visibile all'orizzonte

---

### Idee Future (Non Implementate)

#### Stagioni
**Stato:** Considerata, rimandata

Possibile aggiunta di ciclo stagionale che influenza:
- Disponibilità cibo
- Tipi di predatori
- Comportamento altre salamandre

**Motivo rimando:** Complessità aggiuntiva, da valutare post-release.

---

#### Musica
**Stato:** Esclusa per ora

Il gioco è pensato per essere silenzioso o con suoni ambientali minimi.

**Possibile futuro:** Musica ambientale generativa basata sullo stato del gioco.

---

#### Multiplayer
**Stato:** Non previsto

Il gioco è intrinsecamente single-player. La solitudine è parte dell'esperienza.

---

### Bug Noti

#### Fase Uovo
- [ ] Predatori a volte non rispettano il cooldown dopo essere respinti
- [ ] Energia può andare sotto 0 brevemente prima del clamp

#### Fase Larva
- [ ] Cibo può spawnare dentro le rocce
- [ ] Predatori occasionalmente si bloccano ai bordi

---

### Performance Notes

#### Desktop
- 60 FPS stabili su Chrome/Firefox/Safari
- Nessun problema rilevato

#### Mobile
- Testato su iPhone 12: 60 FPS
- Testato su Android medio: 45-60 FPS
- Da ottimizzare: particelle in scene affollate

---

## Prossimi Passi

### Immediati (v0.3.0)
1. Completare `JuvenileScene` con sistema amicizia
2. Aggiungere sprite pixel art reali
3. Implementare predatori con AI patrol

### Breve Termine (v0.4.0)
1. Completare `AdultScene` con corteggiamento
2. Meccanica deposizione uova con scelta location
3. Schermata eredità fine ciclo

### Medio Termine (v0.5.0)
1. Crepe visibili quando stagno basso
2. Transizione cinematica New Game+
3. Polish visivo generale

### Release (v1.0.0)
1. Bilanciamento completo
2. Testing su vari dispositivi
3. Preparazione per distribuzione

---

*Ultimo aggiornamento: Febbraio 2026*
