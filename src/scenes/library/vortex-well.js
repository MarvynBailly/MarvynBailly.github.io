/**
 * Scene: Vortex Well
 *
 * Broken concentric rings around the monogram with the whole disc slowly
 * rotating, so every gesture is wound into a spiral arm.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { COOL, WARM, scale } from '../../utils/palette.js';

const RINGS = [0.28, 0.38, 0.48];

const SOURCES = 4;
const ORBIT_RADIUS = 0.44;
const ORBIT_RATE = 0.22;          // radians/second, slower than the disc itself
const COOL_INK = scale(COOL, 0.34);
const WARM_INK = scale(WARM, 0.30);

/**
 * Build one ring as a set of arc segments with gaps
 *
 * @param {number} radius - Ring radius in design units
 * @param {number} thickness - Radial thickness
 * @param {number} phase - Rotation of the gap pattern, radians
 * @returns {Array} Polygon obstacle definitions
 */
function arcRing(radius, thickness, phase) {
    const arcs = [];
    const span = (76 * Math.PI) / 180;
    const step = (90 * Math.PI) / 180;

    for (let k = 0; k < 4; k++) {
        const start = phase + k * step;
        const outer = [];
        const inner = [];
        for (let s = 0; s <= 10; s++) {
            const a = start + (span * s) / 10;
            outer.push({
                x: 0.5 + Math.cos(a) * (radius + thickness / 2),
                y: 0.5 + Math.sin(a) * (radius + thickness / 2)
            });
            inner.unshift({
                x: 0.5 + Math.cos(a) * (radius - thickness / 2),
                y: 0.5 + Math.sin(a) * (radius - thickness / 2)
            });
        }
        arcs.push({ type: 'polygon', vertices: outer.concat(inner) });
    }
    return arcs;
}

export default {
    id: 'vortex-well',
    label: 'Vortex Well',
    group: 'Geometry',
    description: 'Broken rings around a slowly rotating disc',
    requires: 'vortex',

    config: {
        VELOCITY_DISSIPATION: 0.02,  // 0.2 kills rotation in ~2s
        DENSITY_DISSIPATION: 0.35,
        CURL: 22,
        PRESSURE_ITERATIONS: 30,     // rotation is near divergence-free
        SPLAT_RADIUS: 0.20,
        SPLAT_FORCE: 1600,
        OUTFLOW_BOUNDARY: false,     // a closed box conserves angular momentum
        SHADING: true,
        VORTEX_RATE: 1.6,            // radians/second at the centre
        VORTEX_FALLOFF: 0.55         // swirl dies before the corners
    },

    obstacles() {
        const defs = ['monogram'];
        RINGS.forEach((r, k) => {
            defs.push.apply(defs, arcRing(r, 0.018, (k * 30 * Math.PI) / 180));
        });
        return defs;
    },

    update(ctx, t) {
        // Four sources orbiting the disc, a quarter turn apart, emitted one per
        // frame round-robin so the scene costs two passes a frame rather than
        // eight. The rotation itself is the vortex pass; these only make it
        // visible, which is why they sit outside the rings at design r 0.44.
        const which = ctx.frame % SOURCES;
        const angle = ORBIT_RATE * t + (which * Math.PI) / 2;

        // Design space maps to the shorter screen axis, so a circular orbit in
        // design units has to be compressed in x to stay circular on screen.
        const x = 0.5 + (Math.cos(angle) * ORBIT_RADIUS) / ctx.aspect;
        const y = 0.5 + Math.sin(angle) * ORBIT_RADIUS;

        ctx.dye(x, y, which % 2 === 0 ? COOL_INK : WARM_INK, 0.0009);
    }
};
