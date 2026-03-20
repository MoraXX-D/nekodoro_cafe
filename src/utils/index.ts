/* ──────────────────────────────────────────────────────
 *  Utility helpers
 * ────────────────────────────────────────────────────── */

/** Clamp a number between min and max (inclusive) */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/** Return a random integer between min and max (inclusive) */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Format seconds as mm:ss */
export function formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
