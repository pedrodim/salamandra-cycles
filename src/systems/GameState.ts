/**
 * GameState - Stato globale del gioco e salvataggio
 */

import { SalamanderTraits, generateInitialTraits, generateSiblingTraits } from '@/data/traits';
import { POND, GENETICS, PREDATORS } from '@/config/gameConfig';

// ============================================
// FASI DI VITA
// ============================================
export type LifePhase = 'egg' | 'larva' | 'juvenile' | 'adult';

// ============================================
// STATO SALAMANDRA
// ============================================
export interface SalamanderState {
  traits: SalamanderTraits;
  
  // Posizione e movimento
  x: number;
  y: number;
  targetX: number | null;
  targetY: number | null;
  rotation: number;
  
  // Stato vitale
  hunger: number;           // 0-100, muori a 0
  health: number;           // 0-100
  
  // Fase uovo
  eggEnergy: number;        // Per scuotimento
  developmentProgress: number;  // 0-100
  
  // Crescita
  growthProgress: number;   // Progresso nella fase corrente
  
  // Morte
  isDead: boolean;
  deathCause: 'predator' | 'starvation' | 'old_age' | null;
}

// ============================================
// STATO FRATELLI
// ============================================
export interface SiblingState {
  id: string;
  x: number;
  y: number;
  isAlive: boolean;
  traits: SalamanderTraits;
}

// ============================================
// STATO STAGNO
// ============================================
export interface PondState {
  sizePercent: number;        // 100 = pieno
  cycle: number;              // Ciclo corrente
  era: number;                // Quante volte lo stagno si è rigenerato (uova dormienti)
  
  // Layout
  plantPositions: { x: number; y: number; type: string }[];
  rockPositions: { x: number; y: number }[];
  
  // Predatori attivi
  predatorDensity: number;    // Moltiplicatore
  aerialPredatorBonus: number; // Bonus uccelli per stagno ridotto
}

// ============================================
// RELAZIONI SOCIALI
// ============================================
export interface Relationship {
  salamanderId: string;
  friendshipLevel: number;  // -10 a +10
  lastInteractionCycle: number;
  interactionCount: number;
}

// ============================================
// STATO COMPLETO DEL GIOCO
// ============================================
export interface GameState {
  // Fase corrente
  currentPhase: LifePhase;
  phaseStartTime: number;
  
  // Player
  player: SalamanderState;
  
  // Fratelli (fase uovo)
  siblings: SiblingState[];
  siblingsSurvived: number;
  canRespawnAsSibling: boolean;
  
  // Ambiente
  pond: PondState;
  
  // Sociale
  relationships: Relationship[];
  
  // Difficoltà
  difficultyMultiplier: number;
  consecutiveDeaths: number;
  
  // Meta
  totalPlayTime: number;
  cyclesCompleted: number;
  
  // Salvataggio
  lastSaveTime: number;
}

// ============================================
// INIZIALIZZAZIONE
// ============================================
export function createInitialGameState(): GameState {
  const initialTraits = generateInitialTraits();
  
  return {
    currentPhase: 'egg',
    phaseStartTime: Date.now(),
    
    player: {
      traits: initialTraits,
      x: 200,
      y: 300,
      targetX: null,
      targetY: null,
      rotation: 0,
      hunger: 100,
      health: 100,
      eggEnergy: 100,
      developmentProgress: 0,
      growthProgress: 0,
      isDead: false,
      deathCause: null,
    },
    
    siblings: generateInitialSiblings(initialTraits),
    siblingsSurvived: 8,
    canRespawnAsSibling: true,
    
    pond: {
      sizePercent: 100,
      cycle: 1,
      era: 1,
      plantPositions: generatePlantPositions(100),
      rockPositions: generateRockPositions(),
      predatorDensity: 1,
      aerialPredatorBonus: 0,
    },
    
    relationships: [],
    
    difficultyMultiplier: 1,
    consecutiveDeaths: 0,
    
    totalPlayTime: 0,
    cyclesCompleted: 0,
    
    lastSaveTime: Date.now(),
  };
}

