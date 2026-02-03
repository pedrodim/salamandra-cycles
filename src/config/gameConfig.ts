/**
 * Configurazione centrale del gioco
 * Tutte le costanti e parametri di bilanciamento
 */

// Tipo per la modalità di gioco
export type GameMode = 'normal' | 'trial';

// Rileva la modalità dal env
export const GAME_MODE: GameMode = 
  (import.meta.env.VITE_GAME_MODE as GameMode) || 'normal';

// ============================================
// TIMING - Durata delle fasi in minuti
// ============================================
export const PHASE_DURATION = {
  normal: {
    egg: 4,
    larva: 6,
    juvenile: 7,
    adult: 8,
  },
  trial: {
    egg: 1.5,
    larva: 2.5,
    juvenile: 3,
    adult: 3,
  },
} as const;

// Durata corrente basata sulla modalità
export const CURRENT_DURATION = PHASE_DURATION[GAME_MODE];

// Converti minuti in millisecondi
export const MS_PER_MINUTE = 60 * 1000;

// ============================================
// VIEWPORT - Dimensioni nelle varie fasi
// ============================================
export const VIEWPORT = {
  egg: {
    initial: 64,     // Pixel visibili all'inizio
    final: 96,       // Prima della schiusa
  },
  larva: {
    initial: 96,
    final: 160,
  },
  juvenile: {
    initial: 160,
    final: 256,
  },
  adult: {
    size: 320,       // Viewport fisso
  },
  // Dimensione massima del canvas
  maxWidth: 400,
  maxHeight: 600,
} as const;

// ============================================
// UOVO - Parametri fase uovo
// ============================================
export const EGG_CONFIG = {
  // Energia per lo scuotimento
  maxEnergy: 100,
  shakeEnergyCost: 25,
  energyRechargeRate: 5,        // Per secondo
  energyDrainRate: 2,           // Per secondo quando inattivo (no predatori)
  shakeCooldownMs: 1500,        // Millisecondi tra scuotimenti
  
  // Predatori
  predatorRepelRadius: 80,      // Pixel
  predatorRepelDuration: 3000,  // ms che il predatore sta lontano
  
  // Sviluppo
  developmentStages: 10,        // Stadi visibili di sviluppo
  
  // Fratelli
  initialSiblings: 8,           // Numero iniziale di uova sorelle
  minSurvivingSiblings: 2,      // Minimo che sopravvive sempre
  predatorAttackChance: 0.3,    // Chance per attacco predatore
} as const;

// ============================================
// MOVIMENTO - Parametri point-and-click
// ============================================
export const MOVEMENT = {
  larva: {
    speed: 30,           // Pixel per secondo
    turnSpeed: 2,        // Radianti per secondo
  },
  juvenile: {
    speed: 80,
    turnSpeed: 4,
  },
  adult: {
    speed: 100,
    turnSpeed: 5,
  },
} as const;

// ============================================
// FAME - Sistema di nutrizione
// ============================================
export const HUNGER = {
  maxHunger: 100,
  // Tasso di diminuzione per secondo nelle varie fasi
  drainRate: {
    larva: 1.5,
    juvenile: 2,
    adult: 2.5,
  },
  // Soglie
  warningThreshold: 30,     // UI mostra warning
  criticalThreshold: 15,    // Movimento rallentato
  starvationDamage: 5,      // Danno/secondo sotto 0
  
  // Cibo
  foodValues: {
    microorganism: 10,
    smallInsect: 20,
    largeInsect: 35,
    smallFish: 50,
  },
} as const;

// ============================================
// PREDATORI - Configurazione nemici
// ============================================
export const PREDATORS = {
  // Fase uovo
  eggPredators: ['shadow'],  // Solo ombre misteriose
  
  // Fase larva
  larvaPredators: ['fish', 'dragonflyLarva', 'newt'],
  
  // Fase giovane
  juvenilePredators: ['largeFish', 'bird', 'snake'],
  
  // Difficoltà base (scala da 1 a 10)
  baseDifficulty: 3,
  
  // Modifica difficoltà dopo morte da predatore
  deathDifficultyReduction: 0.15,  // -15%
  
  // Uccelli - sempre più comuni man mano lo stagno si riduce
  birdFrequencyMultiplier: 1.5,    // Per ogni 20% di riduzione stagno
} as const;

