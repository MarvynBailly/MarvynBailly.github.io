/**
 * Signed distance functions for obstacle primitives
 *
 * Every function takes a point and a primitive expressed in the same space and
 * returns the signed distance to the primitive's boundary: negative inside,
 * positive outside, zero exactly on the surface. The distances are exact, which
 * is what lets the obstacle field resolve a surface far below the grid spacing
 * it is sampled onto.
 *
 * References:
 * - Inigo Quilez, "2D distance functions"
 *   https://iquilezles.org/articles/distfunctions2d/
 */

/**
 * Signed distance to a circle
 *
 * @param {number} px - Point x
 * @param {number} py - Point y
 * @param {number} cx - Centre x
 * @param {number} cy - Centre y
 * @param {number} r - Radius
 * @returns {number} Signed distance
 */
export function sdCircle(px, py, cx, cy, r) {
    return Math.hypot(px - cx, py - cy) - r;
}

/**
 * Signed distance to an axis-aligned box
 *
 * @param {number} px - Point x
 * @param {number} py - Point y
 * @param {number} cx - Centre x
 * @param {number} cy - Centre y
 * @param {number} hx - Half width
 * @param {number} hy - Half height
 * @returns {number} Signed distance
 */
export function sdBox(px, py, cx, cy, hx, hy) {
    const dx = Math.abs(px - cx) - hx;
    const dy = Math.abs(py - cy) - hy;
    const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
    const inside = Math.min(Math.max(dx, dy), 0);
    return outside + inside;
}

/**
 * Signed distance to a simple polygon
 *
 * Handles concave outlines - the sign comes from a crossing-number test rather
 * than from winding, so vertex order does not matter and the letterform in
 * geometry/monogram.js can be one polygon instead of a triangle soup.
 *
 * @param {number} px - Point x
 * @param {number} py - Point y
 * @param {Array<{x: number, y: number}>} verts - Polygon vertices, in order
 * @returns {number} Signed distance
 */
export function sdPolygon(px, py, verts) {
    const n = verts.length;
    let squared = Infinity;
    let sign = 1;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const vi = verts[i];
        const vj = verts[j];

        // Distance to the edge j -> i
        const ex = vj.x - vi.x;
        const ey = vj.y - vi.y;
        const wx = px - vi.x;
        const wy = py - vi.y;
        const lenSq = ex * ex + ey * ey;
        const t = lenSq > 0 ? Math.max(0, Math.min(1, (wx * ex + wy * ey) / lenSq)) : 0;
        const bx = wx - ex * t;
        const by = wy - ey * t;
        squared = Math.min(squared, bx * bx + by * by);

        // Crossing test: flip the sign each time the edge crosses the ray
        const c1 = py >= vi.y;
        const c2 = py < vj.y;
        const c3 = ex * wy > ey * wx;
        if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) sign = -sign;
    }

    return sign * Math.sqrt(squared);
}
