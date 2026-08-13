/**
 * Boat geometry
 *
 * A hull seen from directly above, which is the only view this simulation has.
 *
 * The outline is a table of offsets - the same way a real hull is defined.
 * Naval architects list half-breadths at a series of stations along the
 * centreline and let the plating fair between them; this does exactly that,
 * with the half-breadths written as a fraction of maximum beam so the beam is
 * one number to tune rather than nine.
 *
 * Coordinates are local to the boat: the centreline is the x axis, the bow is
 * at +x, and the hull is one unit long. ObstacleManager scales and rotates it
 * into the field, so nothing here needs to know where the boat is or which way
 * it is pointing.
 *
 * The shape matters to the flow, not just to the eye. The fine entry forward
 * splits the oncoming fluid without a stagnation shelf, the parallel midbody
 * holds the widest section over a third of the length, and the square transom
 * separates cleanly - which is what sheds the alternating wake that makes the
 * boat legible as it drives.
 *
 * References:
 * - core/ObstacleManager.js - how a body's local outline reaches the field
 */

/**
 * Half-breadths along the hull, bow last
 *
 * Each entry is [station, halfBreadth]: station is a position along the
 * centreline from transom (-0.5) to bow (+0.5), halfBreadth is a fraction of
 * the maximum half-beam. The last station is the stem, where the two sides
 * meet and the breadth is zero.
 */
const STATIONS = [
    [-0.500, 0.62],   // transom
    [-0.380, 0.80],
    [-0.200, 0.95],
    [-0.020, 1.00],   // maximum beam, a little aft of midships
    [0.160, 0.94],
    [0.300, 0.78],
    [0.400, 0.55],
    [0.470, 0.28],
    [0.500, 0.00]     // stem
];

/**
 * Build a hull outline as a single closed polygon
 *
 * The polygon runs down the port side from transom to stem and back up the
 * starboard side, so the closing edge is the transom itself - a flat stern
 * rather than a point. Winding does not matter: the polygon distance function
 * signs points by ray crossings.
 *
 * @param {Object} [options] - Hull parameters
 * @param {number} [options.length] - Overall length, in the body's own units
 * @param {number} [options.beam] - Maximum beam as a fraction of length
 * @returns {Array<{x: number, y: number}>} Closed outline, one unit long
 */
export function boatHull(options = {}) {
    const { length = 1, beam = 0.34 } = options;

    const halfBeam = (beam * length) / 2;
    const verts = [];

    for (const [station, breadth] of STATIONS) {
        verts.push({ x: station * length, y: breadth * halfBeam });
    }

    // Back up the other side, skipping the stem (already placed, breadth zero)
    // and stopping before the transom so the closing edge draws it.
    for (let i = STATIONS.length - 2; i >= 0; i--) {
        const [station, breadth] = STATIONS[i];
        verts.push({ x: station * length, y: -breadth * halfBeam });
    }

    return verts;
}

/**
 * Where the propeller sits, in local coordinates
 *
 * Just forward of the transom on the centreline. The wash is injected behind
 * this point rather than at the hull's centre, which is inside the solid and
 * would be masked away by the splat shader.
 */
export const PROPELLER = { x: -0.5, y: 0 };

/** Where the stem meets the water, in local coordinates */
export const STEM = { x: 0.5, y: 0 };
