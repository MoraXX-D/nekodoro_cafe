/* ──────────────────────────────────────────────────────
 *  SaveSystem
 *
 *  Serialises / deserialises game state to localStorage.
 *  Includes version stamping for future migration support.
 * ────────────────────────────────────────────────────── */

import { gameStore } from '../stores/gameStore';
import type { SaveData } from '../types';

const STORAGE_KEY = 'cat_cafe_save';
const SAVE_VERSION = 1;

export class SaveSystem {
    /** Persist current state to localStorage */
    save(): void {
        const state = gameStore.getState();
        const data: SaveData = {
            version: SAVE_VERSION,
            timestamp: new Date().toISOString(),
            state: {
                timerSeconds: state.timerSeconds,
                cycleCount: state.cycleCount,
                isBreak: state.isBreak,
                growthPercent: state.growthPercent,
                currentPlantTier: state.currentPlantTier,
                harvestReady: state.harvestReady,
                beanGrams: state.beanGrams,
                maxBeanStorage: state.maxBeanStorage,
                coins: state.coins,
                xp: state.xp,
                reputation: state.reputation,
                dailyStreak: state.dailyStreak,
                lastLoginDate: state.lastLoginDate,
            },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    /** Load state from localStorage. Returns false if no save found or invalid. */
    load(): boolean {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;

        try {
            const data: SaveData = JSON.parse(raw);
            if (data.version !== SAVE_VERSION) {
                console.warn('[SaveSystem] Version mismatch – ignoring save.');
                return false;
            }
            gameStore.setState(data.state);
            return true;
        } catch (err) {
            console.error('[SaveSystem] Failed to parse save data:', err);
            return false;
        }
    }

    /** Wipe the saved game */
    clear(): void {
        localStorage.removeItem(STORAGE_KEY);
        gameStore.getState().reset();
    }
}
