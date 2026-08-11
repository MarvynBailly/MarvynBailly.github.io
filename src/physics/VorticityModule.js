/**
 * Vorticity Module
 * 
 * Applies vorticity confinement to restore small-scale turbulence.
 * 
 * References:
 * - architecture.md - VorticityModule
 * - math_foundations.md - Section 9 (Vorticity)
 * - technical_analysis.md - Curl & Vorticity Confinement
 */

export class VorticityModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Object} programs - Compiled shader programs
     * @param {FBOManager} fboManager - FBO manager
     * @param {ObstacleField} obstacleField - Obstacle distance field
     * @param {Config} config - Configuration
     */
    constructor(gl, programs, fboManager, obstacleField, config) {
        this.gl = gl;
        this.curlProgram = programs.curl;
        this.vorticityProgram = programs.vorticity;
        this.fboManager = fboManager;
        this.obstacleField = obstacleField;
        this.config = config;
    }

    /**
     * Apply vorticity confinement to velocity field
     * 
     * @param {Object} velocity - Velocity DoubleFBO
     * @param {Object} curl - Curl FBO
     * @param {number} curlStrength - Vorticity confinement strength
     * @param {number} dt - Time step
     */
    apply(velocity, curl, curlStrength, dt) {
        const gl = this.gl;

        // Step 1: Compute curl (vorticity)
        this.computeCurl(velocity.read, curl);

        // Step 2: Apply vorticity confinement force
        this.applyConfinement(velocity.read, curl, curlStrength, dt, velocity.write);
    }

    /**
     * Compute curl of velocity field
     * 
     * @param {Object} velocity - Velocity FBO
     * @param {Object} curl - Target curl FBO
     */
    computeCurl(velocity, curl) {
        const gl = this.gl;

        this.curlProgram.bind();

        gl.uniform2f(
            this.curlProgram.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        gl.uniform1i(this.curlProgram.uniforms.uVelocity, velocity.attach(0));
        gl.uniform1i(this.curlProgram.uniforms.uObstacles, this.obstacleField.attach(2));

        this.fboManager.blit(curl);
    }

    /**
     * Apply vorticity confinement force
     * 
     * @param {Object} velocity - Input velocity FBO
     * @param {Object} curl - Curl FBO
     * @param {number} curlStrength - Confinement strength
     * @param {number} dt - Time step
     * @param {Object} output - Output velocity FBO
     */
    applyConfinement(velocity, curl, curlStrength, dt, output) {
        const gl = this.gl;

        this.vorticityProgram.bind();

        gl.uniform2f(
            this.vorticityProgram.uniforms.texelSize,
            1.0 / velocity.width,
            1.0 / velocity.height
        );

        gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, velocity.attach(0));
        gl.uniform1i(this.vorticityProgram.uniforms.uCurl, curl.attach(1));
        gl.uniform1i(this.vorticityProgram.uniforms.uObstacles, this.obstacleField.attach(2));
        gl.uniform1f(
            this.vorticityProgram.uniforms.uWallBand,
            this.obstacleField.bandThreshold(this.config.WALL_BAND)
        );
        gl.uniform1f(this.vorticityProgram.uniforms.curl, curlStrength);
        gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);

        this.fboManager.blit(output);
    }
}
