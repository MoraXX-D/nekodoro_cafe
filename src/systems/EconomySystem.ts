/* ──────────────────────────────────────────────────────
 *  EconomySystem
 *
 *  Central place for economy formulas and balance
 *  calculations referenced by other systems.
 * ────────────────────────────────────────────────────── */

import type { PlantTier } from '../stores/gameStore';
import type { TasteProfile, CustomerOrder } from '../types';
import { PLANT_TIERS } from './PlantTierSystem';

export class EconomySystem {
    /**
     * yield = baseYield × plantTierMultiplier × reputationMultiplier
     */
    calculateHarvestYield(
        baseYield: number,
        tier: PlantTier,
        reputation: number,
    ): number {
        const tierCfg = PLANT_TIERS.find((t) => t.tier === tier);
        const tierMul = tierCfg?.yieldMultiplier ?? 1;
        const repMul = 1 + reputation / 200; // soft scaling
        return Math.round(baseYield * tierMul * repMul);
    }

    /**
     * reward = tasteScore × customerTipMultiplier
     */
    calculateBrewReward(
        brewTaste: TasteProfile,
        order: CustomerOrder,
    ): number {
        const score = this.tasteMatchScore(brewTaste, order.preferredTaste);
        return Math.round(score * order.tipMultiplier);
    }

    /** 0–100 score based on how well the brew matches the customer's taste */
    tasteMatchScore(brew: TasteProfile, pref: TasteProfile): number {
        const diff =
            Math.abs(brew.body - pref.body) +
            Math.abs(brew.aroma - pref.aroma) +
            Math.abs(brew.acidity - pref.acidity);
        return Math.max(0, 100 - diff);
    }
}
