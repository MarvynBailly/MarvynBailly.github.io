/**
 * Landscape
 *
 * A night scene behind the fluid: a starry sky, and a forest of pines on a
 * low strip of far shore. Painted once with the browser's 2D canvas and handed to the display
 * shader as two textures - the sky, and the trees on their own - so it costs
 * nothing per frame beyond a few lookups.
 *
 * The trees are kept apart because they move: the display shader reads the
 * simulation's wind at canopy height and bends each one by it, tops more than
 * trunks, so they lean in the breeze and whip about when the pointer sweeps
 * past. Baked into the scenery they could not.
 *
 * Everything is anchored to the waterline: the trees stand on it, so their
 * reflections meet them exactly at the surface. Below the
 * waterline nothing needs painting - the water draws the reflection there.
 *
 * Shapes come from a seeded random stream, so the same landscape is painted
 * every visit and on every resize, only stretched to fit.
 *
 * The trees are also kept as a list - `forest` - so they can burn. Each one
 * has a `char` from 0 (a whole tree) to 1 (a dead trunk), which the forest
 * fire sets and drawTrees() follows. The tree texture covers only a strip
 * around the treeline, so redrawing it while trees burn stays cheap.
 *
 * References:
 * - shaders/fragment/display.glsl - how the layers are composited and bent
 * - physics/ForestFire.js - what sets the trees alight
 */

import { makeRandom } from '../scenes/emitters.js';

/** Widest the paintings are made, pixels; larger screens get them filtered up */
const MAX_WIDTH = 2048;

/** Stars in the sky */
const STARS = true;

/** Tallest a pine can be, as a fraction of the screen's shorter side */
const TALLEST_PINE = 0.085;

/** How high the far shore stands above the water, fraction of the shorter side */
const LAND_HEIGHT = 0.022;

export class Landscape {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     */
    constructor(gl) {
        this.gl = gl;
        this.texture = this._createTexture();
        this.treeTexture = this._createTexture();
        this.treeHeight = 0;
        this.landHeight = 0;
        this.key = '';

        // The trees one by one, and the strip of screen their texture covers
        this.forest = [];
        this.treeBand = { bottom: 0, top: 1 };
        this.treeCanvas = null;
        this.treeTop = 0;
    }

    /**
     * Paint the landscape for a screen size and waterline, if not already
     *
     * @param {number} width - Drawing buffer width, pixels
     * @param {number} height - Drawing buffer height, pixels
     * @param {number} waterline - Screen height of the shore, 0 to 1
     */
    fit(width, height, waterline) {
        const scale = Math.min(1, MAX_WIDTH / width);
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));
        const key = `${w}x${h}@${waterline.toFixed(4)}`;
        if (key === this.key) return;
        this.key = key;

        // How tall the tallest pine stands on screen, for the shader to know
        // how far up a tree a pixel is
        this.treeHeight = TALLEST_PINE * Math.min(w, h) / h;

        // And how high the ground they stand on is, so the shader bends them
        // from their roots rather than from the water
        this.landHeight = LAND_HEIGHT * Math.min(w, h) / h;

        this._upload(this.texture, paintScenery(w, h, waterline));

        // A fresh forest: a resize replants it, burnt or not
        const unit = Math.min(w, h);
        const shore = (1 - waterline) * h;
        this.forest = plantTrees(w, h, waterline);
        this.treeTop = Math.floor(shore - (LAND_HEIGHT + TALLEST_PINE) * unit - 4);
        const bottom = Math.ceil(shore + 4);
        this.treeBand = { bottom: 1 - bottom / h, top: 1 - this.treeTop / h };
        this.treeCanvas = document.createElement('canvas');
        this.treeCanvas.width = w;
        this.treeCanvas.height = Math.max(1, bottom - this.treeTop);
        this.redrawTrees();
    }

    /**
     * Draw every tree as it now is, and upload the strip
     */
    redrawTrees() {
        if (!this.treeCanvas) return;
        drawTrees(this.treeCanvas, this.forest, this.treeTop);
        this._upload(this.treeTexture, this.treeCanvas);
    }

    /**
     * @private
     */
    _upload(texture, canvas) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    /**
     * @private
     */
    _createTexture() {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        return texture;
    }
}

