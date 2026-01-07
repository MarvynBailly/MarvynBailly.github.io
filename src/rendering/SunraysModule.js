/**
 * Sunrays Module
 * 
 * Implements god rays (sunrays) post-processing effect.
 * Creates radial blur from bright areas.
 * 
 * References:
 * - architecture.md - SunraysModule
 * - technical_analysis.md - Sunrays Effect
 */

export class SunraysModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Object} programs - Compiled shader programs
     * @param {FBOManager} fboManager - FBO manager
     * @param {TextureManager} textureManager - Texture manager
     * @param {Config} config - Configuration
     */
    constructor(gl, programs, fboManager, textureManager, config) {
        this.gl = gl;
        this.sunraysMaskProgram = programs.sunraysMask;
        this.sunraysProgram = programs.sunrays;
        this.fboManager = fboManager;
        this.textureManager = textureManager;
        this.config = config;

        // Create sunrays framebuffers
        this._initFramebuffers();
    }

    /**
     * Initialize sunrays framebuffers
     * 
     * @private
     */
    _initFramebuffers() {
        const gl = this.gl;
        const res = this.config.SUNRAYS_RESOLUTION;

        const texType = this.textureManager.halfFloatTexType;
        const r = this.textureManager.supportedFormats.formatR;
        const filtering = gl.LINEAR;

        // Create two FBOs for ping-pong
        this.sunrays = this.textureManager.createDoubleFBO(
            res,
            res,
            r.internalFormat,
            r.format,
            texType,
            filtering
        );
    }

    /**
     * Apply sunrays effect to source texture
     * 
     * @param {Object} source - Source FBO (dye)
     * @returns {Object} Sunrays texture FBO
     */
    apply(source) {
        if (!this.config.SUNRAYS) {
            return null;
        }

        const gl = this.gl;

        // Step 1: Create mask from bright areas
        this._createMask(source);

        // Step 2: Apply radial blur
        this._radialBlur();

        return this.sunrays.read;
    }

    /**
     * Create sunrays mask from bright areas
     * 
     * @private
     * @param {Object} source - Source FBO
     */
    _createMask(source) {
        const gl = this.gl;

        this.sunraysMaskProgram.bind();

        gl.uniform1i(this.sunraysMaskProgram.uniforms.uTexture, source.attach(0));

        this.fboManager.blit(this.sunrays.write);
        this.sunrays.swap();
    }

    /**
     * Apply radial blur for god rays effect
     * 
     * @private
     */
    _radialBlur() {
        const gl = this.gl;

        this.sunraysProgram.bind();

        gl.uniform1f(this.sunraysProgram.uniforms.weight, this.config.SUNRAYS_WEIGHT);
        gl.uniform1i(this.sunraysProgram.uniforms.uTexture, this.sunrays.read.attach(0));

        this.fboManager.blit(this.sunrays.write);
        this.sunrays.swap();
    }

    /**
     * Resize sunrays framebuffers
     */
    resize() {
        const gl = this.gl;

        // Delete old framebuffers
        if (this.sunrays.read) {
            gl.deleteFramebuffer(this.sunrays.read.fbo);
            gl.deleteTexture(this.sunrays.read.texture);
        }
        if (this.sunrays.write) {
            gl.deleteFramebuffer(this.sunrays.write.fbo);
            gl.deleteTexture(this.sunrays.write.texture);
        }

        // Recreate
        this._initFramebuffers();
    }
}
