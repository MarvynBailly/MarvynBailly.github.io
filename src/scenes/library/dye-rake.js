/**
 * Scene: Dye Rake
 *
 * Smoke-rake streaklines over the monogram: the cheapest thing on the list
 * that looks like a photograph from a real facility.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { rake } from '../emitters.js';
import { WARM, COOL, scale } from '../../utils/palette.js';

const AMBER = scale(WARM, 0.30);
const AMBER_DIM = scale(WARM, 0.20);
const STEEL = scale(COOL, 0.26);

export default {
    id: 'dye-rake',
    label: 'Dye Rake',
    group: 'Tunnel',
    description: 'Parallel streaklines bending around the monogram',

    config: {
        DENSITY_DISSIPATION: 0.15,   // filaments must survive the crossing
        VELOCITY_DISSIPATION: 0.05,
        CURL: 8,                     // confinement frays straight filaments
        PRESSURE_ITERATIONS: 40,
        WALL_SLIP: 0.90,
        SHADING: false,
        OUTFLOW_BOUNDARY: true
    },

    obstacles: 'monogram',

    update(ctx) {
        // A plug-ish inlet profile: overlapping Gaussians across the full height
        for (let i = 0; i < 5; i++) {
            ctx.velocity(0.02, 0.1 + i * 0.2, 90, 0, 0.02);
        }

        // Eleven filaments, refreshed three per frame. Every third is dimmer so
        // individual lines stay readable where they crowd together.
        rake(ctx, {
            x: 0.03,
            from: 0.10, to: 0.90, count: 11,
            dx: 0,
            radius: 0.00010,
            velocityRadius: 0.0008,
            perFrame: 3,
            color: (i) => (i % 3 === 0 ? STEEL : (i % 3 === 1 ? AMBER : AMBER_DIM))
        });
    }
};
