/**
 * Scene: Little Boat
 *
 * A hull under way on open water, leaving a wake.
 *
 * The boat is a real solid, not a sprite: it is stamped into the obstacle
 * distance field every frame, so the fluid meets a wall where the hull is. Dye
 * cannot enter it, the pressure solve sees it, and the water closes behind the
 * transom because that is what the projection does with the cells the hull has
 * just vacated. Nothing here draws the boat - the display shader already
 * reconstructs any solid in the field, so steering it is the whole job.
 *
 * A moving solid does not push water on its own, though. The projection fills
 * the space the hull leaves and empties the space it enters, which conserves
 * mass without ever transferring momentum, and a boat that only did that would
 * glide through the field leaving nothing behind. What makes a wake is the
 * propeller: a jet thrown astern every frame, swept from the last position so
 * it lays a continuous line rather than a row of beads. The pair of pushes at
 * the bow quarters do the other half, shouldering water aside where the hull
 * is widening fastest.
 *
 * TWO COORDINATE SYSTEMS, as ever. The boat steers in *design* units - a frame
 * pinned to the shorter screen axis, so she holds a straight course and a
 * constant size on any window - while every splat is placed in screen
 * fractions. `unit` below is the conversion, and every offset goes through it.
 *
 * References:
 * - geometry/boat.js - the hull outline, as a table of offsets
 * - core/ObstacleManager.js - setBody(), and how a body reaches the field
 * - scenes/SceneManager.js - the context passed to update()
 */

import { boatHull } from '../../geometry/boat.js';
import { makeRandom, scaleColor } from '../emitters.js';

/** The hull, built once: it never changes shape, only pose */
const HULL = boatHull();

/** Length as a fraction of the shorter screen axis */
const LENGTH = 0.13;

/** Design units per second. A little under one length a second. */
const SPEED = 0.115;

/** The hardest she will put the wheel over, radians per second */
const TURN_RATE = 0.85;

/**
 * How far ahead she watches for the edge, in design units, and how much water
 * she insists on keeping around her. The lookahead is deliberately several
 * lengths: at this turn rate she needs about two to come round, and a boat that
 * notices the wall only when she reaches it makes a corner look like a bounce.
 */
const LOOKAHEAD = 0.30;
const MARGIN = 0.14;

/**
 * Extra room kept at the top, where the header and the nav sit over the canvas
 *
 * Without it she runs happily along the top edge and spends her time behind the
 * navigation, which is the one part of the canvas the visitor is not looking at.
 */
const MARGIN_TOP = 0.24;

/** Propeller jet, in simulation cells per second, thrown astern */
const WASH = 130;
const WASH_RADIUS = 0.0009;

/** Bow quarters, where the hull shoulders water aside */
const BOW_PUSH = 55;
const BOW_RADIUS = 0.00035;

/** Colourless: the palette ramp decides everything the eye sees */
const DENSITY = { r: 1, g: 1, b: 1 };

/** Wake dye laid at the transom */
const WAKE_RATE = 0.16;
const WAKE_RADIUS = 0.0016;

/** A slow wash so there is water-colour in the field for her to cut through */
const WASH_SOURCE_LIFE = 7.0;
const WASH_SOURCE_RATE = 0.07;
const WASH_SOURCE_RADIUS = 0.022;
const DRIFT = 0.18;

/**
 * One design unit expressed as a fraction of each screen axis
 *
 * Design space is square and pinned to the shorter axis, so on a wide window a
 * design unit is a smaller slice of the width than of the height. Multiplying
 * a design-space offset by this puts it in the screen fractions the splats want.
 *
 * @param {number} aspect - Canvas aspect ratio
 * @returns {{x: number, y: number}} Screen fractions per design unit
 */
function unit(aspect) {
    return aspect >= 1 ? { x: 1 / aspect, y: 1 } : { x: 1, y: aspect };
}

