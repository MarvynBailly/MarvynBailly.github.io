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

import { geometricM } from './geometry/monogram.js';

export class Config {
    constructor() {
        // Simulation Resolution
        this.SIM_RESOLUTION = 256;      // Resolution for velocity/pressure computation
        this.DYE_RESOLUTION = 1024;     // Resolution for dye (visual) texture
        this.CAPTURE_RESOLUTION = 512;  // Resolution for screenshots

        // Physics Parameters
        this.DENSITY_DISSIPATION = 1.0;     // How fast dye fades (0 = no fade, higher = faster)
        this.VELOCITY_DISSIPATION = 0.2;    // Viscosity (0 = inviscid, higher = more viscous)
        this.PRESSURE = 0.8;                 // Pressure multiplier
        this.PRESSURE_ITERATIONS = 40;       // Accuracy of pressure solve (higher = more accurate)
        this.CURL = 30;                      // Vorticity confinement strength

        // Interaction Parameters
        this.SPLAT_RADIUS = 0.25;       // Size of user input splat
        this.SPLAT_FORCE = 2000;        // Magnitude of velocity added by splat

        // Visual Effects
        this.SHADING = true;            // Normal-based lighting
        this.COLORFUL = true;           // Random colors for splats
        this.COLOR_UPDATE_SPEED = 10;   // How fast colors cycle

        // Bloom Effect
        this.BLOOM = false;
        this.BLOOM_ITERATIONS = 8;
        this.BLOOM_RESOLUTION = 256;
        this.BLOOM_INTENSITY = 0.8;
        this.BLOOM_THRESHOLD = 0.6;
        this.BLOOM_SOFT_KNEE = 0.7;

        // Sunrays Effect
        this.SUNRAYS = false;
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

        // Obstacle field resolution as a multiple of the simulation grid. The
        // field is a distance field, so the physics reads correct distances at
        // any multiple; the extra resolution only sharpens corners on screen.
        this.OBSTACLE_SUPERSAMPLE = 2;
        this.OBSTACLE_SDF_RANGE = 12;   // Distance stored either side of a surface, texels

        // Matches the site palette: --color-code-bg body, --color-primary edge
        this.OBSTACLE_FILL = { r: 0.043, g: 0.051, b: 0.071 };
        this.OBSTACLE_EDGE = { r: 0.498, g: 0.690, b: 0.788 };

        // Wall interaction
        this.WALL_SLIP = 0.94;   // 1 = free slip, 0 = no slip
        this.WALL_BAND = 1.5;    // Cells over which wall corrections fade in

        // Scene features. Scenes patch these; the defaults are all "off" so a
        // scene that does not mention one gets the plain simulation back.
        this.PALETTE_POINTER = false;   // Draw pointer colour from the site palette
        this.POINTER_FAMILY = 'either'; // Which ink when it does: 'cool', 'warm' or 'either'
        this.CHANNEL_INLET = 0;         // Inlet speed, cells/second; 0 disables the channel
        this.BUOYANCY = 0;              // Vertical force per unit dye
        this.BUOYANCY_WEIGHTS = { r: 1, g: 1, b: 1 };
        this.PALETTE_RAMP = false;      // Map density through a palette in the display shader
        // Ramp stops at density 0, 0.35, 0.7 and 1. Empty water is the exact
        // page background, so an empty canvas is indistinguishable from no canvas.
        //
        // The three stops above it follow how water actually absorbs light:
        // red goes first, then orange and yellow, and blue-green travels
        // furthest. So thin fluid reads deep and blue, and the more of it there
        // is the further it climbs toward the pale green-cyan of a shallow
        // sunlit surface. An earlier ramp ended on amber, which is the one hue
        // a water column cannot produce - it read as rust on marbled paper.
        this.PALETTE_RAMP_COLORS = [
            { r: 0.063, g: 0.075, b: 0.102 },   // #10131a  page background
            { r: 0.055, g: 0.157, b: 0.212 },   // #0e2836  deep water
            { r: 0.149, g: 0.416, b: 0.463 },   // #266a76  mid column
            { r: 0.545, g: 0.784, b: 0.769 }    // #8bc8c4  sunlit shallows
        ];
        this.VORTEX_RATE = 0;           // Rotational body force, radians/second
        this.VORTEX_FALLOFF = 0.55;     // Radius at which the swirl dies out

        // Interaction Options
        this.SPLAT_ON_MOVE = true;          // Splat follows mouse without clicking
        this.CONTINUOUS_COLOR_CHANGE = true; // Vary colors while mouse is held down
        this.COLOR_CHANGE_SPEED = 1500;     // Color change interval in milliseconds (lower = faster)

        // Wind Tunnel Mode
        this.WIND_TUNNEL_MODE = false;      // Enable passive left-to-right wind
        this.WIND_TUNNEL_FORCE = 20;        // Strength of wind tunnel force
        this.OUTFLOW_BOUNDARY = false;      // Allow flow to exit on right edge (non-reflecting)

        // Monogram
        // The letterform is generated from typographic parameters rather than
        // traced from an image, so its strokes stay monolinear and its joints
        // stay exact at any resolution. See geometry/monogram.js.
        this.DEFAULT_OBSTACLES = geometricM();
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
