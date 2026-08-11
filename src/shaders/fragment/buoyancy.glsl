/**
 * Buoyancy Shader
 *
 * Lifts fluid in proportion to how much dye it is carrying, which is what turns
 * a dye field into something that behaves like smoke or a warm plume rather
 * than a passive stain.
 *
 * The lift is a weighted dot product against the dye's channels rather than its
 * brightness, so different pigments can rise at different rates. That is the
 * whole mechanism behind the chromatography scene: give the cool ink a larger
 * weight than the warm one and a mixture separates itself as it climbs.
 *
 * References:
 * - scenes/library/chromatography.js - the scene this exists for
 * - physics/ForcesModule.js - applyBuoyancy
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform sampler2D uObstacles;
uniform vec3 uWeights;
uniform float uStrength;
uniform float dt;

void main () {
    vec2 velocity = texture2D(uVelocity, vUv).xy;

    // Solids do not float
    if (texture2D(uObstacles, vUv).r <= 0.5) {
        float lift = dot(texture2D(uDye, vUv).rgb, uWeights);
        velocity.y += uStrength * lift * dt;
    }

    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
