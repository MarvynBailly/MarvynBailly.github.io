/**
 * ASCII Shader
 *
 * Draws the finished picture as text, one glyph per cell, entirely on the GPU.
 *
 * uSample holds the ordinary display pass at 2 x 4 texels per cell. Each
 * fragment works out which cell it is in, reads that cell's eight texels, and
 * decides what the cell says:
 *
 *   - how much is there picks a glyph from the density ramp;
 *   - a sharp change across the cell replaces it with a stroke along the edge,
 *     which is what resolves a filament thinner than the cell;
 *   - a cell inside an obstacle is blank, or a stroke along the surface if it
 *     borders open water, read from the distance field because the contour
 *     is thinner than a cell and would average away.
 *
 * The glyph is then looked up in uAtlas, a single row of glyph boxes drawn by
 * the browser's own text renderer, and its coverage blends ink over ground.
 *
 * References:
 * - rendering/AsciiRenderer.js - atlas layout and every uniform below
 */

precision highp float;
precision highp sampler2D;

uniform sampler2D uSample;
uniform sampler2D uAtlas;
uniform sampler2D uGradient;
uniform sampler2D uObstacles;

uniform vec2 uOrigin;          // bottom-left of the area drawn into, device pixels
uniform vec2 uCellOffset;      // grid cell shown at that corner, for drawing a crop
uniform vec2 uSampleSize;      // uSample size in texels: cols * 2, rows * 4
uniform vec2 uGrid;            // cols, rows
uniform vec2 uCell;            // cell size in device pixels

uniform vec2 uGlyphSize;       // one glyph's box in the atlas, texels
uniform vec2 uAtlasSize;       // atlas size, texels
uniform float uRampSteps;      // density ramp length; strokes follow it
uniform float uFloor;          // brightness of empty fluid
uniform float uRange;          // brightness span above uFloor the dye reaches
uniform float uEdgeThreshold;  // edge strength, as a fraction of uRange

uniform float uUseGradient;    // 1: colour from uGradient, 0: the dye's own
uniform vec3 uGround;
uniform vec3 uEdgeColor;

uniform float uShowObstacles;
uniform float uObstacleRange2; // field encoding: distance = (0.5 - stored) * this

const float SAMPLES_X = 2.0;
const float SAMPLES_Y = 4.0;

vec3 fetch(vec2 texel) {
    return texture2D(uSample, (texel + 0.5) / uSampleSize).rgb;
}

float brightest(vec3 c) {
    return max(c.r, max(c.g, c.b));
}

/**
 * Atlas index of the stroke running across a normal
 *
 * n is in screen units, x rightward and y upward. Strokes sit right after
 * the ramp: | \ - /
 */
float strokeAcross(vec2 n) {
    float angle = mod(degrees(atan(n.y, n.x)) + 180.0, 180.0);
    if (angle < 22.5 || angle >= 157.5) return uRampSteps;
    if (angle < 67.5) return uRampSteps + 1.0;
    if (angle < 112.5) return uRampSteps + 2.0;
    return uRampSteps + 3.0;
}

/**
 * Signed distance to the obstacles at a cell's centre, in field texels
 */
float obstacleDistance(vec2 cell) {
    vec2 uv = (clamp(cell, vec2(0.0), uGrid - 1.0) + 0.5) / uGrid;
    return (0.5 - texture2D(uObstacles, uv).r) * uObstacleRange2;
}

void main () {
    // Rows count up from the bottom, like the sample texture
    vec2 position = (gl_FragCoord.xy - uOrigin) / uCell;
    vec2 cell = floor(position) + uCellOffset;
    vec2 local = fract(position);

    float glyph = 0.0;
    vec3 ink = uEdgeColor;

    float inside = -1.0;
    if (uShowObstacles > 0.5) inside = obstacleDistance(cell);

    if (inside < 0.0 && uShowObstacles > 0.5) {
        // Only the boundary is drawn - a solid cell with open water beside it
        float left = obstacleDistance(cell - vec2(1.0, 0.0));
        float right = obstacleDistance(cell + vec2(1.0, 0.0));
        float up = obstacleDistance(cell + vec2(0.0, 1.0));
        float down = obstacleDistance(cell - vec2(0.0, 1.0));

        if (max(max(left, right), max(up, down)) >= 0.0) {
            // A cell is twice as tall as it is wide, so the vertical
            // difference covers twice the distance
            glyph = strokeAcross(vec2(right - left, (up - down) * 0.5));
        }
    } else {
        // Average the cell's colour; keep brightness per half for edges
        vec2 base = cell * vec2(SAMPLES_X, SAMPLES_Y);
        vec3 sum = vec3(0.0);
        float left = 0.0, right = 0.0, top = 0.0, bottom = 0.0;

        for (float sy = 0.0; sy < SAMPLES_Y; sy += 1.0) {
            for (float sx = 0.0; sx < SAMPLES_X; sx += 1.0) {
                vec3 c = fetch(base + vec2(sx, sy));
                float v = brightest(c);
                sum += c;
                if (sx < SAMPLES_X * 0.5) left += v; else right += v;
                if (sy < SAMPLES_Y * 0.5) bottom += v; else top += v;
            }
        }

        vec3 color = sum / (SAMPLES_X * SAMPLES_Y);
        float peak = brightest(color);
        float level = (peak - uFloor) / uRange;
        // A fixed jitter per cell, up to a step either way, on where the
        // glyph steps fall. Without it a smooth gradient - the night sky -
        // crosses a step along a hard line and a band of glyphs starts dead
        // straight; with it the next glyph comes in a few cells at a time.
        float jitter = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        float step = min(uRampSteps - 1.0, floor(level * uRampSteps + jitter * 0.9));

        if (step > 0.0) {
            // Strength is the plain difference between halves, so an edge
            // counts the same whichever way it runs. Direction corrects for
            // the halves' centres being half a cell apart across but a whole
            // cell width apart vertically.
            float halfCount = SAMPLES_X * SAMPLES_Y * 0.5;
            float dx = (right - left) / halfCount;
            float dy = (top - bottom) / halfCount;
            float edge = length(vec2(dx, dy)) / uRange;

            glyph = edge > uEdgeThreshold ? strokeAcross(vec2(2.0 * dx, dy)) : step;

            if (uUseGradient > 0.5) {
                ink = texture2D(uGradient, vec2(clamp(level, 0.0, 1.0), 0.5)).rgb;
            } else {
                // The glyph already says how much is there, so the colour is
                // lifted toward full brightness rather than dimmed twice
                ink = color * ((0.45 + 0.55 * peak) / max(peak, 1e-3));
            }
        }
    }

    float coverage = 0.0;
    if (glyph > 0.0) {
        // Each box has a texel of clear space round it, so filtering at a
        // cell's edge never reaches into the next glyph
        vec2 texel = vec2(glyph * (uGlyphSize.x + 2.0), 0.0) + 1.0 + local * uGlyphSize;
        coverage = texture2D(uAtlas, texel / uAtlasSize).a;
    }

    gl_FragColor = vec4(mix(uGround, ink, coverage), 1.0);
}
