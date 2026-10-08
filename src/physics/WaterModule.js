/**
 * Water Module
 *
 * The surface of a lake, as a height field solved with the wave equation:
 * drop something in and rings spread out, reflect off the shore, cross and
 * interfere, and die away. The display shader reads the field's slope to bend
 * and light the reflection, which is how the waves become visible at all - a
 * lake is seen by what it reflects.
 *
 * The field covers the lake's part of the screen, from the waterline (field
 * y = 0) down to the bottom edge (field y = 1). It is solved on a grid whose
 * cells are wider on screen than they are tall: a ring that is round on the
 * grid is drawn as a flattened ellipse, which is what a ring on water looks
 * like from the shore.
 *
 * References:
 * - shaders/fragment/waveStep.glsl - the solver
 * - shaders/fragment/waveDrop.glsl - disturbances
 * - shaders/fragment/display.glsl - how the field is drawn
 */

/** Grid cells across the screen's width */
const COLUMNS = 320;

/** How tall a cell is on screen, relative to its width: the foreshortening */
const SQUASH = 0.42;

/** Solver steps per frame: sets how fast the rings travel */
const STEPS = 2;

/** c^2 in grid units; under 0.5 for stability */
const SPEED2 = 0.42;

/** Fraction of the surface's motion kept from step to step */
const DAMPING = 0.99;

export class WaterModule {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {Object} programs - Compiled programs, with waveStep and waveDrop
     * @param {FBOManager} fboManager - Draws full-screen passes
     * @param {TextureManager} textureManager - Makes framebuffers
     * @param {boolean} linear - Whether float textures can be filtered
     */
    constructor(gl, programs, fboManager, textureManager, linear) {
        this.gl = gl;
        this.programs = programs;
        this.fboManager = fboManager;
        this.textureManager = textureManager;
        this.filter = linear ? gl.LINEAR : gl.NEAREST;
        this.field = null;
        this.untilNext = 0;
    }

    /**
     * Now and then, something touches the water by itself
     *
     * An insect, a fish rising, a drip from a branch: small rings at random
     * places and random moments - the gaps are drawn from an exponential
     * distribution, so they come at an average rate but never in a rhythm.
     * More land further out, where most of the lake's surface is.
     *
     * @param {number} dt - Step, seconds
     * @param {number} rate - Average rings per second; 0 for none
     */
    ambient(dt, rate) {
        if (!rate || !this.field) return;
        this.untilNext -= dt;
        while (this.untilNext <= 0) {
            this.untilNext += -Math.log(1 - Math.random()) / rate;
            this.drop(
                Math.random(),
                0.03 + 0.9 * Math.pow(Math.random(), 1.4),
                0.12 + Math.random() * 0.15,
                1.3 + Math.random() * 0.6
            );
        }
    }

    /**
     * Make sure the field fits the current lake
     *
     * @param {number} screenWidth - Drawing buffer width, pixels
     * @param {number} screenHeight - Drawing buffer height, pixels
     * @param {number} waterline - Screen height of the surface, 0 to 1
     */
    fit(screenWidth, screenHeight, waterline) {
        const lakeHeight = Math.max(1, waterline * screenHeight);
        const rows = Math.max(8, Math.round(COLUMNS * lakeHeight / (SQUASH * screenWidth)));

        if (this.field && this.field.width === COLUMNS && this.field.height === rows) return;

        const tm = this.textureManager;
        const rg = tm.supportedFormats.formatRG;
        if (this.field) tm.deleteDoubleFBO(this.field);
        this.field = tm.createDoubleFBO(COLUMNS, rows, rg.internalFormat, rg.format, tm.halfFloatTexType, this.filter);
    }

    /**
     * Advance the surface by one frame
     */
    step() {
        if (!this.field) return;
        const gl = this.gl;
        const program = this.programs.waveStep;

        for (let i = 0; i < STEPS; i++) {
            program.bind();
            gl.uniform2f(program.uniforms.texelSize, 1 / this.field.width, 1 / this.field.height);
            gl.uniform1i(program.uniforms.uField, this.field.read.attach(0));
            gl.uniform1f(program.uniforms.uSpeed2, SPEED2);
            gl.uniform1f(program.uniforms.uDamping, DAMPING);
            this.fboManager.blit(this.field.write);
            this.field.swap();
        }
    }

    /**
     * Drop something into the lake
     *
     * @param {number} x - Across the screen, 0 to 1
     * @param {number} depth - Down from the waterline to the bottom of the screen, 0 to 1
     * @param {number} amount - Depth of the dent; bigger is a bigger splash
     * @param {number} [radius] - Size of the dent, grid cells
     */
    drop(x, depth, amount, radius = 2.5) {
        if (!this.field) return;
        const gl = this.gl;
        const program = this.programs.waveDrop;

        program.bind();
        gl.uniform1i(program.uniforms.uField, this.field.read.attach(0));
        gl.uniform2f(program.uniforms.uGrid, this.field.width, this.field.height);
        gl.uniform2f(program.uniforms.point, x, depth);
        gl.uniform1f(program.uniforms.radius, radius);
        gl.uniform1f(program.uniforms.amount, -amount);
        this.fboManager.blit(this.field.write);
        this.field.swap();
    }
}
