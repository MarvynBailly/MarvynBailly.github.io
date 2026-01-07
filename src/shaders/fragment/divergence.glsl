/**
 * Divergence Shader
 * 
 * Computes divergence of velocity field: ∇ · u
 * Uses central differences with boundary handling.
 * 
 * References:
 * - math_foundations.md - Section 4.1 (Spatial Discretization)
 * - technical_analysis.md - Divergence Shader
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;

void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    
    // Boundary conditions: reflect velocity at boundaries
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    
    // Compute divergence using central differences
    // div = (∂u/∂x + ∂v/∂y) = (R - L) / 2 + (T - B) / 2
    float div = 0.5 * (R - L + T - B);
    
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
