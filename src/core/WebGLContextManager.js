/**
 * WebGL Context Manager
 * 
 * Initializes and manages WebGL context with capability detection.
 * Handles WebGL2/WebGL1 fallback and extension management.
 * 
 * References:
 * - architecture.md - WebGLContextManager
 * - technical_analysis.md - Texture Format Selection
 * - sources.md - WebGL Specifications
 */

export class WebGLContextManager {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} options - WebGL context options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = null;
        this.isWebGL2 = false;
        this.extensions = {};

        // Default context parameters for fluid simulation
        const defaultOptions = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        };

        this.contextOptions = { ...defaultOptions, ...options };
        this._initializeContext();
    }

    /**
     * Initialize WebGL context
     * Try WebGL2 first, fallback to WebGL1
     * 
     * @private
     */
    _initializeContext() {
        // Try WebGL2
        this.gl = this.canvas.getContext('webgl2', this.contextOptions);
        this.isWebGL2 = !!this.gl;

        // Fallback to WebGL1
        if (!this.gl) {
            this.gl = this.canvas.getContext('webgl', this.contextOptions) ||
                this.canvas.getContext('experimental-webgl', this.contextOptions);
            this.isWebGL2 = false;
        }

        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // Set clear color
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Enable extensions
        this._loadExtensions();
    }

    /**
     * Load required and optional WebGL extensions
     * 
     * @private
     * References: sources.md - WebGL Extensions
     */
    _loadExtensions() {
        const gl = this.gl;

        if (this.isWebGL2) {
            // WebGL2 extensions
            this.extensions.colorBufferFloat = gl.getExtension('EXT_color_buffer_float');
            this.extensions.textureFloatLinear = gl.getExtension('OES_texture_float_linear');
        } else {
            // WebGL1 extensions (required for float textures)
            this.extensions.textureFloat = gl.getExtension('OES_texture_float');
            this.extensions.textureHalfFloat = gl.getExtension('OES_texture_half_float');
            this.extensions.textureFloatLinear = gl.getExtension('OES_texture_float_linear');
            this.extensions.textureHalfFloatLinear = gl.getExtension('OES_texture_half_float_linear');
        }
    }

    /**
     * Get WebGL context
     * 
     * @returns {WebGLRenderingContext|WebGL2RenderingContext} WebGL context
     */
    getContext() {
        return this.gl;
    }

    /**
     * Check if WebGL2 is supported
     * 
     * @returns {boolean} True if WebGL2
     */
    supportsWebGL2() {
        return this.isWebGL2;
    }

    /**
     * Check if floating-point textures are supported
     * 
     * @returns {boolean} True if float textures supported
     */
    supportsFloatTextures() {
        if (this.isWebGL2) {
            return true; // Native float texture support in WebGL2
        } else {
            return !!(this.extensions.textureFloat || this.extensions.textureHalfFloat);
        }
    }

    /**
     * Check if linear filtering for float textures is supported
     * 
     * @returns {boolean} True if linear filtering supported
     */
    supportsLinearFiltering() {
        return !!this.extensions.textureFloatLinear;
    }

    /**
     * Get half-float texture type constant
     * Different between WebGL1 and WebGL2
     * 
     * @returns {number} GL constant for half-float type
     */
    getHalfFloatTexType() {
        const gl = this.gl;
        return this.isWebGL2 ? gl.HALF_FLOAT : this.extensions.textureHalfFloat.HALF_FLOAT_OES;
    }

    /**
     * Get supported extensions
     * 
     * @returns {Object} Extension objects
     */
    getExtensions() {
        return this.extensions;
    }

    /**
     * Handle context lost event
     * 
     * @param {Function} callback - Callback when context is lost
     */
    onContextLost(callback) {
        this.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            callback(event);
        }, false);
    }

    /**
     * Handle context restored event
     * 
     * @param {Function} callback - Callback when context is restored
     */
    onContextRestored(callback) {
        this.canvas.addEventListener('webglcontextrestored', (event) => {
            this._initializeContext();
            callback(event);
        }, false);
    }
}
