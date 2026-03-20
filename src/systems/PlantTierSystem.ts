/* ──────────────────────────────────────────────────────
 *  PlantTierSystem
 *
 *  Manages unlocking and switching between plant tiers.
 *  Tier 1: Arabica (default)
 *  Tier 2: Robusta
 *  Tier 3: Chicory
 *  Tier 4: Rare
 * ────────────────────────────────────────────────────── */

import type { PlantTier } from '../stores/gameStore';
import { gameStore } from '../stores/gameStore';

export interface PlantTierConfig {
    tier: PlantTier;
    label: string;
    unlockCost: number;        // coins to unlock
    yieldMultiplier: number;
    growthSpeedMod: number;    // 1.0 = normal
    flavorBias: { body: number; aroma: number; acidity: number };
}

export const PLANT_TIERS: PlantTierConfig[] = [
    {
        tier: 'arabica',
        label: 'Arabica',
        unlockCost: 0,
        yieldMultiplier: 1.0,
        growthSpeedMod: 1.0,
        flavorBias: { body: 40, aroma: 60, acidity: 50 },
    },
    {
        tier: 'robusta',
        label: 'Robusta',
        unlockCost: 500,
        yieldMultiplier: 1.2,
        growthSpeedMod: 0.9,
        flavorBias: { body: 70, aroma: 30, acidity: 40 },
    },
    {
        tier: 'chicory',
        label: 'Chicory',
        unlockCost: 1200,
        yieldMultiplier: 1.4,
        growthSpeedMod: 0.8,
        flavorBias: { body: 50, aroma: 50, acidity: 60 },
    },
    {
        tier: 'rare',
        label: 'Rare',
        unlockCost: 3000,
        yieldMultiplier: 1.8,
        growthSpeedMod: 0.7,
        flavorBias: { body: 80, aroma: 80, acidity: 30 },
    },
];

export class PlantTierSystem {
    private unlockedTiers: Set<PlantTier> = new Set(['arabica']);

    /** Try to unlock a tier. Returns true if successful. */
    unlock(tier: PlantTier): boolean {
        if (this.unlockedTiers.has(tier)) return false;
        const cfg = PLANT_TIERS.find((t) => t.tier === tier);
        if (!cfg) return false;

        const state = gameStore.getState();
        if (state.coins < cfg.unlockCost) return false;

        state.addCoins(-cfg.unlockCost);
        this.unlockedTiers.add(tier);
        return true;
    }

    /** Switch to a different unlocked plant tier */
    select(tier: PlantTier): boolean {
        if (!this.unlockedTiers.has(tier)) return false;
        gameStore.getState().setPlantTier(tier);
        return true;
    }

    isUnlocked(tier: PlantTier): boolean {
        return this.unlockedTiers.has(tier);
    }

    getConfig(tier: PlantTier): PlantTierConfig | undefined {
        return PLANT_TIERS.find((t) => t.tier === tier);
    }
}
