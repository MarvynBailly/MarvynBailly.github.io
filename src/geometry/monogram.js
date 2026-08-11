/**
 * Monogram geometry
 *
 * The M standing in the middle of the canvas is a letterform rather than a
 * traced bitmap. It is built from typographic parameters, so the strokes stay
 * monolinear, the joints stay exact at any resolution, and the proportions can
 * be tuned by editing a number instead of re-tracing an image.
 *
 * Coordinates are obstacle design space: a square [0, 1] frame centred on the
 * canvas with y pointing up. ObstacleManager maps that frame onto the shorter
 * screen axis, so the letter never stretches with the window.
 *
 * Construction (left half; the right half mirrors it):
 *
 *     B _ C           E _ F   <- y1        A  x0, y0   G  x1, y0
 *     |    \         /    |                B  x0, y1   H  x1-stem, y0
 *     |     \   D   /     |   <- yInner    C  x0+diag, y1
 *     |      \ / \ /      |                D  cx, yInner
 *     K       X   X      I    <- yShoulder E  x1-diag, y1
 *     |      / \ / \      |                F  x1, y1
 *     |     /   V   \     |                I  x1-stem, yShoulder
 *     A _ L    J    H _ G     <- y0        J  cx, ya  (apex)
 *                                          K  x0+stem, yShoulder
 *                                          L  x0+stem, y0
 *
 * Each diagonal is the line from the outer top corner to the apex, offset
 * sideways by `diagonal`; both of its edges are therefore parallel and the
 * shoulder and inner-vertex heights fall out of similar triangles.
 */

const round4 = (n) => Math.round(n * 10000) / 10000;

/**
 * Build the geometric M as a single closed polygon
 *
 * @param {Object} [options] - Letterform parameters, in design units
 * @param {number} [options.centerX] - Horizontal centre
 * @param {number} [options.centerY] - Vertical centre
 * @param {number} [options.width] - Total width
 * @param {number} [options.height] - Cap height
 * @param {number} [options.stem] - Thickness of the vertical strokes
 * @param {number} [options.diagonal] - Horizontal thickness of the diagonals.
 *        Must exceed `stem` so the diagonal covers the top of the stem.
 * @param {number} [options.apexLift] - How far the middle V stops short of the
 *        baseline. Zero puts the apex on the baseline, as in a grotesque M.
 * @returns {Array<Object>} Obstacle definitions
 */
export function geometricM(options = {}) {
    const {
        centerX = 0.5,
        centerY = 0.5,
        width = 0.30,
        height = 0.32,
        stem = 0.050,
        diagonal = 0.056,
        apexLift = 0.0
    } = options;

    const halfWidth = width / 2;
    const x0 = centerX - halfWidth;
    const x1 = centerX + halfWidth;
    const y0 = centerY - height / 2;
    const y1 = centerY + height / 2;

    const apexY = y0 + apexLift;
    const run = y1 - apexY;

    // Where the counters open, i.e. where the diagonal's outer edge leaves the
    // inner edge of the stem, and where the two diagonals meet in the middle.
    const shoulderY = y1 - run * (stem / halfWidth);
    const innerY = apexY + run * (diagonal / halfWidth);

    const v = (x, y) => ({ x: round4(x), y: round4(y) });

    return [{
        type: 'polygon',
        vertices: [
            v(x0, y0),                  // A
            v(x0, y1),                  // B  outer left edge
            v(x0 + diagonal, y1),       // C  flat top of the left diagonal
            v(centerX, innerY),         // D  inner vertex of the V
            v(x1 - diagonal, y1),       // E  flat top of the right diagonal
            v(x1, y1),                  // F
            v(x1, y0),                  // G  outer right edge
            v(x1 - stem, y0),           // H  foot of the right stem
            v(x1 - stem, shoulderY),    // I  right counter
            v(centerX, apexY),          // J  apex
            v(x0 + stem, shoulderY),    // K  left counter
            v(x0 + stem, y0)            // L  foot of the left stem
        ]
    }];
}
