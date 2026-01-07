/**
 * Texture Manager
 * 
 * Creates and manages textures and framebuffer objects (FBOs).
 * Handles format detection and progressive fallback.
 * Implements DoubleFBO pattern for ping-pong rendering.
 * 
 * References:
 * - architecture.md - TextureManager
 * - technical_analysis.md - FBO Management, Texture Format Selection
 * - sources.md - WebGL Extensions
 */

export class TextureManager {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {boolean} isWebGL2 - Whether WebGL2 is being used
     * @param {Object} extensions - WebGL extensions
     */
    constructor(gl, isWebGL2, extensions) {
        this.gl = gl;
        this.isWebGL2 = isWebGL2;
        this.extensions = extensions;
        this.halfFloatTexType = this._getHalfFloatType();

        // Detect supported formats
        this.supportedFormats = this._detectFormats();
    }

    /**
     * Get half-float texture type
     * 
     * @private
     * @returns {number} GL constant for half-float
     */
    _getHalfFloatType() {
        const gl = this.gl;
        if (this.isWebGL2) {
            return gl.HALF_FLOAT;
        } else {
            return this.extensions.textureHalfFloat ?
                this.extensions.textureHalfFloat.HALF_FLOAT_OES :
                gl.UNSIGNED_BYTE;
        }
    }

    /**
     * Detect supported texture formats
     * 
     * @private
     * @returns {Object} Supported format configurations
     */
    _detectFormats() {
        const gl = this.gl;
        const formats = {};

        if (this.isWebGL2) {
            formats.formatRGBA = this.getSupportedFormat(gl.RGBA16F, gl.RGBA, this.halfFloatTexType);
            formats.formatRG = this.getSupportedFormat(gl.RG16F, gl.RG, this.halfFloatTexType);
            formats.formatR = this.getSupportedFormat(gl.R16F, gl.RED, this.halfFloatTexType);
        } else {
            formats.formatRGBA = this.getSupportedFormat(gl.RGBA, gl.RGBA, this.halfFloatTexType);
            formats.formatRG = this.getSupportedFormat(gl.RGBA, gl.RGBA, this.halfFloatTexType);
            formats.formatR = this.getSupportedFormat(gl.RGBA, gl.RGBA, this.halfFloatTexType);
        }

        return formats;
    }

    /**
     * Get supported texture format with fallback
     * Tests if format can be used as render target
     * 
     * @param {number} internalFormat - Internal format
     * @param {number} format - Format
     * @param {number} type - Data type
     * @returns {Object|null} Format config or null if unsupported
     */
    getSupportedFormat(internalFormat, format, type) {
        const gl = this.gl;

        if (!this._supportRenderTextureFormat(internalFormat, format, type)) {
            // Try fallback formats
            if (this.isWebGL2) {
                if (internalFormat === gl.R16F) {
                    return this.getSupportedFormat(gl.RG16F, gl.RG, type);
                }
                if (internalFormat === gl.RG16F) {
                    return this.getSupportedFormat(gl.RGBA16F, gl.RGBA, type);
                }
            }
            return null;
        }

        return {
            internalFormat,
            format
        };
    }

    /**
     * Test if format can be used as FBO attachment
     * 
     * @private
     * @param {number} internalFormat - Internal format
     * @param {number} format - Format
     * @param {number} type - Data type
     * @returns {boolean} True if format supported
     */
    _supportRenderTextureFormat(internalFormat, format, type) {
        const gl = this.gl;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        // Cleanup
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(texture);

        return status === gl.FRAMEBUFFER_COMPLETE;
    }

    /**
     * Create a texture
     * 
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @param {number} internalFormat - Internal format
     * @param {number} format - Format
     * @param {number} type - Data type
     * @param {number} filter - Filtering mode (LINEAR or NEAREST)
     * @returns {WebGLTexture} Created texture
     */
    createTexture(width, height, internalFormat, format, type, filter) {
        const gl = this.gl;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

        return texture;
    }

    /**
     * Create a framebuffer object
     * 
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {number} internalFormat - Internal format
     * @param {number} format - Format
     * @param {number} type - Data type
     * @param {number} filter - Filtering mode
     * @returns {Object} FBO object { texture, fbo, width, height, attach }
     */
    createFBO(width, height, internalFormat, format, type, filter) {
        const gl = this.gl;

        const texture = this.createTexture(width, height, internalFormat, format, type, filter);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Check framebuffer completeness
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer not complete:', status);
        }

        // Unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {
            texture,
            fbo,
            width,
            height,
            attach(unit) {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return unit;
            }
        };
    }

    /**
     * Create a double FBO for ping-pong rendering
     * 
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {number} internalFormat - Internal format
     * @param {number} format - Format
     * @param {number} type - Data type
     * @param {number} filter - Filtering mode
     * @returns {Object} DoubleFBO { read, write, swap, width, height }
     */
    createDoubleFBO(width, height, internalFormat, format, type, filter) {
        const fbo1 = this.createFBO(width, height, internalFormat, format, type, filter);
        const fbo2 = this.createFBO(width, height, internalFormat, format, type, filter);

        return {
            read: fbo1,
            write: fbo2,
            width,
            height,
            swap() {
                const temp = this.read;
                this.read = this.write;
                this.write = temp;
            }
        };
    }

    /**
     * Resize a double FBO
     * 
     * @param {Object} doubleFBO - Existing double FBO
     * @param {number} width - New width
     * @param {number} height - New height
     * @param {number} internalFormat - Internal format
     * @param {number} format - Format
     * @param {number} type - Data type
     * @param {number} filter - Filtering mode
     * @returns {Object} New double FBO
     */
    resizeDoubleFBO(doubleFBO, width, height, internalFormat, format, type, filter) {
        const gl = this.gl;

        // Delete old FBOs
        if (doubleFBO.read) {
            gl.deleteFramebuffer(doubleFBO.read.fbo);
            gl.deleteTexture(doubleFBO.read.texture);
        }
        if (doubleFBO.write) {
            gl.deleteFramebuffer(doubleFBO.write.fbo);
            gl.deleteTexture(doubleFBO.write.texture);
        }

        // Create new FBOs
        return this.createDoubleFBO(width, height, internalFormat, format, type, filter);
    }

    /**
     * Get resolution based on config value
     * Ensures even dimensions
     * 
     * @param {number} resolution - Desired resolution
     * @returns {Object} {width, height}
     */
    getResolution(resolution) {
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;

        if (aspectRatio < 1) {
            // Portrait
            return {
                width: Math.floor(resolution),
                height: Math.floor(resolution / aspectRatio)
            };
        } else {
            // Landscape
            return {
                width: Math.floor(resolution * aspectRatio),
                height: Math.floor(resolution)
            };
        }
    }

    /**
     * Create obstacle texture from data
     * 
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @param {Float32Array} data - Obstacle mask data (0.0 = fluid, 1.0 = obstacle)
     * @returns {Object} Texture object with attach method
     */
    createObstacleTexture(width, height, data) {
        const gl = this.gl;


        // Choose format based on WebGL version
        // Use R8 for WebGL2 (single channel, 8-bit unsigned normalized)
        // Use RGBA8 for WebGL1 (fallback)
        // NOTE: We explicitly use R8/RGBA8 instead of supportedFormats.formatR
        // because formatR is configured for half-float render targets (R16F),
        // which is incompatible with UNSIGNED_BYTE data
        let internalFormat, format, type;

        if (this.isWebGL2) {
            // WebGL 2: Use R8 format (8-bit single channel)
            internalFormat = gl.R8;
            format = gl.RED;
            type = gl.UNSIGNED_BYTE;
        } else {
            // WebGL 1: Use RGBA8 format (no single channel support)
            internalFormat = gl.RGBA;
            format = gl.RGBA;
            type = gl.UNSIGNED_BYTE;
        }

        const useR8 = this.isWebGL2;

        // Convert Float32Array to Uint8Array
        const uint8Data = new Uint8Array(width * height);
        for (let i = 0; i < data.length; i++) {
            uint8Data[i] = data[i] > 0.5 ? 255 : 0;  // Binary: 0 or 255
        }

        // If using RGBA, expand to 4 channels
        let uploadData = uint8Data;
        if (!useR8) {
            uploadData = new Uint8Array(width * height * 4);
            for (let i = 0; i < uint8Data.length; i++) {
                uploadData[i * 4] = uint8Data[i];      // R channel
                uploadData[i * 4 + 1] = 0;             // G
                uploadData[i * 4 + 2] = 0;             // B
                uploadData[i * 4 + 3] = 255;           // A
            }
        }

        // Create texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // CRITICAL: Set pixel unpack alignment to 1 for single-channel textures
        // WebGL defaults to 4-byte row alignment, but our RED/UNSIGNED_BYTE data
        // is 1 byte per pixel. For widths not divisible by 4 (common with dynamic
        // aspect ratio calculations), we must use 1-byte alignment.
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, uploadData);

        // Restore default alignment for other texture operations
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);

        // DEBUG: Log texture creation details
        console.log(`[TextureManager] Obstacle texture: ${width}x${height}, WebGL${this.isWebGL2 ? '2' : '1'}, format=${useR8 ? 'R8' : 'RGBA'}, dataLength=${uploadData.length}, expected=${width * height * (useR8 ? 1 : 4)}`);

        // DEBUG: Sample a few pixels to verify data integrity
        const samplePixels = [];
        for (let i = 0; i < Math.min(10, uploadData.length); i++) {
            samplePixels.push(uploadData[i]);
        }
        console.log(`[TextureManager] First 10 bytes:`, samplePixels);

        // Return texture object with utility method
        return {
            texture,
            width,
            height,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
            // Compatibility with FBO interface
            read: {
                texture,
                attach(id) {
                    gl.activeTexture(gl.TEXTURE0 + id);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    return id;
                }
            }
        };
    }
}
