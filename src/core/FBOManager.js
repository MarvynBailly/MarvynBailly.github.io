/**
 * FBO Manager
 * 
 * Manages framebuffer operations and full-screen quad rendering.
 * Handles viewport management and blit operations.
 * 
 * References:
 * - architecture.md - FBOManager
 * - technical_analysis.md - GPU Parallelism
 */

export class FBOManager {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     */
    constructor(gl) {
        this.gl = gl;
        this._initQuad();
    }

    /**
     * Initialize full-screen quad for rendering
     * 
     * @private
     */
    _initQuad() {
        const gl = this.gl;

        // Create vertex buffer for full-screen quad
        // Positions: [-1, -1], [-1, 1], [1, 1], [1, -1]
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
            gl.STATIC_DRAW
        );

        // Create element buffer for indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array([0, 1, 2, 0, 2, 3]),
            gl.STATIC_DRAW
        );

        // Set up vertex attribute
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
    }

    /**
     * Render full-screen quad to target FBO or screen
     * 
     * @param {Object|null} target - Target FBO (null for screen)
     * @param {boolean} clear - Whether to clear before rendering
     */
    blit(target = null, clear = false) {
        const gl = this.gl;

        if (target === null) {
            // Render to screen
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            // Render to FBO
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }

        if (clear) {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // Check framebuffer status in debug mode
        // this.checkFramebufferStatus();

        // Draw quad
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * Check framebuffer status (for debugging)
     */
    checkFramebufferStatus() {
        const gl = this.gl;
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer error:', this._getFramebufferStatusString(status));
        }
    }

    /**
     * Get human-readable framebuffer status string
     * 
     * @private
     * @param {number} status - Framebuffer status constant
     * @returns {string} Status string
     */
    _getFramebufferStatusString(status) {
        const gl = this.gl;

        switch (status) {
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
            case gl.FRAMEBUFFER_UNSUPPORTED:
                return 'FRAMEBUFFER_UNSUPPORTED';
            default:
                return `Unknown status: ${status}`;
        }
    }
}
