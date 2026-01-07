/**
 * Pressure Solver Shader (Jacobi Iteration)
 * 
 * Solves Poisson equation for pressure: ∇²p = div
 * One iteration of Jacobi relaxation method.
 * 
 * References:
 * - math_foundations.md - Section 7.4 (Jacobi Iteration)
 * - technical_analysis.md - Pressure Solver
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    
    // Jacobi iteration: p = (p_left + p_right + p_top + p_bottom - divergence) / 4
    float pressure = (L + R + B + T - divergence) * 0.25;
    
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
