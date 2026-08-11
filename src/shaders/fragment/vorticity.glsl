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

void main () {
    float solid = texture2D(uObstacles, vUv).r;
    if (solid > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

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
