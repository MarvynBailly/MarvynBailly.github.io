/**
 * Fire schemes demo
 *
 * One fire, drawn once per fire colour scheme in a grid, so the schemes can be
 * compared on the same flames at the same instant rather than one at a time.
 *
 * There is a single simulation. Each frame its display pass is sampled once at
 * the size of a tile, and the ASCII shader then draws that same sample into
 * every tile with a different gradient - so nine schemes cost one simulation
 * and nine cheap full-tile passes, not nine simulations.
 *
 * Two views. "Actual size" is the default: the ASCII grid is built for the
 * whole window at the chosen cell size, exactly as the home page builds it, and
 * each tile is a window onto it around the fire - so a tile shows what a scheme
 * looks like at the size it would really be seen. "Whole scene" instead fits
 * the entire domain into each tile, which shows the shape of the fire but
 * shrinks the cells with it.
 *
 * Tiles keep the window's aspect ratio, which is the simulation's, so in the
 * whole-scene view the fire is smaller rather than stretched.
 */

import { SimulationManager } from '../../src/core/SimulationManager.js';
import { AsciiRenderer } from '../../src/rendering/AsciiRenderer.js';
import { ASCII_SCHEMES } from '../../src/rendering/asciiSchemes.js';
import { Config } from '../../src/config.js';
import { groupedScenes, findScene } from '../../src/scenes/index.js';
import { toScreen } from '../../src/scenes/fire.js';

const SCHEMES = ASCII_SCHEMES.filter((scheme) => scheme.group === 'Fire');
const FIRE_GROUPS = groupedScenes().filter((group) => group.group === 'MB' || group.group === 'Fire');
const FIRES = FIRE_GROUPS.flatMap((group) => group.scenes);

// Layout, CSS pixels
const HEADER = 56;
const PADDING = 20;
const GAP = 16;
const LABEL = 26;

// In the actual-size view, each tile's crop is framed on the scene's fuel:
// centred across it, and with this fraction of the tile below it, so the
// logs or wick stay in shot and the rest of the tile is flame.
const BELOW_FUEL = 0.22;

const canvas = document.getElementById('fluid-canvas');
const labels = document.getElementById('labels');
let simulation = null;
let ascii = null;
let layout = null;
let lastTime = 0;

async function init() {
    sizeCanvas();

    const config = new Config();
    config.INITIAL_SPLATS = 0;
    config.DEFAULT_OBSTACLES = [];

    simulation = new SimulationManager(canvas, config);
    await simulation.init();
    // ?scene=mb-ablaze opens on that fire
    const linked = FIRES.find((scene) => scene.id === new URLSearchParams(location.search).get('scene'));
    await simulation.loadScene(linked || findScene('campfire'));

    ascii = new AsciiRenderer(simulation);
    await ascii.init();
    ascii.setCellSize(3);

    buildControls();
    buildLabels();
    layout = computeLayout();

    window.addEventListener('resize', () => {
        sizeCanvas();
        simulation.resize();
        layout = computeLayout();
        ascii.refresh();
    });

    lastTime = performance.now();
    requestAnimationFrame(frame);
}

function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.016);
    lastTime = now;

    simulation.update(dt);

    // Clear the gaps between tiles to the page
    const gl = simulation.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.043, 0.047, 0.063, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const tileWidth = Math.round(layout.width * layout.ratio);
    const tileHeight = Math.round(layout.height * layout.ratio);

    if (document.getElementById('view').value === 'whole') {
        // Sample once at tile size, then draw that sample in every scheme
        ascii.prepare(tileWidth, tileHeight);
        ascii.sample();
        layout.tiles.forEach((tile, i) => ascii.draw(SCHEMES[i], tile.glX, tile.glY));
    } else {
        // Sample once for the whole window, then show the same window onto it,
        // around the fire, in every tile
        ascii.prepare(canvas.width, canvas.height);
        ascii.sample();

        const cols = tileWidth / ascii.cellWidth;
        const rows = tileHeight / ascii.cellHeight;
        const focus = simulation.activeScene.focus || { x: 0.5, y: 0.15 };
        const fuel = toScreen(focus.x, focus.y, simulation.aspectRatio);
        const clamp = (value, max) => Math.min(Math.max(0, Math.round(value)), Math.max(0, Math.floor(max)));
        const crop = {
            width: tileWidth,
            height: tileHeight,
            col: clamp(fuel.x * ascii.cols - cols / 2, ascii.cols - cols),
            row: clamp(fuel.y * ascii.rows - rows * BELOW_FUEL, ascii.rows - rows)
        };
        layout.tiles.forEach((tile, i) => ascii.draw(SCHEMES[i], tile.glX, tile.glY, crop));
    }

    requestAnimationFrame(frame);
}

