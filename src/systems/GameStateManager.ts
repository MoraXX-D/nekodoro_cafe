import { gameStore } from '../stores/gameStore';

export class GameStateManager {
    private static readonly SAVE_KEY = 'coffeeGameSave';
    private static readonly SAVE_VERSION = 1;
    private static saveDebounceTimer: number | null = null;

    /**
     * Initializes the Save System.
     * Parses LocalStorage payload natively blocking until complete.
     * Directly establishes the `gameStore.subscribe` auto-saving hook!
     */
    public static init(): void {
        this.loadGame();

        // Establish Background Auto-Save Sequence Tracking State Mutability
        gameStore.subscribe((state, prevState) => {
            // Check if any tracked critical progression variables changed
            if (
                state.coins !== prevState.coins ||
                state.beanGrams !== prevState.beanGrams ||
                state.activeOrders !== prevState.activeOrders ||
                state.plantStage !== prevState.plantStage ||
                state.growthPercent !== prevState.growthPercent ||
                state.upgrades !== prevState.upgrades ||
                state.inventory !== prevState.inventory
            ) {
                this.scheduleAutoSave();
            }
        });
    }

    private static scheduleAutoSave(): void {
        if (this.saveDebounceTimer !== null) {
            window.clearTimeout(this.saveDebounceTimer);
        }
        
        // Throttling standard game auto-saving behind an 800ms debounce buffer
        this.saveDebounceTimer = window.setTimeout(() => {
            this.saveGame();
            this.saveDebounceTimer = null;
        }, 800);
    }

    /**
     * Packages the gameStore JSON dictionary alongside version metadata
     * serializing directly out natively into LocalStorage.
     */
    public static saveGame(): void {
        const state = gameStore.getState();
        
        const saveData = {
            version: this.SAVE_VERSION,
            data: {
                timerState: state.timerState,
                timerSeconds: state.timerSeconds,
                cycleCount: state.cycleCount,
                isBreak: state.isBreak,
                growthPercent: state.growthPercent,
                plantStage: state.plantStage,
                currentPlantTier: state.currentPlantTier,
                harvestReady: state.harvestReady,
                beanGrams: state.beanGrams,
                maxBeanStorage: state.maxBeanStorage,
                coins: state.coins,
                xp: state.xp,
                reputation: state.reputation,
                dailyStreak: state.dailyStreak,
                lastLoginDate: state.lastLoginDate,
                activeOrders: state.activeOrders,
                inventory: state.inventory,
                upgrades: state.upgrades
            }
        };

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            console.log('✅ Game Auto-Saved:', saveData.data.coins, 'Coins');
        } catch (e) {
            console.error('❌ Failed to aggressively save coffeeGameSave state', e);
        }
    }

    /**
     * Verifies cached data configuration against parsing exceptions.
     * Enforces the `version: 1` contract blocking regressions gracefully.
     */
    public static loadGame(): void {
        try {
            const saveStr = localStorage.getItem(this.SAVE_KEY);
            if (!saveStr) {
                console.log('☕ No save found. Initializing new game configuration.');
                return; 
            }

            const parsed = JSON.parse(saveStr);
            if (parsed.version === this.SAVE_VERSION && parsed.data) {
                // Apply Zustand merged mutations tracking nested defaults cleanly overriding active state
                gameStore.setState(parsed.data);
                console.log('📥 Successfully loaded coffeeGameSave!', parsed.data);
            } else {
                console.warn('⚠️ Save version mismatch or payload object corrupted. Resetting data tracking strictly back to default.');
                this.resetGame();
            }
        } catch (e) {
            console.error('❌ Failed to cleanly interpret storage load state, aggressive reset initialized.', e);
            this.resetGame();
        }
    }

    /**
     * Completely eradicates the JSON player cache and fires the identical state rest on global config!
     */
    public static resetGame(): void {
        localStorage.removeItem(this.SAVE_KEY);
        gameStore.getState().reset();
    }
}
