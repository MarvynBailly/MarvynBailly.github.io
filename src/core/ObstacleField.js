/**
 * Obstacle Field
 *
 * GPU-side home for the obstacle distance field produced by ObstacleManager.
 *
 * The instance is created once and mutated in place: modules capture it at
 * construction and keep reading the current field through it, so a window
 * resize or a preset change cannot leave a module pointing at a texture that
 * has been replaced. It also carries the few derived numbers the boundary
 * shaders need, which all come from how the field was encoded.
 *
 * References:
 * - core/ObstacleManager.js - field encoding
 */

export class ObstacleField {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {boolean} isWebGL2 - Whether WebGL2 is in use
     */
    constructor(gl, isWebGL2) {
        this.gl = gl;
        this.isWebGL2 = isWebGL2;

        this.width = 0;
        this.height = 0;
        this.range = 1;      // Distance stored either side of a surface, texels
        this.texelsPerCell = 1;  // Field texels per simulation cell

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Linear filtering is what makes the field useful between texels: a
        // distance field is locally linear, so interpolation reconstructs the
        // surface exactly rather than blurring a staircase.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    /**
     * Upload a field, reallocating the texture only when the size changes
     *
     * @param {number} width - Field width in texels
     * @param {number} height - Field height in texels
     * @param {Uint8Array} data - Encoded field, one byte per texel
     * @param {Object} [options] - { range, texelsPerCell }
     */
    upload(width, height, data, options = {}) {
        const gl = this.gl;

        if (options.range) this.range = options.range;
        if (options.texelsPerCell) this.texelsPerCell = options.texelsPerCell;

        const format = this.isWebGL2 ? gl.RED : gl.RGBA;
        const internalFormat = this.isWebGL2 ? gl.R8 : gl.RGBA;
        const payload = this.isWebGL2 ? data : expandToRGBA(data);

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Single-channel rows are 1-byte aligned; WebGL defaults to 4 and the
        // field width follows the window, so it is regularly not a multiple of 4.
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        if (width !== this.width || height !== this.height) {
            this.width = width;
            this.height = height;
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0,
                format, gl.UNSIGNED_BYTE, payload);
        } else {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height,
                format, gl.UNSIGNED_BYTE, payload);
        }

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    }

    /**
     * Upload one rectangle of a field, leaving the rest of the texture alone
     *
     * A moving body rewrites a few thousand texels a frame out of a few
     * hundred thousand. Sending the whole field for that is most of a megabyte
     * of bus traffic per frame to deliver a hull, so the caller reports the
     * region it touched and only that region is sent.
     *
     * The rows have to be packed tight either way - WebGL1 has no
     * UNPACK_ROW_LENGTH to stride over the full field with - so the scratch
     * buffer that does it is kept and regrown rather than reallocated.
     *
     * @param {{x: number, y: number, width: number, height: number}} rect - Region in texels
     * @param {Uint8Array} data - The full field the region is read out of
     * @param {number} fieldWidth - Row stride of `data`, in texels
     */
    uploadRect(rect, data, fieldWidth) {
        const gl = this.gl;
        const { x, y, width, height } = rect;

        if (width <= 0 || height <= 0) return;

        // A region outside the allocated texture would be an INVALID_VALUE and
        // is a sign the field was resized without the texture following.
        if (this.width === 0 || x < 0 || y < 0 ||
            x + width > this.width || y + height > this.height) {
            return;
        }

        const channels = this.isWebGL2 ? 1 : 4;
        const needed = width * height * channels;

        if (!this.scratch || this.scratch.length < needed) {
            this.scratch = new Uint8Array(needed);
        }
        const scratch = this.scratch;

        if (this.isWebGL2) {
            for (let j = 0; j < height; j++) {
                const start = (y + j) * fieldWidth + x;
                scratch.set(data.subarray(start, start + width), j * width);
            }
        } else {
            for (let j = 0; j < height; j++) {
                const start = (y + j) * fieldWidth + x;
                let out = j * width * 4;
                for (let i = 0; i < width; i++) {
                    scratch[out] = data[start + i];
                    scratch[out + 3] = 255;
                    out += 4;
                }
            }
        }

        const format = this.isWebGL2 ? gl.RED : gl.RGBA;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height,
            format, gl.UNSIGNED_BYTE, scratch.subarray(0, needed));
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    }

    /**
     * Bind to a texture unit
     *
     * @param {number} unit - Texture unit index
     * @returns {number} The same unit, for uniform1i
     */
    attach(unit) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        return unit;
    }

    /**
     * Full width of the stored distance range, in texels
     *
     * Shaders decode with `distance = (0.5 - stored) * range2`.
     *
     * @returns {number} 2 * range
     */
    get range2() {
        return 2 * this.range;
    }

    /**
     * Stored value at the outer edge of the wall-influence band
     *
     * Boundary shaders fade their corrections in over the last `bandCells`
     * simulation cells before a surface; comparing against a stored value keeps
     * that test to a single texture read.
     *
     * @param {number} bandCells - Band width in simulation cells
     * @returns {number} Encoded value where the band begins
     */
    bandThreshold(bandCells) {
        return 0.5 - (bandCells * this.texelsPerCell) / this.range2;
    }

    /**
     * Release GPU resources
     */
    destroy() {
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
            this.texture = null;
        }
    }
}

/**
 * Expand a single-channel field to RGBA for WebGL1, which has no R8 format
 *
 * @param {Uint8Array} data - Single channel data
 * @returns {Uint8Array} RGBA data
 */
function expandToRGBA(data) {
    const out = new Uint8Array(data.length * 4);
    for (let i = 0; i < data.length; i++) {
        out[i * 4] = data[i];
        out[i * 4 + 3] = 255;
    }
    return out;
}
