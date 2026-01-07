/**
 * Divergence Shader with Obstacles
 * 
 * Computes divergence of velocity field: ∇ · u
 * Obstacles: No-slip BC (reflect velocity)
 * 
 * References:
 * - math_foundations.md - Section 4.1 (Spatial Discretization)
 * - obstacle_math_foundations.md - Section 6.2 (Divergence with Obstacles)
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;

/**
 * Sample velocity component with boundary handling
 * Handles both domain boundaries and obstacles
 */
float sampleVelocity(vec2 coords, float currentComponent, float normalSample) {
    // Check domain boundary first
    if (coords.x < 0.0 || coords.x > 1.0 || coords.y < 0.0 || coords.y > 1.0) {
        return -currentComponent;  // Domain boundary: no-slip
    }
    
    // Check obstacle
    if (texture2D(uObstacles, coords).r > 0.5) {
        return -currentComponent;  // Obstacle: no-slip (reflect)
    }
    
    return normalSample;  // Normal fluid cell
}

void main () {
    vec2 C = texture2D(uVelocity, vUv).xy;
    
    // Sample velocity neighbors with obstacle handling
    float L = sampleVelocity(vL, C.x, texture2D(uVelocity, vL).x);
    float R = sampleVelocity(vR, C.x, texture2D(uVelocity, vR).x);
    float T = sampleVelocity(vT, C.y, texture2D(uVelocity, vT).y);
    float B = sampleVelocity(vB, C.y, texture2D(uVelocity, vB).y);
    
    // Compute divergence using central differences
    // div = (∂u/∂x + ∂v/∂y) = (R - L) / 2 + (T - B) / 2
    float div = 0.5 * (R - L + T - B);
    
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
