/**
 * Obstacle Manager
 * 
 * Generates obstacle mask data from obstacle definitions.
 * Supports circles, rectangles, triangles, and convex polygons with CPU-side rasterization.
 * 
 * References:
 * - architecture/obstacle_system_design.md - ObstacleManager specification
 * - research/implementation_approaches.md - Binary mask approach
 * - Barycentric coordinates for triangle rasterization (Blackpawn)
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
        } else if (definition.type === 'triangle') {
            this.addTriangle(definition.v0, definition.v1, definition.v2);
        } else if (definition.type === 'polygon') {
            this.addPolygon(definition.vertices);
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
     * Add triangular obstacle using barycentric coordinate rasterization
     * 
     * @param {Object} v0 - First vertex {x, y} in normalized coordinates [0, 1]
     * @param {Object} v1 - Second vertex {x, y} in normalized coordinates [0, 1]
     * @param {Object} v2 - Third vertex {x, y} in normalized coordinates [0, 1]
     * 
     * Reference: Blackpawn "Point in Triangle" using barycentric coordinates
     */
    addTriangle(v0, v1, v2) {
        // Validate inputs
        if (!v0 || !v1 || !v2 ||
            typeof v0.x !== 'number' || typeof v0.y !== 'number' ||
            typeof v1.x !== 'number' || typeof v1.y !== 'number' ||
            typeof v2.x !== 'number' || typeof v2.y !== 'number') {
            console.warn('Invalid triangle vertices');
            return;
        }

        // Clamp vertices to [0, 1]
        const clamp = (v) => ({
            x: Math.max(0, Math.min(1, v.x)),
            y: Math.max(0, Math.min(1, v.y))
        });
        const a = clamp(v0);
        const b = clamp(v1);
        const c = clamp(v2);

        // Convert to grid coordinates
        const ax = a.x * this.width, ay = a.y * this.height;
        const bx = b.x * this.width, by = b.y * this.height;
        const cx = c.x * this.width, cy = c.y * this.height;

        // Compute bounding box
        const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
        const maxX = Math.min(this.width - 1, Math.ceil(Math.max(ax, bx, cx)));
        const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
        const maxY = Math.min(this.height - 1, Math.ceil(Math.max(ay, by, cy)));

        // Warn if triangle is very small
        const gridArea = Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2;
        if (gridArea < 3) {
            console.warn('Triangle area very small (<3 cells), may not flow correctly');
        }

        // Rasterize triangle using barycentric coordinate test
        for (let j = minY; j <= maxY; j++) {
            for (let i = minX; i <= maxX; i++) {
                // Test cell center (add 0.5 for pixel center)
                if (this._pointInTriangle(i + 0.5, j + 0.5, ax, ay, bx, by, cx, cy)) {
                    const idx = j * this.width + i;
                    this.obstacleData[idx] = 1.0;  // Mark as obstacle
                }
            }
        }

        // Store definition
        this.obstacles.push({ type: 'triangle', v0: a, v1: b, v2: c });
    }

    /**
     * Add convex polygon obstacle by triangulating with a fan from first vertex
     * 
     * @param {Array} vertices - Array of vertices [{x, y}, ...] in normalized coordinates
     *                          Must be convex and have at least 3 vertices
     */
    addPolygon(vertices) {
        // Validate inputs
        if (!Array.isArray(vertices) || vertices.length < 3) {
            console.warn('Polygon must have at least 3 vertices');
            return;
        }

        // Triangulate using fan from first vertex
        // For convex polygon with n vertices, creates n-2 triangles
        const v0 = vertices[0];
        for (let i = 1; i < vertices.length - 1; i++) {
            const v1 = vertices[i];
            const v2 = vertices[i + 1];
            this.addTriangle(v0, v1, v2);
        }

        // Store definition (after triangles are added to avoid double-counting)
        // Remove the triangle definitions and add polygon definition
        this.obstacles = this.obstacles.filter(obs => obs.type !== 'triangle' ||
            !(obs.v0.x === v0.x && obs.v0.y === v0.y));
        this.obstacles.push({ type: 'polygon', vertices: vertices.map(v => ({ x: v.x, y: v.y })) });
    }

    /**
     * Test if point (px, py) is inside triangle using barycentric coordinates
     * 
     * @param {number} px - Point x in grid coordinates
     * @param {number} py - Point y in grid coordinates  
     * @param {number} ax - Vertex A x in grid coordinates
     * @param {number} ay - Vertex A y in grid coordinates
     * @param {number} bx - Vertex B x in grid coordinates
     * @param {number} by - Vertex B y in grid coordinates
     * @param {number} cx - Vertex C x in grid coordinates
     * @param {number} cy - Vertex C y in grid coordinates
     * @returns {boolean} True if point is inside or on edge of triangle
     * 
     * Reference: Blackpawn "Point in Triangle" (https://blackpawn.com/texts/pointinpoly/)
     */
    _pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
        // Vectors from A to C, A to B, and A to P
        const v0x = cx - ax, v0y = cy - ay;
        const v1x = bx - ax, v1y = by - ay;
        const v2x = px - ax, v2y = py - ay;

        // Dot products
        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;

        // Compute barycentric coordinates
        const denom = dot00 * dot11 - dot01 * dot01;

        // Check for degenerate triangle (zero area)
        if (Math.abs(denom) < 1e-10) {
            return false;
        }

        const invDenom = 1.0 / denom;
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        // Check if point is in triangle (including edges)
        return (u >= 0) && (v >= 0) && (u + v <= 1);
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
