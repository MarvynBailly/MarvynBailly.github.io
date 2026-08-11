/**
 * Scene: Virga
 *
 * Wind-sheared rain that evaporates before it reaches the ground, which is
 * also how it avoids ponding against the reflecting floor.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { every, makeRandom } from '../emitters.js';
import { COOL, scale } from '../../utils/palette.js';

/** Peak channel 0.30, which is what a deposit lands at, not a per-frame rate */
const RAIN = scale(COOL, 0.38);

const SPAWN_Y = 0.98;
const SPAWN_LEFT = 0.05;
const SPAWN_RIGHT = 0.95;

const FADE_FROM = 0.45;   // dye starts thinning here
const FADE_TO = 0.22;     // gone, and the drop with it, a clear fifth of the
                          // screen above a floor that would otherwise keep it

// Fall and drift, in screen heights per second. Speed sets the cost as much as
// it sets the look: 0.76 of a screen height at 0.80 is a life of 0.95s, so five
// spawns a second hold the live count - and the per-frame passes - just under
// five. Slowing the fall makes it rain harder in the only sense that matters.
const FALL = 0.80;
const SHEAR_TOP = 0.42;   // rightward drift aloft
const SHEAR_BASE = 0.12;  // and at the point of evaporation

/**
 * Fraction of its own velocity a drop hands to the air
 *
 * A drop that injected its full fall speed would drag its own dye down with it
 * and paint a blob. At a third the air lags well behind the drop, so the trail
 * stays roughly where it was laid, shears, and reaches the floor as momentum
 * with no dye left on it.
 */
const DRAG = 0.35;

const SPAWN_INTERVAL = 0.20;  // 5 drops a second
const MAX_LIVE = 7;           // ceiling, not a target: each drop is a dye pass

/**
 * Splat sizes, and the one calculation this scene stands on
 *
 * A drop reads as a streak rather than as floating dust only if it clears its
 * own radius between deposits. It deposits every other frame, so the step to
 * measure is two frames of travel: 0.85 screen heights per second (fall and
 * drift combined) over 1/30s is 0.028, against a dye radius whose 1/e width is
 * sqrt(0.00025) = 0.0158. Just under two radii per deposit - far enough that
 * the trail elongates instead of piling up, close enough that consecutive
 * Gaussians still cross at about 0.8 of peak instead of beading into dots.
 */
const DYE_RADIUS = 0.00025;
const DYE_EVERY = 2;

/** Wider than the dye, so the trail sits inside the pocket it pushed */
const VELOCITY_RADIUS = 0.00040;

/**
 * Add one drop, starting at a given height
 *
 * @param {Object} state - Scene state
 * @param {number} y - Screen y to fall from
 */
function spawnDrop(state, y) {
    state.drops.push({
        x: SPAWN_LEFT + state.random() * (SPAWN_RIGHT - SPAWN_LEFT),
        y,
        // Stagger the dye passes so the cost spreads across frames instead of
        // every live drop firing on the same one
        phase: state.spawned++ % DYE_EVERY
    });
}

export default {
    id: 'virga',
    label: 'Virga',
    group: 'Weather',
    description: 'Sheared rain that evaporates mid-fall',

    config: {
        DENSITY_DISSIPATION: 1.6,    // raised: streaks must evaporate mid-fall
        VELOCITY_DISSIPATION: 0.12,
        CURL: 12,                    // 30 curls the streaks into hooks
        PRESSURE_ITERATIONS: 28,
        OUTFLOW_BOUNDARY: true,
        SHADING: true,
        BLOOM: false
    },

    obstacles: 'monogram',

    setup(ctx) {
        ctx.state.random = makeRandom(4242);
        ctx.state.drops = [];
        ctx.state.spawned = 0;
        ctx.state.next = SPAWN_INTERVAL;

        // Open mid-shower. Filling the sky from empty takes a second, which is
        // a second of nothing for a visitor who may only give the page a few.
        for (let i = 1; i <= 4; i++) {
            spawnDrop(ctx.state, SPAWN_Y - i * (SPAWN_Y - FADE_TO) / 5);
        }
    },

    update(ctx, t, dt) {
        const s = ctx.state;

        // Simulation cells per screen height. Cells are square, so this converts
        // a speed in screen heights into both velocity components.
        const cells = ctx.config.SIM_RESOLUTION;

        // Jittered rather than metronomic: five drops a second on a fixed
        // interval arrive as a curtain rod rather than as weather
        while (t >= s.next) {
            s.next += SPAWN_INTERVAL * (0.5 + s.random());

            // Over the ceiling the drop is skipped, not deferred; deferring it
            // would repay the debt as a burst the moment there was room
            if (s.drops.length >= MAX_LIVE) continue;

            spawnDrop(s, SPAWN_Y);
        }

        for (let i = s.drops.length - 1; i >= 0; i--) {
            const drop = s.drops[i];

            // Shear: the wind a drop feels weakens as it descends, so a streak
            // steepens on its way down instead of ruling a straight slash
            const height = (drop.y - FADE_TO) / (SPAWN_Y - FADE_TO);
            const drift = SHEAR_BASE + (SHEAR_TOP - SHEAR_BASE) * height;

            drop.y -= FALL * dt;
            drop.x += drift * dt / ctx.aspect;   // drift is in screen heights, x in widths

            // Evaporated, or blown out of frame. Either way it stops costing.
            if (drop.y < FADE_TO || drop.x > 1.02) {
                s.drops.splice(i, 1);
                continue;
            }

            ctx.velocity(
                drop.x, drop.y,
                drift * cells * DRAG,
                -FALL * cells * DRAG,
                VELOCITY_RADIUS
            );

            if (every(ctx, DYE_EVERY, drop.phase)) {
                const fade = Math.min(1, (drop.y - FADE_TO) / (FADE_FROM - FADE_TO));
                ctx.dye(drop.x, drop.y, scale(RAIN, fade), DYE_RADIUS);
            }
        }
    }
};
