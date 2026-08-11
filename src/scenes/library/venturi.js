/**
 * Scene: Venturi Throat
 *
 * A converging-diverging throat that makes continuity visible: filaments
 * crowd and accelerate through the contraction, then separate off the
 * diffuser.
 *
 * The geometry is gentler than it looks. The inlet spans design y 0.05 to 0.95
 * and the throat 0.22 to 0.78, an area ratio of 1.61; the monogram sits inside
 * the throat and blocks enough frontal area to take the effective ratio to
 * about 1.9. Closing the throat further would buy a sharper acceleration at the
 * cost of putting a brighter, faster jet directly behind the centre text, which
 * is the trade this scene is deliberately on the safe side of.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { rake } from '../emitters.js';
import { COOL, WARM, scale } from '../../utils/palette.js';

// rake() scales these by count/perFrame = 3 to pay back the frames it skips,
// and DENSITY_DISSIPATION 0.6 takes most of that away again over the ~2s a
// filament needs to reach the throat. What arrives behind the centre text is
// therefore close to the numbers written here, which is why they sit below
// dye-rake's 0.30 rather than at it.
const STEEL = scale(COOL, 0.24);
const STEEL_DIM = scale(COOL, 0.15);
const AMBER = scale(WARM, 0.20);

/** Inlet speed per plug Gaussian, simulation cells per second */
const INLET = 80;

/**
 * Design-space y as a screen-normalised y
 *
 * The design frame is a square on the shorter screen axis, so on a landscape
 * window design y is screen y, but on a portrait one the walls close in
 * vertically. Emitters have to follow them, or the rake is buried in the wall.
 *
 * @param {number} y - Design y
 * @param {number} aspect - Canvas aspect ratio
 * @returns {number} Screen-normalised y
 */
function channelY(y, aspect) {
    return aspect >= 1 ? y : 0.5 + (y - 0.5) * aspect;
}

export default {
    id: 'venturi',
    label: 'Venturi Throat',
    group: 'Tunnel',
    description: 'A contraction that makes continuity visible',

    config: {
        VELOCITY_DISSIPATION: 0.05,
        DENSITY_DISSIPATION: 0.6,
        CURL: 12,
        PRESSURE_ITERATIONS: 40,     // the contraction only accelerates if converged
        SPLAT_RADIUS: 0.12,          // the pointer is a probe, not a paint roller
        SPLAT_FORCE: 1400,
        SHADING: true,
        BLOOM: false,
        OUTFLOW_BOUNDARY: true
    },

    // Design space runs off-frame deliberately: on a wide window the square
    // design frame only covers the middle of the canvas, so full-bleed walls
    // have to extend well past 0 and 1.
    obstacles: [
        'monogram',
        { type: 'polygon', vertices: [
            { x: -0.9, y: 1.3 }, { x: 1.9, y: 1.3 }, { x: 1.9, y: 0.95 },
            { x: 0.90, y: 0.95 }, { x: 0.68, y: 0.78 }, { x: 0.32, y: 0.78 },
            { x: 0.10, y: 0.95 }, { x: -0.9, y: 0.95 }
        ] },
        { type: 'polygon', vertices: [
            { x: -0.9, y: -0.3 }, { x: 1.9, y: -0.3 }, { x: 1.9, y: 0.05 },
            { x: 0.90, y: 0.05 }, { x: 0.68, y: 0.22 }, { x: 0.32, y: 0.22 },
            { x: 0.10, y: 0.05 }, { x: -0.9, y: 0.05 }
        ] }
    ],

    update(ctx) {
        const aspect = ctx.aspect;

        // A plug-ish inlet from three overlapping Gaussians. They sit at the
        // throat corner heights, so the plug edges land exactly where the
        // contraction starts taking fluid, and their combined momentum matches
        // dye-rake's inlet - the only one in the library that has been tuned by
        // eye, and the only calibration available for how fast is "fast".
        for (const y of [0.22, 0.50, 0.78]) {
            ctx.velocity(0.02, channelY(y, aspect), INLET, 0, 0.035);
        }

        // Nine filaments across the inlet, refreshed three per frame. Their own
        // push is a nudge - a Gaussian this narrow carries well under a percent
        // of the plug's momentum - but a nudge is what stops the velocity splat
        // rake() issues from being a pass over the grid that adds nothing.
        rake(ctx, {
            x: 0.035,
            from: channelY(0.10, aspect), to: channelY(0.90, aspect), count: 9,
            dx: 25,
            radius: 0.00010,
            velocityRadius: 0.0008,
            perFrame: 3,
            color: (i) => {
                // The wall pair is what shows whether the flow stays attached
                // down the diffuser, so it gets the contrasting ink
                if (i === 0 || i === 8) return AMBER;
                // Alternating brightness keeps the lines individually readable
                // where the contraction packs them together. The even indices
                // are the dim ones, which puts the centreline filament - the
                // one running straight under the text - on the low setting.
                return i % 2 === 1 ? STEEL : STEEL_DIM;
            }
        });
    }
};
