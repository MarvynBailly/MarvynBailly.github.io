/**
 * Simulation Manager
 * 
 * Main orchestrator for the Navier-Stokes fluid simulation.
 * Coordinates all modules and manages the simulation loop.
 * 
 * References:
 * - architecture.md - Simulation Manager
 * - math_foundations.md - Section 11 (Complete Algorithm)
 * - technical_analysis.md - Core Simulation Loop
 */

import { WebGLContextManager } from './WebGLContextManager.js';
import { ShaderManager, Material, Program } from './ShaderManager.js';
import { TextureManager } from './TextureManager.js';
import { ObstacleManager } from './ObstacleManager.js';
import { ObstacleField } from './ObstacleField.js';
import { FBOManager } from './FBOManager.js';
import { AdvectionModule } from '../physics/AdvectionModule.js';
import { PressureSolverModule } from '../physics/PressureSolverModule.js';
import { VorticityModule } from '../physics/VorticityModule.js';
import { ForcesModule } from '../physics/ForcesModule.js';
import { BloomModule } from '../rendering/BloomModule.js';
import { SunraysModule } from '../rendering/SunraysModule.js';
import { DisplayModule } from '../rendering/DisplayModule.js';
import { createDitheringTexture } from '../rendering/DitheringTexture.js';
import { PointerManager } from '../interaction/PointerManager.js';
import { InteractionManager } from '../interaction/InteractionManager.js';
import { SceneManager } from '../scenes/SceneManager.js';
import { geometricM } from '../geometry/monogram.js';
import { Config } from '../config.js';
import { isMobile } from '../utils/browser.js';

