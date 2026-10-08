/**
 * Fire builder
 *
 * Every fire scene is the same machine with different settings, so they are
 * described here once and each scene file is just its numbers.
 *
 * Dye stands in for heat. Buoyancy lifts it, so a steady trickle of it off a
 * fuel bed organises itself into tongues; dissipation cools it, so a tongue
 * fades from core to tip the way a flame does. Mapped through the scene's
 * palette ramp - or through ASCII's Inferno scheme, which suits it exactly -
 * fresh heat is the pale core colour and spent heat fades to nothing.
 *
 * Wind is the channel inlet, not a push: a uniform force in a closed box is a
 * pure pressure gradient and the projection removes it, so the only way to
 * blow on a fire is to let air in one side and out the other.
 *
 * References:
 * - scenes/library/campfire.js - the fire this was generalised from
 * - scenes/SceneManager.js - the context passed to update()
 */

import { makeRandom } from './emitters.js';

/** Flame colour for the ordinary renderer; a palette ramp only reads its amount */
export const FLAME = { r: 1.0, g: 0.52, b: 0.16 };

/** Empty air: the page background, so a fire scene starts as a blank page */
const PAGE = { r: 0.063, g: 0.075, b: 0.102 };

/** Ramps from empty air through to each fire's core colour, at 0, 0.35, 0.7, 1 */
export const RAMPS = {
    wood: [PAGE, hex('#6b1309'), hex('#e3580e'), hex('#ffe38f')],
    candle: [PAGE, hex('#5a1d05'), hex('#f08a1c'), hex('#fff4c2')],
    embers: [PAGE, hex('#3a0a06'), hex('#9e2a0b'), hex('#ff7a2e')],
    // Red, then orange, then nearly white: a fire burning hot
    hot: [PAGE, hex('#b30000'), hex('#ff9a00'), hex('#fff6b0')],
    gas: [PAGE, hex('#0b1f6b'), hex('#2f6bff'), hex('#c6e6ff')]
};

/**
 * Map a design-space point onto the screen
 *
 * Obstacles live in design space - a square fitted to the shorter screen axis
 * - but emitters take screen coordinates, so a fire has to follow its logs
 * through that mapping.
 *
 * @param {number} x - Design x
 * @param {number} y - Design y
 * @param {number} aspect - Canvas aspect ratio
 * @returns {{x: number, y: number}} Screen-normalised position
 */
export function toScreen(x, y, aspect) {
    return {
        x: 0.5 + (x - 0.5) / Math.max(1, aspect),
        y: 0.5 + (y - 0.5) * Math.min(1, aspect)
    };
}

/**
 * A log, or any straight bar: a rectangle of the given thickness end to end
 *
 * @param {number} x0 - First end, design x
 * @param {number} y0 - First end, design y
 * @param {number} x1 - Second end
 * @param {number} y1 - Second end
 * @param {number} thickness - Diameter, design units
 * @returns {Object} Polygon obstacle
 */
export function log(x0, y0, x1, y1, thickness) {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const nx = (-(y1 - y0) / length) * thickness / 2;
    const ny = ((x1 - x0) / length) * thickness / 2;
    return {
        type: 'polygon',
        vertices: [
            { x: x0 + nx, y: y0 + ny },
            { x: x1 + nx, y: y1 + ny },
            { x: x1 - nx, y: y1 - ny },
            { x: x0 - nx, y: y0 - ny }
        ]
    };
}

/**
 * Tongues evenly spread across a bed, hottest in the middle
 *
 * @param {number} count - Number of tongues; odd gives one tallest flame
 * @param {number} halfWidth - Distance from centre to the outermost, design units
 * @param {number} [edge] - Vigour of the outermost tongues, centre being 1
 * @returns {Array<{offset: number, vigour: number}>} Tongues
 */
export function spread(count, halfWidth, edge = 0.55) {
    const tongues = [];
    for (let i = 0; i < count; i++) {
        const u = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
        tongues.push({ offset: u * halfWidth, vigour: edge + (1 - edge) * (1 - u * u) });
    }
    return tongues;
}

/**
 * Build a fire scene
 *
 * @param {Object} spec
 * @param {string} spec.id - Scene id
 * @param {string} spec.label - Menu label
 * @param {string} spec.description - Menu tooltip
 * @param {Array<Object>} spec.beds - Fuel beds, each
 *        { x, y, slope?, tongues: [{offset, vigour}] } in design space. A
 *        tongue sits at y + |offset| * slope, so a bed can follow the V of
 *        crossed logs.
 * @param {Array<Object>} spec.obstacles - Scene geometry
 * @param {Array<Object>} spec.ramp - Palette ramp, four stops
 * @param {number} spec.rise - Upward push at a tongue, cells/second
 * @param {number} spec.heat - Dye per emission at full vigour
 * @param {number} spec.breeze - Mean inlet speed, cells/second
 * @param {number} [spec.gust] - Gust amplitude, as a fraction of the breeze
 * @param {number} [spec.flicker] - How much a tongue's strength wanders, 0 to 1
 * @param {number} [spec.radius] - Velocity splat radius per tongue
 * @param {number} [spec.dyeRadius] - Dye splat radius per tongue
 * @param {number} [spec.dyeEvery] - Feed each tongue's heat every nth frame
 * @param {Object} [spec.sparks] - { gap: [min, max] seconds, rise, heat, spread }
 * @param {Object} [spec.flares] - { gap: [min, max], length, boost }: now and
 *        then one tongue burns several times harder for a moment
 * @param {Object} [spec.config] - Further config, over the fire defaults
 * @returns {Object} Scene module
 */
