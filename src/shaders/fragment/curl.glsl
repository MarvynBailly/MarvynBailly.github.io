/**
 * Curl Shader with Obstacles
 *
 * Computes curl (vorticity) of velocity field in 2D.
 * Obstacles: free-slip ghost values, so a wall contributes no vorticity of its
 * own. Reading the zero velocity stored inside a solid - the old behaviour -
 * looked like an enormous shear layer and made vorticity confinement fire along
 * every edge of the obstacle.
 *
 * References:
 * - math_foundations.md - Section 9.1 (Vorticity)
 * - obstacle_math_foundations.md - Section 8.3 (Vorticity with Obstacles)
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

void main () {
    // Skip vorticity computation in obstacles
    if (texture2D(uObstacles, vUv).r > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec2 C = texture2D(uVelocity, vUv).xy;

    // The curl stencil only ever uses the component tangential to each
    // neighbour direction, so mirroring the cell's own value across a solid
    // face is exactly the free-slip ghost: zero normal flow, tangential flow
    // untouched.
    float L = texture2D(uObstacles, vL).r > 0.5 ? C.y : texture2D(uVelocity, vL).y;
    float R = texture2D(uObstacles, vR).r > 0.5 ? C.y : texture2D(uVelocity, vR).y;
    float T = texture2D(uObstacles, vT).r > 0.5 ? C.x : texture2D(uVelocity, vT).x;
    float B = texture2D(uObstacles, vB).r > 0.5 ? C.x : texture2D(uVelocity, vB).x;

    // curl = dv/dx - du/dy = (R - L) / 2 - (T - B) / 2
    float vorticity = R - L - T + B;

    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
