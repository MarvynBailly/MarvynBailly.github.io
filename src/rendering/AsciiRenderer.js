/**
 * ASCII Renderer
 *
 * Draws the fluid as text, one glyph per cell, on the GPU.
 *
 * Each frame runs the ordinary display pass into a small offscreen target at
 * 2 x 4 texels per cell, so shading, the palette ramp and bloom all come
 * through, and then the ASCII shader (shaders/fragment/ascii.glsl) reads that
 * back per cell and draws the cell's glyph out of an atlas straight onto the
 * simulation canvas. Nothing comes back to the CPU, so the cost is a couple of
 * full-screen passes whatever the cell size.
 *
 * The atlas is drawn once per grid by the browser's own text renderer, at the
 * size the cells actually are on screen, so a glyph is never scaled.
 *
 * An earlier version handed the text to ascii.rest's canvas player instead.
 * That copies every changed cell individually on the CPU, which at the cell
 * sizes worth looking at cost more than the simulation it was drawing.
 */

import { Program } from '../core/ShaderManager.js';
import { findScheme, sampleGradient } from './asciiSchemes.js';

// Sparse to dense. Glyphs with a strong direction (- = + _) are left out:
// repeated across a region of similar density they read as horizontal
// stripes, which is exactly the structure a swirl does not have. Direction is
// left to the edge strokes, where it means something.
const RAMP = ' .,:;irsxzoaO0#%@';

// Strokes along an edge, in the order the shader indexes them after the ramp
const STROKES = '|\\-/';

// Display samples per cell. A cell is twice as tall as it is wide, so 2 by 4
// keeps the samples square.
const SAMPLES_X = 2;
const SAMPLES_Y = 4;

// How sharply the dye has to change across a cell, as a fraction of the
// visible range, before the cell is drawn as a stroke along that edge instead
// of a density glyph. Below this, dithering and gentle gradients would scatter
// strokes over smooth regions.
const EDGE_THRESHOLD = 0.18;

// Texels a scheme's gradient is sampled into; filtered between, so this only
// has to be enough that the stops land where they were placed.
const GRADIENT_STEPS = 64;

const FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export class AsciiRenderer {
    /**
     * @param {SimulationManager} simulation - Initialised simulation to draw
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.gl = simulation.gl;
        this.active = false;

        this.program = null;
        this.target = null;
        this.atlas = null;

        // One gradient texture per scheme, made the first time it is drawn,
        // so a page showing several schemes at once never re-uploads one
        this.gradients = new Map();
        this.blank = null;

        // Drawing-buffer area the grid was built for
        this.builtWidth = 0;
        this.builtHeight = 0;

        // Held here rather than read from the config: a scene switch resets
        // the config, and would undo the settings controls
        this.cellSize = simulation.config.ASCII_CELL_SIZE;
        this.scheme = findScheme('scene');

        // Everything that depends on the grid, scheme or scene is rebuilt
        // lazily on the next frame, so dragging a slider costs one rebuild per
        // frame rather than one per input event
        this.dirty = true;
    }

    /**
     * Compile the shader and create the textures
     *
     * @returns {Promise<void>}
     */
    async init() {
        const gl = this.gl;
        const sim = this.simulation;

        const response = await fetch('/src/shaders/fragment/ascii.glsl');
        if (!response.ok) throw new Error('Failed to load shader: ascii.glsl');
        const source = await response.text();

        this.program = new Program(
            gl,
            sim.baseVertexShader,
            sim.shaderManager.compileShader(gl.FRAGMENT_SHADER, source)
        );

        this.atlas = this._createTexture();

        // Bound in place of a gradient when a scheme keeps the scene's colours
        this.blank = this._createTexture();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

        // The page's monospace face arrives after first paint; until then the
        // atlas is drawn in a fallback, and redrawn once the real one lands
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => this.refresh());
        }
    }

    /**
     * Draw the simulation as text from the next frame on
     */
    start() {
        this.active = true;
        this.dirty = true;
    }

    /**
     * Go back to drawing the simulation normally
     */
    stop() {
        this.active = false;
        this.simulation.textureManager.deleteFBO(this.target);
        this.target = null;
    }

    /**
     * Rebuild on the next frame: the window, scene or settings changed
     */
    refresh() {
        this.dirty = true;
    }

    /**
     * Change the cell width
     *
     * @param {number} pixels - Cell width in CSS pixels; cells are twice as tall
     */
    setCellSize(pixels) {
        this.cellSize = Math.max(1, pixels);
        this.refresh();
    }

    /**
     * Change the colour scheme
     *
     * @param {string} id - Scheme id from asciiSchemes.js
     */
    setScheme(id) {
        // Colours are bound per draw, so nothing needs rebuilding
        this.scheme = findScheme(id);
    }

    /**
     * Draw one frame to the screen
     */
    render() {
        if (!this.program) return;
        const gl = this.gl;

        this.prepare(gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.sample();
        this.draw(this.scheme, 0, 0);
    }

    /**
     * Size the grid for an area of the drawing buffer
     *
     * Several draws can share one prepared grid: a page showing the same
     * frame in several schemes prepares once for the tile size, samples once,
     * and draws once per tile.
     *
     * @param {number} width - Area width in device pixels
     * @param {number} height - Area height in device pixels
     */
    prepare(width, height) {
        width = Math.max(1, Math.round(width));
        height = Math.max(1, Math.round(height));
        if (this.dirty || width !== this.builtWidth || height !== this.builtHeight) {
            this._build(width, height);
        }
    }

    /**
     * Run the display pass into the sample target, at 2 x 4 texels per cell
     */
    sample() {
        this.simulation.render(this.target);
    }

    /**
     * Draw the sampled frame as text in one scheme
     *
     * By default the whole prepared grid is drawn with its corner at (x, y).
     * Given a smaller area and an offset, only that window onto the grid is
     * drawn, at full size: a crop rather than a thumbnail.
     *
     * @param {Object} scheme - Scheme from asciiSchemes.js
     * @param {number} x - Left edge of the area, device pixels
     * @param {number} y - Bottom edge of the area, device pixels
     * @param {Object} [crop] - { width, height } in device pixels and
     *        { col, row }, the grid cell to put at the area's bottom left
     */
    draw(scheme, x, y, crop = null) {
        const gl = this.gl;
        const sim = this.simulation;
        const config = sim.config;
        const program = this.program;
        const u = program.uniforms;
        const colors = this._schemeColors(scheme);

        program.bind();
        gl.uniform1i(u.uSample, this.target.attach(0));

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.atlas);
        gl.uniform1i(u.uAtlas, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, colors.gradient);
        gl.uniform1i(u.uGradient, 2);

        gl.uniform1i(u.uObstacles, sim.obstacleField.attach(3));
        gl.uniform1f(u.uObstacleRange2, sim.obstacleField.range2);
        gl.uniform1f(u.uShowObstacles, config.SHOW_OBSTACLES ? 1 : 0);

        gl.uniform2f(u.uOrigin, x, y);
        gl.uniform2f(u.uCellOffset, crop ? crop.col : 0, crop ? crop.row : 0);
        gl.uniform2f(u.uSampleSize, this.target.width, this.target.height);
        gl.uniform2f(u.uGrid, this.cols, this.rows);
        gl.uniform2f(u.uCell, this.cellWidth, this.cellHeight);
        gl.uniform2f(u.uGlyphSize, this.glyphWidth, this.glyphHeight);
        gl.uniform2f(u.uAtlasSize, this.atlasWidth, this.atlasHeight);

        gl.uniform1f(u.uRampSteps, RAMP.length);
        gl.uniform1f(u.uFloor, this.floor);
        gl.uniform1f(u.uRange, this.range);
        gl.uniform1f(u.uEdgeThreshold, EDGE_THRESHOLD);

        gl.uniform1f(u.uUseGradient, scheme.stops ? 1 : 0);
        gl.uniform3f(u.uGround, colors.ground.r, colors.ground.g, colors.ground.b);
        gl.uniform3f(u.uEdgeColor, colors.edge.r, colors.edge.g, colors.edge.b);

        sim.fboManager.blit(null, false, {
            x, y,
            width: crop ? crop.width : this.builtWidth,
            height: crop ? crop.height : this.builtHeight
        });
    }

    /**
     * Rebuild the grid, sample target, atlas and brightness range
     *
     * @private
     * @param {number} width - Area width in device pixels
     * @param {number} height - Area height in device pixels
     */
    _build(width, height) {
        this.dirty = false;
        this.builtWidth = width;
        this.builtHeight = height;

        const gl = this.gl;
        const sim = this.simulation;

        // The grid tiles the area exactly: whole columns at the requested
        // width, then whole rows as close to twice that as fits. Cells end up
        // a hair off 1:2, which no one can see, rather than the last row
        // hanging off the bottom, which everyone could.
        const pixelRatio = gl.drawingBufferWidth / Math.max(1, window.innerWidth);

        this.cols = Math.max(1, Math.round(width / (this.cellSize * pixelRatio)));
        this.cellWidth = width / this.cols;
        this.rows = Math.max(1, Math.round(height / (2 * this.cellWidth)));
        this.cellHeight = height / this.rows;

        const sampleWidth = this.cols * SAMPLES_X;
        const sampleHeight = this.rows * SAMPLES_Y;
        if (!this.target || this.target.width !== sampleWidth || this.target.height !== sampleHeight) {
            sim.textureManager.deleteFBO(this.target);
            this.target = sim.textureManager.createFBO(
                sampleWidth, sampleHeight, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST
            );
        }

        this._buildAtlas();
        this._buildRange();
    }

    /**
     * Draw every glyph into one row of padded boxes and upload it
     *
     * @private
     */
    _buildAtlas() {
        const gl = this.gl;
        const glyphs = RAMP + STROKES;

        this.glyphWidth = Math.max(1, Math.ceil(this.cellWidth));
        this.glyphHeight = Math.max(1, Math.ceil(this.cellHeight));
        this.atlasWidth = glyphs.length * (this.glyphWidth + 2);
        this.atlasHeight = this.glyphHeight + 2;

        const canvas = document.createElement('canvas');
        canvas.width = this.atlasWidth;
        canvas.height = this.atlasHeight;
        const ctx = canvas.getContext('2d');

        // A monospace advance is about 0.6em, so this fills the cell's width
        const fontSize = this.glyphWidth / 0.6;
        ctx.font = `${fontSize}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff';

        // Most of the ramp is lowercase, which only fills the middle of a cell
        // twice its width tall. At a readable size that is just how text looks;
        // at a few pixels the empty band between rows is as tall as the glyphs
        // and the picture turns into scan lines. So small cells stretch the
        // glyphs vertically, until the x-height fills most of the cell.
        const xHeight = ctx.measureText('x').actualBoundingBoxAscent || fontSize * 0.5;
        const small = Math.min(1, Math.max(0, (16 - this.glyphHeight) / 8));
        const reach = xHeight + (0.8 * this.glyphHeight - xHeight) * small;
        const stretch = Math.max(1, reach / xHeight);

        // Baseline placed so the stretched x-height sits centred in the box
        const baseline = 1 + this.glyphHeight / 2 + (xHeight * stretch) / 2;

        for (let i = 0; i < glyphs.length; i++) {
            const x = i * (this.glyphWidth + 2) + 1 + this.glyphWidth / 2;
            ctx.setTransform(1, 0, 0, stretch, x, baseline);
            ctx.fillText(glyphs[i], 0, 0);
        }

        // Flipped so the atlas runs bottom up, like gl_FragCoord
        gl.bindTexture(gl.TEXTURE_2D, this.atlas);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    /**
     * Where empty fluid sits and how bright the dye can get, from the scene
     *
     * @private
     */
    _buildRange() {
        const config = this.simulation.config;

        // Empty fluid's brightness: the ramp's first stop on a palette scene,
        // otherwise the page showing through a clear canvas. This is measured
        // against what the display pass draws, so it comes from the scene even
        // when a scheme supplies its own ground.
        this.sceneGround = this._sceneGround();
        this.floor = Math.max(this.sceneGround.r, this.sceneGround.g, this.sceneGround.b);

        // The brightest the dye can show as. A palette scene tops out at its
        // last stop, well short of white, and stretching the ramp to that
        // instead of to 1 is the difference between using all the glyphs and
        // squeezing the whole flow into the bottom two thirds of them.
        const stops = config.PALETTE_RAMP && config.PALETTE_RAMP_COLORS;
        const top = stops ? stops[stops.length - 1] : null;
        this.range = Math.max((top ? Math.max(top.r, top.g, top.b) : 1) - this.floor, 1e-3);
    }

    /**
     * Ground, edge colour and gradient texture for a scheme
     *
     * @private
     * @param {Object} scheme - Scheme from asciiSchemes.js
     * @returns {{gradient: WebGLTexture, ground: Object, edge: Object}} Colours
     */
    _schemeColors(scheme) {
        if (!scheme.stops) {
            return {
                gradient: this.blank,
                ground: this.sceneGround,
                edge: this.simulation.config.OBSTACLE_EDGE
            };
        }

        let colors = this.gradients.get(scheme.id);
        if (!colors) {
            const gl = this.gl;
            const data = new Uint8Array(GRADIENT_STEPS * 4);
            sampleGradient(scheme.stops, GRADIENT_STEPS).forEach((hex, i) => {
                const { r, g, b } = hexToRgb(hex);
                data.set([r * 255, g * 255, b * 255, 255], i * 4);
            });

            const gradient = this._createTexture();
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRADIENT_STEPS, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

            colors = {
                gradient,
                ground: hexToRgb(scheme.ground),
                edge: hexToRgb(scheme.edge || scheme.stops[scheme.stops.length - 1])
            };
            this.gradients.set(scheme.id, colors);
        }
        return colors;
    }

    /**
     * The colour empty fluid shows as in the current scene
     *
     * @private
     * @returns {{r: number, g: number, b: number}} Channels in [0, 1]
     */
    _sceneGround() {
        const config = this.simulation.config;

        if (config.PALETTE_RAMP && config.PALETTE_RAMP_COLORS) {
            return config.PALETTE_RAMP_COLORS[0];
        }

        const channels = (getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g) || []).map(Number);
        if (channels.length >= 3 && channels[3] !== 0) {
            return { r: channels[0] / 255, g: channels[1] / 255, b: channels[2] / 255 };
        }
        return { r: 0, g: 0, b: 0 };
    }

    /**
     * A clamped, linearly filtered texture
     *
     * @private
     * @returns {WebGLTexture} Empty texture
     */
    _createTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }
}

/**
 * @param {string} hex - CSS hex colour, #rrggbb
 * @returns {{r: number, g: number, b: number}} Channels in [0, 1]
 */
function hexToRgb(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return { r, g, b };
}
