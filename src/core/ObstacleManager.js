/**
 * Obstacle Manager
 * 
 * Generates obstacle mask data from obstacle definitions.
 * Supports circles and rectangles with CPU-side rasterization.
 * 
 * References:
 * - architecture/obstacle_system_design.md - ObstacleManager specification
 * - research/implementation_approaches.md - Binary mask approach
 */

export class ObstacleManager {
    /**
     * @param {number} width - Grid width (SIM_RESOLUTION)
     * @param {number} height - Grid height (SIM_RESOLUTION)
     * @param {Config} config - Configuration reference
     */
    constructor(width, height, config) {
        this.width = width;
        this.height = height;
        this.config = config;

        // Allocate obstacle mask (initialized to all fluid = 0.0)
        this.obstacleData = new Float32Array(width * height);

        // Store obstacle definitions
        this.obstacles = [];

        // Add default obstacles from config
        if (config.DEFAULT_OBSTACLES && config.DEFAULT_OBSTACLES.length > 0) {
            config.DEFAULT_OBSTACLES.forEach(obs => this.addObstacle(obs));
        }
    }

    /**
     * Add obstacle from definition object
     * 
     * @param {Object} definition - Obstacle definition { type, x, y, ... }
     */
    addObstacle(definition) {
        if (definition.type === 'circle') {
            this.addCircle(definition.x, definition.y, definition.radius);
        } else if (definition.type === 'rectangle') {
            this.addRectangle(definition.x, definition.y, definition.width, definition.height);
        } else {
            console.warn(`Unknown obstacle type: ${definition.type}`);
        }
    }

    /**
     * Add circular obstacle
     * 
     * @param {number} cx - Center X in normalized coordinates [0, 1]
     * @param {number} cy - Center Y in normalized coordinates [0, 1]
     * @param {number} radius - Radius in normalized coordinates [0, 1]
     */
    addCircle(cx, cy, radius) {
        // Validate inputs
        cx = Math.max(0, Math.min(1, cx));
        cy = Math.max(0, Math.min(1, cy));
        radius = Math.max(0.01, Math.min(0.5, radius));

        // Convert normalized coords to grid coords
        const gridX = cx * this.width;
        const gridY = cy * this.height;
        const gridRadius = radius * this.width;  // Assume square grid

        // Warn if obstacle is very small
        if (gridRadius < 3) {
            console.warn(`Obstacle radius very small (<3 cells), may not flow correctly`);
        }

        // Rasterize circle to mask
        for (let j = 0; j < this.height; j++) {
            for (let i = 0; i < this.width; i++) {
                const dx = i - gridX;
                const dy = j - gridY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= gridRadius) {
                    const idx = j * this.width + i;
                    this.obstacleData[idx] = 1.0;  // Mark as obstacle
                }
            }
        }

        // Store definition
        this.obstacles.push({ type: 'circle', x: cx, y: cy, radius });
    }

    /**
     * Add rectangular obstacle
     * 
     * @param {number} x - Left edge X in normalized coordinates [0, 1]
     * @param {number} y - Bottom edge Y in normalized coordinates [0, 1]
     * @param {number} width - Width in normalized coordinates [0, 1]
     * @param {number} height - Height in normalized coordinates [0, 1]
     */
    addRectangle(x, y, width, height) {
        // Validate inputs
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));
        width = Math.max(0.01, Math.min(1, width));
        height = Math.max(0.01, Math.min(1, height));

        // Convert normalized coords to grid coords
        const gridX = x * this.width;
        const gridY = y * this.height;
        const gridW = width * this.width;
        const gridH = height * this.height;

        // Warn if obstacle is very small
        if (gridW < 3 || gridH < 3) {
            console.warn(`Obstacle dimensions very small (<3 cells), may not flow correctly`);
        }

        // DEBUG: Log obstacle bounds
        console.log(`[ObstacleManager] Rectangle: grid=${this.width}x${this.height}, x=${gridX.toFixed(1)}, y=${gridY.toFixed(1)}, w=${gridW.toFixed(1)}, h=${gridH.toFixed(1)}`);

        // Rasterize rectangle to mask
        for (let j = 0; j < this.height; j++) {
            for (let i = 0; i < this.width; i++) {
                if (i >= gridX && i < gridX + gridW &&
                    j >= gridY && j < gridY + gridH) {
                    const idx = j * this.width + i;
                    this.obstacleData[idx] = 1.0;  // Mark as obstacle
                }
            }
        }

        // Store definition
        this.obstacles.push({ type: 'rectangle', x, y, width, height });
    }

    /**
     * Get obstacle mask data
     * 
     * @returns {Float32Array} Obstacle mask (0.0 = fluid, 1.0 = obstacle)
     */
    getObstacleData() {
        return this.obstacleData;
    }

    /**
     * Clear all obstacles
     */
    clear() {
        // Reset all cells to fluid
        this.obstacleData.fill(0.0);
        this.obstacles = [];
    }

    /**
     * Get obstacle count
     * 
     * @returns {number} Number of obstacles
     */
    getObstacleCount() {
        return this.obstacles.length;
    }

    /**
     * Update obstacle texture (for dynamic obstacles - future feature)
     * 
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {WebGLTexture} texture - Obstacle texture to update
     */
    updateTexture(gl, texture) {
        // Convert Float32Array to Uint8Array
        const uint8Data = new Uint8Array(this.width * this.height);
        for (let i = 0; i < this.obstacleData.length; i++) {
            uint8Data[i] = this.obstacleData[i] > 0.5 ? 255 : 0;
        }

        // Update texture (assumes R8 format)
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,  // mip level
            0, 0,  // x, y offset
            this.width,
            this.height,
            gl.RED,  // format
            gl.UNSIGNED_BYTE,
            uint8Data
        );
    }
}
