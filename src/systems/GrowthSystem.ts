/* ──────────────────────────────────────────────────────
 *  GrowthSystem
 *
 *  Manages progressive plant growth tied to focus-session
 *  completion. Growth accumulates across sessions and
 *  unlocks harvest at 100 %.
 * ────────────────────────────────────────────────────── */

import { gameStore } from '../stores/gameStore';

/** Growth per completed focus session (25 % × 4 = 100 %) */
const GROWTH_PER_SESSION = 25;

export class GrowthSystem {
    /** Call this when a focus session completes */
    onFocusSessionComplete(): void {
        const state = gameStore.getState();
        state.addGrowth(GROWTH_PER_SESSION);
    }

    /** Get the current visual stage (1–5) from growth percentage */
    getVisualStage(): number {
        const percent = gameStore.getState().growthPercent;
        if (percent >= 100) return 5;
        if (percent >= 75) return 4;
        if (percent >= 50) return 3;
        if (percent >= 25) return 2;
        return 1;
    }
}
