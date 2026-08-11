/**
 * Splat Shader
 *
 * Adds a Gaussian splat swept along the segment the source travelled this
 * frame - a capsule, not a disc. Used for user interaction (mouse/touch input).
 *
 * A stationary source has origin == point and the capsule collapses back to the
 * disc this always drew. A moving one does not: one disc per frame at the
 * current position beads as soon as the pointer covers more than about a
 * radius between frames, which at 1920 wide is only 40 pixels per frame.
 * Sweeping costs nothing - it replaces a point-to-point distance with a
 * point-to-segment one, in the same single pass.
 *
 * Obstacles mask the splat, so dragging across a solid pushes fluid around it
 * instead of injecting dye and momentum inside it.
 *
 * References:
 * - technical_analysis.md - Splat Shader
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uTarget;
uniform sampler2D uObstacles;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform vec2 origin;   // where the source was when it was last splatted
uniform float radius;

void main () {
    // Distance to the swept segment, measured in the aspect-corrected space
    // the Gaussian is round in.
    vec2 p = vUv - origin;
    vec2 travel = point - origin;
    p.x *= aspectRatio;
    travel.x *= aspectRatio;

    float span = dot(travel, travel);
    float t = span > 0.0 ? clamp(dot(p, travel) / span, 0.0, 1.0) : 0.0;
    p -= travel * t;

    // Fade out across the surface rather than at it: a hard cut would leave a
    // ring of injected momentum one texel outside the obstacle.
    float solid = smoothstep(0.42, 0.5, texture2D(uObstacles, vUv).r);

    // Gaussian splat
    vec3 splat = exp(-dot(p, p) / radius) * color * (1.0 - solid);
    vec3 base = texture2D(uTarget, vUv).xyz;

    gl_FragColor = vec4(base + splat, 1.0);
}
