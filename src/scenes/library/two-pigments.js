/**
 * Scene: Two Pigments
 *
 * The rainbow retired. Only the two inks the stylesheet already uses,
 * entering from opposite edges on separate bands so they shear past each
 * other rather than summing to the grey of the body text where they meet.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { stream } from '../emitters.js';
import { COOL, WARM, scale } from '../../utils/palette.js';

export default {
    id: 'two-pigments',
    label: 'Two Pigments',
    group: 'Ink',
    description: 'Only the two site inks, meeting at the monogram',

    config: {
        DENSITY_DISSIPATION: 0.35,   // ~3s memory, but two sources must not pile up
        VELOCITY_DISSIPATION: 0.25,
        CURL: 12,                    // keeps the seam alive without shredding it
        PRESSURE_ITERATIONS: 32,
        SPLAT_RADIUS: 0.30,
        SPLAT_FORCE: 1200,
        SHADING: true,
        PALETTE_POINTER: true        // pointer colour joins the palette too
    },

    obstacles: 'monogram',

    update(ctx, t) {
        // Offset bands: away from the centre text column, and far enough apart
        // in y that the additive mix never lands on neutral grey
        stream(ctx, {
            x: 0.03,
            y: 0.30 + 0.06 * Math.sin(0.35 * t),
            dx: 90, dy: 0,
            radius: 0.020,
            color: scale(COOL, 0.40),
            dyeEvery: 4
        });

        stream(ctx, {
            x: 0.97,
            y: 0.72 + 0.06 * Math.sin(0.29 * t),
            dx: -90, dy: 0,
            radius: 0.020,
            color: scale(WARM, 0.35),
            dyeEvery: 4,
            phase: 2
        });
    }
};