// ============================================
// GESTIONE CICLI
// ============================================
export function startNewCycle(
  previousState: GameState,
  partnerTraits: SalamanderTraits,
  favoredTraits: (keyof Pick<SalamanderTraits, 'speed' | 'size' | 'stamina' | 'perception'>)[]
): GameState {
  const { inheritTraits } = require('@/data/traits');
  
  const newTraits = inheritTraits(
    previousState.player.traits,
    partnerTraits,
    favoredTraits
  );
  
  const newCycle = previousState.pond.cycle + 1;
  
  // Calcola riduzione stagno
  let newPondSize = previousState.pond.sizePercent;
  if (newCycle % POND.shrinkPerCycles === 0) {
    newPondSize = Math.max(0, newPondSize - POND.shrinkAmount);
  }
  
  // Se stagno a 0 e ha uova dormienti, nuova era!
  let newEra = previousState.pond.era;
  if (newPondSize <= 0 && newTraits.mutations.dormantEggs) {
    newPondSize = 100;
    newEra++;
  }
  
  return {
    ...createInitialGameState(),
    
    player: {
      ...createInitialGameState().player,
      traits: newTraits,
    },
    
    siblings: generateInitialSiblings(newTraits),
    
    pond: {
      sizePercent: newPondSize,
      cycle: newCycle,
      era: newEra,
      plantPositions: shouldRegenerateLayout(newCycle) 
        ? generatePlantPositions(newPondSize)
        : previousState.pond.plantPositions,
      rockPositions: shouldRegenerateLayout(newCycle)
        ? generateRockPositions()
        : previousState.pond.rockPositions,
      predatorDensity: calculatePredatorDensity(newPondSize),
      aerialPredatorBonus: calculateAerialBonus(newPondSize),
    },
    
    // Mantieni alcune relazioni (amici di vecchia data)
    relationships: previousState.relationships
      .filter(r => r.friendshipLevel > 5)
      .map(r => ({ ...r, friendshipLevel: r.friendshipLevel * 0.5 })),
    
    difficultyMultiplier: previousState.difficultyMultiplier,
    cyclesCompleted: previousState.cyclesCompleted + 1,
    totalPlayTime: previousState.totalPlayTime,
  };
}

// ============================================
// RESPAWN COME FRATELLO
// ============================================
export function respawnAsSibling(state: GameState): GameState | null {
  // Verifica se possibile
  if (!state.canRespawnAsSibling) return null;
  if (Math.random() > GENETICS.brotherRespawnChance) return null;
  
  const aliveSiblings = state.siblings.filter(s => s.isAlive);
  if (aliveSiblings.length === 0) return null;
  
  // Scegli un fratello random
  const sibling = aliveSiblings[Math.floor(Math.random() * aliveSiblings.length)];
  
  return {
    ...state,
    
    player: {
      ...state.player,
      traits: generateSiblingTraits(state.player.traits),
      x: sibling.x,
      y: sibling.y,
      health: 100,
      hunger: 100,
      isDead: false,
      deathCause: null,
    },
    
    // Rimuovi il fratello usato
    siblings: state.siblings.filter(s => s.id !== sibling.id),
    
    // Non puoi più rispawnare come fratello in questo ciclo
    canRespawnAsSibling: false,
    
    // Riduci difficoltà dopo morte da predatore
    difficultyMultiplier: state.difficultyMultiplier * (1 - PREDATORS.deathDifficultyReduction),
    consecutiveDeaths: state.consecutiveDeaths + 1,
  };
}

// ============================================
// SALVATAGGIO
// ============================================
const SAVE_KEY = 'salamandra_cycles_save';

export function saveGame(state: GameState): void {
  const saveData = {
    ...state,
    lastSaveTime: Date.now(),
  };
  
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error('Errore salvataggio:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    
    return JSON.parse(saved) as GameState;
  } catch (e) {
    console.error('Errore caricamento:', e);
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateInitialSiblings(playerTraits: SalamanderTraits): SiblingState[] {
  const siblings: SiblingState[] = [];
  const count = 8;  // EGG_CONFIG.initialSiblings
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    
    siblings.push({
      id: `sibling_${i}_${Date.now()}`,
      x: 200 + Math.cos(angle) * distance,
      y: 300 + Math.sin(angle) * distance,
      isAlive: true,
      traits: generateSiblingTraits(playerTraits),
    });
  }
  
  return siblings;
}

function generatePlantPositions(pondSize: number): { x: number; y: number; type: string }[] {
  const plants: { x: number; y: number; type: string }[] = [];
  const density = POND.plantDensity.initial * (pondSize / 100);
  const count = Math.floor(50 * density);
  
  const plantTypes = ['algae', 'reed', 'lily', 'moss'];
  
  for (let i = 0; i < count; i++) {
    plants.push({
      x: Math.random() * 400,
      y: Math.random() * 600,
      type: plantTypes[Math.floor(Math.random() * plantTypes.length)],
    });
  }
  
  return plants;
}

function generateRockPositions(): { x: number; y: number }[] {
  const rocks: { x: number; y: number }[] = [];
  const count = 5 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < count; i++) {
    rocks.push({
      x: Math.random() * 400,
      y: Math.random() * 600,
    });
  }
  
  return rocks;
}

function shouldRegenerateLayout(cycle: number): boolean {
  return cycle % POND.layoutChangeFrequency === 0;
}

function calculatePredatorDensity(pondSize: number): number {
  // Più piccolo lo stagno, più densi i predatori
  return 1 + (100 - pondSize) / 100;
}

function calculateAerialBonus(pondSize: number): number {
  // Uccelli più frequenti con stagno piccolo
  const shrinkLevel = Math.floor((100 - pondSize) / 20);
  return shrinkLevel * PREDATORS.birdFrequencyMultiplier;
}
