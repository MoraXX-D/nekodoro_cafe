/* ──────────────────────────────────────────────────────
 *  Shared type definitions for the Cat Café game
 * ────────────────────────────────────────────────────── */

/** Brew types available in the café */
export type BrewType = 'espresso' | 'filter' | 'cold_brew';

/** Grams of beans consumed per brew type */
export const BREW_COST: Record<BrewType, number> = {
    espresso: 18,
    filter: 25,
    cold_brew: 35,
};

/** Taste profile used by the blending and customer systems */
export interface TasteProfile {
    body: number;    // 0–100
    aroma: number;   // 0–100
    acidity: number; // 0–100
}

/** Customer preference & satisfaction data */
export interface CustomerOrder {
    preferredTaste: TasteProfile;
    tipMultiplier: number;
}

/** A saved custom blend */
export interface Blend {
    name: string;
    /** Ratio map: plantTier → percentage (must sum to 100) */
    ratios: Record<string, number>;
    resultingTaste: TasteProfile;
}

/** Serialised game save */
export interface SaveData {
    version: number;
    timestamp: string;
    state: Record<string, unknown>;
}
