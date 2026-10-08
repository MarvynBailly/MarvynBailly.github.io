/**
 * Forest Fire
 *
 * The pines on the shore can catch fire, burn down, and in time grow back.
 *
 * Catching is physical. A few times a second the flame in the air across the
 * treeline is read back from the dye field, and a tree that stands in enough
 * of it for long enough ignites - whether the heat came from the pointer held
 * at the trees, from flames the wind has blown over them, or from the tree
 * next door. While it warms it smokes, so a tree about to go up gives itself
 * away. Burning trees warm their neighbours directly too, so a fire runs along
 * the forest rather than waiting for the wind to carry it.
 *
 * A burning tree is on fire in its own shape. Every burning canopy is drawn
 * into a mask, as bright as that tree is burning, and the mask feeds heat and
 * lift into the simulation in one pass a frame - so the flames rise off the
 * branches themselves, and flicker across them, rather than sitting in a ball
 * in front of the tree. The canopy glows like embers as it chars.
 *
 * While a fire is small it can be blown out. A gust from the pointer douses
 * the burning trees it passes over - more for a faster swipe and a closer
 * pass - and divided by the size of the fire they belong to, so a lone tree
 * goes out with a swipe or two, a fire of a handful takes work, and one that
 * has run along the forest is past saving. A tree's flames weaken as it is
 * doused; put out, it goes up in a puff of smoke, and survives scorched.
 *
 * Each tree's life is a small state machine:
 *
 *   alive --(heat >= its threshold)--> burning --(BURN_TIME)--> burnt
 *         <--(REGROW_TIME)-- growing <--(REGROW_DELAY)--
 *
 * and its `char`, 0 to 1, is how burnt it looks; Landscape.redrawTrees()
 * draws that, with `glow` for the embers.
 *
 * References:
 * - rendering/Landscape.js - the trees, and how a burning one is drawn
 * - shaders/fragment/heatSample.glsl - the readback
 * - shaders/fragment/source.glsl - how the mask feeds the fire
 */

import { pine } from '../rendering/Landscape.js';

/** Readback grid across the treeline */
const COLUMNS = 192;
const ROWS = 12;

/** Seconds between readbacks: often enough to catch, rare enough to be cheap */
const SAMPLE_EVERY = 0.08;

/** Flame in the air, as read back (half the dye value), a tree starts to warm in */
const KINDLING = 0.2;

/** How fast a tree in flame warms toward catching, per unit of excess per second */
const WARMING = 3.2;

/** How fast a tree cools back down when the flame around it goes, per second */
const COOLING = 0.3;

/** Seconds between any two trees catching. The pointer's heat warms a dozen
 * trees at once, and without this they all went up together the moment the
 * first one caught; with it a fire starts at one tree and grows. */
const CATCH_GAP = 0.35;

/** Seconds a tree burns for */
const BURN_TIME = 13;

/** How far a burning tree's warmth reaches its neighbours, screen widths */
const REACH = 0.024;

/** How fast a neighbour within reach warms, per second, at the burning tree's peak */
const SPREAD = 0.42;

/** Seconds a burnt tree smoulders, stands dead, and then takes to grow back */
const SMOULDER = 8;
const REGROW_DELAY = 45;
const REGROW_TIME = 20;

/** Flame fed per frame from a fully burning canopy, and the lift with it */
const FLAME_HEAT = 0.035;
const FLAME_LIFT = 1.6;

/** Most trees giving off smoke at once, as splats */
const MAX_SMOKERS = 24;

/** How close a gust must pass to a burning tree to douse it, screen heights */
const GUST_REACH = 0.12;

/** Slowest a pointer can move and still count as a gust, screen heights per second */
const GUST_FLOOR = 0.25;

/** How much a gust douses, per unit of speed above the floor, per second */
const DOUSING = 7;

/** How much harder each extra tree in a fire makes it: dousing is divided by
 * the fire's size to this power. At 1.5 a fire of four takes eight times the
 * effort of one tree, and a fire of ten over thirty. */
const STUBBORNNESS = 1.5;

/** Neighbouring burning trees within this distance are one fire, screen widths */
const SAME_FIRE = 0.035;

/** Seconds a tree that was put out stays too damp to catch again */
const DAMP = 6;

/** Height of the fire mask, pixels; its width follows the window's shape */
const MASK_HEIGHT = 384;

const FLAME = { r: 1.0, g: 0.52, b: 0.16 };
const SMOKE = { r: 0.30, g: 0.31, b: 0.36 };

