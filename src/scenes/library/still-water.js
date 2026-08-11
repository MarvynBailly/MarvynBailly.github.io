/**
 * Scene: Still Water
 *
 * One ink drop released into water that is genuinely still. The whole effect
 * is in the restraint: velocity dies in about a second, so a drop blooms,
 * stalls and hangs there instead of being stirred into a lava lamp by
 * vorticity confinement.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { drop, makeRandom } from '../emitters.js';
import { pigment } from '../../utils/palette.js';

export default {
    id: 'still-water',
    label: 'Still Water',
    group: 'Ink',
    description: 'A single ink drop, allowed to bloom and stall',

    config: {
        DENSITY_DISSIPATION: 0.10,   // ink outlives the motion that made it
        VELOCITY_DISSIPATION: 0.9,   // momentum gone in ~1.1s; this IS the effect
        CURL: 3,                     // confinement makes the default read as a lamp
        PRESSURE_ITERATIONS: 28,
        SPLAT_RADIUS: 0.35,
        SPLAT_FORCE: 900,            // a drag should stir, not jet
        SHADING: true,
        BLOOM: false,
        SUNRAYS: false
    },

    obstacles: 'monogram',

    setup(ctx) {
        ctx.state.random = makeRandom(20260809);
        ctx.state.next = 1.5;        // first drop lands a beat after arrival
        ctx.state.count = 0;
    },

    update(ctx, t) {
        const s = ctx.state;
        if (t < s.next) return;

        // Columns either side of the centre text, never behind it
        const columns = [0.18, 0.30, 0.72, 0.85];
        const x = columns[Math.floor(s.random() * columns.length)] + (s.random() - 0.5) * 0.08;
        const y = 0.15 + s.random() * 0.70;

        // Mostly graphite, occasionally a cool one, so the palette reads as
        // deliberate rather than as two competing inks
        const family = (s.count % 4 === 3) ? 'cool' : 'ink';
        const amplitude = family === 'cool' ? 0.45 : 0.30;

        drop(ctx, {
            x, y,
            color: pigment(family, amplitude, 0.06, s.random),
            radius: 0.011,
            speed: 60,
            spread: 0.03,
            arms: 4
        });

        s.count++;
        s.next = t + 4.0 + s.random() * 3.0;
    }
};
