/**
 * Scene: Stack Plume
 *
 * A chimney plume rises from below the monogram, goes turbulent, and breaks
 * over the apex into two counter-rotating braids that fill the counters.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { stream } from '../emitters.js';
import { INK, WARM, scale, mix } from '../../utils/palette.js';

/** Graphite leaning warm: the only part of a stack that is lit is what feeds it */
const SMOKE = scale(mix(INK, WARM, 0.30), 0.38);

// Throat exit, design space. The lip below stops at y 0.13; a source centred
// inside the throat would be half eaten by the obstacle mask, so it sits at the
// exit plane and lets the walls it has just left do the collimating.
const THROAT_X = 0.5;
const THROAT_Y = 0.14;

/** Vertical push at the throat, simulation cells per second */
const RISE = 100;

/** Peak lateral push. At a tenth of RISE the column leans about 16 degrees */
const SWAY = 28;

// Sway frequencies in radians per second, each the golden ratio times the last
// (they are Fibonacci numbers over 100). Incommensurate frequencies never come
// back into phase, so the column wanders for as long as anyone watches without
// repeating. This is the whole defence against a constant jet reading as
// scripted: the eye finds the period in a single sine within two cycles.
const SLOW = 0.21;
const MID = 0.34;
const FAST = 0.55;

/**
 * Map a design-space point onto the screen
 *
 * Obstacles are placed in design space - a square frame fitted to the shorter
 * screen axis - but emitters take screen coordinates, so the source has to
 * follow the chimney through that mapping instead of sitting at a fixed screen
 * position. On a wide window this returns the throat at screen (0.5, 0.14).
 *
 * @param {number} x - Design x
 * @param {number} y - Design y
 * @param {number} aspect - Canvas aspect ratio
 * @returns {{x: number, y: number}} Screen-normalised position
 */
function toScreen(x, y, aspect) {
    return {
        x: 0.5 + (x - 0.5) / Math.max(1, aspect),
        y: 0.5 + (y - 0.5) * Math.min(1, aspect)
    };
}

export default {
    id: 'stack-plume',
    label: 'Stack Plume',
    group: 'Weather',
    description: 'A plume breaking over the monogram',

    config: {
        DENSITY_DISSIPATION: 0.5,
        VELOCITY_DISSIPATION: 0.05,  // the plume must carry
        CURL: 22,
        PRESSURE_ITERATIONS: 40,
        WALL_SLIP: 0.90,
        OUTFLOW_BOUNDARY: true,
        BLOOM: true,                 // a plume lit from within earns it
        BLOOM_THRESHOLD: 0.55,
        BLOOM_INTENSITY: 0.5
    },

    // A chimney throat below the letter, in design space
    obstacles: [
        'monogram',
        { type: 'rectangle', x: 0.452, y: 0.06, width: 0.022, height: 0.07 },
        { type: 'rectangle', x: 0.526, y: 0.06, width: 0.022, height: 0.07 }
    ],

    update(ctx, t) {
        const throat = toScreen(THROAT_X, THROAT_Y, ctx.aspect);

        // Weights sum to one, so the lateral push is bounded by SWAY however the
        // three components happen to line up
        const lean = SWAY * (
            0.50 * Math.sin(SLOW * t) +
            0.32 * Math.sin(MID * t + 1.7) +
            0.18 * Math.sin(FAST * t + 4.1)
        );

        // The draught breathes on the same frequencies in a different mix and at
        // different phases, so the puffs drift in and out of step with the sway
        // rather than arriving with it
        const draught = RISE * (
            1 + 0.18 * Math.sin(MID * t + 0.4) + 0.10 * Math.sin(SLOW * t + 3.3)
        );

        // One source. The split into two braids is the apex of the M doing it,
        // not two emitters pretending to be one plume.
        stream(ctx, {
            x: throat.x,
            y: throat.y,
            dx: lean,
            dy: draught,
            radius: 0.0006,      // 1/e width 0.025, just inside the 0.052 throat
            color: SMOKE,
            dyeRadius: 0.00040,  // a core narrower than the push, so it frays outward
            dyeEvery: 2
        });
    }
};