/**
 * Put a point on the hull into screen coordinates
 *
 * @param {Object} boat - Boat state
 * @param {{x: number, y: number}} u - Screen fractions per design unit
 * @param {number} lx - Along the centreline, bow positive, hull lengths
 * @param {number} ly - To port, hull lengths
 * @returns {{x: number, y: number}} Screen position
 */
function place(boat, u, lx, ly) {
    const cos = Math.cos(boat.heading);
    const sin = Math.sin(boat.heading);
    const dx = (lx * cos - ly * sin) * LENGTH;
    const dy = (lx * sin + ly * cos) * LENGTH;
    return { x: boat.x + dx * u.x, y: boat.y + dy * u.y };
}

/**
 * Shortest signed angle between two headings
 *
 * @param {number} a - Angle in radians
 * @returns {number} The same angle wrapped to [-pi, pi]
 */
function wrapAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
}

function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
}

/**
 * Place a wash source somewhere in the field
 *
 * @param {function(): number} random - Scene's random source
 * @param {number} age - Starting age, for staggering on setup
 * @returns {Object} Source state
 */
function spawnWash(random, age) {
    const angle = random() * Math.PI * 2;
    return {
        x: 0.12 + random() * 0.76,
        y: 0.16 + random() * 0.68,
        dx: Math.cos(angle) * DRIFT,
        dy: Math.sin(angle) * DRIFT,
        age
    };
}

