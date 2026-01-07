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
     * @param {TextureManager} textureManager - Texture manager
     * @param {Object} obstacleTexture - Obstacle texture (optional)
     */
    constructor(gl, programs, fboManager, textureManager, obstacleTexture = null) {
        this.gl = gl;
        this.divergenceProgram = programs.divergence;
        this.pressureProgram = programs.pressure;
        this.gradientSubtractProgram = programs.gradientSubtract;
        this.fboManager = fboManager;
        this.textureManager = textureManager;
        this.obstacleTexture = obstacleTexture;
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

        // Step 2: Solve Poisson equation for pressure
        this.solvePressure(divergence, pressure, iterations);

        // Step 3: Subtract pressure gradient from velocity
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

        this.divergenceProgram.bind();

        gl.uniform2f(
            this.divergenceProgram.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, velocity.attach(0));

        // NEW: Bind obstacle texture
        if (this.obstacleTexture && this.divergenceProgram.uniforms.uObstacles !== undefined) {
            gl.uniform1i(this.divergenceProgram.uniforms.uObstacles, this.obstacleTexture.attach(2));
        }

        this.fboManager.blit(divergence);
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

        this.pressureProgram.bind();

        gl.uniform2f(
            this.pressureProgram.uniforms.texelSize,
            1.0 / pressure.width,
            1.0 / pressure.height
        );

        gl.uniform1i(this.pressureProgram.uniforms.uDivergence, divergence.attach(1));

        // NEW: Bind obstacle texture
        if (this.obstacleTexture && this.pressureProgram.uniforms.uObstacles !== undefined) {
            gl.uniform1i(this.pressureProgram.uniforms.uObstacles, this.obstacleTexture.attach(2));
        }

        // Jacobi iterations (ping-pong between read/write)
        for (let i = 0; i < iterations; i++) {
            gl.uniform1i(this.pressureProgram.uniforms.uPressure, pressure.read.attach(0));
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

        this.gradientSubtractProgram.bind();

        gl.uniform2f(
            this.gradientSubtractProgram.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        gl.uniform1i(this.gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(this.gradientSubtractProgram.uniforms.uVelocity, velocity.attach(1));

        // NEW: Bind obstacle texture
        if (this.obstacleTexture && this.gradientSubtractProgram.uniforms.uObstacles !== undefined) {
            gl.uniform1i(this.gradientSubtractProgram.uniforms.uObstacles, this.obstacleTexture.attach(2));
        }

        this.fboManager.blit(output);
    }
}
