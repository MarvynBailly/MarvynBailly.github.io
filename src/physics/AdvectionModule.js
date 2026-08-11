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
     * @param {ObstacleField} obstacleField - Obstacle distance field
     */
    constructor(gl, programs, fboManager, obstacleField) {
        this.gl = gl;
        this.advectionProgram = programs.advection;
        this.fboManager = fboManager;
        this.obstacleField = obstacleField;
    }

    /**
     * Advect a quantity along the velocity field
     * 
     * @param {Object} source - Source DoubleFBO or FBO (quantity to advect)
     * @param {Object} velocity - Velocity field FBO
     * @param {number} dt - Time step
     * @param {number} dissipation - Dissipation factor
     * @param {Object} target - Target FBO to write to
     */
    advect(source, velocity, dt, dissipation, target) {
        const gl = this.gl;

        this.advectionProgram.bind();

        // Set uniforms
        gl.uniform2f(
            this.advectionProgram.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        // Source resolution: the same grid when advecting velocity, the dye grid
        // otherwise. Only the manual-filtering path reads it.
        gl.uniform2f(
            this.advectionProgram.uniforms.dyeTexelSize,
            1.0 / source.width,
            1.0 / source.height
        );

        // Obstacle field geometry, so the shader can measure the back-trace
        // against the distances stored in the field
        gl.uniform2f(
            this.advectionProgram.uniforms.uObstacleSize,
            this.obstacleField.width,
            this.obstacleField.height
        );
        gl.uniform1f(this.advectionProgram.uniforms.uObstacleRange, this.obstacleField.range2);

        gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
        gl.uniform1f(this.advectionProgram.uniforms.dissipation, dissipation);

        // Bind textures
        gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocity.attach(0));
        gl.uniform1i(this.advectionProgram.uniforms.uSource, source.attach(1));
        gl.uniform1i(this.advectionProgram.uniforms.uObstacles, this.obstacleField.attach(2));

        // Render
        this.fboManager.blit(target);
    }
}