export function makeFire(spec) {
    const {
        id, label, description, beds, obstacles, ramp,
        rise, heat, breeze,
        gust = 0.45, flicker = 1, radius = 0.00045, dyeRadius = 0.00032, dyeEvery = 2,
        sparks = null, flares = null, config = {}
    } = spec;

    // Every tongue across every bed, flattened once, with its own phase
    const tongues = [];
    for (const bed of beds) {
        for (const tongue of bed.tongues) {
            tongues.push({
                x: bed.x + tongue.offset,
                y: bed.y + Math.abs(tongue.offset) * (bed.slope || 0),
                vigour: tongue.vigour,
                phase: tongues.length
            });
        }
    }

    return {
        id,
        label,
        group: 'Fire',
        description,
        requires: 'channel',

        // Where the fire is, design space: the middle of its fuel. A page that
        // shows a crop of the scene frames it on this.
        focus: {
            x: tongues.reduce((sum, t) => sum + t.x, 0) / tongues.length,
            y: tongues.reduce((sum, t) => sum + t.y, 0) / tongues.length
        },

        config: {
            DENSITY_DISSIPATION: 2.2,
            VELOCITY_DISSIPATION: 0.12,
            CURL: 28,                    // the flicker in a flame is small-scale vorticity
            PRESSURE_ITERATIONS: 40,
            WALL_SLIP: 0.9,
            BUOYANCY: 110,
            CHANNEL_INLET: breeze,
            SHADING: false,
            // No bloom: a fire's core is far above the threshold and its glow
            // spreads over the whole canvas, which lifts the background off the
            // page and, in ASCII, covers it in faint glyphs
            BLOOM: false,
            SHOW_OBSTACLES: true,
            PALETTE_RAMP: true,
            PALETTE_RAMP_COLORS: ramp,
            ...config
        },

        obstacles,

        setup(ctx) {
            ctx.state.random = makeRandom(7);
            ctx.state.nextSpark = 0.6;
            ctx.state.nextFlare = 1.0;
            ctx.state.flare = null;
        },

        update(ctx, t) {
            const state = ctx.state;
            const random = state.random;

            // Gusts on incommensurate periods, so the wind never settles into a
            // rhythm. Kept above zero: a channel with no inflow pools its smoke.
            ctx.config.CHANNEL_INLET = breeze * Math.max(0.3,
                1 + gust * Math.sin(0.23 * t) + gust * 0.55 * Math.sin(0.61 * t + 1.9)
            );

            // A flare-up: one tongue, picked at random, burns hard for a moment
            if (flares && t >= state.nextFlare) {
                state.nextFlare = t + flares.gap[0] + random() * (flares.gap[1] - flares.gap[0]);
                state.flare = { tongue: Math.floor(random() * tongues.length), until: t + flares.length };
            }
            const flaring = state.flare && t < state.flare.until ? state.flare.tongue : -1;

            for (let i = 0; i < tongues.length; i++) {
                const tongue = tongues[i];
                const at = toScreen(tongue.x, tongue.y, ctx.aspect);

                // Two slow beats at phases set by the tongue's index, plus a
                // little noise every frame so no two cycles match
                const wander =
                    0.22 * Math.sin(2.1 * t + tongue.phase * 1.7) +
                    0.16 * Math.sin(4.7 * t + tongue.phase * 2.9) +
                    0.18 * (random() - 0.5);
                let strength = tongue.vigour * Math.max(0.15, 0.62 + flicker * wander);
                if (i === flaring) strength *= flares.boost;

                ctx.velocity(at.x, at.y, 14 * flicker * (random() - 0.5), rise * strength, radius);

                // Heat on every nth frame, staggered so a bed is never all fed
                // at once, and scaled up to carry the frames it skipped
                if ((ctx.frame + tongue.phase) % dyeEvery === 0) {
                    const amount = dyeEvery * heat * strength;
                    ctx.dye(at.x, at.y, {
                        r: FLAME.r * amount, g: FLAME.g * amount, b: FLAME.b * amount
                    }, dyeRadius);
                }
            }

            // Now and then a spark: a fleck of hot dye thrown up hard. It rises
            // on its own buoyancy and is carried off by the wind as it cools.
            if (sparks && t >= state.nextSpark) {
                state.nextSpark = t + sparks.gap[0] + random() * (sparks.gap[1] - sparks.gap[0]);

                const source = tongues[Math.floor(random() * tongues.length)];
                const at = toScreen(
                    source.x + (random() - 0.5) * (sparks.spread || 0.03),
                    source.y + 0.02,
                    ctx.aspect
                );
                ctx.velocity(at.x, at.y, 30 * (random() - 0.5), sparks.rise * (0.7 + 0.5 * random()), 0.00008);
                ctx.dye(at.x, at.y, {
                    r: FLAME.r * sparks.heat, g: FLAME.g * sparks.heat, b: FLAME.b * sparks.heat
                }, 0.00005);
            }
        }
    };
}

/**
 * @param {string} value - CSS hex colour, #rrggbb
 * @returns {{r: number, g: number, b: number}} Channels in [0, 1]
 */
function hex(value) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
    return { r, g, b };
}
