/* ──────────────────────────────────────────────────────
 *  BrewSystem
 *
 *  Handles coffee brewing: deducts beans, calculates
 *  taste score, and rewards coins.
 * ────────────────────────────────────────────────────── */

import { gameStore } from '../stores/gameStore';
import type { BrewType } from '../types';
import { BREW_COST } from '../types';

export class BrewSystem {
    /** Attempt to brew. Returns coin reward or 0 if not enough beans. */
    brew(type: BrewType): number {
        const cost = BREW_COST[type];
        const success = gameStore.getState().removeBeans(cost);
        if (!success) return 0;

        // Placeholder reward — will be refined with customer taste scoring
        const baseReward = cost * 2;
        gameStore.getState().addCoins(baseReward);
        return baseReward;
    }

    /** Check whether the player can afford a specific brew */
    canBrew(type: BrewType): boolean {
        return gameStore.getState().beanGrams >= BREW_COST[type];
    }
}