export class ForestFire {
    /**
     * @param {SimulationManager} simulation - The simulation, with its landscape
     */
    constructor(simulation) {
        this.simulation = simulation;
        this.target = null;
        this.pixels = null;
        this.sinceSample = SAMPLE_EVERY;
        this.sinceCatch = CATCH_GAP;
        this.sinceRedraw = 0;
        this.dirty = false;
        this.frame = 0;

        this.mask = null;
        this.maskCanvas = null;
        this.burning = 0;
    }

    /**
     * Advance every tree by one step
     *
     * @param {number} dt - Step, seconds
     */
    update(dt) {
        const sim = this.simulation;
        const land = sim.landscape;
        const forest = land.forest;
        if (!forest.length) return;

        this.frame++;
        this.sinceCatch += dt;
        this.sinceSample += dt;
        if (this.sinceSample >= SAMPLE_EVERY) {
            this._sample();
            this._warm(this.sinceSample);
            this.sinceSample = 0;
        }

        this._douse(dt);

        let burning = 0;
        for (const tree of forest) {
            if (tree.damp > 0) tree.damp -= dt;
            if (tree.puff > 0) tree.puff = Math.max(0, tree.puff - dt * 0.6);

            if (tree.state === 'burning') {
                burning++;
                tree.time += dt;
                const burn = Math.min(1, tree.time / BURN_TIME);
                // Flames weaken as the tree is doused
                tree.strength = this._strength(burn) * (1 - 0.75 * (tree.doused || 0));
                // Embers: brightest at the height of the blaze, never steady
                tree.glow = tree.strength * (0.45 + 0.2 * Math.random());
                this._setChar(tree, burn);
                this._spread(tree, tree.strength, dt);
                if (burn >= 1) {
                    tree.state = 'burnt';
                    tree.time = 0;
                    tree.heat = 0;
                    tree.strength = 0;
                    tree.glow = 0;
                    this.dirty = true;
                }
            } else if (tree.state === 'burnt') {
                tree.time += dt;
                if (tree.time >= REGROW_DELAY) {
                    tree.state = 'growing';
                    tree.time = 0;
                }
            } else if (tree.state === 'growing') {
                tree.time += dt;
                this._setChar(tree, Math.max(0, 1 - tree.time / REGROW_TIME));
                if (tree.char <= 0) {
                    tree.state = 'alive';
                    tree.heat = 0;
                }
            }
        }

        this._smoke();

        // While anything burns the trees and the fire's mask are redrawn ten
        // times a second, for the embers' flicker; otherwise only on a change
        this.sinceRedraw += dt;
        if ((this.dirty || burning > 0 || this.burning > 0) && this.sinceRedraw >= 0.1) {
            land.redrawTrees();
            this._drawMask();
            this.dirty = false;
            this.sinceRedraw = 0;
            this.burning = burning;
        }

        if (this.burning > 0) this._feed();
    }

    /**
     * How fiercely a tree burns through its burn: it takes hold slowly over
     * the first third, blazes, and dies down as the canopy runs out
     *
     * @private
     */
    _strength(burn) {
        const ramp = Math.min(1, burn * 3);
        return ramp * ramp * (3 - 2 * ramp) * Math.pow(1 - burn, 0.6);
    }

    /**
     * Set how burnt a tree looks, marking the trees for a redraw when it shows
     *
     * @private
     */
    _setChar(tree, char) {
        const before = Math.round(tree.char * 20);
        tree.char = char;
        if (Math.round(char * 20) !== before) this.dirty = true;
    }

