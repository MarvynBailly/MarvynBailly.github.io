/**
 * Obstacle Manager
 *
 * Builds the field the simulation uses for solid boundaries. Obstacles are
 * declared in *design space* - a square [0, 1] frame, y up, centred on the
 * canvas - and rasterised into a grid that shares the canvas aspect ratio, so a
 * shape keeps its proportions on any screen instead of stretching with it.
 *
 * The field stores signed distance, not a binary mask. Each cell holds the
 * distance to the nearest surface in grid texels, clamped to +/- `range` and
 * encoded into a byte as:
 *
 *     stored = 0.5 - distance / (2 * range)
 *
 * so `stored > 0.5` still means "solid", exactly as the shaders always tested,
 * while everything else that was previously impossible comes for free:
 * sub-texel surface positions, smooth wall normals from the field gradient, and
 * a silhouette that can be resolved at screen resolution instead of grid
 * resolution.
 *
 * References:
 * - architecture/obstacle_system_design.md - ObstacleManager specification
 * - utils/sdf.js - the primitive distance functions
 */

import { sdCircle, sdBox, sdPolygon } from '../utils/sdf.js';

/** Distance stored either side of a surface, in grid texels */
export const DEFAULT_SDF_RANGE = 12;

export class ObstacleManager {
    /**
     * @param {number} width - Field width in texels
     * @param {number} height - Field height in texels
     * @param {Config} config - Configuration reference
     */
    constructor(width, height, config) {
        this.config = config;
        this.range = (config && config.OBSTACLE_SDF_RANGE) || DEFAULT_SDF_RANGE;
        this.obstacles = [];

        this.setResolution(width, height);

        if (config && config.DEFAULT_OBSTACLES && config.DEFAULT_OBSTACLES.length > 0) {
            config.DEFAULT_OBSTACLES.forEach(obs => this.addObstacle(obs));
        }
    }

    /**
     * Resize the field, keeping the obstacles that are already defined
     *
     * @param {number} width - New field width in texels
     * @param {number} height - New field height in texels
     */
    setResolution(width, height) {
        this.width = Math.max(1, Math.floor(width));
        this.height = Math.max(1, Math.floor(height));

        // One design unit spans the shorter axis, so the design frame is always
        // square on screen no matter how the window is shaped.
        this.scale = Math.min(this.width, this.height);

        this.field = new Uint8Array(this.width * this.height);
        this.dirty = true;
    }

    /**
     * Add an obstacle from a definition object
     *
     * @param {Object} definition - { type: 'circle'|'rectangle'|'triangle'|'polygon', ... }
     */
    addObstacle(definition) {
        if (!definition || !definition.type) {
            console.warn('Obstacle definition missing a type');
            return;
        }

        switch (definition.type) {
            case 'circle':
                this.addCircle(definition.x, definition.y, definition.radius);
                break;
            case 'rectangle':
                this.addRectangle(definition.x, definition.y, definition.width, definition.height);
                break;
            case 'triangle':
                this.addTriangle(definition.v0, definition.v1, definition.v2);
                break;
            case 'polygon':
                this.addPolygon(definition.vertices);
                break;
            default:
                console.warn(`Unknown obstacle type: ${definition.type}`);
        }
    }

    /**
     * Add a circular obstacle
     *
     * @param {number} cx - Centre x in design coordinates
     * @param {number} cy - Centre y in design coordinates
     * @param {number} radius - Radius in design units
     */
    addCircle(cx, cy, radius) {
        if (!isFiniteNumber(cx) || !isFiniteNumber(cy) || !isFiniteNumber(radius)) {
            console.warn('Invalid circle obstacle');
            return;
        }

        this.obstacles.push({
            type: 'circle',
            x: cx,
            y: cy,
            radius: Math.max(0.005, Math.min(0.5, radius))
        });
        this.dirty = true;
    }

    /**
     * Add a rectangular obstacle
     *
     * @param {number} x - Left edge in design coordinates
     * @param {number} y - Bottom edge in design coordinates
     * @param {number} width - Width in design units
     * @param {number} height - Height in design units
     */
    addRectangle(x, y, width, height) {
        if (!isFiniteNumber(x) || !isFiniteNumber(y) ||
            !isFiniteNumber(width) || !isFiniteNumber(height)) {
            console.warn('Invalid rectangle obstacle');
            return;
        }

        this.obstacles.push({
            type: 'rectangle',
            x,
            y,
            width: Math.max(0.005, width),
            height: Math.max(0.005, height)
        });
        this.dirty = true;
    }