/**
 * The sky, opaque, top row first
 *
 * @param {number} w - Width, pixels
 * @param {number} h - Height, pixels
 * @param {number} waterline - Screen height of the shore, 0 to 1
 * @returns {HTMLCanvasElement} Painting
 */
function paintScenery(w, h, waterline) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    const random = makeRandom(1979);

    const shore = (1 - waterline) * h;   // canvas y of the waterline
    const unit = Math.min(w, h);         // scale shapes to the shorter side

    // Sky: near black overhead, warming to a dusky violet blue at the horizon,
    // along an eased curve sampled at many stops so it has no visible corners
    const sky = g.createLinearGradient(0, 0, 0, shore);
    const top = [4, 6, 13];
    const horizon = [27, 31, 61];
    for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const e = t * t * (3 - 2 * t) * 0.35 + Math.pow(t, 1.8) * 0.65;
        const [r, gr, b] = top.map((v, k) => v + (horizon[k] - v) * e);
        sky.addColorStop(t, `rgb(${r}, ${gr}, ${b})`);
    }
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    // Dither: the sky is dark and changes slowly, so at eight bits a channel
    // it steps in visible bands. A little noise, under a step either way,
    // breaks the steps up so the eye averages them back into a smooth sweep.
    const image = g.getImageData(0, 0, w, Math.ceil(shore));
    const data = image.data;
    const grain = makeRandom(7);
    for (let i = 0; i < data.length; i += 4) {
        const n = grain() - grain();
        data[i] += n;
        data[i + 1] += n;
        data[i + 2] += n * 1.5;
    }
    g.putImageData(image, 0, 0);

    // Stars: many faint, a few bright, thinning toward the horizon haze
    if (STARS) {
        for (let i = 0; i < Math.round(w * shore / 2600); i++) {
            const x = random() * w;
            const y = Math.pow(random(), 1.6) * shore * 0.92;
            const bright = random();
            const size = bright > 0.97 ? 1.6 : bright > 0.85 ? 1.1 : 0.7;
            const alpha = (0.35 + 0.65 * bright) * (1 - y / shore * 0.7);
            g.fillStyle = `rgba(${215 + 40 * random() | 0}, ${220 + 30 * random() | 0}, 255, ${alpha})`;
            g.beginPath();
            g.arc(x, y, size * unit / 900, 0, Math.PI * 2);
            g.fill();
        }
    }

    // The far shore: a low strip of land along the water, its top gently
    // uneven, with the faintest lighter line along it where it meets the sky
    const ground = landline(w, unit, shore);
    g.beginPath();
    g.moveTo(0, shore + 1);
    for (let x = 0; x <= w; x += 2) g.lineTo(x, ground(x));
    g.lineTo(w, shore + 1);
    g.closePath();
    g.fillStyle = '#070b14';
    g.fill();
    g.beginPath();
    for (let x = 0; x <= w; x += 2) (x ? g.lineTo(x, ground(x)) : g.moveTo(x, ground(x)));
    g.strokeStyle = 'rgba(90, 105, 150, 0.18)';
    g.lineWidth = Math.max(1, unit / 900);
    g.stroke();

    // A dark band under the shore, for anything that peeks below the water
    g.fillStyle = '#05080f';
    g.fillRect(0, shore, w, h - shore);

    return canvas;
}

/**
 * Where every pine along the shore stands, and how big it is
 *
 * Two rows: a back row of smaller trees a shade lighter, as the further ones
 * are seen through more night air, and a dense front row in front of it.
 * Every tree stands on the ground of the far shore, so all of them bend from
 * the same roots.
 *
 * Each tree carries its canvas measurements, for drawing, and its box in
 * screen units (0 to 1, y up), for the fire to look for heat in.
 *
 * @param {number} w - Width, pixels
 * @param {number} h - Height, pixels
 * @param {number} waterline - Screen height of the shore, 0 to 1
 * @returns {Array<Object>} Trees, back row first
 */
