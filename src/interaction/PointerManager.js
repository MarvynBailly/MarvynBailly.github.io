/**
 * Pointer Manager
 * 
 * Tracks mouse and touch input, normalizes coordinates.
 * Supports multi-touch interaction.
 * 
 * References:
 * - architecture.md - PointerManager
 * - technical_analysis.md - User Interaction
 */

import { generateColor } from '../utils/math.js';
import { pigment } from '../utils/palette.js';

/**
 * Pick a colour for a pointer
 *
 * Random HSL across all 360 degrees is the stock behaviour and stays the
 * default. A scene can set PALETTE_POINTER to draw from the site's own inks
 * instead, so a considered scene is not undercut by a rainbow cursor.
 *
 * POINTER_FAMILY pins which ink. That matters wherever a scene draws in the
 * palette itself: Probe Traverse distinguishes the machine from the visitor by
 * colour, and a coin flip would have made half the visitor's strokes
 * indistinguishable from the ghost's.
 *
 * @param {Config} config - Configuration
 * @returns {Object} RGB colour
 */
function pointerColor(config) {
    if (!config || !config.PALETTE_POINTER) return generateColor();

    const family = config.POINTER_FAMILY === 'either'
        ? (Math.random() < 0.5 ? 'cool' : 'warm')
        : config.POINTER_FAMILY;

    return pigment(family, 0.42, 0.12);
}

/**
 * Monotonic clock, falling back where performance is unavailable
 *
 * @returns {number} Milliseconds
 */
function now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Pointer data structure
 */
class Pointer {
    constructor(id) {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.px = 0;  // Previous x
        this.py = 0;  // Previous y
        this.dx = 0;  // Delta x, accumulated since the simulation last read it
        this.dy = 0;  // Delta y
        this.ax = 0;  // Where the path since that read began
        this.ay = 0;
        this.down = false;
        this.moved = false;
        this.color = generateColor();
        this.lastInput = -Infinity;   // nobody has touched this pointer yet
    }

    /**
     * Start a fresh path here
     *
     * A press begins a new stroke. Without this the first splat of the press
     * would be swept from wherever the pointer happened to have been left.
     *
     * @param {number} x - Normalized x
     * @param {number} y - Normalized y
     */
    begin(x, y) {
        this.x = this.px = this.ax = x;
        this.y = this.py = this.ay = y;
        this.dx = 0;
        this.dy = 0;
        this.moved = false;
        this.lastInput = now();
    }

    updatePosition(x, y) {
        // The first report a pointer ever gets is a position, not a movement:
        // there is no earlier point to have traveled from, and treating the
        // origin as one would drag a stroke in from the corner of the screen.
        if (this.lastInput === -Infinity) {
            this.begin(x, y);
            return;
        }

        this.px = this.x;
        this.py = this.y;
        this.x = x;
        this.y = y;

        // Accumulate rather than replace. Pointer events arrive at the device's
        // rate, not the frame rate: a 125 Hz mouse fires roughly twice between
        // two frames and a gaming mouse sixteen times, and keeping only the
        // last delta threw away everything but the final fraction of the
        // gesture - measured at 6% of the momentum at 16 events per frame.
        this.dx += this.x - this.px;
        this.dy += this.y - this.py;
        this.moved = Math.abs(this.dx) > 0 || Math.abs(this.dy) > 0;
        this.lastInput = now();
    }

    /**
     * Seconds since this pointer last reported input
     *
     * Scenes use this to decide whether anyone is actually there. A large value
     * on first call is intentional: a visitor who has not touched the canvas
     * counts as idle from the start.
     *
     * @returns {number} Idle time in seconds
     */
    idleFor() {
        return (now() - this.lastInput) / 1000;
    }

    /**
     * Mark the accumulated movement as spent
     *
     * Called once the simulation has turned it into force. Without this a
     * pointer that stops moving keeps reporting its last delta, because no
     * further events arrive to clear it.
     */
    consumeMovement() {
        this.moved = false;
        this.dx = 0;
        this.dy = 0;
        this.ax = this.x;   // the next stroke starts where this one ended
        this.ay = this.y;
    }
}

