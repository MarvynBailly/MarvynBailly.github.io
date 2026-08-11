/**
 * Splat Shader
 *
 * Adds Gaussian splat at specified position.
 * Used for user interaction (mouse/touch input).
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
uniform float radius;

void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;

    // Fade out across the surface rather than at it: a hard cut would leave a
    // ring of injected momentum one texel outside the obstacle.
    float solid = smoothstep(0.42, 0.5, texture2D(uObstacles, vUv).r);

    // Gaussian splat
    vec3 splat = exp(-dot(p, p) / radius) * color * (1.0 - solid);
    vec3 base = texture2D(uTarget, vUv).xyz;

    gl_FragColor = vec4(base + splat, 1.0);
}
