/* ──────────────────────────────────────────────────────
 *  TimerSystem
 *
 *  Manages the Pomodoro-style focus / break timer loop.
 *  - 25 min focus → 5 min break (configurable)
 *  - Emits progress events consumed by GrowthSystem
 *  - Tracks cycle count (0–4)
 * ────────────────────────────────────────────────────── */

import { gameStore } from '../stores/gameStore';

export class TimerSystem {
    private intervalId: ReturnType<typeof setInterval> | null = null;

    /** Initialize the timer system interval */
    init(): void {
        if (this.intervalId) return;

        // Run every 1000ms
        this.intervalId = setInterval(() => {
            const state = gameStore.getState();
            if (state.timerState === 'running') {
                state.tickTimer();
            }
        }, 1000);
    }

    /** Clean up */
    destroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
