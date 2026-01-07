/**
 * Gradient Subtraction Shader with Obstacles
 * 
 * Subtracts pressure gradient from velocity to enforce incompressibility.
 * Obstacles: Set velocity to zero
 * 
 * References:
 * - math_foundations.md - Section 7.5 (Gradient Subtraction)
 * - obstacle_math_foundations.md - Section 6.3 (Gradient Subtraction with Obstacles)
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;

void main () {
    // If current cell is obstacle, set velocity to zero
    if (texture2D(uObstacles, vUv).r > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Normal gradient subtraction for fluid cells
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    
    // Subtract pressure gradient: v = v - ∇p
    // ∇p = ((p_right - p_left) / 2, (p_top - p_bottom) / 2)
    velocity.xy -= vec2(R - L, T - B);
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
