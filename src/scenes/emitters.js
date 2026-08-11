/**
 * Emitter helpers
 *
 * Building blocks scenes compose their per-frame behaviour from. They exist so
 * a scene file reads as a description of what is being injected rather than as
 * splat bookkeeping.
 *
 * The cost model behind the rate limiting here, measured on the shipping build:
 * an idle frame is 48 full-screen passes, of which 40 are the pressure solve on
 * the small simulation grid. Each emitter adds two more, and one of those
 * covers the 1.86-megapixel dye buffer. Around eight to ten emitters per frame
 * is comfortable; past that, dye injection dominates the frame.
 *
 * Advection smears dye between frames, so emitting every nth frame at n times
 * the amplitude looks the same as emitting every frame and costs a fraction.
 *
 * References:
 * - scenes/SceneManager.js - the context these operate on
 */

/**
 * Rate limiter: true once every n frames
 *
 * @param {Object} ctx - Scene context
 * @param {number} n - Period in frames
 * @param {number} [offset] - Phase, for staggering several emitters
 * @returns {boolean} Whether to act this frame
 */
export function every(ctx, n, offset = 0) {
    return n <= 1 || (ctx.frame + offset) % n === 0;
}

/**
 * A steady source of fluid pushed in one direction
 *
 * @param {Object} ctx - Scene context
 * @param {Object} options
 * @param {number} options.x - Screen x
 * @param {number} options.y - Screen y
 * @param {number} options.dx - Horizontal velocity
 * @param {number} options.dy - Vertical velocity
 * @param {number} options.radius - Velocity splat radius
 * @param {Object} [options.color] - Dye colour; omit for an invisible push
 * @param {number} [options.dyeRadius] - Dye splat radius, defaults to radius
 * @param {number} [options.dyeEvery] - Emit dye every nth frame
 * @param {number} [options.phase] - Phase offset for the dye rate limiter
 */
export function stream(ctx, options) {
    const { x, y, dx, dy, radius, color, dyeRadius, dyeEvery = 1, phase = 0 } = options;

    ctx.velocity(x, y, dx, dy, radius);

    if (color && every(ctx, dyeEvery, phase)) {
        // Compensate the amplitude for the frames that were skipped, so the
        // steady-state brightness does not depend on the emission rate.
        const boosted = {
            r: color.r * dyeEvery,
            g: color.g * dyeEvery,
            b: color.b * dyeEvery
        };
        ctx.dye(x, y, boosted, dyeRadius || radius);
    }
}

/**
 * A row of evenly spaced dye filaments, as a smoke rake in a tunnel
 *
 * Filaments are refreshed round-robin so the cost is a few splats per frame
 * rather than one per filament per frame.
 *
 * @param {Object} ctx - Scene context
 * @param {Object} options
 * @param {number} options.x - Screen x of the rake
 * @param {number} options.from - Screen y of the first filament
 * @param {number} options.to - Screen y of the last filament
 * @param {number} options.count - Number of filaments
 * @param {number} options.dx - Horizontal velocity given to each filament
 * @param {number} options.radius - Dye splat radius
 * @param {number} options.velocityRadius - Velocity splat radius
 * @param {function(number): Object} options.color - Colour for filament index i
 * @param {number} [options.perFrame] - Filaments refreshed per frame
 */
export function rake(ctx, options) {
    const {
        x, from, to, count, dx, radius, velocityRadius,
        color, perFrame = 3
    } = options;

    const span = count > 1 ? (to - from) / (count - 1) : 0;

    for (let n = 0; n < perFrame; n++) {
        const i = (ctx.frame * perFrame + n) % count;
        const y = from + span * i;

        ctx.velocity(x, y, dx, 0, velocityRadius);
        // Each filament is refreshed every count/perFrame frames, so scale up
        ctx.dye(x, y, scaleColor(color(i), count / perFrame), radius);
    }
}

/**
 * A single expanding drop: dye at the centre, velocity pushed outward
 *
 * The outward ring is what turns a flat disc into a lobed corona - without it
 * the dye just sits where it landed.
 *
 * @param {Object} ctx - Scene context
 * @param {Object} options
 * @param {number} options.x - Screen x
 * @param {number} options.y - Screen y
 * @param {Object} options.color - Dye colour
 * @param {number} options.radius - Dye splat radius
 * @param {number} [options.speed] - Outward velocity
 * @param {number} [options.spread] - Distance of the velocity ring from centre
 * @param {number} [options.arms] - Number of outward pushes
 */
export function drop(ctx, options) {
    const {
        x, y, color, radius,
        speed = 60, spread = 0.03, arms = 4
    } = options;

    ctx.dye(x, y, color, radius);

    for (let i = 0; i < arms; i++) {
        const angle = (i / arms) * Math.PI * 2;
        const ox = Math.cos(angle), oy = Math.sin(angle);
        ctx.velocity(x + ox * spread, y + oy * spread, ox * speed, oy * speed, radius * 0.6);
    }
}

/**
 * Multiply a colour's amplitude
 *
 * @param {Object} color - {r, g, b}
 * @param {number} amount - Multiplier
 * @returns {Object} Scaled colour
 */
export function scaleColor(color, amount) {
    return { r: color.r * amount, g: color.g * amount, b: color.b * amount };
}

/**
 * Deterministic pseudo-random source
 *
 * Scenes get their own stream so their behaviour is reproducible frame to
 * frame, which matters when a scene has to be tuned by eye.
 *
 * @param {number} [seed] - Starting seed
 * @returns {function(): number} Generator returning 0 to 1
 */
export function makeRandom(seed = 1) {
    let state = seed >>> 0 || 1;
    return function random() {
        // xorshift32
        state ^= state << 13; state >>>= 0;
        state ^= state >> 17;
        state ^= state << 5; state >>>= 0;
        return state / 4294967296;
    };
}
