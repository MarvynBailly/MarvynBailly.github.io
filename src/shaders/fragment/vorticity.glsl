/**
 * Vorticity Confinement Shader
 *
 * Applies vorticity confinement force to counteract numerical dissipation.
 * Restores small-scale rolling motions.
 *
 * Obstacles: the force fades out over the last cells before a surface. Pushing
 * a confinement force straight into a wall only fights the pressure solve and
 * shows up as jitter along the edge.
 *
 * The direction of the force is a normalised gradient of |curl|, and a solid
 * cell holds curl 0 - not because the vorticity there is zero but because
 * there is no fluid there. Differencing against that value put a cliff in
 * |curl| along every surface, and a force perpendicular to a cliff runs along
 * it. Solid neighbours therefore fall back to this cell's own value, the same
 * Neumann treatment the pressure solve uses.
 *
 * References:
 * - math_foundations.md - Section 9.2 (Vorticity Confinement)
 * - technical_analysis.md - Vorticity Shader
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform sampler2D uObstacles;
uniform float uWallBand;
uniform float curl;
uniform float dt;

/**
 * Sample curl, treating a solid neighbour as a copy of this cell
 *
 * @param coords - Neighbour texture coordinate
 * @param fallback - This cell's curl
 */
float sampleCurl(vec2 coords, float fallback) {
    if (texture2D(uObstacles, coords).r > 0.5) {
        return fallback;
    }
    return texture2D(uCurl, coords).x;
}

void main () {
    float solid = texture2D(uObstacles, vUv).r;
    if (solid > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float C = texture2D(uCurl, vUv).x;
    float L = sampleCurl(vL, C);
    float R = sampleCurl(vR, C);
    float T = sampleCurl(vT, C);
    float B = sampleCurl(vB, C);

    // Compute gradient of vorticity magnitude
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));

    // Normalize and scale by vorticity
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    // Taper to nothing at the wall
    force *= 1.0 - smoothstep(uWallBand, 0.5, solid);

    // Add confinement force to velocity
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;

    // Clamp to prevent explosion
    velocity = min(max(velocity, -1000.0), 1000.0);

    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
