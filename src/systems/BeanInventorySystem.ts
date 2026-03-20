/* ──────────────────────────────────────────────────────
 *  BeanInventorySystem
 *
 *  Tracks bean weight in grams, enforces storage cap,
 *  and provides overflow warnings.
 * ────────────────────────────────────────────────────── */

import { gameStore } from '../stores/gameStore';

export class BeanInventorySystem {
    /** Returns true if storage is at or above capacity */
    isOverflowing(): boolean {
        const s = gameStore.getState();
        return s.beanGrams >= s.maxBeanStorage;
    }

    /** Percentage of storage used (0–100) */
    usagePercent(): number {
        const s = gameStore.getState();
        return Math.min((s.beanGrams / s.maxBeanStorage) * 100, 100);
    }

    /** Expand max storage (e.g. via upgrade purchase) */
    expandStorage(additionalGrams: number): void {
        const s = gameStore.getState();
        // Direct state mutation via set – ok for simple numeric fields
        gameStore.setState({ maxBeanStorage: s.maxBeanStorage + additionalGrams });
    }
}
