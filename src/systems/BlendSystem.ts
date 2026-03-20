/* ──────────────────────────────────────────────────────
 *  BlendSystem
 *
 *  Lets the player combine multiple bean types into a
 *  custom blend, computing a resulting taste profile.
 * ────────────────────────────────────────────────────── */

import type { TasteProfile, Blend } from '../types';
import { PLANT_TIERS } from './PlantTierSystem';

export class BlendSystem {
    private savedBlends: Blend[] = [];

    /** Compute the taste profile for a given ratio map */
    computeTaste(ratios: Record<string, number>): TasteProfile {
        let body = 0;
        let aroma = 0;
        let acidity = 0;

        for (const [tier, pct] of Object.entries(ratios)) {
            const cfg = PLANT_TIERS.find((t) => t.tier === tier);
            if (!cfg) continue;
            const weight = pct / 100;
            body += cfg.flavorBias.body * weight;
            aroma += cfg.flavorBias.aroma * weight;
            acidity += cfg.flavorBias.acidity * weight;
        }

        return {
            body: Math.round(body),
            aroma: Math.round(aroma),
            acidity: Math.round(acidity),
        };
    }

    /** Save a custom blend */
    saveBlend(name: string, ratios: Record<string, number>): Blend {
        const blend: Blend = {
            name,
            ratios,
            resultingTaste: this.computeTaste(ratios),
        };
        this.savedBlends.push(blend);
        return blend;
    }

    getBlends(): readonly Blend[] {
        return this.savedBlends;
    }
}
