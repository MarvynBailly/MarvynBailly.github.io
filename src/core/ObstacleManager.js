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

        // Bodies that move. They are kept apart from `obstacles` because the
        // cost of the two is completely different: an obstacle is rasterised
        // once and then read for the rest of the session, a body is restamped
        // every frame. Splitting them is what lets the static field be cached
        // and a moving hull cost only its own footprint. See updateBodies().
        this.bodies = [];

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

        // Distance to the static obstacles alone, kept so a body can be stamped
        // over a copy of it rather than forcing a rebuild of everything.
        this.staticDistance = null;

        // What the bodies covered when they were last stamped, so the cells
        // they have since left can be handed back to the water.
        this.bodyRect = null;

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
     * Add a moving body, or move the one already under this id
     *
     * The outline is given in the body's own coordinates - centred on the
     * origin, pointing along +x - and placed by position, heading and length,
     * so a caller animating one only rewrites three numbers a frame and never
     * re-derives geometry.
     *
     * Position is SCREEN-normalised, unlike the obstacle definitions above:
     * a body drives around the canvas the visitor can see, and asking a caller
     * to steer in a frame that stops at the edge of the shorter axis would be
     * the coordinate bug this codebase keeps warning about. Length stays in
     * design units, so the boat is the same size on any window.
     *
     * @param {string} id - Identifier, so the same body can be moved each frame
     * @param {Object} spec - { vertices, x, y, angle, length }
     * @param {Array<{x: number, y: number}>} spec.vertices - Outline, one unit long
     * @param {number} spec.x - Position across the canvas, 0 to 1
     * @param {number} spec.y - Position up the canvas, 0 to 1
     * @param {number} [spec.angle] - Heading in radians, 0 pointing along +x
     * @param {number} [spec.length] - Length as a fraction of the shorter axis
     */
    setBody(id, spec) {
        if (!spec || !Array.isArray(spec.vertices) || spec.vertices.length < 3) {
            console.warn('Body needs an outline of at least 3 vertices');
            return;
        }
        if (!isFiniteNumber(spec.x) || !isFiniteNumber(spec.y)) {
            console.warn('Body needs a finite position');
            return;
        }

        let body = this.bodies.find(entry => entry.id === id);
        if (!body) {
            body = { id };
            this.bodies.push(body);
        }

        const design = this.designFromScreen(spec.x, spec.y);

        // Half-extents of the outline in its own frame, cached because they
        // depend only on the shape and the culling test below runs per cell.
        if (body.vertices !== spec.vertices) {
            let halfX = 0, halfY = 0;
            for (const v of spec.vertices) {
                halfX = Math.max(halfX, Math.abs(v.x));
                halfY = Math.max(halfY, Math.abs(v.y));
            }
            body.halfX = halfX;
            body.halfY = halfY;
        }

        body.vertices = spec.vertices;
        body.x = design.x;
        body.y = design.y;
        body.angle = isFiniteNumber(spec.angle) ? spec.angle : 0;
        body.length = isFiniteNumber(spec.length) ? Math.max(0.005, spec.length) : 1;
    }

    /**
     * Remove every moving body
     *
     * The field is not repainted here; the next updateBodies() sees bodies
     * where there is now none and hands their last footprint back to the water.
     */
    clearBodies() {
        this.bodies = [];
    }

    /**
     * Restamp the moving bodies into the field
     *
     * Only the cells the bodies cover now, plus the cells they covered last
     * time, are touched: everywhere else the static distance already in the
     * field is still correct. That is the whole reason the static field is
     * cached - a full rebuild is half a million distance evaluations and a
     * megabyte of fresh allocation, which is not something to do sixty times a
     * second for a hull that occupies a few thousand cells.
     *
     * @returns {{x: number, y: number, width: number, height: number}|null}
     *          Region that changed, in texels, or null if nothing did
     */
    updateBodies() {
        if (this.dirty) this._build();

        const primitives = [];
        let covered = null;

        for (const body of this.bodies) {
            const primitive = this._bodyToGrid(body);
            if (!primitive) continue;
            primitives.push(primitive);
            covered = unionBounds(covered, this._boundsOf(primitive));
        }

        // Nothing now and nothing before: the field is already what it should be
        if (!covered && !this.bodyRect) return null;

        const region = unionBounds(covered, this.bodyRect);
        this.bodyRect = covered;
        if (!region) return null;

        const { width, range } = this;
        const encode = 1 / (2 * range);
        const staticDistance = this.staticDistance;

        for (let j = region.j0; j <= region.j1; j++) {
            const row = j * width;
            const py = j + 0.5;
            for (let i = region.i0; i <= region.i1; i++) {
                const k = row + i;
                const px = i + 0.5;

                let d = staticDistance[k];
                for (const primitive of primitives) {
                    // One box distance stands in for seventeen edges wherever
                    // the hull is too far away to matter, which is most of the
                    // region once she is on a diagonal course.
                    if (primitive.bound(px, py) >= d) continue;
                    const bd = primitive.sd(px, py);
                    if (bd < d) d = bd;
                }

                const t = 0.5 - d * encode;
                this.field[k] = Math.round(255 * Math.max(0, Math.min(1, t)));
            }
        }

        return {
            x: region.i0,
            y: region.j0,
            width: region.i1 - region.i0 + 1,
            height: region.j1 - region.j0 + 1
        };
    }

    /**
     * Convert a screen-normalised point into design space
     *
     * Design space is square and pinned to the shorter axis, so on a wide
     * window it runs past 0 and 1 horizontally - which is exactly what a body
     * crossing the full canvas needs.
     *
     * @param {number} sx - 0 to 1 across the canvas
     * @param {number} sy - 0 to 1 up the canvas
     * @returns {{x: number, y: number}} Point in design coordinates
     */
    designFromScreen(sx, sy) {
        return {
            x: 0.5 + (sx - 0.5) * (this.width / this.scale),
            y: 0.5 + (sy - 0.5) * (this.height / this.scale)
        };
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
        const cells = width * height;

        // Reused across rebuilds: this is the one big allocation in the class,
        // and a scene change should not hand the collector a megabyte.
        if (!this.staticDistance || this.staticDistance.length !== cells) {
            this.staticDistance = new Float32Array(cells);
        }
        const distance = this.staticDistance;
        distance.fill(range);

        for (const definition of this.obstacles) {
            const primitive = this._toGrid(definition);
            if (!primitive) continue;

            const bounds = this._boundsOf(primitive);

            for (let j = bounds.j0; j <= bounds.j1; j++) {
                const row = j * width;
                const py = j + 0.5;
                for (let i = bounds.i0; i <= bounds.i1; i++) {
                    const d = primitive.sd(i + 0.5, py);
                    if (d < distance[row + i]) distance[row + i] = d;
                }
            }
        }

        // Encode: 0.5 is the surface, above it is solid, below it is fluid.
        const scale = 1 / (2 * range);
        for (let k = 0; k < cells; k++) {
            const t = 0.5 - distance[k] * scale;
            this.field[k] = Math.round(255 * Math.max(0, Math.min(1, t)));
        }

        // The field now holds the static obstacles only. Any bodies are stamped
        // back by the next updateBodies(), which must not credit itself with
        // having already painted a footprint this rebuild just erased.
        this.bodyRect = null;
        this.dirty = false;
    }

    /**
     * Grid-space distance primitive for a moving body at its current pose
     *
     * @private
     * @param {Object} body - Body record
     * @returns {Object|null} { minX, minY, maxX, maxY, sd(x, y) }
     */
    _bodyToGrid(body) {
        if (!body.vertices || body.vertices.length < 3) return null;

        const cos = Math.cos(body.angle);
        const sin = Math.sin(body.angle);
        const scale = this.scale;
        const offsetX = this.width / 2;
        const offsetY = this.height / 2;

        const verts = new Array(body.vertices.length);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (let n = 0; n < body.vertices.length; n++) {
            const v = body.vertices[n];

            // Scale and rotate in the body's own frame, then place it in design
            // space, then map design space onto the grid - one pass, so a vertex
            // is never held in an intermediate array between the three.
            const lx = v.x * body.length;
            const ly = v.y * body.length;
            const dx = body.x + lx * cos - ly * sin;
            const dy = body.y + lx * sin + ly * cos;

            const gx = (dx - 0.5) * scale + offsetX;
            const gy = (dy - 0.5) * scale + offsetY;

            verts[n] = { x: gx, y: gy };
            if (gx < minX) minX = gx;
            if (gx > maxX) maxX = gx;
            if (gy < minY) minY = gy;
            if (gy > maxY) maxY = gy;
        }

        // A box drawn round the outline in the body's own frame, used to skip
        // the polygon for cells that cannot possibly be near it. An oriented
        // box is worth the trouble over the axis-aligned one above: a hull on a
        // diagonal course fills barely a third of its axis-aligned bounds, and
        // the polygon distance costs seventeen edges where this costs one.
        const centreX = (body.x - 0.5) * scale + offsetX;
        const centreY = (body.y - 0.5) * scale + offsetY;
        const halfX = body.halfX * body.length * scale;
        const halfY = body.halfY * body.length * scale;

        return {
            minX, maxX, minY, maxY,
            sd: (px, py) => sdPolygon(px, py, verts),

            /**
             * A lower bound on the distance to the outline
             *
             * The outline is contained in the box, so nothing can be nearer to
             * the outline than it is to the box. Where the bound already loses
             * to the distance in hand, the polygon cannot win either.
             */
            bound: (px, py) => {
                const rx = px - centreX;
                const ry = py - centreY;
                const bx = Math.abs(rx * cos + ry * sin) - halfX;
                const by = Math.abs(ry * cos - rx * sin) - halfY;

                // Deliberately not Math.hypot: it is overflow-safe and several
                // times slower, and this runs a few thousand times a frame for
                // the sole purpose of being cheaper than what it replaces.
                if (bx <= 0 && by <= 0) return bx > by ? bx : by;
                const ox = bx > 0 ? bx : 0;
                const oy = by > 0 ? by : 0;
                return Math.sqrt(ox * ox + oy * oy);
            }
        };
    }

    /**
     * Cells a primitive can reach, grown by the stored range and clamped
     *
     * @private
     * @param {Object} primitive - Grid-space primitive
     * @returns {{i0: number, i1: number, j0: number, j1: number}} Bounds
     */
    _boundsOf(primitive) {
        const { width, height, range } = this;
        return {
            i0: clampInt(Math.floor(primitive.minX - range), 0, width - 1),
            i1: clampInt(Math.ceil(primitive.maxX + range), 0, width - 1),
            j0: clampInt(Math.floor(primitive.minY - range), 0, height - 1),
            j1: clampInt(Math.ceil(primitive.maxY + range), 0, height - 1)
        };
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

/**
 * Smallest bounds containing both, treating null as "nothing yet"
 *
 * @param {Object|null} a - Bounds or null
 * @param {Object|null} b - Bounds or null
 * @returns {Object|null} Union, or null if both were null
 */
function unionBounds(a, b) {
    if (!a) return b;
    if (!b) return a;
    return {
        i0: Math.min(a.i0, b.i0),
        i1: Math.max(a.i1, b.i1),
        j0: Math.min(a.j0, b.j0),
        j1: Math.max(a.j1, b.j1)
    };
}

function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, value | 0));
}
