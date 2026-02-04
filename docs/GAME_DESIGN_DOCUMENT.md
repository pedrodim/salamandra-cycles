# 🦎 Cycles
## Game Design Document

**Versione:** 0.2.0  
**Ultimo aggiornamento:** Febbraio 2026  
**Genere:** Survival / Life Simulation / Roguelite  
**Piattaforma:** Browser (Desktop & Mobile)  
**Modalità:** Single Player  

---

## 📖 Indice

1. [Visione del Gioco](#visione-del-gioco)
2. [Flusso di Gioco](#flusso-di-gioco)
3. [Fasi di Vita](#fasi-di-vita)
4. [Meccaniche Core](#meccaniche-core)
5. [Sistema Genetico](#sistema-genetico)
6. [Il Mondo: Lo Stagno](#il-mondo-lo-stagno)
7. [Sistema New Game+](#sistema-new-game)
8. [Interfaccia Utente](#interfaccia-utente)
9. [Scelte di Design](#scelte-di-design)
10. [Configurazione Tecnica](#configurazione-tecnica)
11. [Roadmap](#roadmap)

---

## Visione del Gioco

### Concept
Un gioco meditativo e ciclico sulla vita di una salamandra. Il giocatore vive generazione dopo generazione, ereditando tratti dai genitori, sopravvivendo ai predatori, e cercando di perpetuare la propria linea genetica in uno stagno che lentamente muore.

### Ispirazione
Il gioco nasce da un'immagine di una salamandra che nuota in acque torbide verdi - sospesa, vulnerabile, eterea. Quell'atmosfera di fragilità e bellezza è il cuore estetico del progetto.

### Tono
- **Contemplativo** - Non frenetico, lascia spazio alla riflessione
- **Naturalistico** - Basato su biologia reale dove possibile
- **Malinconico** - La morte è parte del ciclo, non una punizione
- **Misterioso** - Il gioco non spiega tutto, il giocatore scopre

### Pilastri di Design
1. **Ciclo perpetuo** - La vita continua attraverso le generazioni
2. **Eredità significativa** - Le scelte passate influenzano il futuro
3. **Scoperta organica** - Le meccaniche si rivelano giocando
4. **Mondo che vive** - Lo stagno cambia indipendentemente dal giocatore

---

## Flusso di Gioco

### Schermata Iniziale

```
┌─────────────────────────────────────────┐
│                                         │
│   [Sfondo: stagno asciutto, crepe]      │
│                                         │
│              Cycles                     │
│           Cicli di vita                 │
│                                         │
│         ─────────────────               │
│                                         │
│          [ Nuovo Ciclo ]                │
│          [ Continua ]      ← opzionale  │
│          [ New Game+ ]     ← sbloccabile│
│                                         │
└─────────────────────────────────────────┘
```

**Scelta di design:** Lo sfondo mostra lo stagno ASCIUTTO - questo crea un collegamento narrativo con il New Game+ e suggerisce che la storia ha un passato.

### Sequenza Introduttiva

Quando il giocatore preme "Nuovo Ciclo" o "New Game+":

1. Fade to black
2. Testi poetici appaiono uno alla volta
3. Luce che cresce dal centro
4. Transizione alla fase uovo

**Testi per Nuovo Ciclo:**
```
"In uno stagno dimenticato..."
"dove l'acqua incontra la terra..."
"la vita trova sempre un modo."

"Sei un piccolo uovo."
"Fragile. Indifeso."
"Ma vivo."
```

**Testi per New Game+:**
```
"Il tempo passa..."
"Lo stagno si è prosciugato."
"Ma nelle crepe, qualcosa attende."
"Anni passano..."
"Decenni..."
"Un giorno, la pioggia torna."
"Le crepe si riempiono d'acqua."
"E la vita riprende."
```

**Scelta di design:** I testi sono diversi per creare una narrazione emergente. Il giocatore che sblocca New Game+ capisce cosa è successo alle sue uova.

### Loop di Gioco Principale

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  UOVO ──► LARVA ──► GIOVANE ──► ADULTO ──► DEPOSIZIONE  │
│    │                                              │      │
│    │         [morte possibile in ogni fase]       │      │
│    │                                              ▼      │
│    │                                    ┌────────────┐   │
│    │                                    │ Scegli     │   │
│    │                                    │ tratti da  │   │
│    │                                    │ ereditare  │   │
│    │                                    └─────┬──────┘   │
│    │                                          │          │
│    └──────────────────────────────────────────┘          │
│                     NUOVO CICLO                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Fasi di Vita

### 🥚 Fase 1: Uovo

**Durata:** ~4 minuti (normal) / ~1.5 minuti (trial)

**Situazione:** Sei un uovo in una covata. Non puoi muoverti, solo percepire vagamente il mondo attorno.

**Viewport:** Molto ristretto (64px iniziali → 96px alla schiusa)

#### Meccaniche

| Meccanica | Descrizione |
|-----------|-------------|
| **Scuotimento** | Unica azione disponibile. Click/tap o Spazio per scuotere l'uovo |
| **Energia** | Risorsa che si ricarica. Scuotere costa energia |
| **Sviluppo** | Progresso automatico verso la schiusa |
| **Predatori** | Ombre che passano, possono mangiare i fratelli |

#### Sistema Energia Uovo

```typescript
maxEnergy: 100
shakeEnergyCost: 25        // Costo per scuotimento
energyRechargeRate: 5/sec  // Ricarica passiva
energyDrainRate: 2/sec     // Drain quando inattivo (no predatori)
shakeCooldownMs: 1500      // Cooldown tra scuotimenti
```

**Scelta di design:** L'energia si scarica da sola se il giocatore è inattivo (ma NON quando ci sono predatori). Questo:
- Impedisce di "ignorare" il gioco
- Crea tensione quando arriva un predatore (devi aver conservato energia)
- L'uovo "si muove da solo" se trascurato troppo

#### Predatori Fase Uovo

- Appaiono come **ombre** misteriose (non si vede cosa sono)
- Si muovono lentamente verso le uova
- Lo scuotimento li respinge temporaneamente
- Se non respinti, **mangiano un fratello** (non il giocatore)
- I fratelli sopravvissuti determinano la possibilità di respawn futuro

**Scelta di design:** Il giocatore non può morire in fase uovo, ma le sue azioni determinano quanti fratelli sopravvivono, che è cruciale per il sistema di respawn.

#### Progressione Visiva

| Giorno | Evento |
|--------|--------|
| 1-2 | Buio, pulsazione lenta |
| 3-4 | Si vedono vagamente altri uova |
| 4-5 | Primo evento predatore |
| 5-6 | Colori più cupi (tensione) |
| 6-7 | Si sblocca lo scuotimento attivo |
| 7-8 | Colori tornano normali |
| 8-10 | Sviluppo visibile dell'embrione |
| Schiusa | Viewport si allarga, transizione |

---

### 🐛 Fase 2: Larva

**Durata:** ~6 minuti (normal) / ~2.5 minuti (trial)

**Situazione:** Sei appena nato. Piccolo, lento, vulnerabile. Devi mangiare per sopravvivere.

**Viewport:** 96px iniziali → 160px a fine fase

#### Meccaniche

| Meccanica | Descrizione |
|-----------|-------------|
| **Movimento** | Point-and-click. Click/tap dove vuoi andare |
| **Fame** | Cala costantemente. Devi mangiare o muori |
| **Nascondersi** | Vicino alle piante sei meno visibile |
| **Crescita** | Mangiare fa crescere. Feedback visivo sul corpo |

#### Sistema Movimento

```typescript
speed: 30 px/sec           // Molto lento
turnSpeed: 2 rad/sec       // Rotazione
```

**Scelta di design:** Point-and-click invece di WASD perché:
- Funziona identicamente su mobile e desktop
- Più "naturale" per un essere acquatico (indica una direzione, nuota)
- Meno stressante di controlli diretti

#### Sistema Fame

```typescript
maxHunger: 100
drainRate: 1.5/sec         // Calo costante
warningThreshold: 30       // Player diventa pallido
criticalThreshold: 15      // Movimento rallentato
// Sotto 0 = morte per fame
```

**Scelta di design:** Nessuna barra fame visibile. Il feedback è sul personaggio:
- Fame alta: colori vivaci
- Fame media: normale
- Fame bassa: pallido, trasparente
- Fame critica: molto pallido, movimento rallentato

#### Cibo

| Tipo | Valore Fame | Frequenza |
|------|-------------|-----------|
| Microorganismi | +10 | Comuni (70%) |
| Insetti piccoli | +20 | Rari (30%) |

**Scelta di design:** Il cibo è abbondante ma disperso. Non è difficile sopravvivere, ma devi muoverti. Questo insegna il movimento prima di introdurre i predatori veri.

#### Predatori Fase Larva

- **Pesci** - Patrol casuale, inseguono se ti vedono
- **Larve di libellula** - Stazionari ma letali se ti avvicini
- **Tritoni** - Lenti ma persistenti

**Sistema Nascondersi:**
```typescript
// Sei "nascosto" se:
// 1. Sei vicino a una pianta (< 25px)
// 2. Il tuo camouflage è >= 5

// Quando nascosto:
// - Predatori non ti vedono
// - Player diventa semi-trasparente (feedback visivo)
```

#### Crescita

La crescita avviene mangiando. Milestone a 25%, 50%, 75%, 100%.

Ad ogni milestone:
1. Il personaggio "trema" velocemente
2. Effetto luccichio (sparkles)
3. Il personaggio cresce leggermente
4. Il viewport si espande

**Scelta di design:** Il "tremolio + luccichio" è il feedback universale per "qualcosa è cambiato nel tuo corpo". Usato anche nelle altre fasi.

---

### 🦎 Fase 3: Giovane

**Durata:** ~7 minuti (normal) / ~3 minuti (trial)

**Situazione:** Sei cresciuto. Più veloce, più sicuro. È tempo di esplorare e socializzare.

**Viewport:** 160px iniziali → 256px a fine fase

#### Meccaniche

| Meccanica | Descrizione |
|-----------|-------------|
| **Movimento veloce** | 2.5x più veloce della larva |
| **Caccia attiva** | Puoi inseguire prede più grandi |
| **Socializzazione** | Incontri con altre salamandre |
| **Amicizia** | Sistema di relazioni (invisibile al player) |

#### Sistema Velocità

```typescript
speed: 80 px/sec           // Molto più veloce
turnSpeed: 4 rad/sec
```

**Scelta di design:** L'aumento di velocità è drammatico e intenzionale. Il giocatore deve SENTIRE la differenza. "Ero lento e vulnerabile, ora sono agile."

#### Sistema Sociale

Altre salamandre appaiono nel mondo. Sono NPC autonomi.

**Interazione:**
1. Ti avvicini a un'altra salamandra
2. Le salamandre "interagiscono" automaticamente (animazioni: scuotono la testa, muovono la coda)
3. Puoi scegliere di restare o allontanarti
4. Restare più a lungo = più interazioni = più amicizia

**Comportamento NPC:**
```typescript
interface SalamanderPersonality {
  curiosity: number;    // Quanto si avvicina spontaneamente
  trust: number;        // Quanto velocemente guadagna amicizia
}

// Le salamandre con alta amicizia:
// - Appaiono più spesso
// - Si avvicinano di più
// - Possono diventare partner in fase adulta
```

**Scelta di design:** Il giocatore NON vede numeri o indicatori di amicizia. L'unico feedback è comportamentale:
- "Questa salamandra mi segue spesso" = è tua amica
- "Questa scappa sempre" = non si fida

#### Sistema Amicizia (Interno)

```typescript
minFriendship: -10         // Diffidente
maxFriendship: +10         // Amico stretto

positiveInteraction: +1    // Ogni interazione positiva
negativeInteraction: -2    // Allontanarsi bruscamente
decayRate: 0.1/ciclo       // Lento decadimento

approachThreshold: +3      // Si avvicina spontaneamente
avoidThreshold: -3         // Si allontana
```

---

### 🦎 Fase 4: Adulto

**Durata:** ~8 minuti (normal) / ~3 minuti (trial)

**Situazione:** Sei adulto. L'obiettivo è trovare un partner e deporre le uova.

**Viewport:** 320px (massimo, fisso)

#### Meccaniche

| Meccanica | Descrizione |
|-----------|-------------|
| **Corteggiamento** | Interazioni più lunghe con potenziali partner |
| **Scelta partner** | Influenza i tratti della prossima generazione |
| **Deposizione** | Scegli DOVE deporre le uova |
| **Preferenza istintiva** | La salamandra "vuole" andare in certi posti |

#### Corteggiamento

Il corteggiamento è un'estensione del sistema sociale:
- Salamandre con alta amicizia sono più ricettive
- Interazioni più lunghe e elaborate
- Il giocatore sceglie con chi provare (avvicinandosi)

**Scelta di design:** Non c'è un "mini-game" di corteggiamento. È organico: passa tempo con chi ti piace, eventualmente diventa il tuo partner.

#### Deposizione Uova

**La meccanica più importante del gioco.**

La salamandra adulta inizia a "voler" andare verso certi luoghi per deporre:
- Il giocatore vede la salamandra tirare leggermente verso una direzione
- Può assecondarla o forzarla altrove

**Luoghi di deposizione:**

| Luogo | Sicurezza | Risorse | Note |
|-------|-----------|---------|------|
| Centro stagno | Media | Alte | Default "istintivo" |
| Tra le piante | Alta | Medie | Buon nascondiglio |
| Vicino rocce | Media | Basse | - |
| Bordi stagno | Bassa | Basse | Più esposto |
| **Nelle crepe** | Speciale | - | Solo se stagno ≤15% |

**Scelta di design:** Se il giocatore non depone mai le uova (ignora completamente l'istinto), il ciclo finisce senza prole = Game Over. Il gioco non lo dice esplicitamente, il giocatore lo scopre.

---

## Meccaniche Core

### Sistema Morte e Respawn

#### Tipi di Morte

| Causa | Fase | Conseguenza |
|-------|------|-------------|
| Predatore | Larva+ | Possibile respawn come fratello |
| Fame | Larva+ | Game over (no respawn) |
| Nessuna prole | Adulto | Game over speciale |

#### Respawn come Fratello

Se muori per un predatore E hai fratelli sopravvissuti dalla fase uovo:

```typescript
brotherRespawnChance: 30%  // Probabilità di respawn

// Se respawn:
// - Stats simili (90% dell'originale)
// - Stessa posizione del fratello
// - Difficoltà ridotta temporaneamente (-15%)
// - Non puoi più respawnare in questo ciclo
```

**Scelta di design:** 
- Solo morte da predatore permette respawn (la fame è "colpa tua")
- La difficoltà si riduce per evitare frustrazione
- Un solo respawn per ciclo per mantenere tensione

### Sistema Visibilità e Camouflage

Il camouflage è calcolato dinamicamente:

```typescript
function calculateCamouflage(traits, environment): number {
  let base = 5;
  
  // Colore vs ambiente
  if (ambiente === 'piante' && colore è verde) base += 2;
  if (ambiente === 'fango' && colore è marrone) base += 2;
  
  // Saturazione (colori vivaci = più visibili)
  if (saturazione > 70%) base -= 2;
  
  // Pattern
  if (pattern === 'mottled') base += 1;
  if (pattern === 'spots' && ambiente === 'piante') base += 1;
  
  // Mutazioni
  if (albino) base -= 4;  // Grosso malus
  if (iridescent) base -= 1;
  
  return clamp(base, 1, 10);
}
```

**Scelta di design:** Il camouflage dipende da DOVE sei, non solo da come sei. Una salamandra verde è invisibile tra le piante ma esposta sul fango.

---

## Sistema Genetico

### Filosofia

Il sistema genetico è basato sulla **genetica mendeliana reale**, specialmente per l'albinismo. Questo:
- È educativo
- Crea sorprese genuine ("Come è nato un figlio albino?!")
- Rende le mutazioni rare davvero speciali

### Tratti Ereditari

#### Stats (1-10)

| Stat | Effetto Gameplay |
|------|------------------|
| **Speed** | Velocità di movimento |
| **Size** | Cosa puoi mangiare / chi ti può mangiare |
| **Stamina** | Quanto puoi muoverti prima di rallentare |
| **Perception** | Raggio visivo, vedi predatori prima |

#### Colori

```typescript
interface SalamanderColors {
  primary: HSL;    // Colore dominante corpo
  secondary: HSL;  // Colore pattern
  belly: HSL;      // Colore ventre (sempre più chiaro)
}
```

I colori influenzano il camouflage (vedi sopra).

#### Pattern

- `spots` - Macchie (bonus in piante)
- `stripes` - Strisce
- `plain` - Tinta unita
- `mottled` - Screziato (bonus camouflage generale)

### Eredità

#### Fine Ciclo

Quando completi un ciclo (deposizione uova):

1. Vedi i tuoi tratti
2. Vedi i tratti del partner
3. **Scegli 2-3 tratti da "favorire"**
4. I colori si mescolano automaticamente
5. Stats non favorite = 50/50 da un genitore

```typescript
function inheritStat(stat, parent1, parent2, favored): number {
  if (favored.includes(stat)) {
    return Math.max(parent1[stat], parent2[stat]);  // Prendi il migliore
  } else {
    return random() < 0.5 ? parent1[stat] : parent2[stat];  // 50/50
  }
  // + piccola variazione casuale (±10%)
}
```

### Albinismo

**Genetica reale:**

```
A = allele normale (dominante)
a = allele albino (recessivo)

AA = normale
Aa = portatore (aspetto normale, può passare il gene)
aa = albino (bianco, penalità camouflage)
```

**Probabilità:**

| Genitori | Probabilità Albino |
|----------|-------------------|
| AA × AA | 0% |
| AA × Aa | 0% (50% portatori) |
| Aa × Aa | 25% |
| Aa × aa | 50% |
| aa × aa | 100% |

**Prima apparizione:** 
- Mutazione spontanea: 0.5% se già portatore
- Altrimenti deve essere introdotto da un partner portatore

**Scelta di design:** L'albinismo è un **malus** (camouflage -4), non un vantaggio. È raro e distintivo. Un giocatore che riesce a far prosperare una linea albina ha fatto qualcosa di notevole.

### Altre Mutazioni

| Mutazione | Probabilità | Effetto |
|-----------|-------------|---------|
| **Gigantismo** | 2% | +3 size, -2 speed |
| **Neotenia** | 2% | Mantiene branchie (estetico) |
| **Iridescenza** | 2% | Colori cangianti, -1 camouflage, bonus corteggiamento |

**Scelta di design:** Le mutazioni sono rare ma impattanti. Sono **sempre vantaggiose** (tranne albinismo) per premiare la fortuna.

---

## Il Mondo: Lo Stagno

### Caratteristiche Base

```typescript
interface PondState {
  sizePercent: number;     // 100% → 5% (minimo)
  cycle: number;           // Ciclo corrente
  era: number;             // Quante "rinascite" (New Game+)
  plantPositions: [];      // Layout piante
  rockPositions: [];       // Layout rocce
  predatorDensity: number; // Moltiplicatore predatori
}
```

### Invecchiamento dello Stagno

Lo stagno si **riduce nel tempo**:

```typescript
shrinkPerCycles: 5     // Ogni 5 cicli
shrinkAmount: 20%      // -20% dimensione
minSize: 5%            // Non scende mai sotto il 5%
```

**Timeline esempio:**
- Ciclo 1-4: Stagno 100%
- Ciclo 5-9: Stagno 80%
- Ciclo 10-14: Stagno 60%
- Ciclo 15-19: Stagno 40%
- Ciclo 20-24: Stagno 20%
- Ciclo 25+: Stagno 5% (appaiono le crepe)

### Conseguenze della Riduzione

| Dimensione | Effetto |
|------------|---------|
| 80% | Piante leggermente ridotte |
| 60% | Predatori +20% densità |
| 40% | Uccelli (predatori aerei) +50% frequenza |
| 20% | Spazio molto ridotto, alta pressione |
| 5% | Crepe visibili, scelta finale |

**Scelta di design:** Lo stagno che muore crea urgenza a lungo termine. Non puoi giocare "per sempre" - devi prepararti alla fine o sbloccare New Game+.

### Predatori Aerei

Gli **uccelli** diventano più comuni quando lo stagno si riduce:

```typescript
birdFrequencyMultiplier: 1.5  // Per ogni 20% di riduzione

// Gli uccelli:
// - Attaccano dall'alto (zona superficie pericolosa)
// - Sono più difficili da evitare
// - Non puoi nasconderti dalle piante contro di loro
```

**Scelta di design:** Gli uccelli puniscono chi sta in superficie. Questo spinge il giocatore verso il fondo e le piante, ma lì ci sono altri predatori. Tensione costante.

---

## Sistema New Game+

### Filosofia

Il New Game+ **non è automatico**. Non è un tratto genetico. È una **scelta consapevole** del giocatore che capisce cosa sta succedendo e agisce di conseguenza.

### Come Sbloccarlo

1. Lo stagno raggiunge il 15% o meno
2. **Appaiono le crepe** - zone speciali ai bordi dello stagno
3. Le crepe sono visivamente distinte (più scure, umide)
4. In fase adulta, il giocatore può scegliere di deporre le uova **nelle crepe**
5. Se lo fa → sblocca New Game+

### Cosa Succede

**Se deponi nelle crepe:**

1. La salamandra depone le uova
2. Pausa significativa
3. La camera si allontana lentamente
4. Si vede lo stagno dall'alto
5. Time-lapse: lo stagno si asciuga completamente
6. Le uova sono invisibili, nascoste nelle crepe
7. Fade to sepia/bianco
8. Ritorno alla schermata iniziale
9. **"New Game+" è ora disponibile**

**Se NON deponi nelle crepe:**

1. Deposizione normale
2. Nuovo ciclo inizia
3. Se lo stagno era al minimo (5%), game over
4. "La tua linea si è estinta"

### Dati New Game+

```typescript
interface NewGamePlusData {
  unlocked: boolean;
  lastTraits: SalamanderTraits;  // Per eredità
  cycle: number;                  // Continua da qui
  era: number;                    // Incrementa
}
```

**Quando selezioni New Game+:**
- Il ciclo CONTINUA (non riparte da 1)
- I tratti dell'ultima generazione sono la base
- Lo stagno torna al 100%
- Una nuova "era" inizia

**Scelta di design:** Il New Game+ è la ricompensa per aver capito il gioco. Non è spiegato. Il giocatore deve:
1. Notare che lo stagno si sta riducendo
2. Notare le crepe che appaiono
3. Decidere di deporre lì invece che nel posto "istintivo"
4. Essere ricompensato con la continuazione

---

## Interfaccia Utente

### Filosofia: UI Minimalista

> "Il miglior UI è quello che non vedi"

Il gioco NON ha:
- Barre vita/fame visibili
- Minimappa
- Indicatori numerici
- Tutorial espliciti
- Pop-up di aiuto

### Feedback Visivo sul Personaggio

| Stato | Feedback |
|-------|----------|
| Fame alta | Colori vivaci |
| Fame bassa | Pallido, trasparente |
| Fame critica | Molto pallido, movimenti lenti |
| Nascosto | Semi-trasparente |
| Crescita | Tremolio + luccichio |
| Energia bassa (uovo) | Flash di trasparenza |

### Elementi UI Presenti

1. **Icona salvataggio** - Angolo alto sinistro, appare brevemente quando salva
2. **Hint iniziali** - Solo in fase uovo, scompaiono dopo primo uso

### Salvataggio

```typescript
saveIcon: {
  position: { x: 20, y: 20 },
  size: 16,
  showDuration: 2000  // Visibile 2 secondi
}
```

Il salvataggio avviene:
- Automaticamente a fine ogni fase
- L'icona ruota brevemente per conferma

---

## Scelte di Design

### Perché Point-and-Click?

**Alternativa considerata:** WASD / frecce direzionali

**Problemi:**
- Non funziona bene su mobile
- Richiede due mani
- Meno "naturale" per un essere acquatico

**Soluzione:** Click/tap per indicare direzione. La salamandra nuota verso quel punto.

### Perché Nessuna UI Fame?

**Alternativa considerata:** Barra fame in alto

**Problemi:**
- Distrae dall'atmosfera
- Rende il gioco "un gestionale"
- Meno immersivo

**Soluzione:** Il corpo della salamandra È l'indicatore. Impari a "leggere" il tuo personaggio.

### Perché l'Albinismo è un Malus?

**Alternativa considerata:** Tratto neutro o bonus

**Problemi:**
- Non realistico
- Tutti lo vorrebbero
- Meno interessante

**Soluzione:** È difficile da mantenere. Una linea albina che prospera è un achievement non ufficiale.

### Perché New Game+ Non è Automatico?

**Alternativa considerata:** Tratto genetico "uova dormienti"

**Problemi:**
- Toglie agenzia al giocatore
- Basato sulla fortuna
- Meno narrativamente soddisfacente

**Soluzione:** È una scelta. Il giocatore deve CAPIRE e AGIRE. La ricompensa è meritata.

### Perché i Fratelli Servono per il Respawn?

**Alternativa considerata:** Respawn infinito o nessun respawn

**Problemi:**
- Infinito = nessuna conseguenza
- Nessuno = troppo punitivo

**Soluzione:** I fratelli sopravvissuti in fase uovo determinano i respawn futuri. Le azioni del passato contano.

---

## Configurazione Tecnica

### Modalità di Gioco

```typescript
type GameMode = 'normal' | 'trial';

// Normal: ciclo completo ~25 minuti
// Trial: ciclo completo ~10 minuti (per testing)
```

**Variabile d'ambiente:**
```bash
VITE_GAME_MODE=trial pnpm dev
```

### Durata Fasi

| Fase | Normal | Trial |
|------|--------|-------|
| Uovo | 4 min | 1.5 min |
| Larva | 6 min | 2.5 min |
| Giovane | 7 min | 3 min |
| Adulto | 8 min | 3 min |
| **Totale** | **~25 min** | **~10 min** |

### Viewport

```typescript
VIEWPORT = {
  egg: { initial: 64, final: 96 },
  larva: { initial: 96, final: 160 },
  juvenile: { initial: 160, final: 256 },
  adult: { size: 320 },  // Fisso
  maxWidth: 400,
  maxHeight: 600,
}
```

### Stack Tecnologico

- **Engine:** Phaser 3 (pixel art mode)
- **Linguaggio:** TypeScript
- **Build:** Vite
- **Package Manager:** pnpm

---

## Roadmap

### Fase 1 ✅ (Completata)
- [x] Setup progetto
- [x] Configurazione di gioco
- [x] Sistema genetico completo
- [x] Scena uovo funzionante
- [x] Scena larva base
- [x] Sistema salvataggio
- [x] Schermata titolo con sfondo asciutto
- [x] Sequenza introduttiva poetica
- [x] Documentazione design

### Fase 2 (In Corso)
- [ ] Sprite pixel art (sostituire placeholder)
- [ ] Scena giovane completa
- [ ] Sistema amicizia funzionante
- [ ] Predatori con AI migliore

### Fase 3
- [ ] Scena adulta completa
- [ ] Sistema corteggiamento
- [ ] Meccanica deposizione uova
- [ ] Schermata eredità fine ciclo

### Fase 4
- [ ] Crepe visibili quando stagno basso
- [ ] Meccanica New Game+ completa
- [ ] Transizione cinematica (camera che si allontana)
- [ ] Polish visivo

### Fase 5
- [ ] Bilanciamento difficoltà
- [ ] Testing estensivo
- [ ] Ottimizzazione mobile
- [ ] Release beta

### Futuro (Post-Release)
- [ ] Musica ambientale (opzionale)
- [ ] Più tipi di stagno/biomi
- [ ] Stagioni
- [ ] Eventi speciali

---

## Appendice: Costanti di Gioco

Tutte le costanti sono in `src/config/gameConfig.ts` per facile bilanciamento.

```typescript
// Esempio struttura
export const EGG_CONFIG = {
  maxEnergy: 100,
  shakeEnergyCost: 25,
  // ...
};

export const HUNGER = {
  maxHunger: 100,
  drainRate: { larva: 1.5, juvenile: 2, adult: 2.5 },
  // ...
};

export const GENETICS = {
  albinismSpontaneousMutation: 0.005,
  mutationChance: 0.02,
  // ...
};
```

---

*Documento vivente - aggiornato man mano che il design evolve.*