    /**
     * Add a triangular obstacle
     *
     * @param {Object} v0 - First vertex {x, y} in design coordinates
     * @param {Object} v1 - Second vertex
     * @param {Object} v2 - Third vertex
     */
    addTriangle(v0, v1, v2) {
        this.addPolygon([v0, v1, v2]);
    }

    /**
     * Add a polygonal obstacle
     *
     * Unlike the previous fan-triangulating version this accepts concave
     * outlines: the distance function signs points by ray crossings, which does
     * not care about convexity or vertex order.
     *
     * @param {Array<{x: number, y: number}>} vertices - Ordered vertices
     */
    addPolygon(vertices) {
        if (!Array.isArray(vertices) || vertices.length < 3) {
            console.warn('Polygon must have at least 3 vertices');
            return;
        }

        const clean = vertices.filter(v => v && isFiniteNumber(v.x) && isFiniteNumber(v.y));
        if (clean.length !== vertices.length) {
            console.warn('Polygon has invalid vertices');
            return;
        }

        this.obstacles.push({
            type: 'polygon',
            vertices: clean.map(v => ({ x: v.x, y: v.y }))
        });
        this.dirty = true;
    }

    /**
     * Get the encoded distance field, rebuilding it if obstacles changed
     *
     * @returns {Uint8Array} Field data, one byte per texel
     */
    getField() {
        if (this.dirty) this._build();
        return this.field;
    }

    /**
     * Remove all obstacles
     */
    clear() {
        this.obstacles = [];
        this.dirty = true;
    }

    /**
     * @returns {number} Number of obstacles
     */
    getObstacleCount() {
        return this.obstacles.length;
    }

    /**
     * Rasterise every obstacle into the distance field
     *
     * Each primitive is only evaluated over its own bounding box grown by
     * `range`, because outside that band the distance is clamped anyway. Cells
     * no primitive reaches keep the "far outside" value.
     *
     * @private
     */
    _build() {
        const { width, height, range } = this;
        const distance = new Float32Array(width * height).fill(range);

        for (const definition of this.obstacles) {
            const primitive = this._toGrid(definition);
            if (!primitive) continue;

            const i0 = clampInt(Math.floor(primitive.minX - range), 0, width - 1);
            const i1 = clampInt(Math.ceil(primitive.maxX + range), 0, width - 1);
            const j0 = clampInt(Math.floor(primitive.minY - range), 0, height - 1);
            const j1 = clampInt(Math.ceil(primitive.maxY + range), 0, height - 1);

            for (let j = j0; j <= j1; j++) {
                const row = j * width;
                const py = j + 0.5;
                for (let i = i0; i <= i1; i++) {
                    const d = primitive.sd(i + 0.5, py);
                    if (d < distance[row + i]) distance[row + i] = d;
                }
            }
        }

        // Encode: 0.5 is the surface, above it is solid, below it is fluid.
        const scale = 1 / (2 * range);
        for (let k = 0; k < distance.length; k++) {
            const t = 0.5 - distance[k] * scale;
            this.field[k] = Math.round(255 * Math.max(0, Math.min(1, t)));
        }

        this.dirty = false;
    }

    /**
     * Convert a design-space definition into a grid-space distance primitive
     *
     * @private
     * @param {Object} definition - Obstacle definition
     * @returns {Object|null} { minX, minY, maxX, maxY, sd(x, y) }
     */
    _toGrid(definition) {
        const scale = this.scale;
        const offsetX = this.width / 2;
        const offsetY = this.height / 2;
        const gx = (x) => (x - 0.5) * scale + offsetX;
        const gy = (y) => (y - 0.5) * scale + offsetY;

        if (definition.type === 'circle') {
            const cx = gx(definition.x);
            const cy = gy(definition.y);
            const r = definition.radius * scale;
            return {
                minX: cx - r, maxX: cx + r,
                minY: cy - r, maxY: cy + r,
                sd: (px, py) => sdCircle(px, py, cx, cy, r)
            };
        }

        if (definition.type === 'rectangle') {
            const x0 = gx(definition.x);
            const y0 = gy(definition.y);
            const hx = definition.width * scale / 2;
            const hy = definition.height * scale / 2;
            const cx = x0 + hx;
            const cy = y0 + hy;
            return {
                minX: cx - hx, maxX: cx + hx,
                minY: cy - hy, maxY: cy + hy,
                sd: (px, py) => sdBox(px, py, cx, cy, hx, hy)
            };
        }

        if (definition.type === 'polygon') {
            const verts = definition.vertices.map(v => ({ x: gx(v.x), y: gy(v.y) }));
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const v of verts) {
                minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
                minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
            }
            return {
                minX, maxX, minY, maxY,
                sd: (px, py) => sdPolygon(px, py, verts)
            };
        }

        return null;
    }
}

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, value | 0));
}