export class SimulationManager {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Config} config - Configuration
     */
    constructor(canvas, config = new Config()) {
        this.canvas = canvas;
        this.config = config;

        // Every value a scene is allowed to patch, as it was before any scene
        // touched it. Scenes are re-applied on top of this rather than on top of
        // each other, so switching scenes cannot accumulate leftovers.
        this.baseConfig = { ...config };

        // Will be initialized in init()
        this.webglManager = null;
        this.gl = null;
        this.shaderManager = null;
        this.textureManager = null;
        this.fboManager = null;

        // FBOs
        this.velocity = null;
        this.dye = null;
        this.pressure = null;
        this.divergence = null;
        this.curl = null;

        // Obstacles
        this.obstacleManager = null;
        this.obstacleField = null;

        // Modules
        this.advectionModule = null;
        this.pressureModule = null;
        this.vorticityModule = null;
        this.forcesModule = null;
        this.bloomModule = null;
        this.sunraysModule = null;
        this.displayModule = null;
        this.pointerManager = null;
        this.interactionManager = null;

        // Textures
        this.ditheringTexture = null;

        // State
        this.aspectRatio = 1.0;
        this.initialized = false;

        // Drawing buffer size the current framebuffers were built for
        this.builtWidth = 0;
        this.builtHeight = 0;
    }

    /**
     * Initialize WebGL context, shaders, and modules
     */
    async init(onProgress = () => { }) {
        // Initialize WebGL
        this.webglManager = new WebGLContextManager(this.canvas);
        this.gl = this.webglManager.getContext();

        // Adjust config for device capabilities
        this.config.adjustForMobile(
            isMobile(),
            this.webglManager.supportsLinearFiltering()
        );

        // Initialize managers
        this.shaderManager = new ShaderManager(this.gl);
        this.textureManager = new TextureManager(
            this.gl,
            this.webglManager.supportsWebGL2(),
            this.webglManager.getExtensions()
        );
        this.fboManager = new FBOManager(this.gl);

        // Stage thresholds match STAGES in src/ui/loading/stages.js
        onProgress(0.10);

        // Load and compile shaders
        await this._loadShaders(onProgress);
        onProgress(0.82);

        // The obstacle field is created before the framebuffers and never
        // replaced, only re-uploaded, so every module can hold onto it.
        this.obstacleField = new ObstacleField(this.gl, this.webglManager.supportsWebGL2());

        // Initialize FBOs
        this._updateFramebuffers();
        onProgress(0.92);

        // Initialize physics modules
        this.advectionModule = new AdvectionModule(this.gl, this.programs, this.fboManager, this.obstacleField);
        this.pressureModule = new PressureSolverModule(this.gl, this.programs, this.fboManager, this.obstacleField, this.config);
        this.vorticityModule = new VorticityModule(this.gl, this.programs, this.fboManager, this.obstacleField, this.config);
        this.forcesModule = new ForcesModule(this.gl, this.programs, this.fboManager, this.obstacleField);

        // Initialize rendering modules
        this.bloomModule = new BloomModule(this.gl, this.programs, this.fboManager, this.textureManager, this.config);
        this.sunraysModule = new SunraysModule(this.gl, this.programs, this.fboManager, this.textureManager, this.config);
        this.displayModule = new DisplayModule(this.gl, this.displayMaterial, this.fboManager);

        // Create dithering texture
        this.ditheringTexture = createDitheringTexture(this.gl);

        // Initialize interaction
        this.pointerManager = new PointerManager(this.canvas, this.config);
        this.interactionManager = new InteractionManager(this.pointerManager, this.forcesModule, this.config);

        // Scenes drive the simulation from the hook the wind tunnel used to own
        this.sceneManager = new SceneManager(this);

        // Initial splats for visual interest
        this.interactionManager.generateRandomSplats(this.velocity, this.dye, 5, this.aspectRatio);
        onProgress(1);

        this.initialized = true;
    }

    /**
     * Load and compile all shaders
     *
     * Sources are fetched concurrently - loading them one after another cost a
     * full round trip per file, which dominated startup on a cold visit.
     *
     * @param {function(number): void} [onProgress] - Reports progress in [0.10, 0.70]
     * @private
     */
    async _loadShaders(onProgress = () => { }) {
        // Load shader source code
        const sources = await this._loadShaderSources({
            baseVertex: '/src/shaders/vertex/baseVertex.glsl',
            blurVertex: '/src/shaders/vertex/blurVertex.glsl',
            advection: '/src/shaders/fragment/advection.glsl',
            divergence: '/src/shaders/fragment/divergence.glsl',
            pressure: '/src/shaders/fragment/pressure.glsl',
            gradientSubtract: '/src/shaders/fragment/gradientSubtract.glsl',
            curl: '/src/shaders/fragment/curl.glsl',
            vorticity: '/src/shaders/fragment/vorticity.glsl',
            splat: '/src/shaders/fragment/splat.glsl',
            buoyancy: '/src/shaders/fragment/buoyancy.glsl',
            vortexForce: '/src/shaders/fragment/vortexForce.glsl',
            display: '/src/shaders/fragment/display.glsl',
            copy: '/src/shaders/fragment/utils/copy.glsl',
            clear: '/src/shaders/fragment/utils/clear.glsl',
            bloomPrefilter: '/src/shaders/fragment/bloomPrefilter.glsl',
            bloomBlur: '/src/shaders/fragment/bloomBlur.glsl',
            bloomFinal: '/src/shaders/fragment/bloomFinal.glsl',
            sunraysMask: '/src/shaders/fragment/sunraysMask.glsl',
            sunrays: '/src/shaders/fragment/sunrays.glsl',
        }, onProgress);

        const { baseVertex, blurVertex } = sources;
        const advectionFrag = sources.advection;
        const divergenceFrag = sources.divergence;
        const pressureFrag = sources.pressure;
        const gradientSubtractFrag = sources.gradientSubtract;
        const curlFrag = sources.curl;
        const vorticityFrag = sources.vorticity;
        const splatFrag = sources.splat;
        const displayFrag = sources.display;
        const copyFrag = sources.copy;
        const clearFrag = sources.clear;
        const bloomPrefilterFrag = sources.bloomPrefilter;
        const bloomBlurFrag = sources.bloomBlur;
        const bloomFinalFrag = sources.bloomFinal;
        const sunraysMaskFrag = sources.sunraysMask;
        const sunraysFrag = sources.sunrays;

        // Compile vertex shaders
        const baseVertexShader = this.shaderManager.compileShader(this.gl.VERTEX_SHADER, baseVertex);
        const blurVertexShader = this.shaderManager.compileShader(this.gl.VERTEX_SHADER, blurVertex);

        // Sources for the three shaders that carry the boundary conditions and
        // therefore have to be recompiled when the boundary mode changes
        this.boundarySources = {
            divergence: divergenceFrag,
            pressure: pressureFrag,
            gradientSubtract: gradientSubtractFrag
        };
        this.baseVertexShader = baseVertexShader;

        // Create programs
        const advectionKeywords = this.webglManager.supportsLinearFiltering() ? [] : ['MANUAL_FILTERING'];

        this.programs = {
            advection: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, advectionFrag, advectionKeywords)
            ),
            divergence: this._compileBoundaryProgram('divergence'),
            pressure: this._compileBoundaryProgram('pressure'),
            gradientSubtract: this._compileBoundaryProgram('gradientSubtract'),
            curl: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, curlFrag)
            ),
            vorticity: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, vorticityFrag)
            ),
            splat: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, splatFrag)
            ),
            buoyancy: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, sources.buoyancy)
            ),
            vortexForce: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, sources.vortexForce)
            ),
            copy: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, copyFrag)
            ),
            clear: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, clearFrag)
            ),
            bloomPrefilter: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, bloomPrefilterFrag)
            ),
            bloomBlur: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, bloomBlurFrag)
            ),
            bloomFinal: new Program(
                this.gl,
                blurVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, bloomFinalFrag)
            ),
            sunraysMask: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, sunraysMaskFrag)
            ),
            sunrays: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, sunraysFrag)
            )
        };

        // Create display material (supports keywords)
        this.displayMaterial = new Material(this.gl, baseVertexShader, displayFrag);
    }

    /**
     * Load shader file from URL
     * 
     * @private
     * @param {string} url - Shader file URL
     * @returns {Promise<string>} Shader source code
     */
    /**
     * Fetch a set of named shader sources concurrently.
     *
     * @param {Object<string, string>} paths - Map of name to shader URL
     * @param {function(number): void} onProgress - Reports progress in [0.10, 0.70]
     * @returns {Promise<Object<string, string>>} Map of name to source text
     * @private
     */
    async _loadShaderSources(paths, onProgress) {
        const names = Object.keys(paths);
        const sources = {};
        let loaded = 0;

        await Promise.all(names.map(async (name) => {
            sources[name] = await this._loadShaderFile(paths[name]);
            loaded++;
            onProgress(0.10 + 0.60 * (loaded / names.length));
        }));

        return sources;
    }

    async _loadShaderFile(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load shader: ${url}`);
        }
        return await response.text();
    }

    /**
     * Which boundary keywords the current config calls for
     *
     * A channel supersedes a plain outflow edge: it already has an outlet, and
     * an inlet to go with it.
     *
     * OUTLET_BC is the whole of a plain outflow edge: the last column leaves
     * the domain and holds the reference pressure that makes the Poisson
     * problem solvable. CHANNEL_BC adds an inlet on top of it, which is the
     * only thing a channel has that an outflow edge does not.
     *
     * @private
     * @returns {string[]} Keywords to compile with
     */
    _boundaryKeywords() {
        if (this.config.CHANNEL_INLET > 0) return ['CHANNEL_BC', 'OUTLET_BC'];
        if (this.config.OUTFLOW_BOUNDARY) return ['OUTLET_BC'];
        return [];
    }

    /**
     * Compile one of the boundary-carrying shaders for the current mode
     *
     * @private
     * @param {string} name - 'divergence', 'pressure' or 'gradientSubtract'
     * @returns {Program} Compiled program
     */
    _compileBoundaryProgram(name) {
        const fragmentShader = this.shaderManager.compileShader(
            this.gl.FRAGMENT_SHADER,
            this.boundarySources[name],
            this._boundaryKeywords()
        );
        return new Program(this.gl, this.baseVertexShader, fragmentShader);
    }

    /**
     * Rebuild the boundary shaders for the current mode
     *
     * Modules read these out of this.programs every frame, so replacing them
     * here is all that is needed to switch the boundary.
     */
    updateBoundaryShaders() {
        if (!this.boundarySources || !this.baseVertexShader) return;

        for (const name of ['divergence', 'pressure', 'gradientSubtract']) {
            this.gl.deleteProgram(this.programs[name].program);
            this.programs[name] = this._compileBoundaryProgram(name);
        }
    }

    /**
     * @deprecated Use updateBoundaryShaders. Kept for the settings panel toggle.
     */
    updateOutflowShaders() {
        this.updateBoundaryShaders();
    }

    /**
     * Activate a scene: its config, its geometry, and its emitters
     *
     * @param {Object} scene - Scene module from scenes/index.js
     * @returns {Promise<void>}
     */
    async loadScene(scene) {
        if (!scene) return;

        const before = this._boundaryKeywords().join();

        // Start from the untouched defaults so scenes never inherit each other
        Object.assign(this.config, this.baseConfig, scene.config || {});

        if (this._boundaryKeywords().join() !== before) {
            this.updateBoundaryShaders();
        }

        this.loadObstaclePreset(await this._resolveObstacles(scene.obstacles));
        this._bringToRest();
        this.sceneManager.setScene(scene);
        this.activeScene = scene;
    }

    /**
     * Stop the fluid before handing it to a new scene
     *
     * The config above is rebuilt from baseConfig every switch precisely so
     * that one scene cannot inherit another's settings. The velocity field was
     * the one thing that still did, and it carries far more state than any
     * setting: leaving a driven channel handed the next scene a screen-wide
     * stream with nothing left to drive it, and a closed box turns that into a
     * slab of recirculation that takes about six seconds to die.
     *
     * Pressure goes with it because the solver warm-starts from the previous
     * frame. Dye is deliberately left alone - it carries no momentum, and
     * clearing it makes the switch blink.
     *
     * @private
     */
    _bringToRest() {
        this._clear(this.velocity);
        this._clear(this.pressure);
    }

    /**
     * Zero a double FBO
     *
     * @private
     * @param {Object} target - Double FBO
     */
    _clear(target) {
        this.programs.clear.bind();
        this.gl.uniform1i(this.programs.clear.uniforms.uTexture, target.read.attach(0));
        this.gl.uniform1f(this.programs.clear.uniforms.value, 0);
        this.fboManager.blit(target.write);
        target.swap();
    }

    /**
     * Turn a scene's obstacle spec into obstacle definitions
     *
     * Accepts the monogram by name, a preset file by name, a literal list, a
     * function returning one, or any nesting of those.
     *
     * @private
     * @param {*} spec - Obstacle specification
     * @returns {Promise<Array>} Obstacle definitions
     */
    async _resolveObstacles(spec) {
        if (!spec) return [];

        if (typeof spec === 'function') {
            return this._resolveObstacles(spec());
        }

        if (typeof spec === 'string') {
            return spec === 'monogram' ? geometricM() : [];
        }

        if (Array.isArray(spec)) {
            const resolved = [];
            for (const entry of spec) {
                if (typeof entry === 'string' || typeof entry === 'function' || Array.isArray(entry)) {
                    resolved.push(...await this._resolveObstacles(entry));
                } else if (entry && entry.preset) {
                    resolved.push(...await this._loadPreset(entry.preset));
                } else if (entry) {
                    resolved.push(entry);
                }
            }
            return resolved;
        }

        if (spec.preset) return this._loadPreset(spec.preset);

        return [spec];
    }

    /**
     * Read obstacle geometry from a preset file
     *
     * @private
     * @param {string} name - Preset name, without extension
     * @returns {Promise<Array>} Obstacle definitions
     */
    async _loadPreset(name) {
        try {
            const response = await fetch(`/presets/${name}.json`);
            if (!response.ok) throw new Error(response.statusText);
            const preset = await response.json();
            return preset.obstacles || [];
        } catch (error) {
            console.warn(`Could not load obstacle preset "${name}":`, error.message);
            return [];
        }
    }

    /**
     * Replace the current obstacles
     *
     * @param {Array} obstacles - Array of obstacle definitions
     */
    loadObstaclePreset(obstacles) {
        if (this.obstacleManager) {
            // A scene's boat must not still be under way in the next scene
            this.obstacleManager.clearBodies();
        }

        if (!this.obstacleManager) {
            console.warn('Obstacles not initialized');
            return;
        }

        this.obstacleManager.clear();

        if (Array.isArray(obstacles)) {
            for (const obstacle of obstacles) {
                this.obstacleManager.addObstacle(obstacle);
            }
        }

        this._uploadObstacleField();
    }

    /**
     * Push the current obstacle field to the GPU
     *
     * @private
     */
    _uploadObstacleField() {
        const manager = this.obstacleManager;

        this.obstacleField.upload(
            manager.width,
            manager.height,
            manager.getField(),
            {
                range: manager.range,
                texelsPerCell: this.config.OBSTACLE_SUPERSAMPLE
            }
        );
    }

    /**
     * Restamp moving bodies and send only the texels that changed
     *
     * @private
     */
    _updateBodies() {
        const manager = this.obstacleManager;
        if (!manager) return;

        // Nothing moving and nothing left behind: skip the call entirely rather
        // than pay for it on every frame of the nineteen scenes with no bodies.
        if (manager.bodies.length === 0 && !manager.bodyRect) return;

        const rect = manager.updateBodies();
        if (rect) {
            this.obstacleField.uploadRect(rect, manager.field, manager.width);
        }
    }

    /**
     * Create the framebuffers, or resize them to match the current canvas
     *
     * Velocity and dye are carried across a resize rather than reallocated from
     * scratch, so dragging a window edge does not wipe the fluid. Everything
     * else is derived state that the next step recomputes anyway.
     *
     * @private
     */
    _updateFramebuffers() {
        const simRes = this.textureManager.getResolution(this.config.SIM_RESOLUTION);
        const dyeRes = this.textureManager.getResolution(this.config.DYE_RESOLUTION);

        this.aspectRatio = this.canvas.width / this.canvas.height;
        this.builtWidth = this.canvas.width;
        this.builtHeight = this.canvas.height;

        const texType = this.textureManager.halfFloatTexType;
        const rgba = this.textureManager.supportedFormats.formatRGBA;
        const rg = this.textureManager.supportedFormats.formatRG;
        const r = this.textureManager.supportedFormats.formatR;
        const filtering = this.webglManager.supportsLinearFiltering() ? this.gl.LINEAR : this.gl.NEAREST;

        // Velocity field (simulation resolution, 2-channel)
        this.velocity = this._makeDoubleFBO(
            this.velocity, simRes.width, simRes.height,
            rg.internalFormat, rg.format, texType, filtering
        );

        // Dye field (higher resolution, 4-channel)
        this.dye = this._makeDoubleFBO(
            this.dye, dyeRes.width, dyeRes.height,
            rgba.internalFormat, rgba.format, texType, filtering
        );

        // Pressure field (ping-ponged across Jacobi iterations)
        this.pressure = this._makeDoubleFBO(
            this.pressure, simRes.width, simRes.height,
            r.internalFormat, r.format, texType, this.gl.NEAREST, false
        );

        // Divergence and curl are rewritten from scratch every step
        this.divergence = this._makeFBO(
            this.divergence, simRes.width, simRes.height,
            r.internalFormat, r.format, texType, this.gl.NEAREST
        );
        this.curl = this._makeFBO(
            this.curl, simRes.width, simRes.height,
            r.internalFormat, r.format, texType, this.gl.NEAREST
        );

        // Obstacle field, at a multiple of the simulation grid
        const supersample = this.config.OBSTACLE_SUPERSAMPLE;
        const fieldWidth = simRes.width * supersample;
        const fieldHeight = simRes.height * supersample;

        if (!this.obstacleManager) {
            this.obstacleManager = new ObstacleManager(fieldWidth, fieldHeight, this.config);
            if (!this.config.OBSTACLES_ENABLED) this.obstacleManager.clear();
        } else {
            // Keep whatever obstacles are loaded; only the grid changes
            this.obstacleManager.setResolution(fieldWidth, fieldHeight);
        }

        this._uploadObstacleField();
    }

    /**
     * Create an FBO, or replace one whose size no longer matches
     *
     * @private
     */
    _makeFBO(existing, width, height, internalFormat, format, type, filter) {
        if (existing && existing.width === width && existing.height === height) {
            return existing;
        }
        if (existing) this.textureManager.deleteFBO(existing);
        return this.textureManager.createFBO(width, height, internalFormat, format, type, filter);
    }

    /**
     * Create a double FBO, or resize one whose size no longer matches
     *
     * @private
     * @param {boolean} [preserve] - Copy the old contents into the new buffer
     */
    _makeDoubleFBO(existing, width, height, internalFormat, format, type, filter, preserve = true) {
        if (existing && existing.width === width && existing.height === height) {
            return existing;
        }

        const next = this.textureManager.createDoubleFBO(
            width, height, internalFormat, format, type, filter
        );

        if (existing) {
            if (preserve) this._copy(existing.read, next.read);
            this.textureManager.deleteDoubleFBO(existing);
        }

        return next;
    }

    /**
     * Blit one texture into another framebuffer
     *
     * @private
     */
    _copy(source, target) {
        this.programs.copy.bind();
        this.gl.uniform1i(this.programs.copy.uniforms.uTexture, source.attach(0));
        this.fboManager.blit(target);
    }

    /**
     * Update simulation for one time step
     * 
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (!this.initialized || this.config.PAUSED) return;

        // 1. Apply user interaction
        this.interactionManager.applyPointerForces(this.velocity, this.dye, this.aspectRatio);

        // 2. Apply wind tunnel force (if enabled)
        if (this.config.WIND_TUNNEL_MODE) {
            this.forcesModule.applySplat(
                this.velocity,
                0.5, 0.5,  // Center of screen
                // Scaled by dt against a 60fps reference: the force used to be
                // added per frame, which made the wind twice as strong on a
                // 120Hz display as on a 60Hz one.
                this.config.WIND_TUNNEL_FORCE * dt * 60.0, 0,
                100.0,  // Very large radius to cover entire screen
                this.aspectRatio
            );
        }

        // 2b. Run the active scene's emitters
        this.sceneManager.update(dt);

        // 2c. Move any bodies the scene repositioned into the obstacle field,
        // before anything reads it, so this step's advection and projection see
        // the hull where the scene just put it rather than where it was.
        this._updateBodies();

        // 3. Advect velocity
        this.advectionModule.advect(
            this.velocity.read,
            this.velocity.read,
            dt,
            this.config.VELOCITY_DISSIPATION,
            this.velocity.write
        );
        this.velocity.swap();

        // 4. Advect dye
        this.advectionModule.advect(
            this.dye.read,
            this.velocity.read,
            dt,
            this.config.DENSITY_DISSIPATION,
            this.dye.write
        );
        this.dye.swap();

        // 5. Body forces a scene has asked for. Both run before the projection
        // so the pressure solve gets to respond to what they added.
        if (this.config.BUOYANCY > 0) {
            this.forcesModule.applyBuoyancy(
                this.velocity, this.dye,
                this.config.BUOYANCY, this.config.BUOYANCY_WEIGHTS, dt
            );
        }

        if (this.config.VORTEX_RATE > 0) {
            this.forcesModule.applyVortex(
                this.velocity,
                { rate: this.config.VORTEX_RATE, falloff: this.config.VORTEX_FALLOFF },
                this.aspectRatio, dt
            );
        }

        // 6. Apply vorticity confinement (if enabled)
        if (this.config.CURL > 0) {
            this.vorticityModule.apply(
                this.velocity,
                this.curl,
                this.config.CURL,
                dt
            );
            this.velocity.swap();
        }

        // 7. Pressure projection (enforce incompressibility)
        this.pressureModule.project(
            this.velocity,
            this.pressure,
            this.divergence,
            this.config.PRESSURE_ITERATIONS
        );
        this.velocity.swap();
    }

    /**
     * Render current state to screen
     */
    render() {
        if (!this.initialized) return;

        // Apply bloom effect
        let bloomTexture = null;
        if (this.config.BLOOM) {
            bloomTexture = this.bloomModule.apply(this.dye.read);
        }

        // Apply sunrays effect
        let sunraysTexture = null;
        if (this.config.SUNRAYS) {
            sunraysTexture = this.sunraysModule.apply(this.dye.read);
        }

        // Final composite render to screen
        this.displayModule.render(this.dye.read, {
            shading: this.config.SHADING,
            bloom: this.config.BLOOM,
            bloomTexture: bloomTexture,
            sunrays: this.config.SUNRAYS,
            sunraysTexture: sunraysTexture,
            ditheringTexture: this.ditheringTexture,
            paletteRamp: this.config.PALETTE_RAMP,
            rampColors: this.config.PALETTE_RAMP_COLORS,
            showObstacles: this.config.SHOW_OBSTACLES,
            obstacleField: this.obstacleField,
            obstacleFill: this.config.OBSTACLE_FILL,
            obstacleEdge: this.config.OBSTACLE_EDGE
        });
    }

    /**
     * Rebuild framebuffers for the current canvas size
     *
     * The canvas itself is sized by the caller, which owns the device pixel
     * ratio; this only reacts to the drawing buffer it is handed.
     */
    resize() {
        if (!this.initialized) return;
        if (this.canvas.width === this.builtWidth && this.canvas.height === this.builtHeight) {
            return;
        }

        this._updateFramebuffers();

        // Resize visual effects modules
        if (this.bloomModule) this.bloomModule.resize();
        if (this.sunraysModule) this.sunraysModule.resize();
    }
}
