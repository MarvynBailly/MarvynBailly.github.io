/**
 * Display Module
 * 
 * Handles final rendering to screen with optional visual effects.
 * 
 * References:
 * - architecture.md - DisplayModule
 * - technical_analysis.md - Display Shader
 */

export class DisplayModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Material} displayMaterial - Display material with keyword support
     * @param {FBOManager} fboManager - FBO manager
     */
    constructor(gl, displayMaterial, fboManager) {
        this.gl = gl;
        this.displayMaterial = displayMaterial;
        this.fboManager = fboManager;
    }

    /**
     * Render to screen
     * 
     * @param {Object} dye - Dye FBO to display
     * @param {Object} options - Display options
     * @param {boolean} options.shading - Enable shading
     * @param {boolean} options.bloom - Enable bloom
     * @param {boolean} options.sunrays - Enable sunrays
     * @param {boolean} options.showObstacles - Enable obstacle rendering
     * @param {Object} options.bloomTexture - Bloom texture (if bloom enabled)
     * @param {Object} options.sunraysTexture - Sunrays texture (if sunrays enabled)
     * @param {ObstacleField} options.obstacleField - Obstacle distance field
     * @param {Object} options.obstacleFill - Obstacle body color {r, g, b}
     * @param {Object} options.obstacleEdge - Obstacle contour color {r, g, b}
     * @param {Object} options.ditheringTexture - Dithering texture
     */
    render(dye, options = {}) {
        const gl = this.gl;

        // Build keyword list based on enabled features
        const keywords = [];
        if (options.shading) keywords.push('SHADING');
        if (options.bloom && options.bloomTexture) keywords.push('BLOOM');
        if (options.sunrays && options.sunraysTexture) keywords.push('SUNRAYS');
        if (options.showObstacles && options.obstacleField) keywords.push('SHOW_OBSTACLES');
        if (options.paletteRamp) keywords.push('PALETTE_RAMP');

        // Set material keywords (compiles variant if needed)
        this.displayMaterial.setKeywords(keywords);
        this.displayMaterial.bind();

        // Bind main dye texture
        gl.uniform1i(this.displayMaterial.uniforms.uTexture, dye.attach(0));

        // Bind optional textures
        if (options.bloom && options.bloomTexture) {
            gl.uniform1i(this.displayMaterial.uniforms.uBloom, options.bloomTexture.attach(1));
        }

        if (options.sunrays && options.sunraysTexture) {
            gl.uniform1i(this.displayMaterial.uniforms.uSunrays, options.sunraysTexture.attach(2));
        }

        if (options.ditheringTexture) {
            gl.uniform1i(this.displayMaterial.uniforms.uDithering, options.ditheringTexture.attach(3));
            gl.uniform2f(
                this.displayMaterial.uniforms.ditherScale,
                gl.canvas.width / options.ditheringTexture.width,
                gl.canvas.height / options.ditheringTexture.height
            );
        }

        // Bind the obstacle field, its colors, and the numbers the shader needs
        // to turn stored distance into device pixels
        if (options.showObstacles && options.obstacleField) {
            const field = options.obstacleField;
            const fill = options.obstacleFill;
            const edge = options.obstacleEdge;

            gl.uniform1i(this.displayMaterial.uniforms.uObstacles, field.attach(4));
            gl.uniform3f(this.displayMaterial.uniforms.uObstacleFill, fill.r, fill.g, fill.b);
            gl.uniform3f(this.displayMaterial.uniforms.uObstacleEdge, edge.r, edge.g, edge.b);
            gl.uniform2f(
                this.displayMaterial.uniforms.uObstacleParams,
                field.range2,
                gl.drawingBufferHeight / field.height
            );
        }

        // Palette ramp stops, darkest first
        if (options.paletteRamp && options.rampColors) {
            options.rampColors.slice(0, 4).forEach((stop, i) => {
                const location = this.displayMaterial.uniforms[`uRamp${i}`];
                if (location) gl.uniform3f(location, stop.r, stop.g, stop.b);
            });
        }

        // Set texel size for shading
        gl.uniform2f(
            this.displayMaterial.uniforms.texelSize,
            1.0 / dye.width,
            1.0 / dye.height
        );

        // Render to screen (null = default framebuffer)
        this.fboManager.blit(null);
    }
}