export class PointerManager {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Config} config - Configuration
     */
    constructor(canvas, config) {
        this.canvas = canvas;
        this.config = config;
        this.pointers = [];
        this.pointers.push(new Pointer(0)); // Default pointer for mouse

        this._setupEventListeners();
        this._startColorChangeLoop();
    }

    /**
     * Start passive color change loop with smooth transitions
     * 
     * @private
     */
    _startColorChangeLoop() {
        // Initialize color transition state for each pointer
        for (const pointer of this.pointers) {
            pointer.currentColor = { ...pointer.color };
            pointer.targetColor = pointerColor(this.config);
            pointer.transitionStart = 0;
        }

        this._colorLoopId = null;
        const updateColors = (timestamp) => {
            if (this.config.CONTINUOUS_COLOR_CHANGE) {
                const transitionDuration = this.config.COLOR_CHANGE_SPEED;

                for (const pointer of this.pointers) {
                    // Initialize transition start time if not set
                    if (!pointer.transitionStart) {
                        pointer.transitionStart = timestamp;
                    }

                    // Calculate transition progress (0 to 1)
                    const elapsed = timestamp - pointer.transitionStart;
                    const progress = Math.min(elapsed / transitionDuration, 1.0);

                    // Lerp between current and target color
                    pointer.color = {
                        r: pointer.currentColor.r + (pointer.targetColor.r - pointer.currentColor.r) * progress,
                        g: pointer.currentColor.g + (pointer.targetColor.g - pointer.currentColor.g) * progress,
                        b: pointer.currentColor.b + (pointer.targetColor.b - pointer.currentColor.b) * progress
                    };

                    // When transition completes, set new target
                    if (progress >= 1.0) {
                        pointer.currentColor = { ...pointer.targetColor };
                        pointer.targetColor = pointerColor(this.config);
                        pointer.transitionStart = timestamp;
                    }
                }
            }
            this._colorLoopId = requestAnimationFrame(updateColors);
        };

        this._colorLoopId = requestAnimationFrame(updateColors);
    }

    /**
     * Stop the color change loop and clean up event listeners
     */
    destroy() {
        if (this._colorLoopId != null) {
            cancelAnimationFrame(this._colorLoopId);
            this._colorLoopId = null;
        }
    }

    /**
     * Setup mouse and touch event listeners
     * 
     * @private
     */
    _setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        window.addEventListener('mouseup', (e) => this._onMouseUp(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e));
    }

    /**
     * Normalize coordinates to [0, 1]
     * 
     * @private
     * @param {number} clientX - Client X coordinate
     * @param {number} clientY - Client Y coordinate
     * @returns {Object} Normalized {x, y}
     */
    _normalizeCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / rect.width,
            y: 1.0 - (clientY - rect.top) / rect.height  // Flip Y for WebGL
        };
    }

    /**
     * Mouse down event
     * 
     * @private
     */
    _onMouseDown(e) {
        const coords = this._normalizeCoords(e.clientX, e.clientY);
        this.pointers[0].down = true;
        this.pointers[0].begin(coords.x, coords.y);
        this.pointers[0].color = pointerColor(this.config);
    }

    /**
     * Mouse move event
     * 
     * @private
     */
    _onMouseMove(e) {
        const coords = this._normalizeCoords(e.clientX, e.clientY);
        this.pointers[0].updatePosition(coords.x, coords.y);
    }

    /**
     * Mouse up event
     * 
     * @private
     */
    _onMouseUp(e) {
        this.pointers[0].down = false;
    }

    /**
     * Touch start event
     * 
     * @private
     */
    _onTouchStart(e) {
        e.preventDefault();
        const touches = e.targetTouches;

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const coords = this._normalizeCoords(touch.clientX, touch.clientY);

            // Find or create pointer for this touch
            let pointer = this.pointers.find(p => p.id === touch.identifier);
            if (!pointer) {
                pointer = new Pointer(touch.identifier);
                // Initialize color transition state
                pointer.currentColor = { ...pointer.color };
                pointer.targetColor = pointerColor(this.config);
                pointer.transitionStart = 0;
                this.pointers.push(pointer);
            }

            pointer.down = true;
            pointer.begin(coords.x, coords.y);
            pointer.color = pointerColor(this.config);
        }
    }

    /**
     * Touch move event
     * 
     * @private
     */
    _onTouchMove(e) {
        e.preventDefault();
        const touches = e.targetTouches;

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const coords = this._normalizeCoords(touch.clientX, touch.clientY);

            const pointer = this.pointers.find(p => p.id === touch.identifier);
            if (pointer) {
                pointer.updatePosition(coords.x, coords.y);
            }
        }
    }

    /**
     * Touch end event
     * 
     * @private
     */
    _onTouchEnd(e) {
        const touches = e.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const pointer = this.pointers.find(p => p.id === touch.identifier);
            if (pointer) {
                pointer.down = false;
            }
        }

        // Remove stale touch pointers to prevent unbounded array growth
        this.pointers = this.pointers.filter(p => p.id === 0 || p.down);
    }

    /**
     * Get all active pointers
     * 
     * @returns {Pointer[]} Array of pointers
     */
    getPointers() {
        return this.pointers;
    }
}
