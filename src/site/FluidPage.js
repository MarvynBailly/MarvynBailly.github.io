/**
 * Fluid page
 *
 * Boots the simulation as the substrate of an ordinary web page rather than as
 * the content of one: the canvas sits behind the layout, the layout is the
 * obstacle geometry, and a page transition is something that happens to the
 * fluid as much as to the DOM.
 *
 * It owns the three things every such page needs and no prototype should have
 * to rewrite: the render loop, the resize path, and the decision about when the
 * obstacle field is stale. Everything specific - which physics, which emitters,
 * what a navigation looks like - is supplied by the caller.
 *
 * References:
 * - core/SimulationManager.js - the simulation being driven
 * - site/DomObstacles.js - how the layout becomes geometry
 */

import { SimulationManager } from '../core/SimulationManager.js';
import { LoadingScreen } from '../ui/LoadingScreen.js';
import { Config } from '../config.js';
import { DomObstacles } from './DomObstacles.js';
import { centreOf, pointOn, screenFromPixels } from './geometry.js';

export class FluidPage {
    /**
     * Boot a page and start its render loop
     *
     * @param {Object} [options] - See the constructor
     * @returns {Promise<FluidPage>} The running page
     */
    static async start(options = {}) {
        const page = new FluidPage(options);
        await page.init();
        return page;
    }

    /**
     * @param {Object} [options]
     * @param {HTMLCanvasElement} [options.canvas] - Canvas to draw into
     * @param {Element} [options.loading] - Loading screen host
     * @param {Object} [options.config] - Config values applied before init
     * @param {Object} [options.scene] - Scene module: config patch and update()
     * @param {string} [options.selector] - What counts as a solid element
     */
    constructor(options = {}) {
        this.options = options;
        this.canvas = options.canvas || document.getElementById('fluid-canvas');
        this.loading = new LoadingScreen(options.loading || document.getElementById('loading'));

        this.sim = null;
        this.obstacles = null;

        this.frame = 0;
        this.time = 0;
        this.lastTime = 0;

        // Layout is re-measured when something says it moved, and every frame
        // while a transition is running. Both are needed: a scroll fires an
        // event, a CSS transform does not.
        this.layoutDirty = true;
        this.trackingUntil = 0;
        this.trailingSync = 0;

        this.callbacks = [];
        this.resizePending = false;
    }

