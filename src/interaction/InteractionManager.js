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

/** Pointer travel between drops into the water, screen heights */
const WAKE_SPACING = 0.012;

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

        // The gusts the pointer made this frame, for anything that wants to
        // know where the wind blew - the forest fire, to be blown out by them.
        // Each is { x, y, speed }: screen position, and how far the pointer
        // moved this frame as a fraction of the screen's height.
        this.gusts = [];
    }

    /**
     * Apply pointer forces to velocity and dye
     * 
     * @param {Object} velocity - Velocity DoubleFBO
     * @param {Object} dye - Dye DoubleFBO
     * @param {number} aspectRatio - Canvas aspect ratio
     * @param {Object} [lake] - Water with waves, if the scene has some:
     *        { waterline, drop(x, depth, amount, radius) }
     */
    applyPointerForces(velocity, dye, aspectRatio, lake = null) {
        const pointers = this.pointerManager.getPointers();
        this.gusts.length = 0;

        for (const pointer of pointers) {
            // Apply forces if: moved AND (splatOnMove OR pointer is down)
            const shouldApplyForce = pointer.moved && (this.config.SPLAT_ON_MOVE || pointer.down);
            const overWater = lake && pointer.y < lake.waterline;

            // Held down over the air, the pointer is a torch: it feeds heat
            // every frame it is held, moving or not, and the heat rises and
            // blows about like any other fire. Dragging sweeps it along the
            // path, so a drag draws a line of flame rather than a dotted one.
            if (this.config.POINTER_FIRE && pointer.down && !overWater) {
                const heat = this.config.POINTER_FIRE_HEAT;
                const color = this.config.POINTER_FIRE_COLOR;
                const radius = this.config.POINTER_FIRE_RADIUS;
                this.forcesModule.applyColorSplat(
                    dye, pointer.x, pointer.y,
                    { r: color.r * heat, g: color.g * heat, b: color.b * heat },
                    radius, aspectRatio, pointer.ax, pointer.ay
                );
                this.forcesModule.applySplat(
                    velocity, pointer.x, pointer.y, 0, this.config.POINTER_FIRE_RISE,
                    radius * 1.5, aspectRatio, pointer.ax, pointer.ay
                );
            }

            // Over the water the pointer is a finger trailed through it: the
            // faster it moves the bigger the wake, and pressing digs in deeper
            if (shouldApplyForce && overWater) {
                // A drop per stretch of travel, not per frame: a finger drawn
                // through water leaves a trail of rings, and dropping on every
                // frame piled dozens into the same place until the reflection
                // turned to noodles. Each is gentle, and grows only a little
                // with speed.
                const speed = Math.hypot(pointer.dx * aspectRatio, pointer.dy);
                pointer.wake = (pointer.wake || 0) + speed;
                if (pointer.wake >= WAKE_SPACING) {
                    pointer.wake = 0;
                    const amount = Math.min(0.45, 0.14 + speed * 8) * (pointer.down ? 1.4 : 1);
                    lake.drop(pointer.x, (lake.waterline - pointer.y) / lake.waterline, amount, 2.0);
                }
            } else if (shouldApplyForce && this.config.POINTER_WIND) {
                // Wind: air pushed along the pointer's path, and nothing else
                const dx = pointer.dx * (aspectRatio < 1 ? aspectRatio : 1);
                const dy = pointer.dy * (aspectRatio > 1 ? 1 / aspectRatio : 1);
                this.forcesModule.applySplat(
                    velocity, pointer.x, pointer.y,
                    dx * this.config.POINTER_WIND_FORCE, dy * this.config.POINTER_WIND_FORCE,
                    this.config.POINTER_WIND_RADIUS, aspectRatio, pointer.ax, pointer.ay
                );
                this.gusts.push({
                    x: pointer.x,
                    y: pointer.y,
                    speed: Math.hypot(pointer.dx * aspectRatio, pointer.dy)
                });
            } else if (shouldApplyForce) {
                // A drag reads as movement across the screen, so the delta has
                // to be corrected for the canvas shape before it becomes force,
                // or the same gesture pushes harder along the long axis.
                const dx = pointer.dx * (aspectRatio < 1 ? aspectRatio : 1);
                const dy = pointer.dy * (aspectRatio > 1 ? 1 / aspectRatio : 1);

                // Both splats are swept from where the pointer was when its
                // movement was last consumed to where it is now, so a drag
                // lays down a stroke rather than one blob per frame. A pointer
                // that has barely moved sweeps a segment shorter than a texel,
                // which is the disc this always drew.
                this.forcesModule.applySplat(
                    velocity,
                    pointer.x,
                    pointer.y,
                    dx * this.config.SPLAT_FORCE,
                    dy * this.config.SPLAT_FORCE,
                    this.config.SPLAT_RADIUS / 100.0,
                    aspectRatio,
                    pointer.ax,
                    pointer.ay
                );

                this.forcesModule.applyColorSplat(
                    dye,
                    pointer.x,
                    pointer.y,
                    pointer.color,
                    this.config.SPLAT_RADIUS / 100.0,
                    aspectRatio,
                    pointer.ax,
                    pointer.ay
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
