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
     * @param {Object} obstacleTexture - Obstacle texture (optional)
     */
    constructor(gl, programs, fboManager, obstacleTexture = null) {
        this.gl = gl;
        this.splatProgram = programs.splat;
        this.fboManager = fboManager;
        this.obstacleTexture = obstacleTexture;
    }

    /**
     * Apply Gaussian splat at specified position
     * 
     * @param {Object} target - Target DoubleFBO (velocity or dye)
     * @param {number} x - X position (normalized 0-1)
     * @param {number} y - Y position (normalized 0-1)
     * @param {number} dx - X delta (for velocity)
     * @param {number} dy - Y delta (for velocity)
     * @param {Object} color - RGB color {r, g, b}
     * @param {number} radius - Splat radius
     * @param {number} aspectRatio - Canvas aspect ratio
     */
    applySplat(target, x, y, dx, dy, color, radius, aspectRatio) {
        const gl = this.gl;

        this.splatProgram.bind();

        gl.uniform1i(this.splatProgram.uniforms.uTarget, target.read.attach(0));
        gl.uniform1f(this.splatProgram.uniforms.aspectRatio, aspectRatio);
        gl.uniform2f(this.splatProgram.uniforms.point, x, y);
        gl.uniform3f(this.splatProgram.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(this.splatProgram.uniforms.radius, radius);

        this.fboManager.blit(target.write);
        target.swap();
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
        const gl = this.gl;

        this.splatProgram.bind();

        gl.uniform1i(this.splatProgram.uniforms.uTarget, target.read.attach(0));
        gl.uniform1f(this.splatProgram.uniforms.aspectRatio, aspectRatio);
        gl.uniform2f(this.splatProgram.uniforms.point, x, y);
        gl.uniform3f(this.splatProgram.uniforms.color, color.r, color.g, color.b);
        gl.uniform1f(this.splatProgram.uniforms.radius, radius);

        this.fboManager.blit(target.write);
        target.swap();
    }
}
