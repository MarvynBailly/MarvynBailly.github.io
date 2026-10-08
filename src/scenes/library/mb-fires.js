/**
 * Scenes: MB fires
 *
 * The monogram standing in a fire, at several sizes of fire and in two ways
 * of showing the letters.
 *
 * Outlined, the letters are drawn as walls - dark with a contour - and the
 * fire burns round them. Unoutlined, the walls are still there but nothing
 * draws them: the letters exist only as the space the fire cannot enter, so
 * the flames do the outlining. That needs fire on every side of them, which
 * is why those variants burn wider and harder, and why the B's two counters -
 * sealed off, so no flame could ever reach them - carry a faint glow of their
 * own; unlit, the B would read as a solid blob.
 *
 * The letters stand well above the ground, in the flames rather than on the
 * fuel, so the fire has room to build before it reaches them.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 * - geometry/monogram.js - the letterforms
 */

import { makeFire, log, spread, toScreen, RAMPS, FLAME } from '../fire.js';
import { makeRandom } from '../emitters.js';
import { monogramMB } from '../../geometry/monogram.js';

const BASELINE = 0.32;
const HEIGHT = 0.24;
const GROUND = 0.07;

const { obstacles: LETTERS, m, b } = monogramMB({ centerX: 0.5, baseline: BASELINE, height: HEIGHT });

/** The pair's horizontal extent, design space */
const LEFT = m.x0;
const RIGHT = b.x1;

// How hard a fire burns. Each level moves heat, lift and cooling together:
// more heat alone just makes a brighter blob, and more lift alone a thinner one.
const LEVELS = {
    low: { rise: 45, heat: 0.22, buoyancy: 95, dissipation: 2.3, sparks: { gap: [0.8, 2.5], rise: 150, heat: 1.2, spread: 0.06 } },
    medium: { rise: 70, heat: 0.36, buoyancy: 125, dissipation: 1.8, sparks: { gap: [0.15, 0.6], rise: 210, heat: 1.6, spread: 0.06 } },
    high: { rise: 90, heat: 0.48, buoyancy: 150, dissipation: 1.45, sparks: { gap: [0.06, 0.3], rise: 240, heat: 1.8, spread: 0.08 } },
    extreme: { rise: 110, heat: 0.6, buoyancy: 175, dissipation: 1.15, sparks: { gap: [0.02, 0.15], rise: 280, heat: 2.0, spread: 0.1 } }
};

/** A single flame at a point, as a bed of one */
const flame = (x, y, vigour) => ({ x, y, tongues: [{ offset: 0, vigour }] });

/**
 * Build one MB fire
 *
 * @param {Object} spec
 * @param {string} spec.id - Scene id
 * @param {string} spec.label - Menu label
 * @param {string} spec.description - Menu tooltip
 * @param {string} spec.level - Key into LEVELS
 * @param {number} spec.spread - How far the fire bed reaches past the letters
 *        on each side, design units; 0 is a bed exactly as wide as the pair
 * @param {boolean} spec.outlined - Draw the letters, or leave them to the fire
 * @returns {Object} Scene module
 */
