/**
 * Forces Module
 * 
 * Applies external forces to the simulation (splats, gravity, etc.)
 * 
 * References:
 * - architecture.md - ForcesModule
 * - technical_analysis.md - Splat Shader
 */

export class ForcesModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Object} programs - Compiled shader programs
     * @param {FBOManager} fboManager - FBO manager
     * @param {ObstacleField} obstacleField - Obstacle distance field
     */
    constructor(gl, programs, fboManager, obstacleField) {
        this.gl = gl;
        this.programs = programs;
        this.splatProgram = programs.splat;
        this.fboManager = fboManager;
        this.obstacleField = obstacleField;
    }

    /**
     * Apply a Gaussian velocity splat at the specified position
     *
     * @param {Object} target - Target DoubleFBO (velocity)
     * @param {number} x - X position (normalized 0-1)
     * @param {number} y - Y position (normalized 0-1)
     * @param {number} dx - X velocity to add
     * @param {number} dy - Y velocity to add
     * @param {number} radius - Splat radius
     * @param {number} aspectRatio - Canvas aspect ratio
     * @param {number} [fromX] - Where the source was last frame; defaults to x
     * @param {number} [fromY] - Where the source was last frame; defaults to y
     */
    applySplat(target, x, y, dx, dy, radius, aspectRatio, fromX = x, fromY = y) {
        this._splat(target, x, y, dx, dy, 0.0, radius, aspectRatio, fromX, fromY);
    }

    /**
     * Apply color splat (for dye)
     * 
     * @param {Object} target - Target DoubleFBO (dye)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} color - RGB color {r, g, b}
     * @param {number} radius - Splat radius
     * @param {number} aspectRatio - Canvas aspect ratio
     * @param {number} [fromX] - Where the source was last frame; defaults to x
     * @param {number} [fromY] - Where the source was last frame; defaults to y
     */
    applyColorSplat(target, x, y, color, radius, aspectRatio, fromX = x, fromY = y) {
        this._splat(target, x, y, color.r, color.g, color.b, radius, aspectRatio, fromX, fromY);
    }

    /**
     * Write a set of rounded rectangles into the dye field
     *
     * Used to turn a layout into fluid: the boxes are where the page's panels
     * are, and once they are in the dye the solver can carry them off. Boxes
     * beyond what the shader holds are stamped in a second pass rather than
     * dropped, because a page losing three of its cards at the moment it
     * dissolves is worse than one extra full-screen pass.
     *
     * @param {Object} target - Target DoubleFBO (dye)
     * @param {Array<{x: number, y: number, halfWidth: number, halfHeight: number}>} boxes
     *        Boxes in screen-normalised coordinates, y up
     * @param {Object} color - Ink colour {r, g, b}
     * @param {number} aspectRatio - Canvas aspect ratio
     * @param {Object} [options] - { radius, edge, rim, rimGain }
     */
    applyInkStamp(target, boxes, color, aspectRatio, options = {}) {
        if (!boxes || boxes.length === 0) return;

        const gl = this.gl;
        const program = this.programs.inkStamp;
        const uniforms = program.uniforms;

        const {
            radius = 0.008,
            edge = 0.002,
            rim = 0.004,
            rimGain = 1.8
        } = options;

        // Matches MAX_BOXES in the shader
        const capacity = 24;

        for (let start = 0; start < boxes.length; start += capacity) {
            const batch = boxes.slice(start, start + capacity);
            const packed = new Float32Array(capacity * 4);

            for (let i = 0; i < batch.length; i++) {
                const box = batch[i];
                packed[i * 4] = box.x;
                packed[i * 4 + 1] = box.y;
                packed[i * 4 + 2] = box.halfWidth;
                packed[i * 4 + 3] = box.halfHeight;
            }

            program.bind();
            gl.uniform1i(uniforms.uTarget, target.read.attach(0));
            gl.uniform1f(uniforms.aspectRatio, aspectRatio);
            gl.uniform4fv(uniforms.uBoxes, packed);
            gl.uniform1i(uniforms.uCount, batch.length);
            gl.uniform3f(uniforms.uColor, color.r, color.g, color.b);
            gl.uniform1f(uniforms.uRadius, radius);
            gl.uniform1f(uniforms.uEdge, edge);
            gl.uniform1f(uniforms.uRim, rim);
            gl.uniform1f(uniforms.uRimGain, rimGain);

            this.fboManager.blit(target.write);
            target.swap();
        }
    }

    /**
     * Lift fluid in proportion to the dye it carries
     *
     * @param {Object} velocity - Velocity DoubleFBO
     * @param {Object} dye - Dye DoubleFBO
     * @param {number} strength - Force per unit dye
     * @param {Object} weights - Per-channel lift weights {r, g, b}
     * @param {number} dt - Time step
     */
    applyBuoyancy(velocity, dye, strength, weights, dt) {
        const gl = this.gl;
        const program = this.programs.buoyancy;
        const uniforms = program.uniforms;

        program.bind();
        gl.uniform1i(uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(uniforms.uDye, dye.read.attach(1));
        gl.uniform1i(uniforms.uObstacles, this.obstacleField.attach(2));
        gl.uniform3f(uniforms.uWeights, weights.r, weights.g, weights.b);
        gl.uniform1f(uniforms.uStrength, strength);
        gl.uniform1f(uniforms.dt, dt);

        this.fboManager.blit(velocity.write);
        velocity.swap();
    }

    /**
     * Wind a disc of fluid toward solid-body rotation
     *
     * @param {Object} velocity - Velocity DoubleFBO
     * @param {Object} options - {rate, falloff, stiffness, centerX, centerY}
     * @param {number} aspectRatio - Canvas aspect ratio
     * @param {number} dt - Time step
     */
    applyVortex(velocity, options, aspectRatio, dt) {
        const gl = this.gl;
        const program = this.programs.vortexForce;
        const uniforms = program.uniforms;

        program.bind();
        gl.uniform1i(uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(uniforms.uObstacles, this.obstacleField.attach(2));
        gl.uniform2f(uniforms.uCenter, options.centerX ?? 0.5, options.centerY ?? 0.5);
        gl.uniform1f(uniforms.uRate, options.rate);
        gl.uniform1f(uniforms.uFalloff, options.falloff);
        gl.uniform1f(uniforms.uStiffness, options.stiffness ?? 2.0);
        // Offsets in the shader are in screen heights; velocity is in cells
        gl.uniform1f(uniforms.uCellsPerUnit, velocity.height);
        gl.uniform1f(uniforms.aspectRatio, aspectRatio);
        gl.uniform1f(uniforms.dt, dt);

        this.fboManager.blit(velocity.write);
        velocity.swap();
    }

    /**
     * Add a value wherever a mask texture says to, in one pass
     *
     * The shape-sized counterpart of a splat: dye or momentum fed along a
     * whole outline every frame, rather than splatted onto it point by point.
     *
     * @param {Object} target - Target DoubleFBO (dye or velocity)
     * @param {WebGLTexture} source - Mask; its red channel is the weight, in
     *        screen space, bottom row first
     * @param {Object} amount - {r, g, b} added at full weight; for velocity,
     *        r and g are the x and y components
     * @param {number} aspectRatio - Canvas aspect ratio
     * @param {Object} [options]
     * @param {number} [options.time] - Seconds, to move the flicker
     * @param {number} [options.flicker] - 0 for steady, 1 for full flicker
     * @param {number} [options.grain] - Flicker noise cells across the height
     */
    applySource(target, source, amount, aspectRatio, options = {}) {
        const { time = 0, flicker = 0, grain = 24 } = options;
        const gl = this.gl;
        const program = this.programs.source;
        const uniforms = program.uniforms;

        program.bind();
        gl.uniform1i(uniforms.uTarget, target.read.attach(0));
        gl.uniform1i(uniforms.uObstacles, this.obstacleField.attach(1));
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, source);
        gl.uniform1i(uniforms.uSource, 2);
        gl.uniform3f(uniforms.amount, amount.r, amount.g, amount.b || 0);
        gl.uniform1f(uniforms.aspectRatio, aspectRatio);
        gl.uniform1f(uniforms.time, time);
        gl.uniform1f(uniforms.flicker, flicker);
        gl.uniform1f(uniforms.grain, grain);

        this.fboManager.blit(target.write);
        target.swap();
    }

    /**
     * Add a Gaussian splat of an arbitrary three-component value
     *
     * @private
     * @param {Object} target - Target DoubleFBO
     * @param {number} x - X position (normalized 0-1)
     * @param {number} y - Y position (normalized 0-1)
     * @param {number} r - First component (velocity x, or red)
     * @param {number} g - Second component (velocity y, or green)
     * @param {number} b - Third component (unused for velocity, or blue)
     * @param {number} radius - Splat radius
     * @param {number} aspectRatio - Canvas aspect ratio
     * @param {number} fromX - Start of the segment to sweep the splat along
     * @param {number} fromY - Start of the segment to sweep the splat along
     */
    _splat(target, x, y, r, g, b, radius, aspectRatio, fromX = x, fromY = y) {
        const gl = this.gl;
        const uniforms = this.splatProgram.uniforms;

        this.splatProgram.bind();

        gl.uniform1i(uniforms.uTarget, target.read.attach(0));
        gl.uniform1i(uniforms.uObstacles, this.obstacleField.attach(1));
        gl.uniform1f(uniforms.aspectRatio, aspectRatio);
        gl.uniform2f(uniforms.point, x, y);
        gl.uniform2f(uniforms.origin, fromX, fromY);
        gl.uniform3f(uniforms.color, r, g, b);
        gl.uniform1f(uniforms.radius, radius);

        this.fboManager.blit(target.write);
        target.swap();
    }
}
