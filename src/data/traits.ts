/**
 * Sistema di tratti genetici e ereditarietà
 * Basato su genetica reale per l'albinismo (autosomica recessiva)
 */

// ============================================
// TIPI COLORE
// ============================================
export interface HSL {
  h: number;  // 0-360
  s: number;  // 0-100
  l: number;  // 0-100
}

export interface SalamanderColors {
  primary: HSL;
  secondary: HSL;
  belly: HSL;
}

// ============================================
// PATTERN
// ============================================
export type PatternType = 'spots' | 'stripes' | 'plain' | 'mottled';

// ============================================
// ALLELI ALBINISMO
// ============================================
export type AlbinismAllele = 'A' | 'a';  // A = normale, a = albino

export interface AlbinismGenotype {
  alleles: [AlbinismAllele, AlbinismAllele];
}

// Funzioni helper per albinismo
export function isAlbino(genotype: AlbinismGenotype): boolean {
  return genotype.alleles[0] === 'a' && genotype.alleles[1] === 'a';
}

export function isCarrier(genotype: AlbinismGenotype): boolean {
  return (genotype.alleles[0] === 'a' || genotype.alleles[1] === 'a') && !isAlbino(genotype);
}

// ============================================
// MUTAZIONI SPECIALI
// ============================================
export interface SpecialMutations {
  albino: boolean;           // Determinato da genotipo
  gigantism: boolean;        // +3 size, -2 speed
  neoteny: boolean;          // Mantiene branchie visibili
  iridescent: boolean;       // Colori cangianti, bonus corteggiamento
  // NOTA: dormantEggs rimosso - il New Game+ è basato sulla scelta 
  // del giocatore di deporre uova nelle crepe, non su un tratto genetico
}

// ============================================
// TRATTI COMPLETI
// ============================================
export interface SalamanderTraits {
  // Stats gameplay (1-10)
  speed: number;
  size: number;
  stamina: number;
  perception: number;
  
  // Aspetto
  colors: SalamanderColors;
  pattern: PatternType;
  
  // Genetica albinismo
  albinismGenotype: AlbinismGenotype;
  
  // Mutazioni
  mutations: SpecialMutations;
  
  // Meta
  generation: number;
  lineageId: string;
}

// ============================================
// CALCOLO CAMOUFLAGE
// ============================================
export type EnvironmentType = 'plants' | 'mud' | 'rocks' | 'open';

export function calculateCamouflage(
  traits: SalamanderTraits, 
  environment: EnvironmentType
): number {
  let base = 5;
  
  // Colore primario - verdi e marroni si nascondono meglio
  const hue = traits.colors.primary.h;
  
  if (environment === 'plants') {
    // Verdi (60-150) si nascondono bene tra le piante
    if (hue >= 60 && hue <= 150) base += 2;
  }
  
  if (environment === 'mud') {
    // Marroni/arancio (20-50) si nascondono nel fango
    if (hue >= 20 && hue <= 50) base += 2;
  }
  
  if (environment === 'rocks') {
    // Grigi (bassa saturazione) si nascondono tra le rocce
    if (traits.colors.primary.s < 30) base += 2;
  }
  
  // Saturazione alta = più visibile
  if (traits.colors.primary.s > 70) base -= 2;
  
  // Pattern bonus
  if (traits.pattern === 'mottled') base += 1;
  if (traits.pattern === 'spots' && environment === 'plants') base += 1;
  
  // Mutazioni che influenzano camouflage
  if (isAlbino(traits.albinismGenotype)) {
    base -= 4;  // Grosso malus - bianco su verde!
  }
  
  if (traits.mutations.iridescent) {
    base -= 1;  // Luccica, attira attenzione
  }
  
  // Clamp tra 1 e 10
  return Math.max(1, Math.min(10, base));
}