export default {
    id: 'little-boat',
    label: 'Little Boat',
    group: 'Ink',
    description: 'A hull under way, carving a wake across the colour field',
    requires: 'paletteRamp',

    config: {
        // A shade heavier than the colour field's, because a propeller lays far
        // more dye than a drifting wash does and a tab left open all afternoon
        // should not silt up. Measured over 100s the peak was still climbing at
        // 0.12; this holds it.
        DENSITY_DISSIPATION: 0.17,
        VELOCITY_DISSIPATION: 0.30,
        CURL: 20,
        PRESSURE_ITERATIONS: 32,
        SHADING: true,
        PALETTE_RAMP: true,
        // Unlike the colour field, the solid here is the subject rather than a
        // hidden shaper of the flow, so it is drawn.
        SHOW_OBSTACLES: true
    },

    // Open water: the boat is the only solid, and she needs the room
    obstacles: [],

    setup(ctx) {
        ctx.state.random = makeRandom(4131);
        ctx.state.boat = {
            x: 0.30,
            y: 0.38,
            heading: 0.4,
            prevX: 0.30,
            prevY: 0.38
        };

        ctx.state.wash = spawnWash(ctx.state.random, 0);

        // Place her before the first step so frame one has a hull in the field
        ctx.body('boat', {
            vertices: HULL,
            x: ctx.state.boat.x,
            y: ctx.state.boat.y,
            angle: ctx.state.boat.heading,
            length: LENGTH
        });
    },

    update(ctx, t) {
        const s = ctx.state;
        const boat = s.boat;
        const dt = ctx.dt;
        const u = unit(ctx.aspect);

        // ---- Steering -------------------------------------------------------
        // Two slow sinusoids well off each other's period, so she wanders in
        // long curves that do not repeat on any interval short enough to read
        // as a loop. This is the whole helm when there is open water ahead.
        let turn = 0.55 * Math.sin(t * 0.21) + 0.30 * Math.sin(t * 0.47 + 1.3);

        // Where she would be in a few lengths' time, in screen fractions
        const aheadX = boat.x + Math.cos(boat.heading) * LOOKAHEAD * u.x;
        const aheadY = boat.y + Math.sin(boat.heading) * LOOKAHEAD * u.y;

        if (aheadX < MARGIN || aheadX > 1 - MARGIN ||
            aheadY < MARGIN || aheadY > 1 - MARGIN_TOP) {
            // Come about toward the middle. Proportional rather than hard over:
            // slamming to full helm the instant the lookahead clips the margin
            // makes her judder along the edge, because the next frame clears it
            // and the frame after that clips it again.
            const toCentre = Math.atan2(
                (0.5 - boat.y) / u.y,
                (0.5 - boat.x) / u.x
            );
            turn = wrapAngle(toCentre - boat.heading) * 2.2;
        }

        boat.heading += clamp(turn, -TURN_RATE, TURN_RATE) * dt;

        boat.prevX = boat.x;
        boat.prevY = boat.y;
        boat.x += Math.cos(boat.heading) * SPEED * dt * u.x;
        boat.y += Math.sin(boat.heading) * SPEED * dt * u.y;

        // The lookahead should make this unreachable; it is here because a tab
        // restored from the background can hand us one enormous dt, and a boat
        // that leaves the canvas never comes back.
        boat.x = clamp(boat.x, 0.02, 0.98);
        boat.y = clamp(boat.y, 0.02, 0.98);

        ctx.body('boat', {
            vertices: HULL,
            x: boat.x,
            y: boat.y,
            angle: boat.heading,
            length: LENGTH
        });

        // ---- What she does to the water -------------------------------------
        const cos = Math.cos(boat.heading);
        const sin = Math.sin(boat.heading);

        // The propeller, just abaft the transom so the jet lands in water
        // rather than inside the hull, where the splat shader would mask it
        // away. Swept from where it was last frame: at speed the boat covers
        // more than the splat radius between frames, and one disc per frame
        // beads into dots instead of laying a wake.
        const screw = place(boat, u, -0.62, 0);
        const screwWas = {
            x: screw.x - (boat.x - boat.prevX),
            y: screw.y - (boat.y - boat.prevY)
        };

        ctx.velocity(
            screw.x, screw.y,
            -cos * WASH, -sin * WASH,
            WASH_RADIUS,
            screwWas.x, screwWas.y
        );

        // Bow quarters, pushing outward where the hull is widening fastest.
        // Without these she parts the water without displacing it, which reads
        // as a hull sliding over the surface rather than through it.
        // Velocity is in simulation texels per second, and the grid is built to
        // match the canvas aspect, so a texel is square and a diagonal thrust
        // needs no correction - unlike every position above.
        for (const side of [1, -1]) {
            const quarter = place(boat, u, 0.30, side * 0.14);
            ctx.velocity(
                quarter.x, quarter.y,
                -sin * side * BOW_PUSH,
                cos * side * BOW_PUSH,
                BOW_RADIUS
            );
        }

        // Wake dye at the transom, swept like the jet
        ctx.dye(
            screw.x, screw.y,
            scaleColor(DENSITY, WAKE_RATE * dt * 60),
            WAKE_RADIUS,
            screwWas.x, screwWas.y
        );

        // ---- Ambient wash ---------------------------------------------------
        // Something for her to cut through. Same raised-cosine envelope as the
        // colour field uses, so the source is never switched on or off, only
        // faded, and the wake has a field to be legible against.
        const wash = s.wash;
        wash.age += dt;
        if (wash.age >= WASH_SOURCE_LIFE) Object.assign(wash, spawnWash(s.random, 0));

        wash.x += wash.dx * dt;
        wash.y += wash.dy * dt;
        if (wash.x < 0.06 || wash.x > 0.94) {
            wash.dx = -wash.dx;
            wash.x = clamp(wash.x, 0.06, 0.94);
        }
        if (wash.y < 0.12 || wash.y > 0.88) {
            wash.dy = -wash.dy;
            wash.y = clamp(wash.y, 0.12, 0.88);
        }

        const envelope = 0.5 - 0.5 * Math.cos((2 * Math.PI * wash.age) / WASH_SOURCE_LIFE);
        ctx.dye(
            wash.x, wash.y,
            scaleColor(DENSITY, WASH_SOURCE_RATE * envelope * dt * 60),
            WASH_SOURCE_RADIUS
        );
    }
};