    /**
     * Read back the flame in the air across the treeline
     *
     * @private
     */
    _sample() {
        const sim = this.simulation;
        const gl = sim.gl;
        const band = sim.landscape.treeBand;

        if (!this.target) {
            this.target = sim.textureManager.createFBO(COLUMNS, ROWS, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
            this.pixels = new Uint8Array(COLUMNS * ROWS * 4);
        }

        const program = sim.programs.heatSample;
        program.bind();
        gl.uniform1i(program.uniforms.uTexture, sim.dye.read.attach(0));
        gl.uniform4f(program.uniforms.uRect, 0, band.bottom, 1, band.top);
        sim.fboManager.blit(this.target);
        gl.readPixels(0, 0, COLUMNS, ROWS, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * The most flame around a tree's canopy, as read back
     *
     * @private
     */
    _heatAround(tree) {
        const band = this.simulation.landscape.treeBand;
        const span = band.top - band.bottom;
        const c0 = Math.max(0, Math.floor(tree.box.x0 * COLUMNS));
        const c1 = Math.min(COLUMNS - 1, Math.ceil(tree.box.x1 * COLUMNS));
        const r0 = Math.max(0, Math.floor((tree.box.y0 - band.bottom) / span * ROWS));
        const r1 = Math.min(ROWS - 1, Math.ceil((tree.box.y1 - band.bottom) / span * ROWS));

        let hottest = 0;
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                hottest = Math.max(hottest, this.pixels[(r * COLUMNS + c) * 4]);
            }
        }
        return hottest / 255;
    }

    /**
     * Warm the living trees by the flame around them; one hot enough catches
     *
     * @private
     */
    _warm(elapsed) {
        for (const tree of this.simulation.landscape.forest) {
            if (tree.state !== 'alive') continue;
            const excess = this._heatAround(tree) - KINDLING;
            tree.heat = Math.max(0, tree.heat + (excess > 0 ? excess * WARMING : -COOLING) * elapsed);
            if (tree.heat >= this._threshold(tree)) this._ignite(tree);
        }
    }

    /**
     * How much heat a tree takes to catch: a little different for every tree,
     * so neighbours in the same heat go up one after another, not together
     *
     * @private
     */
    _threshold(tree) {
        if (tree.threshold === undefined) {
            const h = Math.sin(tree.x * 12.9898 + tree.tall * 78.233) * 43758.5453;
            tree.threshold = 0.8 + 0.7 * (h - Math.floor(h));
        }
        return tree.threshold;
    }

    /**
     * A burning tree warms the living trees near it
     *
     * @private
     */
    _spread(burning, strength, dt) {
        const x = (burning.box.x0 + burning.box.x1) / 2;
        for (const tree of this.simulation.landscape.forest) {
            if (tree.state !== 'alive') continue;
            const distance = Math.abs((tree.box.x0 + tree.box.x1) / 2 - x);
            if (distance >= REACH) continue;
            tree.heat += SPREAD * strength * (1 - distance / REACH) * dt;
            if (tree.heat >= this._threshold(tree)) this._ignite(tree);
        }
    }

    /**
     * @private
     */
    _ignite(tree) {
        if (this.sinceCatch < CATCH_GAP || tree.damp > 0) return;
        this.sinceCatch = 0;
        tree.state = 'burning';
        tree.time = 0;
        tree.strength = 0;
        tree.doused = 0;
        this.dirty = true;
    }

    /**
     * Blow on the fire: every gust the pointer made this frame douses the
     * burning trees near it, the harder the bigger the fire they are part of
     *
     * @private
     */
    _douse(dt) {
        const sim = this.simulation;
        const gusts = sim.interactionManager.gusts;
        const burning = sim.landscape.forest.filter((tree) => tree.state === 'burning');
        if (!burning.length) return;

        // Group the burning trees into fires: neighbours along the shore
        burning.sort((a, b) => a.box.x0 - b.box.x0);
        let fire = [];
        const fires = [fire];
        for (let i = 0; i < burning.length; i++) {
            if (i > 0 && burning[i].box.x0 - burning[i - 1].box.x1 > SAME_FIRE) {
                fire = [];
                fires.push(fire);
            }
            fire.push(burning[i]);
        }
        for (const group of fires) for (const tree of group) tree.fireSize = group.length;

        // Dousing fades back if the blowing stops before the tree goes out
        for (const tree of burning) tree.doused = Math.max(0, (tree.doused || 0) - 0.15 * dt);
        if (!gusts.length || !dt) return;

        const aspect = sim.aspectRatio;
        for (const gust of gusts) {
            const speed = gust.speed / dt;
            if (speed <= GUST_FLOOR) continue;
            for (const tree of burning) {
                const cx = (tree.box.x0 + tree.box.x1) / 2;
                const cy = (tree.box.y0 + tree.box.y1) / 2;
                const distance = Math.hypot((gust.x - cx) * aspect, gust.y - cy);
                if (distance >= GUST_REACH) continue;
                const near = 1 - distance / GUST_REACH;
                tree.doused += DOUSING * (speed - GUST_FLOOR) * near * dt / Math.pow(tree.fireSize, STUBBORNNESS);
                if (tree.doused >= 1) this._putOut(tree);
            }
        }
    }

    /**
     * A tree blown out: a puff of smoke, and it lives - scorched, growing
     * back what it lost, and too damp to catch again for a while
     *
     * @private
     */
    _putOut(tree) {
        tree.state = 'growing';
        tree.time = (1 - tree.char) * REGROW_TIME;
        tree.heat = 0;
        tree.doused = 0;
        tree.strength = 0;
        tree.glow = 0;
        tree.damp = DAMP;
        tree.puff = 1;
        this.dirty = true;
    }

    /**
     * Smoke from the trees: thin wisps off one that is warming, heavier as it
     * nears catching; a little off the top of one that is burning; and a
     * thread from a fresh stump while it smoulders out
     *
     * @private
     */
    _smoke() {
        const sim = this.simulation;
        let smokers = 0;

        for (let i = 0; i < sim.landscape.forest.length && smokers < MAX_SMOKERS; i++) {
            const tree = sim.landscape.forest[i];
            let amount = 0;
            let height = 1;

            if (tree.puff > 0) {
                amount = 1.2 * tree.puff;
                height = 0.7;
            } else if (tree.state === 'alive' && tree.heat > 0.05) {
                amount = 0.5 * Math.min(1, tree.heat / this._threshold(tree));
            } else if (tree.state === 'burning') {
                amount = 0.35 * tree.strength;
                height = 1 - 0.7 * tree.char;
            } else if (tree.state === 'burnt' && tree.time < SMOULDER) {
                amount = 0.3 * (1 - tree.time / SMOULDER);
                height = 0.45;
            }
            if (amount <= 0) continue;
            smokers++;

            // Every third frame, staggered between trees, tripled to make up
            if ((this.frame + i) % 3 !== 0) continue;

            const box = tree.box;
            const x = (box.x0 + box.x1) / 2 + (Math.random() - 0.5) * (box.x1 - box.x0) * 0.3;
            const y = box.y0 + (box.y1 - box.y0) * height;
            const size = Math.max(0.000015, Math.pow(box.y1 - box.y0, 2) * 0.025);
            const dose = 3 * 0.12 * amount;

            sim.forcesModule.applyColorSplat(sim.dye, x, y,
                { r: SMOKE.r * dose, g: SMOKE.g * dose, b: SMOKE.b * dose }, size, sim.aspectRatio);
            sim.forcesModule.applySplat(sim.velocity, x, y, 0, 8 * amount, size * 2, sim.aspectRatio);
        }
    }

    /**
     * Draw every burning canopy into the fire mask, as bright as it burns
     *
     * @private
     */
    _drawMask() {
        const sim = this.simulation;
        const land = sim.landscape;
        const height = MASK_HEIGHT;
        const width = Math.max(1, Math.round(height * sim.aspectRatio));

        if (!this.maskCanvas || this.maskCanvas.width !== width || this.maskCanvas.height !== height) {
            this.maskCanvas = document.createElement('canvas');
            this.maskCanvas.width = width;
            this.maskCanvas.height = height;
        }
        const g = this.maskCanvas.getContext('2d');
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#000';
        g.fillRect(0, 0, width, height);
        g.globalCompositeOperation = 'lighter';

        for (const tree of land.forest) {
            if (tree.state !== 'burning' || !tree.strength) continue;
            const v = Math.round(255 * Math.min(1, tree.strength));
            g.fillStyle = `rgb(${v}, ${v}, ${v})`;

            // The same shape as the canopy is drawn, in the mask's pixels:
            // shrinking as the tree burns down
            const box = tree.box;
            const x = (box.x0 + box.x1) / 2 * width;
            const base = (1 - box.y0) * height;
            const tall = (box.y1 - box.y0) * height;
            const across = (box.x1 - box.x0) * width;
            pine(g, x, base, tall * (1 - 0.8 * tree.char), across * (1 - 0.6 * tree.char));
        }

        this.mask = sim.sceneManager.context.mask(this.maskCanvas, this.mask);
    }

    /**
     * Feed the fire from the mask: flame across every burning canopy, with a
     * fine flicker so it licks and gutters over the branches
     *
     * @private
     */
    _feed() {
        const sim = this.simulation;
        if (!this.mask) return;
        const time = sim.time || 0;
        sim.forcesModule.applySource(sim.velocity, this.mask, { r: 0, g: FLAME_LIFT, b: 0 }, sim.aspectRatio,
            { time, flicker: 0.5, grain: 70 });
        sim.forcesModule.applySource(sim.dye, this.mask,
            { r: FLAME.r * FLAME_HEAT, g: FLAME.g * FLAME_HEAT, b: FLAME.b * FLAME_HEAT }, sim.aspectRatio,
            { time, flicker: 0.9, grain: 70 });
    }
}
