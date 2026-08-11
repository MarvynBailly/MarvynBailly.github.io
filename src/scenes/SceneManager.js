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
             */
            velocity(x, y, dx, dy, radius) {
                sim.forcesModule.applySplat(sim.velocity, x, y, dx, dy, radius, sim.aspectRatio);
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
            dye(x, y, color, radius) {
                sim.forcesModule.applyColorSplat(sim.dye, x, y, color, radius, sim.aspectRatio);
            }
        };
    }
}
