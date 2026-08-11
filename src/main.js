/**
 * Main Application Entry Point
 * 
 * Initializes the fluid simulation and starts the render loop.
 * 
 * References:
 * - architecture.md - Main Entry Point
 */

import { SimulationManager } from './core/SimulationManager.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { Config } from './config.js';
import { groupedScenes, findScene, isAvailable, DEFAULT_SCENE } from './scenes/index.js';

// Global state
let simulation = null;
let lastTime = 0;
let frameCount = 0;
let fpsDisplay = null;
let frametimeDisplay = null;
let resizePending = false;

/**
 * Initialize the application
 */
async function init() {
    const canvas = document.getElementById('fluid-canvas');
    const loading = new LoadingScreen(document.getElementById('loading'));

    try {
        // Resize canvas to fill window
        resizeCanvas(canvas);

        // Create config
        const config = new Config();

        // Create simulation
        simulation = new SimulationManager(canvas, config);

        // Initialize (loads shaders, creates FBOs, etc.), reporting progress
        // to whichever loading concept was picked for this visit
        await simulation.init((progress) => loading.setProgress(progress));

        // Expose for debugging once there is something to expose
        window.simulation = simulation;

        // Load the opening scene before the first frame is drawn
        await simulation.loadScene(findScene(DEFAULT_SCENE));

        // Setup UI
        setupUI();

        // Coalesce resize events into one rebuild per frame: dragging a window
        // edge fires them faster than the framebuffers can be reallocated.
        window.addEventListener('resize', () => {
            if (resizePending) return;
            resizePending = true;
            requestAnimationFrame(() => {
                resizePending = false;
                resizeCanvas(canvas);
                simulation.resize();
            });
        });

        // Start render loop before the handoff so the sim is already running
        // by the time the loading screen fades away
        lastTime = performance.now();
        requestAnimationFrame(render);

        await loading.finish();

        console.log('Fluid simulation initialized successfully!');

    } catch (error) {
        console.error('Failed to initialize simulation:', error);
        loading.error(`Error: ${error.message}`);
    }
}

/**
 * Render loop
 * 
 * @param {number} currentTime - Current time in milliseconds
 */
function render(currentTime) {
    // Elapsed is what actually happened; dt is what the solver is willing to
    // take in one step. Reporting the first and integrating the second is why
    // the stats panel used to insist the page was running at 62fps.
    const elapsed = (currentTime - lastTime) / 1000;
    const dt = Math.min(elapsed, 0.016);
    lastTime = currentTime;

    // Update simulation
    simulation.update(dt);

    // Render to screen
    simulation.render();

    // Update performance stats
    frameCount++;
    updateStats(elapsed);

    // Continue loop
    requestAnimationFrame(render);
}

/**
 * Update performance statistics
 *
 * @param {number} elapsed - Real time since the previous frame, in seconds
 */
function updateStats(elapsed) {
    if (fpsDisplay && frametimeDisplay && elapsed > 0) {
        fpsDisplay.textContent = Math.round(1 / elapsed);
        frametimeDisplay.textContent = Math.round(elapsed * 1000) + 'ms';
    }
}

/**
 * Resize canvas to fill window
 *
 * The drawing buffer is sized in device pixels here and nowhere else, so the
 * simulation can treat canvas.width/height as authoritative.
 *
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function resizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
    canvas.style.width = '100%';
    canvas.style.height = '100%';
}

/**
 * Setup UI interactions
 */
function setupUI() {
    // Info panel toggle
    const infoBtn = document.getElementById('info-btn');
    const infoPanel = document.getElementById('info-panel');
    const closeInfo = document.getElementById('close-info');

    if (infoBtn && infoPanel) {
        infoBtn.addEventListener('click', () => {
            infoPanel.classList.toggle('hidden');
            if (settingsPanel) settingsPanel.classList.add('hidden'); // Close settings panel
        });
    }

    if (closeInfo && infoPanel) {
        closeInfo.addEventListener('click', () => {
            infoPanel.classList.add('hidden');
        });
    }

    // Settings panel toggle
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');

    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('hidden');
            if (infoPanel) infoPanel.classList.add('hidden'); // Close info panel
        });
    }

    if (closeSettings && settingsPanel) {
        closeSettings.addEventListener('click', () => {
            settingsPanel.classList.add('hidden');
        });
    }

    // Setup settings controls
    setupSettingsControls();

    // Stats display
    fpsDisplay = document.getElementById('fps-value');
    frametimeDisplay = document.getElementById('frametime-value');

    // Toggle stats with 'S' key
    document.addEventListener('keydown', (e) => {
        if (e.key === 's' || e.key === 'S') {
            const stats = document.getElementById('stats');
            if (stats) {
                stats.classList.toggle('hidden');
            }
        }

        // Toggle pause with spacebar
        // if (e.key === ' ') {
        //     e.preventDefault();
        //     if (simulation && simulation.config) {
        //         simulation.config.PAUSED = !simulation.config.PAUSED;
        //     }
        // }
    });
}

