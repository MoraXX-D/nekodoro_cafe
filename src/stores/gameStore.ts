/* ──────────────────────────────────────────────────────
 *  GameStore – Zustand vanilla store (no React dependency)
 *
 *  Uses the vanilla `createStore` API so state can be read and
 *  mutated from Phaser scenes, system modules, and (later) any
 *  UI layer.
 * ────────────────────────────────────────────────────── */

import { createStore } from 'zustand/vanilla';
import { OrderSystem, type CoffeeOrder } from '../systems/OrderSystem';

/* ─── State shape ────────────────────────────────────── */
export type TimerState = 'idle' | 'running' | 'completed';

export interface GameState {
    /* Timer */
    timerState: TimerState;
    timerSeconds: number; // 1500 for 25 mins
    cycleCount: number;
    isBreak: boolean;

    /* Plant / Growth */
    growthPercent: number; // 0-100% across multiple sessions
    plantStage: number;    // 1 to 6 visual stage
    currentPlantTier: PlantTier;
    harvestReady: boolean;

    /* Bean Inventory */
    beanGrams: number;
    maxBeanStorage: number;

    /* Economy */
    coins: number;
    xp: number;

    /* Reputation */
    reputation: number;

    /* Streak */
    dailyStreak: number;
    lastLoginDate: string | null;

    /* Orders */
    activeOrders: CoffeeOrder[];

    /* Inventory & Upgrades */
    inventory: {
        milk: number;
        sugar: number;
        honey: number;
        cinnamon: number;
    };
    upgrades: Record<string, number>;

    /* Meta */
    isDevMode: boolean;
}

export type PlantTier = 'arabica' | 'robusta' | 'chicory' | 'rare';

/* ─── Initial state ──────────────────────────────────── */
const initialState: GameState = {
    timerState: 'idle',
    timerSeconds: 25 * 60,
    cycleCount: 0,
    isBreak: false,

    growthPercent: 0,
    plantStage: 1,
    currentPlantTier: 'arabica',
    harvestReady: false,

    beanGrams: 0,
    maxBeanStorage: 500,

    coins: 0,
    xp: 0,

    reputation: 0,

    dailyStreak: 0,
    lastLoginDate: null,

    activeOrders: [],

    inventory: {
        milk: 0,
        sugar: 0,
        honey: 0,
        cinnamon: 0
    },
    upgrades: {},

    isDevMode: false,
};

/* ─── Actions ────────────────────────────────────────── */
export interface GameActions {
    /** Reset all state to initial values */
    reset: () => void;

    /* Timer */
    setTimerRunning: (running: boolean) => void;
    setTimerSeconds: (seconds: number) => void;
    startTimer: () => void;
    tickTimer: () => void;
    cancelTimer: () => void;
    harvestBeans: () => void;
    incrementCycle: () => void;
    setIsBreak: (isBreak: boolean) => void;

    /* Growth */
    addGrowth: (percent: number) => void;
    resetGrowth: () => void;
    setHarvestReady: (ready: boolean) => void;
    setPlantTier: (tier: PlantTier) => void;

    /* Beans */
    addBeans: (grams: number) => void;
    removeBeans: (grams: number) => boolean;

    /* Economy */
    addCoins: (amount: number) => void;
    addXp: (amount: number) => void;

    /* Reputation */
    addReputation: (amount: number) => void;

    /* Streak */
    recordLogin: (dateISO: string) => void;

    /* Orders */
    removeOrder: (id: string) => void;

    /* Dev */
    toggleDevMode: () => void;
}

export type GameStore = GameState & GameActions;

/* ─── Store ──────────────────────────────────────────── */
export const gameStore = createStore<GameStore>()((set, get) => ({
    ...initialState,

    reset: () => set(initialState),

    /* Timer */
    setTimerRunning: (running) => set({ timerState: running ? 'running' : 'idle' }),
    setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),

    startTimer: () => set({
        timerState: 'running',
        timerSeconds: 25 * 60, // 25 minutes
        plantStage: 1
    }),

    tickTimer: () => set((state) => {
        if (state.timerState !== 'running' || state.timerSeconds <= 0) return state;

        const newSeconds = state.timerSeconds - 1;
        const totalDuration = 25 * 60; // 1500s (25 minutes)
        const elapsed = totalDuration - newSeconds;

        // Map 1500 secs to 6 stages (250s per stage):
        let newStage = 1;
        if (newSeconds <= 0) newStage = 6;
        else if (elapsed >= 1250) newStage = 5;
        else if (elapsed >= 1000) newStage = 4;
        else if (elapsed >= 750) newStage = 3;
        else if (elapsed >= 500) newStage = 2;
        else if (elapsed >= 250) newStage = 1;

        return {
            timerSeconds: newSeconds,
            plantStage: newStage,
            timerState: newSeconds <= 0 ? 'completed' : 'running'
        };
    }),

    cancelTimer: () => set((state) => {
        if (state.timerState !== 'running') return state;
        return {
            timerState: 'idle',
            timerSeconds: 25 * 60,
            plantStage: 1,
            reputation: Math.max(0, state.reputation - 5)
        };
    }),

    harvestBeans: () => set((state) => {
        if (state.timerState !== 'completed') return state;

        // Random amount between 18 and 35
        const harvested = Math.floor(Math.random() * (35 - 18 + 1)) + 18;

        // Generate 1-3 random orders
        const newOrders = OrderSystem.generateMultipleOrders(1, 3);

        return {
            timerState: 'idle',
            timerSeconds: 25 * 60,
            plantStage: 1,
            beanGrams: Math.min(state.beanGrams + harvested, state.maxBeanStorage),
            activeOrders: [...state.activeOrders, ...newOrders]
        };
    }),

    removeOrder: (id: string) => set((s) => ({
        activeOrders: s.activeOrders.filter(o => o.id !== id)
    })),

    incrementCycle: () => set((s) => ({ cycleCount: s.cycleCount + 1 })),
    setIsBreak: (isBreak) => set({ isBreak }),

    /* Growth */
    addGrowth: (percent) =>
        set((s) => {
            const next = Math.min(s.growthPercent + percent, 100);
            return { growthPercent: next, harvestReady: next >= 100 };
        }),
    resetGrowth: () => set({ growthPercent: 0, harvestReady: false, plantStage: 1 }),
    setHarvestReady: (ready) => set({ harvestReady: ready }),
    setPlantTier: (tier) => set({ currentPlantTier: tier }),

    /* Beans */
    addBeans: (grams) =>
        set((s) => ({
            beanGrams: Math.min(s.beanGrams + grams, s.maxBeanStorage),
        })),
    removeBeans: (grams) => {
        const state = get();
        if (state.beanGrams < grams) return false;
        set({ beanGrams: state.beanGrams - grams });
        return true;
    },

    /* Economy */
    addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
    addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

    /* Reputation */
    addReputation: (amount) =>
        set((s) => ({ reputation: Math.max(0, s.reputation + amount) })),

    /* Streak */
    recordLogin: (dateISO) =>
        set((s) => {
            if (s.lastLoginDate === dateISO) return s; // already recorded
            return {
                dailyStreak: s.dailyStreak + 1,
                lastLoginDate: dateISO,
            };
        }),

    /* Dev */
    toggleDevMode: () => set((s) => ({ isDevMode: !s.isDevMode })),
}));
