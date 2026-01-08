/**
 * Interaction Manager
 * 
 * Translates pointer input into simulation forces.
 * Applies velocity and dye splats based on user interaction.
 * 
 * References:
 * - architecture.md - InteractionManager
 * - technical_analysis.md - Splat Shader
 */

export class InteractionManager {
    /**
     * @param {PointerManager} pointerManager - Pointer manager
     * @param {ForcesModule} forcesModule - Forces module
     * @param {Config} config - Configuration
     */
    constructor(pointerManager, forcesModule, config) {
        this.pointerManager = pointerManager;
        this.forcesModule = forcesModule;
        this.config = config;
    }

    /**
     * Apply pointer forces to velocity and dye
     * 
     * @param {Object} velocity - Velocity DoubleFBO
     * @param {Object} dye - Dye DoubleFBO
     * @param {number} aspectRatio - Canvas aspect ratio
     */
    applyPointerForces(velocity, dye, aspectRatio) {
        const pointers = this.pointerManager.getPointers();

        for (const pointer of pointers) {
            // Apply forces if: moved AND (splatOnMove OR pointer is down)
            const shouldApplyForce = pointer.moved && (this.config.SPLAT_ON_MOVE || pointer.down);

            if (shouldApplyForce) {
                // Apply velocity splat
                this.forcesModule.applySplat(
                    velocity,
                    pointer.x,
                    pointer.y,
                    pointer.dx * this.config.SPLAT_FORCE,
                    pointer.dy * this.config.SPLAT_FORCE,
                    pointer.color,
                    this.config.SPLAT_RADIUS / 100.0,
                    aspectRatio
                );

                // Apply dye splat
                this.forcesModule.applyColorSplat(
                    dye,
                    pointer.x,
                    pointer.y,
                    pointer.color,
                    this.config.SPLAT_RADIUS / 100.0,
                    aspectRatio
                );
            }
        }
    }

    /**
     * Generate random splats for ambient activity
     * 
     * @param {Object} velocity - Velocity DoubleFBO
     * @param {Object} dye - Dye DoubleFBO
     * @param {number} count - Number of splats
     * @param {number} aspectRatio - Canvas aspect ratio
     */
    generateRandomSplats(velocity, dye, count, aspectRatio) {
        for (let i = 0; i < count; i++) {
            const x = Math.random();
            const y = Math.random();
            const dx = (Math.random() - 0.5) * 1000;
            const dy = (Math.random() - 0.5) * 1000;
            const color = {
                r: Math.random(),
                g: Math.random(),
                b: Math.random()
            };

            this.forcesModule.applySplat(
                velocity, x, y, dx, dy, color,
                this.config.SPLAT_RADIUS / 100.0,
                aspectRatio
            );

            this.forcesModule.applyColorSplat(
                dye, x, y, color,
                this.config.SPLAT_RADIUS / 100.0,
                aspectRatio
            );
        }
    }
}