// Start application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function setupSettingsControls() {
    if (!simulation || !simulation.config) return;
    const config = simulation.config;
    const bloom = document.getElementById('bloom-toggle');
    const sunrays = document.getElementById('sunrays-toggle');
    const shading = document.getElementById('shading-toggle');
    const obstacles = document.getElementById('obstacles-toggle');
    if (bloom) { bloom.checked = config.BLOOM; bloom.addEventListener('change', (e) => config.BLOOM = e.target.checked); }
    if (sunrays) { sunrays.checked = config.SUNRAYS; sunrays.addEventListener('change', (e) => config.SUNRAYS = e.target.checked); }
    if (shading) { shading.checked = config.SHADING; shading.addEventListener('change', (e) => config.SHADING = e.target.checked); }
    if (obstacles) { obstacles.checked = config.SHOW_OBSTACLES; obstacles.addEventListener('change', (e) => config.SHOW_OBSTACLES = e.target.checked); }

    // Interaction options
    const splatOnMove = document.getElementById('splat-on-move-toggle');
    const continuousColor = document.getElementById('continuous-color-toggle');
    const windTunnel = document.getElementById('wind-tunnel-toggle');
    const outflowBoundary = document.getElementById('outflow-boundary-toggle');
    if (splatOnMove) { splatOnMove.checked = config.SPLAT_ON_MOVE; splatOnMove.addEventListener('change', (e) => config.SPLAT_ON_MOVE = e.target.checked); }
    if (continuousColor) { continuousColor.checked = config.CONTINUOUS_COLOR_CHANGE; continuousColor.addEventListener('change', (e) => config.CONTINUOUS_COLOR_CHANGE = e.target.checked); }
    if (windTunnel) { windTunnel.checked = config.WIND_TUNNEL_MODE; windTunnel.addEventListener('change', (e) => config.WIND_TUNNEL_MODE = e.target.checked); }
    if (outflowBoundary) {
        outflowBoundary.checked = config.OUTFLOW_BOUNDARY;
        outflowBoundary.addEventListener('change', (e) => {
            config.OUTFLOW_BOUNDARY = e.target.checked;
            simulation.updateOutflowShaders(); // Recompile shaders with new keyword
        });
    }

    setupSlider('wind-tunnel-force', 'wind-force-value', config.WIND_TUNNEL_FORCE, (v) => config.WIND_TUNNEL_FORCE = parseInt(v));
    setupSlider('color-change-speed', 'color-speed-value', config.COLOR_CHANGE_SPEED, (v) => config.COLOR_CHANGE_SPEED = parseInt(v), 'ms');
    setupSlider('velocity-dissipation', 'vel-diss-value', config.VELOCITY_DISSIPATION, (v) => config.VELOCITY_DISSIPATION = parseFloat(v));
    setupSlider('density-dissipation', 'den-diss-value', config.DENSITY_DISSIPATION, (v) => config.DENSITY_DISSIPATION = parseFloat(v));
    setupSlider('curl-strength', 'curl-value', config.CURL, (v) => config.CURL = parseInt(v));
    setupSlider('pressure-iterations', 'pressure-value', config.PRESSURE_ITERATIONS, (v) => config.PRESSURE_ITERATIONS = parseInt(v));
    setupSlider('wall-slip', 'wall-slip-value', config.WALL_SLIP, (v) => config.WALL_SLIP = parseFloat(v));
    setupSlider('splat-force', 'force-value', config.SPLAT_FORCE, (v) => config.SPLAT_FORCE = parseInt(v));
    setupSlider('splat-radius', 'radius-value', config.SPLAT_RADIUS, (v) => config.SPLAT_RADIUS = parseFloat(v));

    setupSceneMenu();

    const reset = document.getElementById('reset-settings');
    if (reset) reset.addEventListener('click', () => location.reload());
}

