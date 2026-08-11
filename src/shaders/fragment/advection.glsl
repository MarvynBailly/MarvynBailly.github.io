/**
 * Advection Shader with Obstacles
 *
 * Implements semi-Lagrangian advection for unconditional stability.
 * Obstacles: solid cells carry nothing, and a back-trace that ends inside a
 * wall is walked back to the surface instead of being abandoned.
 *
 * References:
 * - math_foundations.md - Section 5 (Semi-Lagrangian Method)
 * - obstacle_math_foundations.md - Section 7 (Advection with Obstacles)
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uObstacles;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform vec2 uObstacleSize;   // Obstacle field dimensions, texels
uniform float uObstacleRange; // Full width of the stored distance range, texels
uniform float dt;
uniform float dissipation;

/** Distance from a point to the nearest surface, in obstacle texels */
float clearanceAt(vec2 uv) {
    return (0.5 - texture2D(uObstacles, uv).r) * uObstacleRange;
}

// Bilinear interpolation for manual filtering (WebGL1 fallback)
vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);

    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
    // Solid cells hold nothing. Clearing them every step stops dye from
    // collecting inside a wall and stops stale velocity leaking back out of one.
    float clearance = clearanceAt(vUv);
    if (clearance <= 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    #ifdef MANUAL_FILTERING
        // Manual bilinear filtering for devices without linear float filtering
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    #else
        // Use hardware linear filtering
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    #endif

    // How far the trace reaches, measured in obstacle texels
    float travel = length((coord - vUv) * uObstacleSize);

    // Distance is what makes this cheap: a trace shorter than the clearance
    // cannot reach any surface, which is the case almost everywhere and costs
    // nothing to establish. Only the rest gets marched.
    if (travel > clearance) {
        // Sphere-trace along the segment: step by the clearance at each point,
        // which cannot step past a surface. Testing only the end point - the old
        // behaviour - let a fast trace pass clean through a stroke and pick up
        // whatever was on the far side.
        float marched = clearance;
        float contact = -1.0;

        for (int i = 0; i < 6; i++) {
            if (contact < 0.0 && marched < travel) {
                float d = clearanceAt(mix(vUv, coord, marched / travel));
                if (d < 0.5) contact = marched;
                else marched = marched + d;
            }
        }

        if (contact >= 0.0) {
            // Stop just short of the wall, so the fluid slides along it instead
            // of piling up against it the way a frozen trace did.
            coord = mix(vUv, coord, max(contact - 0.5, 0.0) / travel);
        } else if (marched < travel) {
            // Ran out of steps: sample from the last point known to be clear
            coord = mix(vUv, coord, marched / travel);
        }

        // Belt and braces - never read from inside a wall
        if (clearanceAt(coord) <= 0.0) coord = vUv;
    }

    #ifdef MANUAL_FILTERING
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec4 result = texture2D(uSource, coord);
    #endif

    // Apply dissipation (exponential decay for physically correct attenuation)
    gl_FragColor = result * exp(-dissipation * dt);
}
