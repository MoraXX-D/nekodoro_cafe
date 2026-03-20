/* ──────────────────────────────────────────────────────
 *  ReputationSystem
 *
 *  Tracks café reputation based on customer satisfaction
 *  and daily streaks. Unlocks VIP customers at thresholds.
 * ────────────────────────────────────────────────────── */

import { gameStore } from '../stores/gameStore';

export class ReputationSystem {
    /** Formula: repGain = (satisfaction + streakBonus) / 10 */
    onCustomerServed(satisfactionScore: number): void {
        const streak = gameStore.getState().dailyStreak;
        const streakBonus = Math.min(streak, 10); // cap bonus at 10
        const gain = (satisfactionScore + streakBonus) / 10;
        gameStore.getState().addReputation(gain);
    }

    /** Reputation tier label */
    getTier(): string {
        const rep = gameStore.getState().reputation;
        if (rep >= 100) return 'Legendary';
        if (rep >= 50) return 'Popular';
        if (rep >= 20) return 'Known';
        return 'New';
    }

    /** Check if VIP customers should appear */
    isVipUnlocked(): boolean {
        return gameStore.getState().reputation >= 50;
    }
}
