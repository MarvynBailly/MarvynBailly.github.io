/**
 * Curl Shader
 * 
 * Computes curl (vorticity) of velocity field in 2D.
 * curl = ∂v/∂x - ∂u/∂y
 * 
 * References:
 * - math_foundations.md - Section 9.1 (Vorticity)
 * - technical_analysis.md - Curl Shader
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
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    
    // curl = ∂v/∂x - ∂u/∂y = (R - L) / 2 - (T - B) / 2
    float vorticity = R - L - T + B;
    
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
