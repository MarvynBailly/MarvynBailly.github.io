/**
 * Generate dithering texture for bloom
 * Creates blue noise pattern to reduce banding artifacts
 * 
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {WebGLTexture} Dithering texture
 */
export function createDitheringTexture(gl) {
    const size = 128;
    const data = new Uint8Array(size * size);

    // Generate blue noise pattern (simple random for now)
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 255;
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, size, size, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);

    return {
        texture,
        width: size,
        height: size,
        attach(unit) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return unit;
        }
    };
}
