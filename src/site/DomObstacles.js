/**
 * DOM obstacles
 *
 * Turns the page's own layout into the simulation's solid geometry: every
 * element carrying `data-solid` is measured where the browser actually put it
 * and rasterised into the obstacle field, so the fluid flows around the
 * navigation, stagnates in front of the cards and sheds off their corners.
 *
 * The layout is the source of truth and nothing here mirrors it. That is what
 * makes CSS the animation system for the physics too: a card that transitions
 * its transform moves its own wall, because the wall is re-read from the same
 * rectangle the compositor is drawing.
 *
 * Re-reading is not free - it is a layout flush plus a rasterise plus a texture
 * upload - so it happens only when something has actually moved, which the
 * signature check below decides. A still page pays nothing per frame.
 *
 * References:
 * - site/geometry.js - the coordinate conversions
 * - core/ObstacleManager.js - what the definitions are rasterised into
 */

import { rectToObstacle } from './geometry.js';

/** Design-space movement below this is not worth a rebuild (about half a pixel) */
const EPSILON = 0.0004;

export class DomObstacles {
    /**
     * @param {SimulationManager} simulation - Simulation to push geometry into
     * @param {Object} [options]
     * @param {string} [options.selector] - What counts as solid
     * @param {Element} [options.root] - Subtree to search
     */
    constructor(simulation, options = {}) {
        this.simulation = simulation;
        this.selector = options.selector || '[data-solid]';
        this.root = options.root || document;

        // Corner radius comes from the stylesheet, and reading a computed style
        // forces the same layout flush the rectangles do. It is cached per
        // element because a border radius is a design decision that does not
        // change while a card slides across the screen.
        this.radii = new WeakMap();

        this.signature = [];
        this.elements = [];
    }

    /**
     * Forget cached per-element style
     *
     * Call after swapping page content or changing a breakpoint, where the
     * elements are new or their styling genuinely differs.
     */
    refresh() {
        this.radii = new WeakMap();
        this.signature = [];
    }

    /**
     * Measure the page and return obstacle definitions
     *
     * @returns {Array<Object>} Obstacle definitions in design space
     */
    collect() {
        const nodes = this.root.querySelectorAll(this.selector);
        const definitions = [];

        this.elements.length = 0;

        for (const element of nodes) {
            if (element.dataset.solid === 'off') continue;

            const rect = element.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) continue;

            // An element faded out is still laid out, but it is no longer
            // something the visitor can see the fluid parting around, and
            // leaving it solid is the difference between a page dissolving and
            // a page whose ghosts keep blocking the flow. This is also the only
            // control a transition needs over the physics: fade the panel and
            // the wall goes with it.
            if (parseFloat(getComputedStyle(element).opacity) < 0.06) continue;

            const angle = parseFloat(element.dataset.angle || '0') * Math.PI / 180;

            const definition = rectToObstacle(rect, {
                radius: this._radiusOf(element),
                angle,
                layoutWidth: element.offsetWidth,
                layoutHeight: element.offsetHeight
            });

            if (!definition) continue;

            definitions.push(definition);
            this.elements.push(element);
        }

        return definitions;
    }

    /**
     * Rebuild the obstacle field if the layout moved
     *
     * @param {boolean} [force] - Rebuild even if nothing appears to have moved
     * @returns {boolean} Whether the field was rebuilt
     */
    sync(force = false) {
        const definitions = this.collect();
        const signature = describe(definitions);

        if (!force && matches(signature, this.signature)) return false;

        this.signature = signature;
        this.simulation.setObstacles(definitions);
        return true;
    }

    /**
     * Corner radius of an element in CSS pixels
     *
     * @private
     * @param {Element} element - Element to measure
     * @returns {number} Radius in CSS pixels
     */
    _radiusOf(element) {
        if (this.radii.has(element)) return this.radii.get(element);

        const declared = element.dataset.radius;
        const radius = declared !== undefined
            ? parseFloat(declared) || 0
            : parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;

        this.radii.set(element, radius);
        return radius;
    }
}

/**
 * Flatten definitions into comparable numbers
 *
 * @param {Array<Object>} definitions - Obstacle definitions
 * @returns {Array<number>} Signature
 */
function describe(definitions) {
    const signature = [];

    for (const definition of definitions) {
        if (definition.type === 'polygon') {
            signature.push(-1);
            for (const vertex of definition.vertices) signature.push(vertex.x, vertex.y);
        } else {
            signature.push(1, definition.x, definition.y, definition.width, definition.height);
        }
    }

    return signature;
}

/**
 * Whether two signatures describe the same layout
 *
 * @param {Array<number>} a - Signature
 * @param {Array<number>} b - Signature
 * @returns {boolean} True if nothing moved meaningfully
 */
function matches(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > EPSILON) return false;
    }
    return true;
}
