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
        this.dx = 0;  // Delta x
        this.dy = 0;  // Delta y
        this.down = false;
        this.moved = false;
        this.color = generateColor();
    }

    updatePosition(x, y) {
        this.px = this.x;
        this.py = this.y;
        this.x = x;
        this.y = y;
        this.dx = this.x - this.px;
        this.dy = this.y - this.py;
        this.moved = Math.abs(this.dx) > 0 || Math.abs(this.dy) > 0;
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
            pointer.targetColor = generateColor();
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
                        pointer.targetColor = generateColor();
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
        this.pointers[0].updatePosition(coords.x, coords.y);
        this.pointers[0].color = generateColor();
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
                pointer.targetColor = generateColor();
                pointer.transitionStart = 0;
                this.pointers.push(pointer);
            }

            pointer.down = true;
            pointer.updatePosition(coords.x, coords.y);
            pointer.color = generateColor();
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