/**
 * Where each tile goes: a grid as close to square as the count allows, each
 * tile at the window's aspect ratio and as large as fits
 *
 * @returns {Object} Tile size in CSS pixels, device pixel ratio, and positions
 */
function computeLayout() {
    const ratio = canvas.width / window.innerWidth;
    const aspect = window.innerWidth / window.innerHeight;
    const header = document.querySelector('header').offsetHeight || HEADER;

    const cols = Math.ceil(Math.sqrt(SCHEMES.length));
    const rows = Math.ceil(SCHEMES.length / cols);

    const areaWidth = window.innerWidth - 2 * PADDING;
    const areaHeight = window.innerHeight - header - 2 * PADDING;

    const width = Math.floor(Math.min(
        (areaWidth - (cols - 1) * GAP) / cols,
        ((areaHeight - (rows - 1) * GAP - rows * LABEL) / rows) * aspect
    ));
    const height = Math.floor(width / aspect);

    const gridWidth = cols * width + (cols - 1) * GAP;
    const gridHeight = rows * (height + LABEL) + (rows - 1) * GAP;
    const left = PADDING + (areaWidth - gridWidth) / 2;
    const top = header + PADDING + (areaHeight - gridHeight) / 2;

    const tiles = SCHEMES.map((scheme, i) => {
        const x = left + (i % cols) * (width + GAP);
        const y = top + Math.floor(i / cols) * (height + LABEL + GAP) + LABEL;
        return {
            x, y,
            // WebGL counts from the bottom left, in device pixels
            glX: Math.round(x * ratio),
            glY: Math.round(canvas.height - (y + height) * ratio)
        };
    });

    tiles.forEach((tile, i) => {
        const label = labels.children[i];
        label.style.left = `${tile.x}px`;
        label.style.top = `${tile.y - LABEL}px`;
        label.style.width = `${width}px`;
    });

    return { width, height, ratio, tiles };
}

function buildLabels() {
    for (const scheme of SCHEMES) {
        const label = document.createElement('div');
        label.className = 'tile-label';

        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        swatch.style.background = `linear-gradient(90deg, ${scheme.stops.join(', ')})`;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = scheme.label;

        label.append(swatch, name);
        labels.appendChild(label);
    }
}

function buildControls() {
    const select = document.getElementById('scene');
    for (const { group, scenes } of FIRE_GROUPS) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group;
        for (const scene of scenes) {
            const option = document.createElement('option');
            option.value = scene.id;
            option.textContent = scene.label;
            optgroup.appendChild(option);
        }
        select.appendChild(optgroup);
    }
    select.value = simulation.activeScene.id;
    select.addEventListener('change', async () => {
        await simulation.loadScene(findScene(select.value));
        ascii.refresh();
    });

    const cell = document.getElementById('cell');
    const output = document.getElementById('cell-value');
    cell.addEventListener('input', () => {
        output.textContent = `${cell.value}px`;
        ascii.setCellSize(parseFloat(cell.value));
    });
}

function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
}

init().catch((error) => {
    console.error('Failed to start the demo:', error);
    document.querySelector('h1').textContent = `Fire schemes - failed to start: ${error.message}`;
});
