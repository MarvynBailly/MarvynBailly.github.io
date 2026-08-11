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
uniform float uInletSpeed;

/**
 * Sample velocity component with boundary handling
 * Handles both domain boundaries and obstacles
 */
float sampleVelocity(vec2 coords, float currentComponent, float normalSample) {
#ifdef CHANNEL_BC
    // Inlet: a ghost chosen so the interpolated face velocity is exactly the
    // inlet speed. Imposing it here rather than by writing cells is the whole
    // difference between a channel and a box with a fan in it - a value written
    // into the field is simply removed again by the next projection.
    if (coords.x < 0.0) {
        return 2.0 * uInletSpeed - currentComponent;
    }
#else
    if (coords.x < 0.0) {
        return -currentComponent;  // No-slip on the left
    }
#endif

#ifdef OUTLET_BC
    // Outlet: zero gradient, so fluid leaves instead of reflecting - but one
    // way only.
    //
    // Nothing feeds this domain but the scene's own emitters, which add
    // momentum rather than mass. An outlet that admits inflow is therefore a
    // mass source with nothing to balance it, and the projection will use it as
    // one: starting from a dead still field, a two-way outlet built a
    // right-to-left jet of around 700 cells/s within thirty seconds and kept it.
    // Clamping is a no-op wherever the flow is already leaving.
    if (coords.x > 1.0) {
        return max(currentComponent, 0.0);
    }
#else
    // No-slip on right edge (default)
    if (coords.x > 1.0) {
        return -currentComponent;
    }
#endif

    // Top and bottom. Only the wall-normal component reaches this stencil, so
    // reflecting it is what free slip and no slip have in common.
    if (coords.y < 0.0 || coords.y > 1.0) {
        return -currentComponent;
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
