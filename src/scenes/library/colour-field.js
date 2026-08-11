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

import { makeRandom, scaleColor } from '../emitters.js';

/**
 * Place a wash source somewhere in the field
 *
 * @param {function(): number} random - Scene's random source
 * @param {number} age - Starting age, for staggering on setup
 * @returns {Object} Source state
 */
function spawn(random, age) {
    const angle = random() * Math.PI * 2;
    return {
        x: 0.10 + random() * 0.80,
        y: 0.15 + random() * 0.70,
        dx: Math.cos(angle) * DRIFT,
        dy: Math.sin(angle) * DRIFT,
        age
    };
}

/** Colourless: only the magnitude reaches the ramp */
const DENSITY = { r: 1, g: 1, b: 1 };

const COMB_TEETH = 12;
const COMB_PERIOD = 7;

// The wash. Density used to arrive as one full-strength blob every fifth
// frame, which is twelve deposits a second each landing whole - measured at
// 770 units of dye on the frames that carried one and nothing on the other
// four fifths. At this radius that is a visible lump appearing out of nowhere.
//
// Instead a few long-lived sources drift across the field, each depositing a
// little every frame under a raised-cosine envelope, so every source begins and
// ends at exactly zero and no deposit ever has an edge in time. Their ages are
// staggered on setup so they do not breathe in unison.
// Two, not more: a dye splat covers the whole dye buffer, and on a 2-megapixel
// one a third pass per frame costs the frame - measured at 33.4 ms against
// 16.7 ms for two. Evenly staggered raised cosines sum to a constant for any
// count above one, so two smooths the total just as completely as three did.
const SOURCES = 2;
const SOURCE_LIFE = 6.0;      // seconds from fade-in to fade-out
const WASH_RADIUS = 0.02;
// Peak amplitude per source. Averaged over the envelope and the sources this
// puts the same dye per second into the field as the old blob did, so the
// palette still lands where it was tuned.
const WASH_RATE = 0.06;
// Fast enough to cross the field within a life. The old emitter was diffuse
// because it chose a fresh position twelve times a second; a source that stays
// put spends six seconds pouring dye down one hole and reads as a spotlight,
// which is what the first attempt at this looked like. Travel is what buys the
// spread back, and at this speed each frame's step is a small fraction of the
// splat radius, so the trail it lays has no gaps in it.
const DRIFT = 0.22;           // screen widths per second

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
        PALETTE_RAMP: true,
        // The letterform is left in the flow but not drawn. It still shapes
        // everything around it, and because dye cannot enter a solid it reads
        // as a soft silhouette in the water rather than as a graphic sitting on
        // top of it - which is the whole difference between an obstacle in a
        // simulation and a logo over a background.
        SHOW_OBSTACLES: false
    },

    obstacles: 'monogram',

    setup(ctx) {
        ctx.state.random = makeRandom(7714);
        ctx.state.nextComb = 3;
        ctx.state.sweep = 0;

        // Ages are spread across the cycle so the sources fade in and out at
        // different times rather than all together
        ctx.state.sources = [];
        for (let i = 0; i < SOURCES; i++) {
            ctx.state.sources.push(spawn(ctx.state.random, (SOURCE_LIFE * i) / SOURCES));
        }
    },

    update(ctx, t) {
        const s = ctx.state;

        // A slow wash keeps something in the field for the ramp to work on
        for (const source of s.sources) {
            source.age += ctx.dt;
            if (source.age >= SOURCE_LIFE) Object.assign(source, spawn(s.random, 0));

            source.x += source.dx * ctx.dt;
            source.y += source.dy * ctx.dt;

            // Turn at the edges rather than wrapping: a source that reappears
            // on the far side would jump, and a jump is the thing this whole
            // arrangement exists to avoid.
            if (source.x < 0.06 || source.x > 0.94) {
                source.dx = -source.dx;
                source.x = Math.min(Math.max(source.x, 0.06), 0.94);
            }
            if (source.y < 0.12 || source.y > 0.88) {
                source.dy = -source.dy;
                source.y = Math.min(Math.max(source.y, 0.12), 0.88);
            }

            // Raised cosine: zero at both ends of the life, so a source is
            // never switched on or off, only faded.
            const envelope = 0.5 - 0.5 * Math.cos((2 * Math.PI * source.age) / SOURCE_LIFE);

            // Per second rather than per frame, so the wash does not get
            // heavier on a 120 Hz display than on a 60 Hz one.
            const amount = WASH_RATE * envelope * ctx.dt * 60;
            ctx.dye(source.x, source.y, scaleColor(DENSITY, amount), WASH_RADIUS);
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
