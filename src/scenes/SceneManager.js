/**
 * Scene Manager
 *
 * Runs the active scene's emitters once per frame, from the same hook the
 * hardcoded wind tunnel used to occupy in SimulationManager.update().
 *
 * A scene is a plain module: metadata, a config patch, obstacle geometry, and
 * an optional per-frame update. Everything a scene needs to inject fluid is
 * handed to it through a context object, so scene files never reach into the
 * simulation's internals and can be written and reviewed in isolation.
 *
 * TWO COORDINATE SYSTEMS, and mixing them up is the classic bug here:
 *   - Emitter positions are SCREEN-normalised. (0,0) is the bottom-left of the
 *     canvas, (1,1) the top-right, whatever the window shape.
 *   - Obstacle geometry is DESIGN space: a square [0,1] frame mapped to the
 *     shorter screen axis, so shapes keep their proportions. See ObstacleManager.
 *
 * References:
 * - scenes/emitters.js - the helpers scenes build their emitters from
 * - core/ObstacleManager.js - design space
 */

export class SceneManager {
    /**
     * @param {SimulationManager} simulation - Owning simulation
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.scene = null;
        this.time = 0;
        this.frame = 0;
        this.context = null;
    }

    /**
     * Activate a scene
     *
     * @param {Object|null} scene - Scene module, or null to run none
     */
    setScene(scene) {
        this.scene = scene || null;
        this.time = 0;
        this.frame = 0;
        this.context = this._makeContext();

        if (this.scene && typeof this.scene.setup === 'function') {
            this.scene.setup(this.context);
        }
    }

    /**
     * Run the active scene for one frame
     *
     * @param {number} dt - Time step in seconds
     */
    update(dt) {
        if (!this.scene || typeof this.scene.update !== 'function') return;

        this.time += dt;
        this.frame++;

        const context = this.context;
        context.time = this.time;
        context.frame = this.frame;
        context.dt = dt;
        context.aspect = this.simulation.aspectRatio;

        this.scene.update(context, this.time, dt);
    }

    /**
     * Build the object scenes receive
     *
     * Splat helpers are bound to the simulation's current buffers by lookup at
     * call time rather than captured, because resizing replaces them.
     *
     * @private
     * @returns {Object} Scene context
     */
    _makeContext() {
        const sim = this.simulation;

        return {
            time: 0,
            frame: 0,
            dt: 0,
            aspect: sim.aspectRatio,
            config: sim.config,
            state: {},          // scratch space owned by the scene

            /**
             * Seconds since the visitor last touched the canvas
             *
             * Large when nobody has interacted at all, which is the common case:
             * a scene that only responds to input does nothing for most visitors.
             *
             * @returns {number} Idle time in seconds
             */
            idleFor() {
                const pointers = sim.pointerManager.getPointers();
                return Math.min(...pointers.map(p => p.idleFor()));
            },

            /**
             * Add velocity at a screen-normalised position
             *
             * @param {number} x - 0 to 1 across the canvas
             * @param {number} y - 0 to 1 up the canvas
             * @param {number} dx - Horizontal velocity, simulation cells/second
             * @param {number} dy - Vertical velocity
             * @param {number} radius - Raw splat radius; the Gaussian is exp(-r^2/radius)
             * @param {number} [fromX] - Where the source was last frame; splat sweeps from there
             * @param {number} [fromY] - Where the source was last frame
             */
            velocity(x, y, dx, dy, radius, fromX, fromY) {
                sim.forcesModule.applySplat(
                    sim.velocity, x, y, dx, dy, radius, sim.aspectRatio, fromX, fromY
                );
            },

            /**
             * Add dye at a screen-normalised position
             *
             * Costs roughly sixteen times a velocity splat, because it covers the
             * dye buffer rather than the simulation grid. Rate-limit with every().
             *
             * @param {number} x - 0 to 1 across the canvas
             * @param {number} y - 0 to 1 up the canvas
             * @param {Object} color - {r, g, b}
             * @param {number} radius - Raw splat radius
             */
            dye(x, y, color, radius, fromX, fromY) {
                sim.forcesModule.applyColorSplat(
                    sim.dye, x, y, color, radius, sim.aspectRatio, fromX, fromY
                );
            },

            /**
             * Turn a drawing into a source mask
             *
             * The canvas covers the whole screen, top row first as canvases
             * are; white is full weight. Pass the mask back in to redraw it,
             * after a resize say, without making a new texture.
             *
             * @param {HTMLCanvasElement} canvas - Drawing of where the source is
             * @param {WebGLTexture} [existing] - Mask to overwrite
             * @returns {WebGLTexture} Mask for dyeSource / velocitySource
             */
            mask(canvas, existing) {
                const gl = sim.gl;
                const texture = existing || gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                return texture;
            },

            /**
             * Add dye wherever a mask says to, in one pass
             *
             * For a source that is a shape rather than a point. Unlike a run of
             * splats it feeds the whole shape every frame, so nothing about the
             * feeding shows.
             *
             * @param {WebGLTexture} mask - From mask()
             * @param {Object} color - {r, g, b} at full weight, per frame
             * @param {Object} [options] - { flicker, grain }, see ForcesModule.applySource
             */
            dyeSource(mask, color, options = {}) {
                sim.forcesModule.applySource(sim.dye, mask, color, sim.aspectRatio, {
                    time: this.time, ...options
                });
            },

            /**
             * Add velocity wherever a mask says to, in one pass
             *
             * @param {WebGLTexture} mask - From mask()
             * @param {number} dx - Horizontal velocity at full weight, per frame
             * @param {number} dy - Vertical velocity at full weight, per frame
             * @param {Object} [options] - { flicker, grain }, see ForcesModule.applySource
             */
            velocitySource(mask, dx, dy, options = {}) {
                sim.forcesModule.applySource(sim.velocity, mask, { r: dx, g: dy, b: 0 }, sim.aspectRatio, {
                    time: this.time, ...options
                });
            },

            /**
             * Drop something into the lake, if the scene has waves on its water
             *
             * @param {number} x - Across the screen, 0 to 1
             * @param {number} depth - Down from the waterline to the bottom of
             *        the screen, 0 to 1; small is far away
             * @param {number} amount - Size of the splash
             * @param {number} [radius] - Size of the dent, in wave grid cells
             */
            ripple(x, depth, amount, radius) {
                if (sim.config.REFLECTION && sim.config.WAVES) {
                    sim.waterModule.drop(x, depth, amount, radius);
                }
            },

            /**
             * Place or move a solid body in the flow
             *
             * The body becomes part of the obstacle field, so the fluid sees a
             * real wall: it flows around the hull, dye cannot enter it, and the
             * pressure solve responds to it. Moving it is all this call does -
             * pushing water is the scene's job, because only the scene knows
             * where the bow and the propeller are. See scenes/library/little-boat.js.
             *
             * Position is screen-normalised like the splats above; `length` is
             * a fraction of the shorter screen axis, so the body keeps its size
             * and proportions on any window.
             *
             * @param {string} id - Identifier, so the same body moves each frame
             * @param {Object} spec - { vertices, x, y, angle, length }
             */
            body(id, spec) {
                if (sim.obstacleManager) sim.obstacleManager.setBody(id, spec);
            }
        };
    }
}