    /**
     * Create the simulation, wire the page to it, and start rendering
     *
     * @returns {Promise<void>}
     */
    async init() {
        const config = new Config();

        // The monogram is the default geometry, and a page that supplies its
        // own would otherwise start with an M sitting in the middle of it.
        config.DEFAULT_OBSTACLES = [];
        Object.assign(config, this.options.config || {});

        this._resizeCanvas();

        this.sim = new SimulationManager(this.canvas, config);
        await this.sim.init((progress) => this.loading.setProgress(progress));

        // Captured after init rather than in the simulation's constructor, so a
        // scene switch restores the config the device actually settled on
        // instead of undoing the mobile adjustments made during startup.
        this.sim.baseConfig = { ...config };

        // Expose for debugging, as main.js does for the simulation itself
        window.fluidPage = this;

        this.obstacles = new DomObstacles(this.sim, { selector: this.options.selector });

        if (this.options.scene) await this.setScene(this.options.scene);
        this.obstacles.sync(true);

        window.addEventListener('resize', () => this._onResize());
        window.addEventListener('scroll', () => this.invalidate(), { passive: true });

        // Fonts land after first paint and move every box under them
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => this.invalidate());
        }

        this.lastTime = performance.now();
        requestAnimationFrame((now) => this._render(now));

        await this.loading.finish();
    }

    /**
     * Activate a scene's physics and emitters, keeping the page's geometry
     *
     * @param {Object} scene - Scene module
     * @returns {Promise<void>}
     */
    async setScene(scene) {
        await this.sim.loadScene(scene, { obstacles: false });

        // Scenes on a fluid page are written against the page, so they get it
        const context = this.sim.sceneManager.context;
        if (context) context.page = this;

        this.invalidate();
    }

    /**
     * Note that the layout has moved and should be re-measured
     */
    invalidate() {
        this.layoutDirty = true;
    }

    /**
     * Re-measure the layout every frame for a while
     *
     * A CSS transition animates on the compositor and reports nothing, so the
     * only way to keep a wall on a moving card is to keep asking where it is.
     * The window is deliberately explicit: measuring every frame forever would
     * make an idle page cost as much as an animating one.
     *
     * @param {number} milliseconds - How long the animation runs
     */
    track(milliseconds) {
        this.trackingUntil = Math.max(this.trackingUntil, performance.now() + milliseconds);

        // One guaranteed measurement after the window closes. Without it the
        // last frame inside the window is the last word on where everything is,
        // and on a slow machine that frame can land before the animation has
        // finished - leaving a wall on a panel that has since moved, or none on
        // one that has just faded in. A timer does not care how many frames the
        // renderer managed.
        clearTimeout(this.trailingSync);
        this.trailingSync = setTimeout(
            () => this.invalidate(),
            Math.max(0, this.trackingUntil - performance.now()) + 80
        );
    }

    /**
     * Run a callback every frame
     *
     * @param {function(number, number): void} callback - Receives (dt, time)
     * @returns {function(): void} Removes the callback
     */
    onFrame(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index >= 0) this.callbacks.splice(index, 1);
        };
    }

    /**
     * Add velocity at a screen-normalised position
     *
     * @param {number} x - 0 to 1 across the canvas
     * @param {number} y - 0 to 1 up the canvas
     * @param {number} dx - Horizontal velocity, cells/second
     * @param {number} dy - Vertical velocity
     * @param {number} radius - Splat radius
     */
    velocity(x, y, dx, dy, radius) {
        this.sim.forcesModule.applySplat(this.sim.velocity, x, y, dx, dy, radius, this.sim.aspectRatio);
    }

    /**
     * Add dye at a screen-normalised position
     *
     * @param {number} x - 0 to 1 across the canvas
     * @param {number} y - 0 to 1 up the canvas
     * @param {Object} color - {r, g, b}
     * @param {number} radius - Splat radius
     */
    dye(x, y, color, radius) {
        this.sim.forcesModule.applyColorSplat(this.sim.dye, x, y, color, radius, this.sim.aspectRatio);
    }

    /**
     * Turn a set of elements into dye
     *
     * The page stops being drawn on top of the fluid and becomes part of it:
     * after this the dye field is holding the shape of those panels, and
     * whatever the solver does next happens to the page rather than around it.
     * Releasing the walls afterwards - by fading the elements, which is all it
     * takes - lets the ink into the space they were occupying.
     *
     * @param {Iterable<Element>} elements - Elements to stamp
     * @param {Object} color - Ink colour {r, g, b}
     * @param {Object} [options] - { radius, edge, rim, rimGain } in screen heights
     * @returns {number} How many boxes were stamped
     */
    inkStamp(elements, color, options = {}) {
        const boxes = [];

        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) continue;

            // Fully off-screen panels are skipped rather than stamped: on a
            // scrolled page they are real, but the ink for them would be laid
            // outside the domain and would only ever arrive as an edge artefact.
            if (rect.bottom < -8 || rect.top > window.innerHeight + 8) continue;

            const centre = centreOf(rect);
            boxes.push({
                x: centre.x,
                y: centre.y,
                halfWidth: rect.width / 2 / window.innerWidth,
                halfHeight: rect.height / 2 / window.innerHeight
            });
        }

        this.sim.forcesModule.applyInkStamp(
            this.sim.dye, boxes, color, this.sim.aspectRatio, options
        );

        return boxes.length;
    }

    /**
     * Screen-normalised centre of an element
     *
     * @param {Element} element - Element to locate
     * @returns {{x: number, y: number}} Centre, screen-normalised
     */
    centreOf(element) {
        return centreOf(element.getBoundingClientRect());
    }

    /**
     * A point on an element's border, in screen-normalised coordinates
     *
     * @param {Element} element - Element to locate
     * @param {number} u - -1 (left edge) to 1 (right edge)
     * @param {number} v - -1 (bottom edge) to 1 (top edge)
     * @param {number} [pad] - Outward offset in CSS pixels
     * @returns {{x: number, y: number}} Screen-normalised point
     */
    edgeOf(element, u, v, pad = 0) {
        return pointOn(element.getBoundingClientRect(), u, v, pad);
    }

    /**
     * Screen-normalised position of a pointer event
     *
     * @param {PointerEvent|MouseEvent} event - Event with client coordinates
     * @returns {{x: number, y: number}} Screen-normalised point
     */
    pointOf(event) {
        return screenFromPixels(event.clientX, event.clientY);
    }

    /**
     * One frame: layout, simulation, render
     *
     * @private
     * @param {number} now - Timestamp from requestAnimationFrame
     */
    _render(now) {
        const elapsed = (now - this.lastTime) / 1000;
        const dt = Math.min(elapsed, 0.016);
        this.lastTime = now;
        this.frame++;
        this.time += dt;

        for (const callback of this.callbacks) callback(dt, this.time);

        // Measured after the callbacks and before the step, which is the only
        // ordering that is right for both kinds of motion: a CSS transform is
        // sampled as late as possible, and a panel a callback has just moved is
        // a wall in the same frame it moved rather than the frame after. The
        // other order leaves the geometry one frame behind anything the page
        // animates itself, which is visible as a contour sliding off its panel.
        if (this.layoutDirty || now < this.trackingUntil) {
            // A forced rebuild is only worth it when something asked for one;
            // during a transition the signature check is what stops a card that
            // has finished moving from being re-rasterised every frame.
            this.obstacles.sync(this.layoutDirty);
            this.layoutDirty = false;
        }

        this.sim.update(dt);
        this.sim.render();

        requestAnimationFrame((next) => this._render(next));
    }

    /**
     * Rebuild framebuffers and geometry for a new window size
     *
     * @private
     */
    _onResize() {
        if (this.resizePending) return;
        this.resizePending = true;

        requestAnimationFrame(() => {
            this.resizePending = false;
            this._resizeCanvas();
            this.sim.resize();
            this.obstacles.refresh();
            this.invalidate();
        });
    }

    /**
     * Size the drawing buffer in device pixels
     *
     * @private
     */
    _resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
        this.canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }
}
