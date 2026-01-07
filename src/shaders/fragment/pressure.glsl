/**
 * Pressure Solver Shader (Jacobi Iteration) with Obstacles
 * 
 * Solves Poisson equation for pressure: ∇²p = div
 * One iteration of Jacobi relaxation method.
 * Obstacles: Neumann BC (∂p/∂n = 0), don't solve in obstacle cells
 * 
 * References:
 * - math_foundations.md - Section 7.4 (Jacobi Iteration)
 * - obstacle_math_foundations.md - Section 5.3 (Pressure with Obstacles)
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
uniform sampler2D uObstacles;

/**
 * Sample pressure with obstacle handling
 * If neighbor is obstacle, use Neumann BC (copy current cell pressure)
 */
float samplePressure(vec2 coords, float fallback) {
    if (texture2D(uObstacles, coords).r > 0.5) {
        return fallback;  // Neumann BC: ∂p/∂n = 0
    }
    return texture2D(uPressure, coords).x;
}

void main () {
    // Check if current cell is obstacle
    float obstacle = texture2D(uObstacles, vUv).r;
    
    if (obstacle > 0.5) {
        // Don't solve pressure in obstacles
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Sample current cell pressure (for Neumann BC fallback)
    float C = texture2D(uPressure, vUv).x;
    
    // Sample neighbors with obstacle handling
    float L = samplePressure(vL, C);
    float R = samplePressure(vR, C);
    float T = samplePressure(vT, C);
    float B = samplePressure(vB, C);
    
    float divergence = texture2D(uDivergence, vUv).x;
    
    // Jacobi iteration: p = (p_left + p_right + p_top + p_bottom - divergence) / 4
    float pressure = (L + R + B + T - divergence) * 0.25;
    
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
