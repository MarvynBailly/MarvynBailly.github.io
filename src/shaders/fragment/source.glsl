/**
 * Source Shader
 *
 * Adds a value everywhere a mask says to, in one pass: the mask's red channel
 * times `amount`, times a flicker. It is the counterpart of the splat shader
 * for sources that are a shape rather than a point - a burning outline is
 * hundreds of points, and feeding them as splats either costs hundreds of
 * passes or, fed a few at a time in turn, shows the feeding as a light
 * running round the shape.
 *
 * The flicker is value noise drifting upward, so a source with flicker
 * breathes unevenly along its length the way a flame does, and does so
 * smoothly from frame to frame.
 *
 * References:
 * - shaders/fragment/splat.glsl - the point equivalent, and the obstacle mask
 * - physics/ForcesModule.js - applySource
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uTarget;
uniform sampler2D uSource;
uniform sampler2D uObstacles;
uniform vec3 amount;
uniform float aspectRatio;
uniform float time;
uniform float flicker;     // 0: steady, 1: the noise swings the source from 0 to full
uniform float grain;       // noise cells across the canvas height

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

void main () {
    vec2 p = vec2(vUv.x * aspectRatio, vUv.y) * grain;

    // Two octaves drifting up at different speeds, so the pattern never just
    // translates as a block
    float n = 0.65 * noise(p + vec2(0.0, -time * 1.3)) +
              0.35 * noise(p * 2.3 + vec2(time * 0.4, -time * 2.9));
    float strength = mix(1.0, smoothstep(0.15, 0.85, n), flicker);

    float solid = smoothstep(0.42, 0.5, texture2D(uObstacles, vUv).r);
    float mask = texture2D(uSource, vUv).r * (1.0 - solid);

    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + amount * mask * strength, 1.0);
}
