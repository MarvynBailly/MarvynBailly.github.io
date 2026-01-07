/**
 * Bloom Module
 * 
 * Implements bloom post-processing effect.
 * Multi-pass pipeline: prefilter → blur → composite.
 * 
 * References:
 * - architecture.md - BloomModule
 * - technical_analysis.md - Bloom Effect
 */

export class BloomModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Object} programs - Compiled shader programs
     * @param {FBOManager} fboManager - FBO manager
     * @param {TextureManager} textureManager - Texture manager
     * @param {Config} config - Configuration
     */
    constructor(gl, programs, fboManager, textureManager, config) {
        this.gl = gl;
        this.bloomPrefilterProgram = programs.bloomPrefilter;
        this.bloomBlurProgram = programs.bloomBlur;
        this.bloomFinalProgram = programs.bloomFinal;
        this.fboManager = fboManager;
        this.textureManager = textureManager;
        this.config = config;

        // Create bloom framebuffers
        this._initFramebuffers();
    }

    /**
     * Initialize bloom framebuffers at multiple resolutions
     * 
     * @private
     */
    _initFramebuffers() {
        const gl = this.gl;
        const res = this.config.BLOOM_RESOLUTION;
        const iterations = this.config.BLOOM_ITERATIONS;

        const texType = this.textureManager.halfFloatTexType;
        const rgba = this.textureManager.supportedFormats.formatRGBA;
        const filtering = gl.LINEAR;

        this.bloomFramebuffers = [];

        // Create progressively smaller framebuffers for downsampling
        let width = res;
        let height = res;

        for (let i = 0; i < iterations; i++) {
            const fbo = this.textureManager.createFBO(
                width,
                height,
                rgba.internalFormat,
                rgba.format,
                texType,
                filtering
            );
            this.bloomFramebuffers.push(fbo);

            width = Math.max(2, Math.floor(width / 2));
            height = Math.max(2, Math.floor(height / 2));
        }
    }

    /**
     * Apply bloom effect to source texture
     * 
     * @param {Object} source - Source FBO
     * @returns {Object} Bloom texture FBO
     */
    apply(source) {
        if (!this.config.BLOOM || this.bloomFramebuffers.length === 0) {
            return null;
        }

        const gl = this.gl;

        // Step 1: Prefilter (extract bright regions)
        this._prefilter(source, this.bloomFramebuffers[0]);

        // Step 2: Blur iterations (downsampling and blurring)
        this._blur();

        // Return the final bloom texture (smallest resolution)
        return this.bloomFramebuffers[this.bloomFramebuffers.length - 1];
    }

    /**
     * Prefilter step: extract bright regions
     * 
     * @private
     * @param {Object} source - Source FBO
     * @param {Object} target - Target FBO
     */
    _prefilter(source, target) {
        const gl = this.gl;

        this.bloomPrefilterProgram.bind();

        const threshold = this.config.BLOOM_THRESHOLD;
        const knee = this.config.BLOOM_SOFT_KNEE;

        // Soft knee curve parameters
        const curve_x = threshold - knee;
        const curve_y = knee * 2.0;
        const curve_z = 0.25 / knee;

        gl.uniform3f(this.bloomPrefilterProgram.uniforms.curve, curve_x, curve_y, curve_z);
        gl.uniform1f(this.bloomPrefilterProgram.uniforms.threshold, threshold);
        gl.uniform1i(this.bloomPrefilterProgram.uniforms.uTexture, source.attach(0));

        this.fboManager.blit(target);
    }

    /**
     * Blur iterations: progressively blur and downsample
     * 
     * @private
     */
    _blur() {
        const gl = this.gl;

        this.bloomBlurProgram.bind();

        // Progressive downsampling with blur
        for (let i = 0; i < this.bloomFramebuffers.length - 1; i++) {
            const source = this.bloomFramebuffers[i];
            const target = this.bloomFramebuffers[i + 1];

            gl.uniform2f(
                this.bloomBlurProgram.uniforms.texelSize,
                1.0 / source.width,
                1.0 / source.height
            );

            gl.uniform1i(this.bloomBlurProgram.uniforms.uTexture, source.attach(0));

            this.fboManager.blit(target);
        }
    }

    /**
     * Resize bloom framebuffers
     */
    resize() {
        // Delete old framebuffers
        for (const fbo of this.bloomFramebuffers) {
            this.gl.deleteFramebuffer(fbo.fbo);
            this.gl.deleteTexture(fbo.texture);
        }

        // Recreate
        this._initFramebuffers();
    }
}
