/**
 * Scene: Written in Fire
 *
 * MB written out in flame, a stroke at a time, as if by a pen - then the heat
 * lifts the letters off the page and they burn away into the sky, and the pen
 * starts again.
 *
 * Nothing holds the letters up: they are heat like any other in a fire scene,
 * so the moment a stroke is laid down it starts to rise. Buoyancy is kept low
 * enough that the whole monogram is legible before it goes, and the ember bed
 * underneath keeps something burning while the pen is between passes.
 *
 * References:
 * - scenes/fire.js - the ember bed, and how heat behaves
 * - geometry/monogram.js - the letter proportions the strokes follow
 */

import { makeFire, toScreen, spread, RAMPS, FLAME } from '../fire.js';
import { monogramMB } from '../../geometry/monogram.js';

const BASELINE = 0.3;
const HEIGHT = 0.3;

/** Seconds to write the whole monogram, and between the starts of passes */
const WRITE = 1.6;
const PERIOD = 8;

// Heat rises, and rising heat curls up and tears, so the first M would be in
// shreds before the pen reached the B. Instead the lift is held almost off
// while the pen writes and for a beat after - the monogram just glows - and
// then turned up over IGNITE seconds, so the finished letters go up together.
// Before the next pass it is turned back down over SETTLE seconds: the burn
// leaves the air churning, and a pen writing into that would be torn up too.
const HOLD = 1.2;
const IGNITE = 0.6;
const SETTLE = 1.8;
const LIFT_WRITING = 4;
const LIFT_BURNING = 55;

/** Heat laid along a stroke, and how thick the stroke is */
const INK = 0.9;
const NIB = 0.00013;

/**
 * The centrelines of the monogram's strokes, in the order a hand would write
 * them: the M in one movement, then the B's stem, upper bowl and lower bowl
 *
 * @returns {Array<Array<{x: number, y: number}>>} Polylines, design space
 */
function strokes() {
    const { m, b } = monogramMB({ centerX: 0.5, baseline: BASELINE, height: HEIGHT });
    const y0 = BASELINE;
    const y1 = BASELINE + HEIGHT;

    const left = m.x0 + m.stem / 2;
    const right = m.x1 - m.stem / 2;
    const middle = (m.x0 + m.x1) / 2;
    const theM = [
        { x: left, y: y0 }, { x: left, y: y1 },
        { x: middle, y: y0 + HEIGHT * 0.12 },
        { x: right, y: y1 }, { x: right, y: y0 }
    ];

    const stemX = b.x0 + b.stem / 2;
    const waist = y0 + HEIGHT * 0.53;
    const stem = [{ x: stemX, y: y0 }, { x: stemX, y: y1 }];

    // Each bowl's centreline: out along the bar, round, and back, half a bar
    // in from the outer edge of the solid letter it traces
    const bowl = (bottom, top, width) => {
        const radius = (top - bottom) / 2 - b.bar / 2;
        const cx = b.x0 + width - (top - bottom) / 2;
        const cy = (top + bottom) / 2;
        const points = [{ x: stemX, y: cy + radius }];
        for (let i = 0; i <= 16; i++) {
            const a = Math.PI / 2 - (i / 16) * Math.PI;
            points.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
        }
        points.push({ x: stemX, y: cy - radius });
        return points;
    };

    return [
        theM,
        stem,
        bowl(waist - b.bar / 2, y1, b.width * 0.9),
        bowl(y0, waist + b.bar / 2, b.width)
    ];
}

const STROKES = strokes();

// Every segment with its cumulative distance along the whole monogram, so the
// pen's position is a single number that only ever increases
const SEGMENTS = [];
let LENGTH = 0;
for (const stroke of STROKES) {
    for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1];
        const z = stroke[i];
        const length = Math.hypot(z.x - a.x, z.y - a.y);
        SEGMENTS.push({ a, z, start: LENGTH, end: LENGTH + length });
        LENGTH += length;
    }
}

/**
 * Point a fraction of the way along a segment
 *
 * @param {Object} segment - From SEGMENTS
 * @param {number} s - Distance along the monogram, within the segment
 * @returns {{x: number, y: number}} Design-space point
 */
function along(segment, s) {
    const t = (s - segment.start) / Math.max(segment.end - segment.start, 1e-9);
    return {
        x: segment.a.x + (segment.z.x - segment.a.x) * t,
        y: segment.a.y + (segment.z.y - segment.a.y) * t
    };
}

// The ember bed: a low fire along the ground, there so the screen is never
// empty between passes and so the letters rise out of something burning
const base = makeFire({
    id: 'written-in-fire',
    label: 'Written in Fire',
    description: 'MB written in flame, then burning away',

    beds: [{ x: 0.5, y: 0.04, tongues: spread(9, 0.24, 0.6) }],
    obstacles: [],

    ramp: RAMPS.wood,
    rise: 14,
    heat: 0.08,         // kept low: its plume rises through the letters, and a strong one tears them apart
    breeze: 10,
    gust: 0.6,
    flicker: 0.8,
    dyeEvery: 3,

    config: {
        DENSITY_DISSIPATION: 0.9,  // the letters have to last long enough to read
        BUOYANCY: LIFT_WRITING,    // varied through each pass by update()
        VELOCITY_DISSIPATION: 0.7, // air that settles between passes, so each one is written into calm
        CURL: 6                    // vorticity confinement shreds thin strokes
    }
});

export default {
    ...base,
    group: 'MB',
    focus: { x: 0.5, y: BASELINE },

    setup(ctx) {
        base.setup(ctx);
        ctx.state.pen = 0;
    },

    update(ctx, t, dt) {
        base.update(ctx, t, dt);

        // Where the pen is now and where it was last frame, as distances along
        // the monogram. Once it reaches the end it rests there, drawing
        // nothing, until the next pass sends it back to the start.
        const cycle = t % PERIOD;

        const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
        const ignition = clamp01((cycle - WRITE - HOLD) / IGNITE) * clamp01((PERIOD - cycle) / SETTLE);
        ctx.config.BUOYANCY = LIFT_WRITING + (LIFT_BURNING - LIFT_WRITING) * ignition * ignition;

        const now = Math.min(cycle / WRITE, 1) * LENGTH;
        let before = ctx.state.pen;
        if (now < before) before = 0;   // a new pass has begun
        ctx.state.pen = now;
        if (now <= before) return;

        const color = { r: FLAME.r * INK, g: FLAME.g * INK, b: FLAME.b * INK };

        // Sweep a splat along every piece of stroke the pen crossed this frame.
        // Pen lifts between strokes are simply not segments, so they draw nothing.
        for (const segment of SEGMENTS) {
            if (segment.end <= before || segment.start >= now) continue;

            const from = toScreen(...xy(along(segment, Math.max(before, segment.start))), ctx.aspect);
            const to = toScreen(...xy(along(segment, Math.min(now, segment.end))), ctx.aspect);
            ctx.dye(to.x, to.y, color, NIB, from.x, from.y);
        }
    }
};

/**
 * @param {{x: number, y: number}} point - Point
 * @returns {number[]} [x, y]
 */
function xy(point) {
    return [point.x, point.y];
}