// ============================================
// GENERAZIONE TRATTI INIZIALI
// ============================================
export function generateInitialTraits(): SalamanderTraits {
  return {
    speed: randomStat(),
    size: randomStat(),
    stamina: randomStat(),
    perception: randomStat(),
    
    colors: generateNaturalColors(),
    pattern: randomPattern(),
    
    albinismGenotype: {
      // Prima generazione: sempre normale (AA) o raramente portatore (Aa)
      alleles: Math.random() < 0.1 ? ['A', 'a'] : ['A', 'A'],
    },
    
    mutations: {
      albino: false,
      gigantism: false,
      neoteny: false,
      iridescent: false,
    },
    
    generation: 1,
    lineageId: generateLineageId(),
  };
}

// ============================================
// EREDITÀ - Creazione figli
// ============================================
export function inheritTraits(
  parent1: SalamanderTraits,
  parent2: SalamanderTraits,
  favoredTraits: (keyof Pick<SalamanderTraits, 'speed' | 'size' | 'stamina' | 'perception'>)[]
): SalamanderTraits {
  // Eredità albinismo - genetica mendeliana reale
  const childAlbinismGenotype = inheritAlbinism(
    parent1.albinismGenotype,
    parent2.albinismGenotype
  );
  
  const childIsAlbino = isAlbino(childAlbinismGenotype);
  
  // Colori
  let childColors: SalamanderColors;
  if (childIsAlbino) {
    childColors = getAlbinoColors();
  } else {
    childColors = mixColors(parent1.colors, parent2.colors);
  }
  
  // Stats - i tratti favoriti vengono dal genitore con valore più alto
  const child: SalamanderTraits = {
    speed: inheritStat('speed', parent1, parent2, favoredTraits),
    size: inheritStat('size', parent1, parent2, favoredTraits),
    stamina: inheritStat('stamina', parent1, parent2, favoredTraits),
    perception: inheritStat('perception', parent1, parent2, favoredTraits),
    
    colors: childColors,
    pattern: Math.random() < 0.5 ? parent1.pattern : parent2.pattern,
    
    albinismGenotype: childAlbinismGenotype,
    
    mutations: inheritMutations(parent1.mutations, parent2.mutations),
    
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    lineageId: parent1.lineageId,  // Segue la linea del giocatore
  };
  
  // Applica effetti mutazioni
  if (childIsAlbino) {
    child.mutations.albino = true;
  }
  
  if (child.mutations.gigantism) {
    child.size = Math.min(10, child.size + 3);
    child.speed = Math.max(1, child.speed - 2);
  }
  
  // Possibili nuove mutazioni
  applyRandomMutations(child);
  
  return child;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomStat(): number {
  // Distribuzione normale centrata su 5
  const base = 5;
  const variation = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  return Math.max(1, Math.min(10, Math.round(base + variation * 4)));
}

function randomPattern(): PatternType {
  const patterns: PatternType[] = ['spots', 'stripes', 'plain', 'mottled'];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

function generateNaturalColors(): SalamanderColors {
  // Colori naturali di salamandra - verdi/marroni
  return {
    primary: {
      h: 80 + Math.random() * 40,   // 80-120: verde-giallo
      s: 30 + Math.random() * 30,   // 30-60: non troppo saturo
      l: 25 + Math.random() * 20,   // 25-45: abbastanza scuro
    },
    secondary: {
      h: 90 + Math.random() * 30,
      s: 20 + Math.random() * 20,
      l: 30 + Math.random() * 20,
    },
    belly: {
      h: 60 + Math.random() * 40,
      s: 20 + Math.random() * 30,
      l: 50 + Math.random() * 20,   // Ventre più chiaro
    },
  };
}

function getAlbinoColors(): SalamanderColors {
  // Colori albini - molto chiari, bassa saturazione
  return {
    primary: { h: 0, s: 5, l: 90 },
    secondary: { h: 30, s: 10, l: 85 },
    belly: { h: 0, s: 0, l: 95 },
  };
}

function mixColors(c1: SalamanderColors, c2: SalamanderColors): SalamanderColors {
  const mix = (a: HSL, b: HSL): HSL => ({
    h: (a.h + b.h) / 2 + (Math.random() - 0.5) * 20,
    s: (a.s + b.s) / 2 + (Math.random() - 0.5) * 10,
    l: (a.l + b.l) / 2 + (Math.random() - 0.5) * 10,
  });
  
  return {
    primary: mix(c1.primary, c2.primary),
    secondary: mix(c1.secondary, c2.secondary),
    belly: mix(c1.belly, c2.belly),
  };
}

function inheritAlbinism(
  g1: AlbinismGenotype,
  g2: AlbinismGenotype
): AlbinismGenotype {
  // Genetica mendeliana: ogni genitore passa un allele random
  const allele1 = g1.alleles[Math.random() < 0.5 ? 0 : 1];
  const allele2 = g2.alleles[Math.random() < 0.5 ? 0 : 1];
  return { alleles: [allele1, allele2] };
}

function inheritStat(
  stat: keyof Pick<SalamanderTraits, 'speed' | 'size' | 'stamina' | 'perception'>,
  p1: SalamanderTraits,
  p2: SalamanderTraits,
  favored: (keyof Pick<SalamanderTraits, 'speed' | 'size' | 'stamina' | 'perception'>)[]
): number {
  let value: number;
  
  if (favored.includes(stat)) {
    // Prendi il valore più alto
    value = Math.max(p1[stat], p2[stat]);
  } else {
    // 50/50 da quale genitore
    value = Math.random() < 0.5 ? p1[stat] : p2[stat];
  }
  
  // Piccola variazione (±10%)
  const variation = (Math.random() - 0.5) * 0.2 * value;
  return Math.max(1, Math.min(10, Math.round(value + variation)));
}

function inheritMutations(m1: SpecialMutations, m2: SpecialMutations): SpecialMutations {
  return {
    albino: false,  // Determinato separatamente dal genotipo
    gigantism: m1.gigantism || m2.gigantism,  // Dominante
    neoteny: Math.random() < 0.5 ? m1.neoteny : m2.neoteny,
    iridescent: Math.random() < 0.5 ? m1.iridescent : m2.iridescent,
  };
}

function applyRandomMutations(traits: SalamanderTraits): void {
  // Mutazione spontanea albinismo (molto rara, solo se già portatore)
  if (isCarrier(traits.albinismGenotype) && Math.random() < 0.005) {
    traits.albinismGenotype.alleles = ['a', 'a'];
    traits.mutations.albino = true;
    traits.colors = getAlbinoColors();
  }
  
  // Altre mutazioni vantaggiose (2% ciascuna)
  if (!traits.mutations.gigantism && Math.random() < 0.02) {
    traits.mutations.gigantism = true;
    traits.size = Math.min(10, traits.size + 3);
    traits.speed = Math.max(1, traits.speed - 2);
  }
  
  if (!traits.mutations.iridescent && Math.random() < 0.02) {
    traits.mutations.iridescent = true;
  }
  
  if (!traits.mutations.neoteny && Math.random() < 0.02) {
    traits.mutations.neoteny = true;
  }
}

function generateLineageId(): string {
  return `lineage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// TRATTI FRATELLO (dopo morte)
// ============================================
export function generateSiblingTraits(original: SalamanderTraits): SalamanderTraits {
  // Fratello molto simile ma non identico
  return {
    ...original,
    speed: varyStatSlightly(original.speed),
    size: varyStatSlightly(original.size),
    stamina: varyStatSlightly(original.stamina),
    perception: varyStatSlightly(original.perception),
    colors: varyColorsSlightly(original.colors),
    // Stesso genotipo albinismo (stessa covata)
    albinismGenotype: { ...original.albinismGenotype },
    // Stesse mutazioni potenziali
    mutations: { ...original.mutations },
  };
}

function varyStatSlightly(stat: number): number {
  const variation = (Math.random() - 0.5) * 2;  // ±1
  return Math.max(1, Math.min(10, Math.round(stat + variation)));
}

function varyColorsSlightly(colors: SalamanderColors): SalamanderColors {
  const varyHSL = (hsl: HSL): HSL => ({
    h: hsl.h + (Math.random() - 0.5) * 10,
    s: Math.max(0, Math.min(100, hsl.s + (Math.random() - 0.5) * 5)),
    l: Math.max(0, Math.min(100, hsl.l + (Math.random() - 0.5) * 5)),
  });
  
  return {
    primary: varyHSL(colors.primary),
    secondary: varyHSL(colors.secondary),
    belly: varyHSL(colors.belly),
  };
}