function mbFire({ id, label, description, level, spread: reach, outlined }) {
    const intensity = LEVELS[level];
    const halfWidth = (RIGHT - LEFT) / 2 + reach;

    // One tongue every couple of hundredths across the bed, so a wider fire
    // is more flames rather than the same flames further apart
    const count = 2 * Math.round(halfWidth / 0.022) + 1;

    const beds = [
        { x: 0.5, y: GROUND + 0.035, tongues: spread(count, halfWidth, 0.55) },

        // Flames off the letters' tops, and in the M's notch where the two
        // diagonals meet and heat collects like water in a cupped hand
        flame(m.x0 + m.diagonal / 2, m.y1 + 0.016, 0.5),
        flame(m.x1 - m.diagonal / 2, m.y1 + 0.016, 0.5),
        flame((m.x0 + m.x1) / 2, BASELINE + HEIGHT * (m.diagonal / (m.width / 2)) + 0.02, 0.55),
        flame(b.x0 + b.width * 0.25, b.y1 + 0.016, 0.45),
        flame(b.x0 + b.width * 0.6, b.y1 + 0.016, 0.45)
    ];

    // Without an outline the counters have to be lit from inside or they
    // vanish into the letter. A glow, not a flame: they are sealed, so any
    // heat put in stays, and a little goes a long way.
    if (!outlined) {
        for (const counter of b.counters) beds.push(flame(counter.x, counter.y, 0.12));
    }

    const scene = makeFire({
        id,
        label,
        description,
        beds,

        obstacles: [
            ...LETTERS,
            log(0.5 - halfWidth - 0.02, GROUND, 0.5 + halfWidth + 0.02, GROUND, 0.04)
        ],

        ramp: RAMPS.wood,
        rise: intensity.rise,
        heat: intensity.heat,
        breeze: 26,
        gust: 0.5,
        dyeEvery: count > 21 ? 4 : 3,   // a wide bed is a lot of splats; feed fewer per frame
        sparks: intensity.sparks,

        config: {
            DENSITY_DISSIPATION: intensity.dissipation,
            BUOYANCY: intensity.buoyancy,
            CURL: 30,
            SHOW_OBSTACLES: outlined
        }
    });

    return { ...scene, group: 'MB' };
}

// ----- The letters themselves on fire -----------------------------------

/** How far the burning band reaches out from the letters' surfaces, design units */
const BAND = 0.022;

/** Weight of the band inside the B's counters, which are sealed and fill up */
const COUNTER_WEIGHT = 0.18;

/** Height of the mask drawing, pixels; its width follows the window's shape */
const MASK_HEIGHT = 512;

/**
 * A polygon's vertices, whatever kind of obstacle it was declared as
 *
 * @param {Object} part - Obstacle definition
 * @returns {Array<{x: number, y: number}>} Vertices
 */
