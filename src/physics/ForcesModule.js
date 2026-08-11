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
     */
    applySplat(target, x, y, dx, dy, radius, aspectRatio) {
        this._splat(target, x, y, dx, dy, 0.0, radius, aspectRatio);
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
     */
    applyColorSplat(target, x, y, color, radius, aspectRatio) {
        this._splat(target, x, y, color.r, color.g, color.b, radius, aspectRatio);
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
     */
    _splat(target, x, y, r, g, b, radius, aspectRatio) {
        const gl = this.gl;
        const uniforms = this.splatProgram.uniforms;

        this.splatProgram.bind();

        gl.uniform1i(uniforms.uTarget, target.read.attach(0));
        gl.uniform1i(uniforms.uObstacles, this.obstacleField.attach(1));
        gl.uniform1f(uniforms.aspectRatio, aspectRatio);
        gl.uniform2f(uniforms.point, x, y);
        gl.uniform3f(uniforms.color, r, g, b);
        gl.uniform1f(uniforms.radius, radius);

        this.fboManager.blit(target.write);
        target.swap();
    }
}
