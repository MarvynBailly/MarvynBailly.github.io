/**
 * Scene: Colour Field
 *
 * Dye stops carrying colour. Density is mapped through a four-stop ramp of site
 * tokens in the display shader, so nothing on screen can leave the palette.
 *
 * Because the ramp decides everything, the emitters here are deliberately
 * colourless: they place density, not hue. What varies is where the fluid is
 * thick, and a slow comb keeps rearranging that.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - shaders/fragment/display.glsl - the PALETTE_RAMP branch
 */

import { makeRandom } from '../emitters.js';

/** Colourless: only the magnitude reaches the ramp */
const DENSITY = { r: 0.30, g: 0.30, b: 0.30 };

const COMB_TEETH = 12;
const COMB_PERIOD = 7;

export default {
    id: 'colour-field',
    label: 'Colour Field',
    group: 'Ink',
    description: 'Density mapped through a palette ramp',
    requires: 'paletteRamp',

    config: {
        DENSITY_DISSIPATION: 0.15,
        VELOCITY_DISSIPATION: 0.35,
        CURL: 18,
        PRESSURE_ITERATIONS: 32,
        SHADING: true,
        PALETTE_RAMP: true
    },

    obstacles: 'monogram',

    setup(ctx) {
        ctx.state.random = makeRandom(7714);
        ctx.state.nextComb = 3;
        ctx.state.sweep = 0;
    },

    update(ctx, t) {
        const s = ctx.state;

        // A slow wash keeps something in the field for the ramp to work on
        if (ctx.frame % 5 === 0) {
            const x = 0.10 + s.random() * 0.80;
            const y = 0.15 + s.random() * 0.70;
            ctx.dye(x, y, DENSITY, 0.02);
        }

        // The comb: a rake of velocity drawn across the field in one frame,
        // perpendicular to its own line, alternating direction each pass. This
        // is the marbling gesture, and it costs nothing between sweeps.
        if (t > s.nextComb) {
            const downward = s.sweep % 2 === 0;
            const speed = downward ? -220 : 220;

            for (let i = 0; i < COMB_TEETH; i++) {
                const x = 0.06 + (0.88 * i) / (COMB_TEETH - 1);
                ctx.velocity(x, downward ? 0.78 : 0.22, 0, speed, 0.004);
            }

            s.sweep++;
            s.nextComb = t + COMB_PERIOD;
        }
    }
};
