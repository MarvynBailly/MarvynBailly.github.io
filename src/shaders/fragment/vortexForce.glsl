/**
 * Vortex Force Shader
 *
 * Drives a disc of fluid toward solid-body rotation about a centre, fading to
 * nothing at the edge of the disc so the corners of the canvas stay still.
 *
 * This relaxes velocity toward the rotation rather than adding a force to it.
 * Adding acceleration every frame in a closed box has nowhere to go: energy
 * accumulates until the field is noise. Relaxing toward a target is stable
 * however long the page is left open, and still lets a visitor's drag deform
 * the flow before it is wound back in.
 *
 * References:
 * - scenes/library/vortex-well.js - the scene this exists for
 * - physics/ForcesModule.js - applyVortex
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;
uniform vec2 uCenter;
uniform float uRate;        // Radians per second
uniform float uFalloff;     // Radius, in screen heights, where the swirl dies
uniform float uStiffness;   // How quickly the field is pulled onto the target
uniform float uCellsPerUnit;
uniform float aspectRatio;
uniform float dt;

void main () {
    vec2 velocity = texture2D(uVelocity, vUv).xy;

    if (texture2D(uObstacles, vUv).r <= 0.5) {
        // Work in screen heights so the disc stays circular on any window
        vec2 offset = vUv - uCenter;
        offset.x *= aspectRatio;

        float weight = 1.0 - smoothstep(uFalloff * 0.55, uFalloff, length(offset));

        if (weight > 0.0) {
            // Perpendicular has the same length as the offset, so this is the
            // solid-body profile: tangential speed proportional to radius.
            vec2 target = vec2(-offset.y, offset.x) * uRate * uCellsPerUnit;
            velocity = mix(velocity, target, clamp(weight * uStiffness * dt, 0.0, 1.0));
        }
    }

    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
