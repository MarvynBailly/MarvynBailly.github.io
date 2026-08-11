/**
 * Pressure Solver Module
 * 
 * Enforces incompressibility via pressure projection.
 * Implements: divergence computation, Poisson solving, gradient subtraction.
 * 
 * References:
 * - architecture.md - PressureSolverModule
 * - math_foundations.md - Section 7 (Pressure Projection)
 * - technical_analysis.md - Pressure Solver
 */

export class PressureSolverModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Object} programs - Compiled shader programs
     * @param {FBOManager} fboManager - FBO manager
     * @param {ObstacleField} obstacleField - Obstacle distance field
     * @param {Config} config - Configuration
     */
    constructor(gl, programs, fboManager, obstacleField, config) {
        this.gl = gl;
        // Held as the whole map rather than as individual programs: the
        // divergence and gradient-subtract shaders are recompiled when the
        // outflow boundary is toggled, and reading them back out of the map
        // each frame is what keeps this module from using the stale pair.
        this.programs = programs;
        this.fboManager = fboManager;
        this.obstacleField = obstacleField;
        this.config = config;
    }

    /**
     * Project velocity field to make it divergence-free
     * 
     * @param {Object} velocity - Velocity DoubleFBO
     * @param {Object} pressure - Pressure FBO
     * @param {Object} divergence - Divergence FBO
     * @param {number} iterations - Number of Jacobi iterations
     * @returns {Object} Pressure-corrected velocity (in velocity.write)
     */
    project(velocity, pressure, divergence, iterations) {
        const gl = this.gl;

        // Step 1: Compute divergence
        this.computeDivergence(velocity.read, divergence);

        // Step 2: Damp the previous frame's pressure and use it as the initial
        // guess. Starting warm converges in far fewer sweeps than starting from
        // zero; damping stops the guess from drifting once the flow changes.
        this.dampPressure(pressure, this.config.PRESSURE);

        // Step 3: Solve Poisson equation for pressure
        this.solvePressure(divergence, pressure, iterations);

        // Step 4: Subtract pressure gradient from velocity
        this.subtractGradient(velocity.read, pressure, velocity.write);

        return velocity.write;
    }

    /**
     * Compute divergence of velocity field
     * 
     * @param {Object} velocity - Velocity FBO
     * @param {Object} divergence - Target divergence FBO
     */
    computeDivergence(velocity, divergence) {
        const gl = this.gl;

        this.programs.divergence.bind();

        gl.uniform2f(
            this.programs.divergence.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        gl.uniform1i(this.programs.divergence.uniforms.uVelocity, velocity.attach(0));
        gl.uniform1i(this.programs.divergence.uniforms.uObstacles, this.obstacleField.attach(2));
        gl.uniform1f(this.programs.divergence.uniforms.uInletSpeed, this.config.CHANNEL_INLET);

        this.fboManager.blit(divergence);
    }

    /**
     * Scale the pressure field towards zero
     *
     * @param {Object} pressure - Pressure DoubleFBO
     * @param {number} value - Retention factor (1 keeps it, 0 clears it)
     */
    dampPressure(pressure, value) {
        const gl = this.gl;
        const clear = this.programs.clear;

        clear.bind();
        gl.uniform1i(clear.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clear.uniforms.value, value);

        this.fboManager.blit(pressure.write);
        pressure.swap();
    }

    /**
     * Solve Poisson equation using Jacobi iteration
     * 
     * @param {Object} divergence - Divergence FBO
     * @param {Object} pressure - Pressure DoubleFBO
     * @param {number} iterations - Number of iterations
     */
    solvePressure(divergence, pressure, iterations) {
        const gl = this.gl;

        this.programs.pressure.bind();

        gl.uniform2f(
            this.programs.pressure.uniforms.texelSize,
            1.0 / pressure.width,
            1.0 / pressure.height
        );

        gl.uniform1i(this.programs.pressure.uniforms.uDivergence, divergence.attach(1));
        gl.uniform1i(this.programs.pressure.uniforms.uObstacles, this.obstacleField.attach(2));

        // Jacobi iterations (ping-pong between read/write)
        for (let i = 0; i < iterations; i++) {
            gl.uniform1i(this.programs.pressure.uniforms.uPressure, pressure.read.attach(0));
            this.fboManager.blit(pressure.write);
            pressure.swap();
        }
    }

    /**
     * Subtract pressure gradient from velocity
     * 
     * @param {Object} velocity - Input velocity FBO
     * @param {Object} pressure - Pressure FBO
     * @param {Object} output - Output velocity FBO
     */
    subtractGradient(velocity, pressure, output) {
        const gl = this.gl;

        this.programs.gradientSubtract.bind();

        gl.uniform2f(
            this.programs.gradientSubtract.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        gl.uniform1i(this.programs.gradientSubtract.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(this.programs.gradientSubtract.uniforms.uVelocity, velocity.attach(1));
        gl.uniform1i(this.programs.gradientSubtract.uniforms.uObstacles, this.obstacleField.attach(2));
        gl.uniform1f(
            this.programs.gradientSubtract.uniforms.uWallBand,
            this.obstacleField.bandThreshold(this.config.WALL_BAND)
        );
        gl.uniform1f(this.programs.gradientSubtract.uniforms.uWallSlip, this.config.WALL_SLIP);
        gl.uniform1f(this.programs.gradientSubtract.uniforms.uInletSpeed, this.config.CHANNEL_INLET);

        this.fboManager.blit(output);
    }
}
