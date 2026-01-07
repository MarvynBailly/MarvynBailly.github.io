/**
 * Configuration System for Navier-Stokes Fluid Simulation
 * 
 * Central configuration for all simulation parameters.
 * Provides validation, clamping, and adaptive settings for mobile devices.
 * 
 * References:
 * - architecture.md - Configuration System
 * - technical_analysis.md - Configuration Parameters
 */

export class Config {
    constructor() {
        // Simulation Resolution
        this.SIM_RESOLUTION = 128;      // Resolution for velocity/pressure computation
        this.DYE_RESOLUTION = 1024;     // Resolution for dye (visual) texture
        this.CAPTURE_RESOLUTION = 512;  // Resolution for screenshots

        // Physics Parameters
        this.DENSITY_DISSIPATION = 1.0;     // How fast dye fades (1.0 = no fade)
        this.VELOCITY_DISSIPATION = 0.2;    // Viscosity (0 = inviscid, higher = more viscous)
        this.PRESSURE = 0.8;                 // Pressure multiplier
        this.PRESSURE_ITERATIONS = 20;       // Accuracy of pressure solve (higher = more accurate)
        this.CURL = 30;                      // Vorticity confinement strength

        // Interaction Parameters
        this.SPLAT_RADIUS = 0.25;       // Size of user input splat
        this.SPLAT_FORCE = 2000;        // Magnitude of velocity added by splat

        // Visual Effects
        this.SHADING = true;            // Normal-based lighting
        this.COLORFUL = true;           // Random colors for splats
        this.COLOR_UPDATE_SPEED = 10;   // How fast colors cycle

        // Bloom Effect
        this.BLOOM = true;
        this.BLOOM_ITERATIONS = 8;
        this.BLOOM_RESOLUTION = 256;
        this.BLOOM_INTENSITY = 0.8;
        this.BLOOM_THRESHOLD = 0.6;
        this.BLOOM_SOFT_KNEE = 0.7;

        // Sunrays Effect
        this.SUNRAYS = true;
        this.SUNRAYS_RESOLUTION = 196;
        this.SUNRAYS_WEIGHT = 0.5;

        // Rendering
        this.BACK_COLOR = { r: 0, g: 0, b: 0 };
        this.TRANSPARENT = false;
        this.PAUSED = false;

        // Performance
        this.FPS_LIMIT = 60;            // Maximum FPS

        // Obstacle Configuration
        this.OBSTACLES_ENABLED = true;
        this.SHOW_OBSTACLES = true;
        this.OBSTACLE_COLOR = { r: 0.0, g: 0.8, b: 1.0 };  // Bright cyan

        // Large "M" shape in center using axis-aligned rectangles
        // Smoother diagonal approximation with more rectangles
        this.DEFAULT_OBSTACLES = [
            // Left vertical bar
            { type: 'rectangle', x: 0.33, y: 0.32, width: 0.05, height: 0.36 },
            // Right vertical bar
            { type: 'rectangle', x: 0.62, y: 0.32, width: 0.05, height: 0.36 },
            // Center vertical bar (middle peak)
            { type: 'rectangle', x: 0.475, y: 0.48, width: 0.05, height: 0.20 },

            // Left diagonal (6 blocks for smooth transition)
            { type: 'rectangle', x: 0.380, y: 0.650, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.395, y: 0.620, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.410, y: 0.590, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.425, y: 0.560, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.440, y: 0.530, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.455, y: 0.500, width: 0.035, height: 0.045 },

            // Right diagonal (6 blocks for smooth transition, mirrored)
            { type: 'rectangle', x: 0.585, y: 0.650, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.570, y: 0.620, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.555, y: 0.590, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.540, y: 0.560, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.525, y: 0.530, width: 0.035, height: 0.045 },
            { type: 'rectangle', x: 0.510, y: 0.500, width: 0.035, height: 0.045 }
        ];
    }

    /**
     * Adjust configuration for mobile devices
     * Lower resolutions and disable expensive effects
     * 
     * @param {boolean} isMobile - Whether device is mobile
     * @param {boolean} supportsLinearFiltering - Whether GPU supports linear filtering
     * 
     * References: technical_analysis.md - Mobile Optimization
     */
    adjustForMobile(isMobile, supportsLinearFiltering) {
        if (isMobile) {
            this.DYE_RESOLUTION = 512;
            this.BLOOM_ITERATIONS = 4;
            this.BLOOM_RESOLUTION = 128;
            this.SUNRAYS_RESOLUTION = 128;
        }

        if (!supportsLinearFiltering) {
            this.DYE_RESOLUTION = 512;
            this.SHADING = false;
            this.BLOOM = false;
            this.SUNRAYS = false;
        }
    }

    /**
     * Validate and clamp simulation resolution
     * 
     * @param {number} value - Desired resolution
     * @returns {number} Clamped resolution value
     */
    validateSimResolution(value) {
        return Math.max(32, Math.min(512, Math.floor(value)));
    }

    /**
     * Validate and clamp dye resolution
     * 
     * @param {number} value - Desired resolution
     * @returns {number} Clamped resolution value
     */
    validateDyeResolution(value) {
        return Math.max(128, Math.min(2048, Math.floor(value)));
    }

    /**
     * Validate and clamp dissipation value
     * 
     * @param {number} value - Desired dissipation
     * @returns {number} Clamped dissipation value
     */
    validateDissipation(value) {
        return Math.max(0, Math.min(4.0, value));
    }

    /**
     * Validate and clamp pressure iterations
     * 
     * @param {number} value - Desired iterations
     * @returns {number} Clamped iterations value
     */
    validatePressureIterations(value) {
        return Math.max(1, Math.min(100, Math.floor(value)));
    }

    /**
     * Validate and clamp splat radius
     * 
     * @param {number} value - Desired radius
     * @returns {number} Clamped radius value
     */
    validateSplatRadius(value) {
        return Math.max(0.01, Math.min(1.0, value));
    }

    /**
     * Set simulation resolution with validation
     */
    set simResolution(value) {
        this.SIM_RESOLUTION = this.validateSimResolution(value);
    }

    /**
     * Set dye resolution with validation
     */
    set dyeResolution(value) {
        this.DYE_RESOLUTION = this.validateDyeResolution(value);
    }

    /**
     * Set density dissipation with validation
     */
    set densityDissipation(value) {
        this.DENSITY_DISSIPATION = this.validateDissipation(value);
    }

    /**
     * Set velocity dissipation with validation
     */
    set velocityDissipation(value) {
        this.VELOCITY_DISSIPATION = this.validateDissipation(value);
    }

    /**
     * Set pressure iterations with validation
     */
    set pressureIterations(value) {
        this.PRESSURE_ITERATIONS = this.validatePressureIterations(value);
    }

    /**
     * Set splat radius with validation
     */
    set splatRadius(value) {
        this.SPLAT_RADIUS = this.validateSplatRadius(value);
    }
}
