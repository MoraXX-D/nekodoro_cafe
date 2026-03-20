/* ──────────────────────────────────────────────────────
 *  HarvestSystem
 *
 *  Handles harvesting mature plants and producing beans.
 *  Yield is randomised (200–400 g) and influenced by plant tier.
 * ────────────────────────────────────────────────────── */

import type { PlantTier } from '../stores/gameStore';
import { gameStore } from '../stores/gameStore';

const BASE_YIELD_MIN = 200;
const BASE_YIELD_MAX = 400;

const TIER_MULTIPLIER: Record<PlantTier, number> = {
    arabica: 1.0,
    robusta: 1.2,
    chicory: 1.4,
    rare: 1.8,
};

export class HarvestSystem {
    /** Attempt to harvest the current plant. Returns grams harvested or 0. */
    harvest(): number {
        const state = gameStore.getState();
        if (!state.harvestReady) return 0;

        const base =
            Math.floor(Math.random() * (BASE_YIELD_MAX - BASE_YIELD_MIN + 1)) +
            BASE_YIELD_MIN;
        const grams = Math.round(base * TIER_MULTIPLIER[state.currentPlantTier]);

        state.addBeans(grams);
        state.resetGrowth();

        return grams;
    }
}
