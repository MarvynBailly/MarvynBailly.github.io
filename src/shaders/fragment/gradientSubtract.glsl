/**
 * Gradient Subtraction Shader with Obstacles
 *
 * Subtracts pressure gradient from velocity to enforce incompressibility, then
 * conditions the velocity that is left against any nearby wall.
 *
 * The pressure solve is a fixed number of Jacobi sweeps, so it never fully
 * converges and always leaves a little flow pointing into the obstacle - which
 * is what let dye bleed through the thinner strokes. Removing the inward normal
 * component here, over a narrow band around the surface, closes that gap; the
 * same band applies tangential friction, which is what actually sheds vortices
 * off the edges instead of letting the fluid slide by untouched.
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
uniform float uWallBand;
uniform float uWallSlip;
uniform float uInletSpeed;

/**
 * Sample pressure with obstacle handling
 * If neighbor is obstacle, use Neumann BC (dp/dn = 0)
 */
float samplePressure(vec2 coords, float fallback) {
    if (texture2D(uObstacles, coords).r > 0.5) {
        return fallback;  // Neumann BC: dp/dn = 0
    }
    return texture2D(uPressure, coords).x;
}

void main () {
    float solid = texture2D(uObstacles, vUv).r;

    // If current cell is obstacle, set velocity to zero
    if (solid > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

#ifdef CHANNEL_BC
    // The inlet column is driven, not solved: the pressure correction would
    // otherwise erode the very condition the divergence stencil imposes.
    if (vL.x < 0.0) {
        gl_FragColor = vec4(uInletSpeed, 0.0, 0.0, 1.0);
        return;
    }
#endif

#ifdef OUTLET_BC
    // The outlet column keeps whatever it has and leaves.
    //
    // vR leaves the domain on exactly the column the divergence stencil calls
    // the outlet, which is the point: a plain `vUv.x >= 0.99` covers five
    // columns on a 1920x1080 sim grid and nine at twice the device pixel
    // ratio, so the width of the unprojected strip - and with it the boundary
    // condition - depended on the size of the window.
    //
    // One way only, matching the divergence stencil: this column is the last
    // thing that touches the velocity, so without the clamp here the pressure
    // correction upstream can put the inflow straight back.
    if (vR.x > 1.0) {
        vec2 outlet = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(max(outlet.x, 0.0), outlet.y, 0.0, 1.0);
        return;
    }
#endif

    // Sample current cell pressure (for Neumann BC fallback)
    float C = texture2D(uPressure, vUv).x;

    // Sample neighbors with obstacle handling
    float L = samplePressure(vL, C);
    float R = samplePressure(vR, C);
    float T = samplePressure(vT, C);
    float B = samplePressure(vB, C);

    vec2 velocity = texture2D(uVelocity, vUv).xy;

    // Subtract pressure gradient: v = v - grad(p)
    // grad(p) = ((p_right - p_left) / 2, (p_top - p_bottom) / 2)
    velocity.xy -= 0.5 * vec2(R - L, T - B);

    // Wall conditioning, faded in over the band before the surface
    float proximity = smoothstep(uWallBand, 0.5, solid);
    if (proximity > 0.0) {
        // The obstacle field rises towards a solid, so its gradient is the wall
        // normal, pointing from the fluid into the wall.
        vec2 gradient = vec2(
            texture2D(uObstacles, vR).r - texture2D(uObstacles, vL).r,
            texture2D(uObstacles, vT).r - texture2D(uObstacles, vB).r
        );

        float slope = length(gradient);
        if (slope > 0.0001) {
            vec2 normal = gradient / slope;
            float into = dot(velocity, normal);
            vec2 tangent = velocity - into * normal;

            // No penetration: cancel flow heading into the wall, leave flow
            // heading away from it alone.
            velocity -= normal * max(into, 0.0) * proximity;

            // Friction: bleed off tangential speed inside the boundary layer.
            velocity -= tangent * (1.0 - uWallSlip) * proximity;
        }
    }

    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
