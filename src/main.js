/**
 * Main Application Entry Point
 * 
 * Initializes the fluid simulation and starts the render loop.
 * 
 * References:
 * - architecture.md - Main Entry Point
 */

import { SimulationManager } from './core/SimulationManager.js';
import { Config } from './config.js';

// Global state
let simulation = null;
let lastTime = 0;
let frameCount = 0;
let fpsDisplay = null;
let frametimeDisplay = null;

/**
 * Initialize the application
 */
async function init() {
    const canvas = document.getElementById('fluid-canvas');
    const loading = document.getElementById('loading');

    try {
        // Resize canvas to fill window
        resizeCanvas(canvas);

        // Create config
        const config = new Config();

        // Create simulation
        simulation = new SimulationManager(canvas, config);

        // Initialize (loads shaders, creates FBOs, etc.)
        await simulation.init();

        // Hide loading indicator
        loading.classList.add('hidden');

        // Setup UI
        setupUI();

        // Setup resize handler
        window.addEventListener('resize', () => {
            resizeCanvas(canvas);
            simulation.resize();
        });

        // Start render loop
        lastTime = performance.now();
        requestAnimationFrame(render);

        console.log('Fluid simulation initialized successfully!');

    } catch (error) {
        console.error('Failed to initialize simulation:', error);
        loading.querySelector('p').textContent = `Error: ${error.message}`;
    }
}

/**
 * Render loop
 * 
 * @param {number} currentTime - Current time in milliseconds
 */
function render(currentTime) {
    // Calculate delta time
    const dt = Math.min((currentTime - lastTime) / 1000, 0.016);
    lastTime = currentTime;

    // Update simulation
    simulation.update(dt);

    // Render to screen
    simulation.render();

    // Update performance stats
    frameCount++;
    updateStats(dt);

    // Continue loop
    requestAnimationFrame(render);
}

/**
 * Update performance statistics
 * 
 * @param {number} dt - Delta time
 */
function updateStats(dt) {
    if (fpsDisplay && frametimeDisplay) {
        const fps = Math.round(1 / dt);
        const frametime = Math.round(dt * 1000);

        fpsDisplay.textContent = fps;
        frametimeDisplay.textContent = frametime + 'ms';
    }
}

/**
 * Resize canvas to fill window
 * 
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function resizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
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

// Export for debugging
window.simulation = simulation;
window.frameCount = frameCount;



function setupSettingsControls() {
    if (!simulation || !simulation.config) return;
    const config = simulation.config;
    const bloom = document.getElementById('bloom-toggle');
    const sunrays = document.getElementById('sunrays-toggle');
    const shading = document.getElementById('shading-toggle');
    if (bloom) { bloom.checked = config.BLOOM; bloom.addEventListener('change', (e) => config.BLOOM = e.target.checked); }
    if (sunrays) { sunrays.checked = config.SUNRAYS; sunrays.addEventListener('change', (e) => config.SUNRAYS = e.target.checked); }
    if (shading) { shading.checked = config.SHADING; shading.addEventListener('change', (e) => config.SHADING = e.target.checked); }
    setupSlider('velocity-dissipation', 'vel-diss-value', (v) => config.VELOCITY_DISSIPATION = parseFloat(v));
    setupSlider('density-dissipation', 'den-diss-value', (v) => config.DENSITY_DISSIPATION = parseFloat(v));
    setupSlider('curl-strength', 'curl-value', (v) => config.CURL = parseInt(v));
    setupSlider('pressure-iterations', 'pressure-value', (v) => config.PRESSURE_ITERATIONS = parseInt(v));
    setupSlider('splat-force', 'force-value', (v) => config.SPLAT_FORCE = parseInt(v));
    setupSlider('splat-radius', 'radius-value', (v) => config.SPLAT_RADIUS = parseFloat(v));
    const reset = document.getElementById('reset-settings');
    if (reset) reset.addEventListener('click', () => location.reload());
}

function setupSlider(id, valId, callback) {
    const slider = document.getElementById(id);
    const display = document.getElementById(valId);
    if (slider && display) {
        slider.addEventListener('input', (e) => {
            display.textContent = e.target.value;
            callback(e.target.value);
        });
    }
}
