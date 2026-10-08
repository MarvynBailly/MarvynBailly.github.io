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

/**
 * Build a geometric B to stand beside the M
 *
 * Same construction philosophy: monolinear strokes, exact joints. The lower
 * bowl is a little wider than the upper, as in most Bs - an even split reads
 * as top-heavy.
 *
 * A polygon cannot have a hole, and a B has two, so the letter is built from
 * three solids that overlap: the stem, and two bowls each shaped like a '⊃' -
 * a band running out along a bar, round a half circle, and back. The stem
 * closes the open side of both bands, which is what makes the counters.
 *
 *     ____________
 *     |  ______   \      upper bowl: bar at the top, arc, bar at the waist
 *     | |      \  |
 *     | |______/  /
 *     |  ________ \      lower bowl: bar at the waist, wider arc, base bar
 *     | |        \ |
 *     | |________/ |
 *     |___________/
 *
 * @param {Object} [options] - Letterform parameters, in design units
 * @param {number} [options.x0] - Left edge
 * @param {number} [options.y0] - Baseline
 * @param {number} [options.width] - Width of the lower, wider bowl
 * @param {number} [options.height] - Cap height
 * @param {number} [options.stem] - Thickness of the vertical stroke
 * @param {number} [options.bar] - Thickness of the horizontal strokes and bowls
 * @param {number} [options.waist] - Height of the waist bar's centre, as a
 *        fraction of the cap height
 * @param {number} [options.upperWidth] - Upper bowl width, as a fraction of `width`
 * @returns {Array<Object>} Obstacle definitions
 */
export function geometricB(options = {}) {
    const {
        x0 = 0.4,
        y0 = 0.34,
        width = 0.22,
        height = 0.32,
        stem = 0.050,
        bar = 0.046,
        waist = 0.53,
        upperWidth = 0.9
    } = options;

    const y1 = y0 + height;
    const yWaist = y0 + height * waist;

    return [
        { type: 'rectangle', x: x0, y: y0, width: stem, height },
        bowl(x0, yWaist - bar / 2, y1, width * upperWidth, bar),
        bowl(x0, y0, yWaist + bar / 2, width, bar)
    ];
}

/**
 * One bowl of a B: a band along the bottom bar, round a half circle on the
 * right, and back along the top bar, as a single outline with no hole
 *
 * @param {number} x0 - Left edge, where the stem will cover the open side
 * @param {number} bottom - Outer bottom edge
 * @param {number} top - Outer top edge
 * @param {number} width - Outer width
 * @param {number} band - Stroke thickness
 * @returns {Object} Polygon obstacle
 */
function bowl(x0, bottom, top, width, band) {
    const radius = (top - bottom) / 2;
    const centerX = x0 + width - radius;
    const centerY = (top + bottom) / 2;
    const inner = radius - band;
    const steps = 18;

    const v = (x, y) => ({ x: round4(x), y: round4(y) });
    const vertices = [v(x0, top)];

    // Outer edge: along the top, round the right side, back along the bottom
    for (let i = 0; i <= steps; i++) {
        const a = Math.PI / 2 - (i / steps) * Math.PI;
        vertices.push(v(centerX + radius * Math.cos(a), centerY + radius * Math.sin(a)));
    }
    vertices.push(v(x0, bottom));

    // Inner edge, back the other way
    vertices.push(v(x0, bottom + band));
    for (let i = 0; i <= steps; i++) {
        const a = -Math.PI / 2 + (i / steps) * Math.PI;
        vertices.push(v(centerX + inner * Math.cos(a), centerY + inner * Math.sin(a)));
    }
    vertices.push(v(x0, top - band));

    return { type: 'polygon', vertices };
}

/**
 * The MB monogram: the M and a matching B side by side
 *
 * Both letters share one cap height and stroke weight, and the pair is
 * centred on centerX as a unit. Also returns the letters' measurements, so a
 * scene can place things relative to their strokes.
 *
 * @param {Object} [options]
 * @param {number} [options.centerX] - Centre of the pair
 * @param {number} [options.baseline] - Shared baseline
 * @param {number} [options.height] - Cap height
 * @returns {{obstacles: Array<Object>, m: Object, b: Object}} Geometry and metrics
 */
export function monogramMB(options = {}) {
    const { centerX = 0.5, baseline = 0.34, height = 0.32 } = options;

    // Proportions of the standalone M, scaled to the requested cap height
    const k = height / 0.32;
    const stem = 0.050 * k;
    const m = { width: 0.30 * k, height, stem, diagonal: 0.056 * k };
    const b = { width: 0.22 * k, height, stem, bar: 0.046 * k };
    const gap = 0.055 * k;

    const total = m.width + gap + b.width;
    m.x0 = centerX - total / 2;
    m.x1 = m.x0 + m.width;
    b.x0 = m.x1 + gap;
    b.x1 = b.x0 + b.width;
    m.y0 = b.y0 = baseline;
    m.y1 = b.y1 = baseline + height;

    // The B's two counters, the enclosed spaces inside the bowls: middle and
    // half-size of each. Matches geometricB's defaults: waist at 0.53, upper
    // bowl 0.9 as wide.
    const waist = baseline + height * 0.53;
    const counter = (width, bottom, top) => ({
        x: (b.x0 + stem + b.x0 + width - b.bar) / 2,
        y: (bottom + top) / 2,
        halfWidth: (width - stem - b.bar) / 2,
        halfHeight: (top - bottom) / 2 - b.bar
    });
    b.counters = [
        counter(b.width * 0.9, waist - b.bar / 2, m.y1),
        counter(b.width, baseline, waist + b.bar / 2)
    ];

    return {
        obstacles: [
            ...geometricM({
                centerX: m.x0 + m.width / 2,
                centerY: baseline + height / 2,
                width: m.width,
                height,
                stem,
                diagonal: m.diagonal
            }),
            ...geometricB({ x0: b.x0, y0: baseline, width: b.width, height, stem, bar: b.bar })
        ],
        m,
        b
    };
}