function outline(part) {
    if (part.type === 'rectangle') {
        const { x, y, width, height } = part;
        return [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
    }
    return part.vertices;
}

/**
 * Draw where the letters burn: a band just outside every surface
 *
 * Every part of both letters is stroked thick, then the letters themselves
 * are cut out of the stroke, which leaves a band in the open air all the way
 * round them. The seams where the B's parts overlap fall inside the letter
 * and are cut away with it, so only real surfaces burn. The band inside the
 * B's counters is then turned down, since a counter is sealed: heat put in
 * it never leaves, and at full weight it fills solid.
 *
 * Drawn for the current window shape, because design space maps onto the
 * screen differently at every aspect ratio.
 *
 * @param {number} aspect - Canvas aspect ratio
 * @param {Array<Object>} letters - The letters' obstacle definitions
 * @param {Array<Object>} counters - The B's counters, from monogramMB
 * @param {number} band - How far the burning band reaches, design units
 * @returns {HTMLCanvasElement} White where the letters burn, top row first
 */
function drawBurningEdge(aspect, letters, counters, band) {
    const height = MASK_HEIGHT;
    const width = Math.max(1, Math.round(height * aspect));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext('2d');

    // Design space is a square fitted to the shorter side of the screen
    const unit = Math.min(width, height);
    const toPixels = (p) => {
        const s = toScreen(p.x, p.y, aspect);
        return [s.x * width, (1 - s.y) * height];
    };
    const trace = (vertices) => {
        g.beginPath();
        vertices.forEach((v, i) => (i ? g.lineTo(...toPixels(v)) : g.moveTo(...toPixels(v))));
        g.closePath();
    };
    const parts = letters.map(outline);

    // The stroke is soft-edged, so the band fades out into the air rather
    // than stopping at a line, and filtered texture lookups stay smooth
    g.filter = `blur(${Math.max(1, unit * band * 0.25)}px)`;
    g.strokeStyle = '#fff';
    g.lineJoin = 'round';
    g.lineWidth = 2 * band * unit;
    for (const part of parts) {
        trace(part);
        g.stroke();
    }
    g.filter = 'none';

    // Cut the letters out of it
    g.globalCompositeOperation = 'destination-out';
    for (const part of parts) {
        trace(part);
        g.fill();
    }

    // Turn the counters down
    g.globalAlpha = 1 - COUNTER_WEIGHT;
    for (const c of counters) {
        const [left, top] = toPixels({ x: c.x - c.halfWidth, y: c.y + c.halfHeight });
        const [right, bottom] = toPixels({ x: c.x + c.halfWidth, y: c.y - c.halfHeight });
        g.fillRect(left, top, right - left, bottom - top);
    }

    return canvas;
}

/**
 * Build an MB scene whose letters are on fire
 *
 * Built on mbFire for the ground fire, the config and the sparks; the
 * letters' own flames come from a drawing of their burning edge, fed in full
 * every frame by one pass for heat and one for lift. Feeding the edge as
 * splats instead, a few points a frame in turn, showed the feeding as a light
 * running round the letters.
 *
 * @param {Object} spec
 * @param {string} spec.id - Scene id
 * @param {string} spec.label - Menu label
 * @param {string} spec.description - Menu tooltip
 * @param {boolean} spec.ground - Burn on top of a ground fire, or alone
 * @param {number} spec.burn - How fiercely the letters burn, 1 being the default
 * @param {number} [spec.baseline] - Letters' baseline, design space
 * @param {number} [spec.height] - Letters' cap height
 * @param {number} [spec.brightness] - Extra heat on the letters' flames, without
 *        more lift: brighter, not taller
 * @param {Object} [spec.lake] - Water under the letters instead of ground:
 *        { waterline, ripple, reflectivity, color?, landscape? }, waterline in
 *        design space. It has real waves, firelight on it, and sparks falling
 *        into it; each can be switched off in the settings panel.
 * @returns {Object} Scene module
 */
function mbBurning({ id, label, description, ground, burn, baseline = BASELINE, height = HEIGHT, lake = null, brightness = 1 }) {
    // Letters drawn smaller than the lakes' 0.2 are further away, and their
    // fire has to shrink with them - a thinner burning band, less lift, less
    // heat - or the flames swallow the letters and read as near, not far
    const distance = Math.min(1, height / 0.2);

    // The letters' own flames add a lot of heat, so the ground fire under them
    // burns at the low level; at medium the two together blow out to white
    const base = mbFire({ id, label, description, level: 'low', spread: 0.08, outlined: false });
    const { obstacles: letters, m: theM, b: theB } = monogramMB({ centerX: 0.5, baseline, height });

    // A lake is a solid floor for the fluid - flames stay above the surface -
    // and a reflection for the display, both at the same waterline. The floor
    // runs well past the design square so it spans any window width.
    const obstacles = lake
        ? [...letters, { type: 'rectangle', x: -2, y: -1, width: 5, height: 1 + lake.waterline }]
        : base.obstacles;

    const config = lake ? {
        ...base.config,
        REFLECTION: true,
        WATERLINE: lake.waterline,
        RIPPLE: lake.ripple,
        REFLECTIVITY: lake.reflectivity,
        WAVES: true,
        WAVE_STRENGTH: 0.05,
        FIRELIGHT: 0.7,
        FALLING_SPARKS: false,     // off by default; the settings panel turns them on
        AMBIENT_RIPPLES: 1.1,
        SWELL: lake.swell || 0,
        TREES_BURN: true,          // the pines catch if fire reaches them      // small rings now and then, so the water is never quite still
        POINTER_WIND: true,        // the pointer is a breeze over the lake, not a brush
        POINTER_FIRE: true,        // and held down, a torch
        LANDSCAPE: !!lake.landscape,
        SMOKE: !!lake.landscape,       // trees warming toward catching give off smoke
        ...(lake.ramp ? { PALETTE_RAMP_COLORS: lake.ramp } : {}),
        ...(lake.color ? { WATER_COLOR: lake.color } : {})
    } : base.config;

    return {
        ...base,
        obstacles,
        config,

        // Framed on the letters rather than the fuel, for pages that crop
        focus: { x: 0.5, y: (lake ? lake.waterline : baseline) - 0.01 },

        setup(ctx) {
            base.setup(ctx);
            ctx.state.edge = null;
            ctx.state.edgeAspect = 0;
            ctx.state.sparks = [];
            ctx.state.nextFallingSpark = 1.5;
            ctx.state.sparkRandom = makeRandom(23);
        },

        update(ctx, t, dt) {
            // Without a ground fire the bed is held at nothing; only the wind runs
            if (ground) {
                base.update(ctx, t, dt);
            } else {
                ctx.config.CHANNEL_INLET = 26 * Math.max(0.3, 1 + 0.5 * Math.sin(0.23 * t));
            }

            // Redrawn whenever the window changes shape
            if (Math.abs(ctx.aspect - ctx.state.edgeAspect) > 1e-3) {
                ctx.state.edge = ctx.mask(drawBurningEdge(ctx.aspect, letters, theB.counters, BAND * distance), ctx.state.edge);
                ctx.state.edgeAspect = ctx.aspect;
            }

            // Lift steadier than heat: the flicker is in how much burns, not in
            // the air jerking about
            const heat = 0.04 * burn * Math.sqrt(distance) * brightness;
            ctx.velocitySource(ctx.state.edge, 0, 2.6 * burn * distance, { flicker: 0.4, grain: 20 / distance });
            ctx.dyeSource(ctx.state.edge, { r: FLAME.r * heat, g: FLAME.g * heat, b: FLAME.b * heat },
                { flicker: 0.9, grain: 26 / distance });

            if (lake && ctx.config.FALLING_SPARKS) fallingSparks(ctx, t, dt, lake.waterline, theM.x0, theB.x1, baseline + height);
        }
    };
}

/**
 * Sparks spat off the burning letters that arc up, fall, and land in the lake
 *
 * The rising sparks in the other fire scenes are heat thrown upward, and heat
 * only goes up. These are embers - things with weight - so they are tracked
 * as particles on the CPU: a ballistic arc under gravity, drawn each frame as
 * a short stroke of heat from where the ember was to where it is. When one
 * reaches the waterline it goes out and leaves a ring on the surface, landing
 * a little way out on the lake rather than at the far shore.
 *
 * @param {Object} ctx - Scene context
 * @param {number} t - Scene time, seconds
 * @param {number} dt - Step, seconds
 * @param {number} waterline - Design space
 * @param {number} left - Letters' left edge, design space
 * @param {number} right - Letters' right edge
 * @param {number} top - Letters' top
 */
function fallingSparks(ctx, t, dt, waterline, left, right, top) {
    const state = ctx.state;
    const random = state.sparkRandom;

    if (t >= state.nextFallingSpark && state.sparks.length < 6) {
        state.nextFallingSpark = t + 0.35 + random() * 1.4;

        // Off the tops of the letters, always thrown upward: within about 30
        // degrees of vertical, leaning outward the further from the middle
        // it starts, so the sparks fan out over the letters rather than
        // squirting sideways out of them
        const across = random() * 2 - 1;
        const angle = (across * 22 + (random() - 0.5) * 16) * Math.PI / 180;
        const speed = 0.45 + random() * 0.25;
        state.sparks.push({
            x: (left + right) / 2 + across * (right - left) / 2,
            y: top + 0.01,
            vx: speed * Math.sin(angle),
            vy: speed * Math.cos(angle),
            depth: 0.04 + random() * 0.22
        });
    }

    const GRAVITY = 1.1;   // design units per second squared
    const glow = 1.1;

    state.sparks = state.sparks.filter((spark) => {
        const fromX = spark.x;
        const fromY = spark.y;
        spark.vy -= GRAVITY * dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;

        if (spark.y <= waterline) {
            const at = toScreen(spark.x, waterline, ctx.aspect);
            ctx.ripple(at.x, spark.depth, 0.6, 1.2);
            return false;
        }

        const from = toScreen(fromX, fromY, ctx.aspect);
        const to = toScreen(spark.x, spark.y, ctx.aspect);
        ctx.dye(to.x, to.y, { r: FLAME.r * glow, g: FLAME.g * glow, b: FLAME.b * glow }, 0.000005, from.x, from.y);
        return true;
    });
}

export const MB_BURNING = mbBurning({
    id: 'mb-burning',
    label: 'MB Burning',
    description: 'The unoutlined monogram, itself on fire, over a fire',
    ground: true,
    burn: 1
});

export const MB_LAKE = mbBurning({
    id: 'mb-lake',
    label: 'MB Over the Lake',
    description: 'The monogram alight, hovering over still water',
    ground: false,
    burn: 1.2,
    // Higher and a little smaller than MB Alight: a reflection hangs as far
    // below the surface as the letters stand above it, and both have to fit
    baseline: 0.47,
    height: 0.2,
    lake: { waterline: 0.36, ripple: 1, reflectivity: 0.75 }
});

export const MB_LAKE_STILL = mbBurning({
    id: 'mb-lake-still',
    label: 'MB Over Still Water',
    description: 'The monogram alight over a lake like glass',
    ground: false,
    burn: 1.2,
    baseline: 0.47,
    height: 0.2,
    // Barely a ripple, so the reflection is nearly a mirror, and given back
    // brighter, as calm water does
    lake: { waterline: 0.36, ripple: 0.2, reflectivity: 0.9 }
});

export const MB_NIGHT_LAKE = mbBurning({
    id: 'mb-night-lake',
    label: 'MB Night Lake',
    description: 'The monogram alight over a still lake at night, among the pines',
    ground: false,
    burn: 1.2,
    brightness: 1.45,
    // Smaller than over the other lakes, and nearer the horizon: further back
    // over the water, hovering above the far shore. Low enough that the
    // flames clear the page header and the whole reflection is on screen.
    baseline: 0.5,
    height: 0.12,
    // Still water, coloured the deep blue of a lake under a night sky, with
    // mountains, pines, moon and clouds standing on the far shore
    lake: {
        waterline: 0.36,
        ripple: 0.2,
        reflectivity: 0.85,
        color: { r: 0.031, g: 0.075, b: 0.141 },   // #08132a
        landscape: true,
        ramp: RAMPS.hot,             // the same night, a hotter fire
        swell: 0.6                   // a light wind: the whole lake moving
    }
});

export const MB_ALIGHT = mbBurning({
    id: 'mb-alight',
    label: 'MB Alight',
    description: 'The unoutlined monogram burning on its own',
    ground: false,
    burn: 1.2
});

export const MB_ABLAZE = mbFire({
    id: 'mb-ablaze',
    label: 'MB Ablaze',
    description: 'The monogram, outlined, standing in a fire',
    level: 'medium',
    spread: 0.02,
    outlined: true
});

export const MB_SILHOUETTE = mbFire({
    id: 'mb-silhouette',
    label: 'MB Silhouette',
    description: 'The monogram drawn only by the flames around it',
    level: 'medium',
    spread: 0.08,
    outlined: false
});

export const MB_SMOULDER = mbFire({
    id: 'mb-smoulder',
    label: 'MB Smoulder',
    description: 'A low fire under the unoutlined monogram',
    level: 'low',
    spread: 0.08,
    outlined: false
});

export const MB_BLAZE = mbFire({
    id: 'mb-blaze',
    label: 'MB Blaze',
    description: 'A big fire round the unoutlined monogram',
    level: 'high',
    spread: 0.14,
    outlined: false
});

export const MB_FIRESTORM = mbFire({
    id: 'mb-firestorm',
    label: 'MB Firestorm',
    description: 'The unoutlined monogram in a wall of fire',
    level: 'extreme',
    spread: 0.22,
    outlined: false
});
