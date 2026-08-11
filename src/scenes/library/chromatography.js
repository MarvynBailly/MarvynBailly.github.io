/**
 * Scene: Chromatography
 *
 * Pigment wicks up the plate and separates itself: the light fraction outruns
 * the heavy one, so the physics produces the palette rather than the emitter.
 * Needs the buoyancy pass, which lifts dye by weighted channel content.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 * - shaders/fragment/buoyancy.glsl - what does the separating
 */

import { every } from '../emitters.js';
import { COOL, WARM, mix, scale } from '../../utils/palette.js';

/**
 * A muddy premix. Under the buoyancy weights below, its cool content scores
 * about 1.8 and its warm content about 1.2, so the two fractions climb at
 * noticeably different rates and the band splits on its own.
 */
const LOADING = scale(mix(COOL, WARM, 0.5), 0.34);

const SPOTS = 7;

export default {
    id: 'chromatography',
    label: 'Chromatography',
    group: 'Ink',
    description: 'Pigment separates as it climbs the plate',
    requires: 'buoyancy',

    config: {
        DENSITY_DISSIPATION: 0.10,
        VELOCITY_DISSIPATION: 0.8,   // a porous plate: buoyancy must beat inertia
        CURL: 0,                     // confinement fights laminar rise, and skips a pass
        PRESSURE_ITERATIONS: 24,
        SHADING: false,
        BUOYANCY: 75,
        BUOYANCY_WEIGHTS: { r: 0.25, g: 0.95, b: 1.30 }  // cool rises ~1.5x faster
    },

    obstacles: 'monogram',

    setup(ctx) {
        ctx.state.nextSpot = 6;
    },

    update(ctx, t) {
        // The loading line: a row of spots along the bottom, refreshed twice a
        // second. Continuous emission would erase the separation by constantly
        // topping the band back up with unseparated pigment.
        if (every(ctx, 30)) {
            for (let i = 0; i < SPOTS; i++) {
                const x = 0.12 + (0.76 * i) / (SPOTS - 1);
                ctx.dye(x, 0.04, LOADING, 0.004);
            }
        }

        // Every so often, one spot is loaded heavily. A single concentrated
        // band climbing through the steady ones is what makes the different
        // rise rates legible as separation rather than as drift.
        if (t > ctx.state.nextSpot) {
            const lane = Math.floor(((t / 12) % SPOTS));
            ctx.dye(0.12 + (0.76 * lane) / (SPOTS - 1), 0.05, scale(LOADING, 2.4), 0.005);
            ctx.state.nextSpot = t + 12;
        }
    }
};
