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

        // WebGL only promises eight texture units to a fragment shader, and
        // the landscape with wind-blown trees needs a ninth. Most hardware has
        // sixteen; where it does not, the trees simply stand still.
        this.textureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
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
     * @param {Object} [options.target] - FBO to draw into instead of the screen
     * @param {Object} [options.reflection] - Water below a line, reflecting the
     *        scene: { waterline (screen height, 0 to 1), color {r, g, b},
     *        reflectivity, ripple, time }
     */
    render(dye, options = {}) {
        const gl = this.gl;

        // Pixel-scaled effects (dithering, the obstacle contour) are measured
        // against whatever is being drawn into, not against the screen
        const target = options.target || null;
        const targetWidth = target ? target.width : gl.drawingBufferWidth;
        const targetHeight = target ? target.height : gl.drawingBufferHeight;

        // Build keyword list based on enabled features
        const keywords = [];
        if (options.shading) keywords.push('SHADING');
        if (options.bloom && options.bloomTexture) keywords.push('BLOOM');
        if (options.sunrays && options.sunraysTexture) keywords.push('SUNRAYS');
        if (options.showObstacles && options.obstacleField) keywords.push('SHOW_OBSTACLES');
        if (options.paletteRamp) keywords.push('PALETTE_RAMP');
        if (options.paletteRamp && options.smoke) keywords.push('SMOKE');
        if (options.reflection) keywords.push('REFLECTION');
        if (options.reflection && options.reflection.waves) keywords.push('WAVES');
        if (options.landscape) keywords.push('LANDSCAPE');
        const treeWind = options.landscape && options.landscape.sway && this.textureUnits > 8;
        if (treeWind) keywords.push('TREE_WIND');

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
                targetWidth / options.ditheringTexture.width,
                targetHeight / options.ditheringTexture.height
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
                targetHeight / field.height
            );
        }

        // Palette ramp stops, darkest first
        if (options.paletteRamp && options.rampColors) {
            options.rampColors.slice(0, 4).forEach((stop, i) => {
                const location = this.displayMaterial.uniforms[`uRamp${i}`];
                if (location) gl.uniform3f(location, stop.r, stop.g, stop.b);
            });
        }

        // Water below a waterline, reflecting what is above it
        if (options.reflection) {
            const water = options.reflection;
            const u = this.displayMaterial.uniforms;
            gl.uniform1f(u.uWaterline, water.waterline);
            gl.uniform3f(u.uWaterColor, water.color.r, water.color.g, water.color.b);
            gl.uniform1f(u.uReflectivity, water.reflectivity);
            gl.uniform1f(u.uRipple, water.ripple);
            gl.uniform1f(u.uTime, water.time);
            gl.uniform1f(u.uAspect, targetWidth / targetHeight);
            gl.uniform1f(u.uFirelight, water.firelight || 0);
            gl.uniform1f(u.uSwell, water.swell || 0);

            if (water.waves) {
                gl.uniform1i(u.uWaves, water.waves.read.attach(5));
                gl.uniform2f(u.uWaveTexel, 1 / water.waves.width, 1 / water.waves.height);
                gl.uniform1f(u.uWaveStrength, water.waveStrength);
            }
        }

        // A painted landscape behind the fluid
        if (options.landscape) {
            const land = options.landscape;
            const u = this.displayMaterial.uniforms;
            gl.activeTexture(gl.TEXTURE6);
            gl.bindTexture(gl.TEXTURE_2D, land.texture);
            gl.uniform1i(u.uLandscape, 6);
            gl.activeTexture(gl.TEXTURE7);
            gl.bindTexture(gl.TEXTURE_2D, land.trees);
            gl.uniform1i(u.uTrees, 7);
            gl.uniform2f(u.uTreeBand, land.treeBand.bottom, land.treeBand.top);
            gl.uniform1f(u.uShore, land.shore);
            gl.uniform1f(u.uTreeHeight, land.treeHeight);

            if (treeWind) {
                gl.uniform1i(u.uSway, land.sway.attach(8));
            }
        }

        // Set texel size for shading
        gl.uniform2f(
            this.displayMaterial.uniforms.texelSize,
            1.0 / dye.width,
            1.0 / dye.height
        );

        // Render to the target, or the screen (null = default framebuffer)
        this.fboManager.blit(target);
    }
}
