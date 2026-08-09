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
    }

    /**
     * Initialize WebGL context, shaders, and modules
     */
    async init() {
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

        // Load and compile shaders
        await this._loadShaders();

        // Initialize FBOs
        this._initFramebuffers();

        // Initialize physics modules
        this.advectionModule = new AdvectionModule(this.gl, this.programs, this.fboManager, this.obstacle);
        this.pressureModule = new PressureSolverModule(this.gl, this.programs, this.fboManager, this.textureManager, this.obstacle);
        this.vorticityModule = new VorticityModule(this.gl, this.programs, this.fboManager, this.obstacle);
        this.forcesModule = new ForcesModule(this.gl, this.programs, this.fboManager, this.obstacle);

        // Initialize rendering modules
        this.bloomModule = new BloomModule(this.gl, this.programs, this.fboManager, this.textureManager, this.config);
        this.sunraysModule = new SunraysModule(this.gl, this.programs, this.fboManager, this.textureManager, this.config);
        this.displayModule = new DisplayModule(this.gl, this.displayMaterial, this.fboManager);

        // Create dithering texture
        this.ditheringTexture = createDitheringTexture(this.gl);

        // Initialize interaction
        this.pointerManager = new PointerManager(this.canvas, this.config);
        this.interactionManager = new InteractionManager(this.pointerManager, this.forcesModule, this.config);

        // Initial splats for visual interest
        this.interactionManager.generateRandomSplats(this.velocity, this.dye, 5, this.aspectRatio);

        this.initialized = true;
    }

    /**
     * Load and compile all shaders
     * 
     * @private
     */
    async _loadShaders() {
        // Load shader source code
        const baseVertex = await this._loadShaderFile('/src/shaders/vertex/baseVertex.glsl');
        const blurVertex = await this._loadShaderFile('/src/shaders/vertex/blurVertex.glsl');

        const advectionFrag = await this._loadShaderFile('/src/shaders/fragment/advection.glsl');
        const divergenceFrag = await this._loadShaderFile('/src/shaders/fragment/divergence.glsl');
        const pressureFrag = await this._loadShaderFile('/src/shaders/fragment/pressure.glsl');
        const gradientSubtractFrag = await this._loadShaderFile('/src/shaders/fragment/gradientSubtract.glsl');
        const curlFrag = await this._loadShaderFile('/src/shaders/fragment/curl.glsl');
        const vorticityFrag = await this._loadShaderFile('/src/shaders/fragment/vorticity.glsl');
        const splatFrag = await this._loadShaderFile('/src/shaders/fragment/splat.glsl');
        const displayFrag = await this._loadShaderFile('/src/shaders/fragment/display.glsl');
        const copyFrag = await this._loadShaderFile('/src/shaders/fragment/utils/copy.glsl');
        const clearFrag = await this._loadShaderFile('/src/shaders/fragment/utils/clear.glsl');
        const bloomPrefilterFrag = await this._loadShaderFile('/src/shaders/fragment/bloomPrefilter.glsl');
        const bloomBlurFrag = await this._loadShaderFile('/src/shaders/fragment/bloomBlur.glsl');
        const bloomFinalFrag = await this._loadShaderFile('/src/shaders/fragment/bloomFinal.glsl');
        const sunraysMaskFrag = await this._loadShaderFile('/src/shaders/fragment/sunraysMask.glsl');
        const sunraysFrag = await this._loadShaderFile('/src/shaders/fragment/sunrays.glsl');

        // Compile vertex shaders
        const baseVertexShader = this.shaderManager.compileShader(this.gl.VERTEX_SHADER, baseVertex);
        const blurVertexShader = this.shaderManager.compileShader(this.gl.VERTEX_SHADER, blurVertex);

        // Store shaders that need dynamic recompilation
        this.divergenceFragSource = divergenceFrag;
        this.gradientSubtractFragSource = gradientSubtractFrag;
        this.baseVertexShader = baseVertexShader;

        // Create programs
        const advectionKeywords = this.webglManager.supportsLinearFiltering() ? [] : ['MANUAL_FILTERING'];

        this.programs = {
            advection: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, advectionFrag, advectionKeywords)
            ),
            divergence: this._compileDivergenceShader(divergenceFrag, baseVertexShader),
            pressure: new Program(
                this.gl,
                baseVertexShader,
                this.shaderManager.compileShader(this.gl.FRAGMENT_SHADER, pressureFrag)
            ),
            gradientSubtract: this._compileGradientSubtractShader(gradientSubtractFrag, baseVertexShader),
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
    async _loadShaderFile(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load shader: ${url}`);
        }
        return await response.text();
    }

    /**
     * Compile divergence shader with appropriate keywords
     * 
     * @private
     * @param {string} fragSource - Fragment shader source
     * @param {WebGLShader} vertexShader - Compiled vertex shader
     * @returns {Program} Compiled divergence program
     */
    _compileDivergenceShader(fragSource, vertexShader) {
        const keywords = [];
        if (this.config.OUTFLOW_BOUNDARY) {
            keywords.push('OUTFLOW_BOUNDARY');
        }

        const fragmentShader = this.shaderManager.compileShader(
            this.gl.FRAGMENT_SHADER,
            fragSource,
            keywords
        );

        return new Program(this.gl, vertexShader, fragmentShader);
    }

    /**
     * Compile gradient subtraction shader with appropriate keywords
     * 
     * @private
     * @param {string} fragSource - Fragment shader source
     * @param {WebGLShader} vertexShader - Compiled vertex shader
     * @returns {Program} Compiled gradient subtraction program
     */
    _compileGradientSubtractShader(fragSource, vertexShader) {
        const keywords = [];
        if (this.config.OUTFLOW_BOUNDARY) {
            keywords.push('OUTFLOW_BOUNDARY');
        }

        const fragmentShader = this.shaderManager.compileShader(
            this.gl.FRAGMENT_SHADER,
            fragSource,
            keywords
        );

        return new Program(this.gl, vertexShader, fragmentShader);
    }


    /**
     * Update shaders when outflow boundary setting changes
     */
    updateOutflowShaders() {
        if (this.divergenceFragSource && this.baseVertexShader) {
            // Recompile divergence shader
            this.programs.divergence = this._compileDivergenceShader(
                this.divergenceFragSource,
                this.baseVertexShader
            );

            // Recompile gradient subtraction shader
            this.programs.gradientSubtract = this._compileGradientSubtractShader(
                this.gradientSubtractFragSource,
                this.baseVertexShader
            );

            // Update the pressure solver module's references
            if (this.pressureSolverModule) {
                this.pressureSolverModule.divergenceProgram = this.programs.divergence;
                this.pressureSolverModule.gradientSubtractProgram = this.programs.gradientSubtract;
            }
        }
    }

    /**
     * Load obstacle preset
     * 
     * @param {Array} obstacles - Array of obstacle definitions
     */
    loadObstaclePreset(obstacles) {
        if (!this.obstacleManager || !this.obstacle) {
            console.warn('Obstacles not enabled or not initialized');
            return;
        }

        // Clear existing obstacles
        this.obstacleManager.clear();

        // Load new obstacles
        if (Array.isArray(obstacles)) {
            for (const obstacle of obstacles) {
                this.obstacleManager.addObstacle(obstacle);
            }
        }

        // Get obstacle data and texture dimensions
        const obstacleData = this.obstacleManager.getObstacleData();
        const width = this.obstacleManager.width;
        const height = this.obstacleManager.height;

        // Convert Float32Array to Uint8Array
        const uint8Data = new Uint8Array(width * height);
        for (let i = 0; i < obstacleData.length; i++) {
            uint8Data[i] = obstacleData[i] > 0.5 ? 255 : 0;
        }

        // Determine format based on WebGL version
        const isWebGL2 = this.webglManager.supportsWebGL2();
        let uploadData = uint8Data;
        let format = this.gl.RED;

        // If using WebGL1, expand to RGBA
        if (!isWebGL2) {
            uploadData = new Uint8Array(width * height * 4);
            for (let i = 0; i < uint8Data.length; i++) {
                uploadData[i * 4] = uint8Data[i];      // R channel
                uploadData[i * 4 + 1] = 0;             // G
                uploadData[i * 4 + 2] = 0;             // B
                uploadData[i * 4 + 3] = 255;           // A
            }
            format = this.gl.RGBA;
        }

        // Update texture with proper alignment
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.obstacle.texture);

        // Set pixel unpack alignment to 1 for single-channel textures
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);

        this.gl.texSubImage2D(
            this.gl.TEXTURE_2D,
            0,  // mip level
            0, 0,  // x, y offset
            width,
            height,
            format,
            this.gl.UNSIGNED_BYTE,
            uploadData
        );

        // Restore default alignment
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);

        console.log(`Loaded ${obstacles.length} obstacles (${width}x${height}, WebGL${isWebGL2 ? '2' : '1'})`);
    }



    /**
     * Initialize framebuffers
     * 
     * @private
     */
    _initFramebuffers() {
        const simRes = this.textureManager.getResolution(this.config.SIM_RESOLUTION);
        const dyeRes = this.textureManager.getResolution(this.config.DYE_RESOLUTION);

        this.aspectRatio = this.canvas.width / this.canvas.height;

        const texType = this.textureManager.halfFloatTexType;
        const rgba = this.textureManager.supportedFormats.formatRGBA;
        const rg = this.textureManager.supportedFormats.formatRG;
        const r = this.textureManager.supportedFormats.formatR;
        const filtering = this.webglManager.supportsLinearFiltering() ? this.gl.LINEAR : this.gl.NEAREST;

        // Create velocity field (lower resolution, 2-channel)
        this.velocity = this.textureManager.createDoubleFBO(
            simRes.width, simRes.height,
            rg.internalFormat, rg.format,
            texType, filtering
        );

        // Create dye field (higher resolution, 4-channel)
        this.dye = this.textureManager.createDoubleFBO(
            dyeRes.width, dyeRes.height,
            rgba.internalFormat, rgba.format,
            texType, filtering
        );

        // Create pressure field (single FBO with ping-pong for iterations)
        const pressureDoubleFBO = this.textureManager.createDoubleFBO(
            simRes.width, simRes.height,
            r.internalFormat, r.format,
            texType, this.gl.NEAREST
        );
        this.pressure = pressureDoubleFBO;

        // Create divergence field
        this.divergence = this.textureManager.createFBO(
            simRes.width, simRes.height,
            r.internalFormat, r.format,
            texType, this.gl.NEAREST
        );

        // Create curl field
        this.curl = this.textureManager.createFBO(
            simRes.width, simRes.height,
            r.internalFormat, r.format,
            texType, this.gl.NEAREST
        );

        // NEW: Create obstacle manager with aspect-ratio-corrected dimensions
        if (this.config.OBSTACLES_ENABLED) {
            this.obstacleManager = new ObstacleManager(
                simRes.width,   // Use aspect-ratio-corrected width
                simRes.height,  // Use aspect-ratio-corrected height
                this.config
            );

            const obstacleData = this.obstacleManager.getObstacleData();
            this.obstacle = this.textureManager.createObstacleTexture(
                simRes.width,
                simRes.height,
                obstacleData
            );
        }
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
                this.config.WIND_TUNNEL_FORCE, 0,  // Force pointing right
                { r: 0, g: 0, b: 0 },  // No color
                100.0,  // Very large radius to cover entire screen
                this.aspectRatio,
                false  // Additive (accumulate)
            );
        }

        // 3. Advect velocity
        this.advectionModule.advect(
            this.velocity.read,
            this.velocity.read,
            dt,
            this.config.VELOCITY_DISSIPATION,
            this.velocity.write,
            true  // isVelocity = true
        );
        this.velocity.swap();

        // 3. Advect dye
        this.advectionModule.advect(
            this.dye.read,
            this.velocity.read,
            dt,
            this.config.DENSITY_DISSIPATION,
            this.dye.write,
            false  // isVelocity = false
        );
        this.dye.swap();

        // 4. Apply vorticity confinement (if enabled)
        if (this.config.CURL > 0) {
            this.vorticityModule.apply(
                this.velocity,
                this.curl,
                this.config.CURL,
                dt
            );
            this.velocity.swap();
        }

        // 5. Pressure projection (enforce incompressibility)
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
            showObstacles: this.config.SHOW_OBSTACLES,
            obstacleTexture: this.obstacle,
            obstacleColor: this.config.OBSTACLE_COLOR
        });
    }

    /**
     * Resize canvas and framebuffers
     */
    resize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            if (this.initialized) {
                this._initFramebuffers();

                // Resize visual effects modules
                if (this.bloomModule) {
                    this.bloomModule.resize();
                }
                if (this.sunraysModule) {
                    this.sunraysModule.resize();
                }
            }
        }
    }
}