function plantTrees(w, h, waterline) {
    const random = makeRandom(1983);
    const shore = (1 - waterline) * h;
    const unit = Math.min(w, h);
    const ground = landline(w, unit, shore);
    const forest = [];

    const rows = [
        { color: '#0c1324', scale: 0.62, spacing: 0.16, gap: 0.04 },
        { color: '#05080f', scale: 1, spacing: 0.14, gap: 0.08 }
    ];
    for (const row of rows) {
        let x = -unit * 0.02;
        while (x < w + unit * 0.02) {
            // Mostly trees, with the odd clearing
            if (random() > row.gap) {
                const tall = unit * TALLEST_PINE * row.scale * (0.45 + random() * 0.55);
                const width = tall * (0.32 + random() * 0.1);
                // Rooted in the ground, a little below its surface
                const base = ground(x) + unit * 0.004;
                forest.push({
                    x, base, tall, width, color: row.color,
                    box: {
                        x0: (x - width / 2) / w, x1: (x + width / 2) / w,
                        y0: 1 - base / h, y1: 1 - (base - tall) / h
                    },
                    state: 'alive', char: 0, heat: 0, time: 0
                });
                x += tall * (row.spacing + random() * 0.14);
            } else {
                x += unit * (0.02 + random() * 0.04);
            }
        }
    }

    return forest;
}

/**
 * Draw the forest into the tree strip
 *
 * A tree is drawn by how burnt it is. Whole, it is a pine. As it burns its
 * canopy shrinks toward the trunk and darkens to charcoal; past half burnt a
 * bare, dead trunk shows through; fully burnt only that trunk is left. A tree
 * growing back is the same thing in reverse, but in its living colour.
 *
 * @param {HTMLCanvasElement} canvas - The strip
 * @param {Array<Object>} forest - From plantTrees
 * @param {number} top - Canvas y of the strip's top edge, in landscape pixels
 */
function drawTrees(canvas, forest, top) {
    const g = canvas.getContext('2d');
    g.clearRect(0, 0, canvas.width, canvas.height);

    for (const tree of forest) {
        const base = tree.base - top;
        const char = tree.char;

        // The dead tree, showing once the canopy has burnt back enough
        if (char > 0.45) deadTree(g, tree, base);

        // What is left of the canopy
        if (char < 1) {
            // A burning canopy chars, and glows like embers while it does
            let color = tree.color;
            if (tree.state === 'burning') {
                color = mixHex(mixHex(tree.color, '#160a07', Math.min(1, char * 2)), '#ff5a14', Math.min(1, tree.glow || 0));
            }
            g.fillStyle = color;
            pine(g, tree.x, base, tree.tall * (1 - 0.8 * char), tree.width * (1 - 0.6 * char));
        }
    }
}

/**
 * A burnt pine: a charred trunk and the bare, thin branches left on it
 *
 * Every one is different - the shape comes from a random stream seeded by
 * where the tree stands, so a tree is the same each time it is drawn but no
 * two are alike. The trunk tapers and leans a little; some have snapped part
 * way up and end in a jagged break, others keep a thin spike of a top.
 * Branches are fine and tapering, angled upward as a pine's are and shorter
 * toward the top; some fork into twigs, some are broken stubs, and a few
 * droop where the fire has taken their strength.
 *
 * @param {CanvasRenderingContext2D} g - Tree strip
 * @param {Object} tree - From plantTrees
 * @param {number} base - Strip y of the tree's foot
 */