// ============================================
// STAGNO - Mondo e ambiente
// ============================================
export const POND = {
  initialSize: 100,              // Percentuale
  shrinkPerCycles: 5,            // Ogni N cicli
  shrinkAmount: 20,              // Percentuale persa
  minSize: 5,                    // Minimo 5% - le crepe restano umide!
  
  // Crepe per New Game+
  cracksAppearAt: 15,            // Le crepe appaiono quando stagno <= 15%
  cracksCount: 3,                // Numero di crepe dove deporre
  
  // Cambio layout
  layoutChangeFrequency: 3,      // Ogni N cicli
  
  // Piante per nascondersi
  plantDensity: {
    initial: 0.3,                // 30% della mappa
    minAfterShrink: 0.15,
  },
} as const;

// ============================================
// GENETICA - Sistema ereditario
// ============================================
export const GENETICS = {
  // Mutazione spontanea albinismo
  albinismSpontaneousMutation: 0.005,  // 0.5%
  
  // Altre mutazioni
  mutationChance: 0.02,                 // 2% per mutazione vantaggiosa
  
  // Variazione stats figli
  statVariation: 0.1,                   // ±10%
  
  // Eredità fratello dopo morte
  brotherRespawnChance: 0.3,            // 30%
  brotherStatSimilarity: 0.9,           // 90% simile
} as const;

// ============================================
// AMICIZIA - Sistema sociale
// ============================================
export const FRIENDSHIP = {
  // Range valori
  minFriendship: -10,
  maxFriendship: 10,
  
  // Guadagno/perdita per interazione
  positiveInteraction: 1,
  negativeInteraction: -2,
  
  // Soglie comportamento
  approachThreshold: 3,      // Si avvicina spontaneamente
  avoidThreshold: -3,        // Si allontana
  
  // Decadimento nel tempo
  decayRate: 0.1,            // Per ciclo di gioco
} as const;

// ============================================
// UI - Interfaccia utente minimale
// ============================================
export const UI = {
  // Icona salvataggio
  saveIcon: {
    position: { x: 20, y: 20 },
    size: 16,
    showDuration: 2000,      // ms
  },
  
  // Nessuna barra vita/fame visibile!
  // Feedback solo visuale sul personaggio
} as const;

// ============================================
// EFFETTI VISIVI
// ============================================
export const EFFECTS = {
  // Scuotimento crescita
  growthShake: {
    duration: 500,
    intensity: 3,
  },
  
  // Luccichio
  sparkle: {
    particleCount: 8,
    duration: 800,
    colors: [0xffffff, 0xffffcc, 0xccffcc],
  },
  
  // Bollicine
  bubbles: {
    frequency: 2000,         // ms tra burst
    countPerBurst: 3,
    riseSpeed: 20,
  },
} as const;

// ============================================
// COLORI - Palette del gioco
// ============================================
export const COLORS = {
  // Acqua dello stagno (da immagine di riferimento)
  water: {
    surface: 0x8fa67a,       // Verde chiaro superficie
    mid: 0x6b8c5a,           // Verde medio
    deep: 0x4a6b3a,          // Verde scuro profondo
    murky: 0x3d5c2e,         // Torbido
  },
  
  // Salamandra default
  salamander: {
    body: 0x4a5c3a,
    belly: 0x8fa67a,
    spots: 0x2d3a22,
  },
  
  // Uovo
  egg: {
    shell: 0xc9d4b8,
    embryo: 0x6b7a5a,
    developing: 0x8fa67a,
  },
  
  // UI
  ui: {
    warning: 0xffcc00,
    danger: 0xff6600,
    safe: 0x66cc66,
  },
} as const;

// ============================================
// DEBUG
// ============================================
export const DEBUG = {
  enabled: GAME_MODE === 'trial',
  showHitboxes: false,
  showFPS: true,
  logStateChanges: true,
} as const;
