/**
 * Advection Module
 * 
 * Implements semi-Lagrangian advection for velocity and dye transport.
 * 
 * References:
 * - architecture.md - AdvectionModule
 * - math_foundations.md - Section 5 (Semi-Lagrangian Method)
 * - technical_analysis.md - Advection Shader
 */

export class AdvectionModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Object} programs - Compiled shader programs
     * @param {FBOManager} fboManager - FBO manager
     * @param {Object} obstacleTexture - Obstacle texture (optional)
     */
    constructor(gl, programs, fboManager, obstacleTexture = null) {
        this.gl = gl;
        this.advectionProgram = programs.advection;
        this.fboManager = fboManager;
        this.obstacleTexture = obstacleTexture;
    }

    /**
     * Advect a quantity along the velocity field
     * 
     * @param {Object} source - Source DoubleFBO or FBO (quantity to advect)
     * @param {Object} velocity - Velocity field FBO
     * @param {number} dt - Time step
     * @param {number} dissipation - Dissipation factor
     * @param {Object} target - Target FBO to write to
     * @param {boolean} isVelocity - Whether advecting velocity (same resolution) or dye (different resolution)
     */
    advect(source, velocity, dt, dissipation, target, isVelocity = false) {
        const gl = this.gl;

        this.advectionProgram.bind();

        // Set uniforms
        gl.uniform2f(
            this.advectionProgram.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        if (isVelocity) {
            // Advecting velocity: source and velocity same resolution
            gl.uniform2f(
                this.advectionProgram.uniforms.dyeTexelSize,
                1.0 / source.width,
                1.0 / source.height
            );
        } else {
            // Advecting dye: potentially different resolution
            gl.uniform2f(
                this.advectionProgram.uniforms.dyeTexelSize,
                1.0 / source.width,
                1.0 / source.height
            );
        }

        gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
        gl.uniform1f(this.advectionProgram.uniforms.dissipation, dissipation);

        // Bind textures
        gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocity.attach(0));
        gl.uniform1i(this.advectionProgram.uniforms.uSource, source.attach(1));

        // NEW: Bind obstacle texture if available
        if (this.obstacleTexture && this.advectionProgram.uniforms.uObstacles !== undefined) {
            gl.uniform1i(this.advectionProgram.uniforms.uObstacles, this.obstacleTexture.attach(2));
        }

        // Render
        this.fboManager.blit(target);
    }
}
