/**
 * Wave Step Shader
 *
 * One time step of the 2D wave equation on the lake's surface,
 *
 *     h_tt = c^2 (h_xx + h_yy),
 *
 * by the standard leapfrog scheme: each texel holds the height now (r) and the
 * height one step ago (g), and the next height is the current one carried on
 * at its current rate of change plus the pull of its neighbours.
 *
 *     h' = h + damping * (h - h_prev) + c^2 * laplacian(h)
 *
 * c^2 is in grid units and must stay under 0.5 for the scheme to be stable in
 * two dimensions. Damping slightly under 1 lets ripples die away rather than
 * ringing round the lake forever. Clamped texture edges give a reflecting
 * shore, so rings bounce back off the sides.
 *
 * References:
 * - physics/WaterModule.js - drives this
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uField;
uniform float uSpeed2;
uniform float uDamping;

void main () {
    vec2 h = texture2D(uField, vUv).rg;
    float laplacian = texture2D(uField, vL).r + texture2D(uField, vR).r +
                      texture2D(uField, vT).r + texture2D(uField, vB).r - 4.0 * h.r;

    float next = h.r + uDamping * (h.r - h.g) + uSpeed2 * laplacian;

    // A whisper of absolute decay as well, so the surface always settles back
    // to flat rather than drifting off on accumulated rounding
    gl_FragColor = vec4(next * 0.9995, h.r, 0.0, 1.0);
}
