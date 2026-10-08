/**
 * Page geometry
 *
 * Three coordinate systems meet here, and every bug in a fluid-driven layout is
 * a confusion between two of them:
 *
 *   - CSS pixels, y down, origin at the top-left of the viewport. What the DOM
 *     reports and what a stylesheet talks in.
 *   - Screen-normalised, y UP, (0,0) bottom-left to (1,1) top-right. What the
 *     splat helpers take.
 *   - Design space, a square [0,1] frame pinned to the shorter axis and centred
 *     on the canvas. What obstacle geometry is declared in, so a shape keeps
 *     its proportions when the window does not.
 *
 * The one number that ties them together is the shorter viewport axis: design
 * space is defined to span it, so a CSS length converts to a design length by
 * dividing by it, whatever the window shape.
 *
 * References:
 * - core/ObstacleManager.js - design space, and what it rasterises
 * - scenes/SceneManager.js - the screen-normalised splat helpers
 */

/**
 * CSS pixels per design unit for the current viewport
 *
 * @returns {number} Length of one design unit, in CSS pixels
 */
export function designUnit() {
    return Math.min(window.innerWidth, window.innerHeight);
}

/**
 * Convert a CSS-pixel length to design units
 *
 * @param {number} pixels - Length in CSS pixels
 * @returns {number} Length in design units
 */
export function designLength(pixels) {
    return pixels / designUnit();
}

/**
 * Convert a viewport point in CSS pixels to screen-normalised coordinates
 *
 * @param {number} px - Distance from the left edge, CSS pixels
 * @param {number} py - Distance from the top edge, CSS pixels
 * @returns {{x: number, y: number}} Screen-normalised point, y up
 */
export function screenFromPixels(px, py) {
    return {
        x: px / window.innerWidth,
        y: 1 - py / window.innerHeight
    };
}

/**
 * Convert a screen-normalised point to design space
 *
 * @param {number} sx - 0 to 1 across the canvas
 * @param {number} sy - 0 to 1 up the canvas
 * @returns {{x: number, y: number}} Point in design coordinates
 */
export function designFromScreen(sx, sy) {
    const unit = designUnit();
    return {
        x: 0.5 + (sx - 0.5) * (window.innerWidth / unit),
        y: 0.5 + (sy - 0.5) * (window.innerHeight / unit)
    };
}

/**
 * Screen-normalised centre of a viewport rectangle
 *
 * @param {DOMRect} rect - Rectangle from getBoundingClientRect()
 * @returns {{x: number, y: number}} Centre, screen-normalised
 */
export function centreOf(rect) {
    return screenFromPixels(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

/**
 * A point on a rectangle's perimeter, in screen-normalised coordinates
 *
 * `u` and `v` run from -1 to 1 across the rectangle, so (-1, 0) is the middle
 * of its left edge and (1, 1) its top-right corner. Emitters are placed this
 * way rather than in pixels because a card's edges are where the interesting
 * flow is and they move whenever the layout does.
 *
 * @param {DOMRect} rect - Rectangle from getBoundingClientRect()
 * @param {number} u - Horizontal position, -1 (left) to 1 (right)
 * @param {number} v - Vertical position, -1 (bottom) to 1 (top)
 * @param {number} [pad] - Outward offset in CSS pixels
 * @returns {{x: number, y: number}} Screen-normalised point
 */
export function pointOn(rect, u, v, pad = 0) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return screenFromPixels(
        cx + u * (rect.width / 2 + pad),
        cy - v * (rect.height / 2 + pad)
    );
}

/**
 * Convert a viewport rectangle into an obstacle definition
 *
 * Axis-aligned elements become rounded rectangles, which is what a card
 * actually is. A rotated element becomes a polygon instead: the rectangle the
 * DOM reports for one is its axis-aligned bounding box, and handing that to the
 * rasteriser would put a wall where the visitor can see there is none.
 *
 * The rotation has to be declared by the caller through `data-angle`, because a
 * bounding box cannot be inverted back into a pose on its own. Given the angle
 * it can: rotation about the centre leaves the centre alone, and the bounding
 * width of a rotated box is w|cos| + h|sin|, which solves for the scale.
 *
 * @param {DOMRect} rect - Rectangle from getBoundingClientRect()
 * @param {Object} [options]
 * @param {number} [options.radius] - Corner radius in CSS pixels
 * @param {number} [options.angle] - Rotation in radians, 0 for axis-aligned
 * @param {number} [options.layoutWidth] - Untransformed width, CSS pixels
 * @param {number} [options.layoutHeight] - Untransformed height, CSS pixels
 * @returns {Object|null} Obstacle definition in design space, or null if empty
 */
export function rectToObstacle(rect, options = {}) {
    if (!(rect.width > 0) || !(rect.height > 0)) return null;

    const { radius = 0, angle = 0, layoutWidth, layoutHeight } = options;
    const centre = centreOf(rect);
    const design = designFromScreen(centre.x, centre.y);

    if (Math.abs(angle) < 1e-4 || !layoutWidth || !layoutHeight) {
        const width = designLength(rect.width);
        const height = designLength(rect.height);
        return {
            type: 'roundrect',
            x: design.x - width / 2,
            y: design.y - height / 2,
            width,
            height,
            radius: designLength(radius)
        };
    }

    // Recover the scale the transform applied, then rebuild the four corners
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const spread = layoutWidth * cos + layoutHeight * sin;
    const scale = spread > 0 ? rect.width / spread : 1;

    const hx = designLength(layoutWidth * scale) / 2;
    const hy = designLength(layoutHeight * scale) / 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const corner = (sx, sy) => ({
        x: design.x + sx * hx * c - sy * hy * s,
        y: design.y + sx * hx * s + sy * hy * c
    });

    return {
        type: 'polygon',
        vertices: [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)]
    };
}