/**
 * Build the scene menu from the registry
 *
 * Scenes whose simulation feature has not been built yet are listed but
 * disabled, so the menu never offers something that would quietly do nothing.
 */
function setupSceneMenu() {
    const selector = document.getElementById('scene-preset');
    if (!selector) return;

    selector.textContent = '';

    for (const { group, scenes } of groupedScenes()) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group;

        for (const scene of scenes) {
            const option = document.createElement('option');
            option.value = scene.id;
            option.textContent = isAvailable(scene) ? scene.label : `${scene.label} (soon)`;
            option.disabled = !isAvailable(scene);
            option.title = scene.description || '';
            optgroup.appendChild(option);
        }

        selector.appendChild(optgroup);
    }

    selector.value = DEFAULT_SCENE;

    selector.addEventListener('change', async (e) => {
        const scene = findScene(e.target.value);
        if (!scene) return;
        await simulation.loadScene(scene);
        syncSettingsControls();
    });
}

/**
 * Push the current config back into the settings panel
 *
 * A scene rewrites most of what the sliders control, so the panel has to be
 * re-read from the config rather than left showing the previous scene's values.
 */
function syncSettingsControls() {
    if (!simulation || !simulation.config) return;
    const config = simulation.config;

    const checkboxes = {
        'bloom-toggle': 'BLOOM',
        'sunrays-toggle': 'SUNRAYS',
        'shading-toggle': 'SHADING',
        'obstacles-toggle': 'SHOW_OBSTACLES',
        'splat-on-move-toggle': 'SPLAT_ON_MOVE',
        'continuous-color-toggle': 'CONTINUOUS_COLOR_CHANGE',
        'wind-tunnel-toggle': 'WIND_TUNNEL_MODE',
        'outflow-boundary-toggle': 'OUTFLOW_BOUNDARY'
    };
    for (const [id, key] of Object.entries(checkboxes)) {
        const el = document.getElementById(id);
        if (el) el.checked = config[key];
    }

    const sliders = {
        'wind-tunnel-force': ['wind-force-value', 'WIND_TUNNEL_FORCE', 'ms'],
        'color-change-speed': ['color-speed-value', 'COLOR_CHANGE_SPEED', 'ms'],
        'velocity-dissipation': ['vel-diss-value', 'VELOCITY_DISSIPATION', ''],
        'density-dissipation': ['den-diss-value', 'DENSITY_DISSIPATION', ''],
        'curl-strength': ['curl-value', 'CURL', ''],
        'pressure-iterations': ['pressure-value', 'PRESSURE_ITERATIONS', ''],
        'wall-slip': ['wall-slip-value', 'WALL_SLIP', ''],
        'splat-force': ['force-value', 'SPLAT_FORCE', ''],
        'splat-radius': ['radius-value', 'SPLAT_RADIUS', '']
    };
    for (const [id, [valueId, key, suffix]] of Object.entries(sliders)) {
        const slider = document.getElementById(id);
        const display = document.getElementById(valueId);
        if (!slider || !display) continue;
        slider.value = config[key];
        display.textContent = slider.value + (id === 'color-change-speed' ? suffix : '');
    }
}

/**
 * Wire a range input to a config value
 *
 * The slider is seeded from the config rather than from its markup, so the
 * panel cannot open showing a number the simulation is not actually using.
 *
 * @param {string} id - Range input element id
 * @param {string} valId - Element that displays the current value
 * @param {number} initial - Current config value
 * @param {function(string): void} callback - Applies a new value
 * @param {string} [suffix] - Unit appended to the displayed value
 */
function setupSlider(id, valId, initial, callback, suffix = '') {
    const slider = document.getElementById(id);
    const display = document.getElementById(valId);
    if (!slider || !display) return;

    slider.value = initial;
    display.textContent = slider.value + suffix;

    slider.addEventListener('input', (e) => {
        display.textContent = e.target.value + suffix;
        callback(e.target.value);
    });
}