function deadTree(g, tree, base) {
    const random = makeRandom(Math.floor(Math.abs(tree.x) * 977 + tree.tall * 131) + 1);
    const shade = 3 + Math.floor(random() * 4);
    const ink = `rgb(${shade}, ${shade + 1}, ${shade + 5})`;
    g.fillStyle = ink;
    g.strokeStyle = ink;
    g.lineCap = 'round';
    g.lineJoin = 'round';

    // The trunk: tapering, leaning, snapped or spiked
    const snapped = random() < 0.45;
    const stand = tree.tall * (snapped ? 0.32 + random() * 0.25 : 0.55 + random() * 0.3);
    const lean = (random() - 0.5) * tree.tall * 0.08;
    const foot = Math.max(1, tree.width * (0.07 + random() * 0.04));
    const tip = snapped ? foot * 0.55 : Math.max(0.4, foot * 0.12);
    const top = { x: tree.x + lean, y: base - stand };

    g.beginPath();
    g.moveTo(tree.x - foot / 2, base);
    g.lineTo(top.x - tip / 2, top.y);
    if (snapped) {
        // A jagged break across the top
        g.lineTo(top.x - tip * 0.1, top.y - stand * (0.04 + random() * 0.06));
        g.lineTo(top.x + tip * 0.15, top.y + stand * 0.02);
        g.lineTo(top.x + tip * 0.35, top.y - stand * (0.02 + random() * 0.05));
    }
    g.lineTo(top.x + tip / 2, top.y);
    g.lineTo(tree.x + foot / 2, base);
    g.closePath();
    g.fill();

    // Branches up the trunk, alternating sides, shorter toward the top
    const count = 3 + Math.floor(random() * 5);
    for (let i = 0; i < count; i++) {
        const along = 0.25 + 0.7 * (i + random() * 0.6) / count;
        if (along > 0.95) continue;
        const side = (i % 2 === 0 ? 1 : -1) * (random() < 0.85 ? 1 : -1);
        const x0 = tree.x + lean * along;
        const y0 = base - stand * along;

        // Mostly up and out; one in five droops
        const droops = random() < 0.2;
        const angle = droops ? -(5 + random() * 25) : 25 + random() * 40;   // degrees above horizontal
        const radians = angle * Math.PI / 180;
        const broken = random() < 0.3;
        const length = tree.width * (0.55 - 0.35 * along) * (0.6 + random() * 0.6) * (broken ? 0.4 : 1);

        const x1 = x0 + side * Math.cos(radians) * length;
        const y1 = y0 - Math.sin(radians) * length;
        const width = Math.max(0.35, foot * (0.32 - 0.18 * along));

        // A slight bend: the branch sags a little under its own end
        g.lineWidth = width;
        g.beginPath();
        g.moveTo(x0, y0);
        g.quadraticCurveTo(x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5 + length * 0.08, x1, y1);
        g.stroke();

        // A twig or two forking off the outer half
        if (!broken && random() < 0.6) {
            const fx = x0 + (x1 - x0) * (0.5 + random() * 0.25);
            const fy = y0 + (y1 - y0) * (0.5 + random() * 0.25);
            const twig = length * (0.25 + random() * 0.25);
            const turn = radians + (0.5 + random() * 0.4);
            g.lineWidth = Math.max(0.3, width * 0.55);
            g.beginPath();
            g.moveTo(fx, fy);
            g.lineTo(fx + side * Math.cos(turn) * twig, fy - Math.sin(turn) * twig);
            g.stroke();
        }
    }
}

/**
 * Blend two #rrggbb colours
 */
function mixHex(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/**
 * A pine tree: three tiers of triangles, narrowing toward the top
 */
export function pine(g, x, base, height, width) {
    g.fillRect(x - width * 0.06, base - height * 0.15, width * 0.12, height * 0.15);
    for (let tier = 0; tier < 3; tier++) {
        const bottom = base - height * (0.1 + tier * 0.27);
        const spread = width * (1 - tier * 0.28) / 2;
        g.beginPath();
        g.moveTo(x - spread, bottom);
        g.lineTo(x, bottom - height * 0.45);
        g.lineTo(x + spread, bottom);
        g.closePath();
        g.fill();
    }
}

/**
 * The top of the far shore, as a canvas y at each x
 *
 * Shared by the scenery that paints the land and the trees that stand on it,
 * so every trunk meets the ground exactly. A few slow seeded waves give it
 * low rises and dips; it never drops into the water or rises much above
 * LAND_HEIGHT.
 *
 * @param {number} w - Width, pixels
 * @param {number} unit - The screen's shorter side, pixels
 * @param {number} shore - Canvas y of the waterline
 * @returns {function(number): number} Canvas y of the ground's top
 */
function landline(w, unit, shore) {
    const random = makeRandom(2718);
    const waves = [0, 1, 2].map((i) => ({
        frequency: (2 + i * 3.3 + random() * 2) * Math.PI * 2 / w,
        phase: random() * Math.PI * 2,
        amplitude: 1 / (1 + i)
    }));
    const total = waves.reduce((sum, wave) => sum + wave.amplitude, 0);
    return (x) => {
        let y = 0;
        for (const wave of waves) y += wave.amplitude * Math.sin(x * wave.frequency + wave.phase);
        const rise = 0.6 + 0.4 * y / total;   // 0.2 to 1 of the full height
        return shore - rise * LAND_HEIGHT * unit;
    };
}
