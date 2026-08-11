/**
 * Scene: Lattice Array
 *
 * A staggered post array with a slowly rotating drive, so the channel
 * structure the fluid threads keeps reorganising itself.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { makeRandom, scaleColor } from '../emitters.js';
import { pigment } from '../../utils/palette.js';

/** Drive rotation rate, rad/s: a full turn in just over two minutes */
const OMEGA = 0.05;

// Acceleration applied to the whole field, cells/second^2. The built-in wind
// tunnel adds WIND_TUNNEL_FORCE (20) per frame against a 60fps reference, so
// 1200; this scene holds velocity twice as long as the default
// (VELOCITY_DISSIPATION 0.10 against 0.20), so half of that lands in the same
// place. Some of it is spent on post drag, so the free stream settles lower.
const DRIVE = 600;

/** Seeds refreshed per frame; the rest of the grid waits its turn */
const SEEDS_PER_FRAME = 4;

// 1/e radius of sqrt(0.00012) = 0.011 screen heights, about three simulation
// cells: a quarter of a channel gap, so a streak threads a gap instead of
// plugging it.
const SEED_RADIUS = 0.00012;

/**
 * Design-space y as a screen-normalised y
 *
 * The design frame is a square on the shorter screen axis, so on a landscape
 * window design y is screen y, but on a portrait one the post rows crowd
 * towards the middle and the seeds have to crowd with them.
 *
 * @param {number} y - Design y
 * @param {number} aspect - Canvas aspect ratio
 * @returns {number} Screen-normalised y
 */
function arrayY(y, aspect) {
    return aspect >= 1 ? y : 0.5 + (y - 0.5) * aspect;
}

/**
 * Staggered posts, skipping any that would collide with the monogram
 *
 * @returns {Array} Circle obstacle definitions
 */
function posts() {
    const defs = [];
    for (let j = 0; j < 5; j++) {
        const y = 0.10 + 0.20 * j;
        for (let i = 0; i < 14; i++) {
            const x = -0.35 + 0.145 * i + (j % 2 ? 0.0725 : 0);
            if (Math.hypot(x - 0.5, y - 0.5) < 0.26) continue;
            defs.push({ type: 'circle', x, y, radius: 0.032 });
        }
    }
    return defs;
}

export default {
    id: 'lattice-array',
    label: 'Lattice Array',
    group: 'Geometry',
    description: 'A staggered post array under a rotating drive',

    config: {
        PRESSURE_ITERATIONS: 44,     // many small solids; 40 leaks through the gaps
        PRESSURE: 0.85,
        VELOCITY_DISSIPATION: 0.10,
        DENSITY_DISSIPATION: 0.7,
        CURL: 18,
        SPLAT_RADIUS: 0.16,
        SPLAT_FORCE: 1800,
        SHADING: true
    },

    obstacles() {
        return ['monogram'].concat(posts());
    },

    setup(ctx) {
        const random = makeRandom(20260809);
        const seeds = [];

        // Columns are given in screen coordinates because the array runs full
        // bleed whatever the window shape; rows are given in design coordinates
        // because they have to fall on the lines midway between post rows,
        // where a seed cannot land inside a post.
        const columns = [0.10, 0.32, 0.68, 0.90];
        const rows = [0.20, 0.40, 0.60, 0.80];

        columns.forEach((x, c) => rows.forEach((y, r) => {
            seeds.push({
                // Jitter breaks the grid. An exact lattice of sources reads as
                // a stamped pattern rather than as dye finding its own way,
                // and it stays in step with the posts as the drive rotates.
                x: x + (random() - 0.5) * 0.06,
                y: y + (random() - 0.5) * 0.04,
                // Checkerboard, so a streak can still be traced back to the
                // channel it started in once the drive has swung off axis.
                color: pigment((c + r) % 2 ? 'warm' : 'cool', 0.14, 0.10, random)
            });
        }));

        ctx.state.seeds = seeds;
    },

    update(ctx, t, dt) {
        const angle = OMEGA * t;

        // A radius this large is flat to within a percent from corner to
        // corner, so the splat acts as a body force over the whole field rather
        // than as a jet - the same trick WIND_TUNNEL_MODE uses. Scaling by dt
        // fixes the acceleration instead of the per-frame kick, so the drive
        // does not double on a 120Hz display.
        //
        // The domain is closed on all four sides here, and the projection can
        // meet that condition by growing a pressure gradient that cancels a
        // uniform force outright. What keeps the drive alive is that forty-four
        // Jacobi sweeps cannot carry that pressure mode across a 455-cell grid
        // in one frame: the interior flows, and the flow stalls against
        // whichever pair of walls the drive is currently pointing at.
        ctx.velocity(
            0.5, 0.5,
            Math.cos(angle) * DRIVE * dt,
            Math.sin(angle) * DRIVE * dt,
            100.0
        );

        // Seeding the whole field rather than one upwind edge is what makes
        // this readable at any drive angle: DENSITY_DISSIPATION 0.7 only lets a
        // streak run about a quarter of the canvas, which is three post columns
        // - enough to show which gaps the fluid is threading, not enough to
        // reach across from a border injector.
        const seeds = ctx.state.seeds;
        const boost = seeds.length / SEEDS_PER_FRAME;

        for (let n = 0; n < SEEDS_PER_FRAME; n++) {
            const seed = seeds[(ctx.frame * SEEDS_PER_FRAME + n) % seeds.length];
            ctx.dye(
                seed.x,
                arrayY(seed.y, ctx.aspect),
                scaleColor(seed.color, boost),
                SEED_RADIUS
            );
        }
    }
};
