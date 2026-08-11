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
                // A drag reads as movement across the screen, so the delta has
                // to be corrected for the canvas shape before it becomes force,
                // or the same gesture pushes harder along the long axis.
                const dx = pointer.dx * (aspectRatio < 1 ? aspectRatio : 1);
                const dy = pointer.dy * (aspectRatio > 1 ? 1 / aspectRatio : 1);

                // Apply velocity splat
                this.forcesModule.applySplat(
                    velocity,
                    pointer.x,
                    pointer.y,
                    dx * this.config.SPLAT_FORCE,
                    dy * this.config.SPLAT_FORCE,
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

            // Consume the movement. Pointer events only fire while the pointer
            // is actually moving, so leaving this set meant a mouse that had
            // come to rest kept injecting its last delta on every frame,
            // forever.
            pointer.consumeMovement();
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
                velocity, x, y, dx, dy,
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
