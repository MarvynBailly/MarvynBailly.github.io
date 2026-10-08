/**
 * Heat Sample Shader
 *
 * Copies a rectangle of the dye field into a small target, as the hottest of
 * its channels, so the forest fire can read back how much heat is around the
 * trees without reading the whole field. Halved on the way in, so heat up to
 * 2 fits in a byte.
 *
 * References:
 * - physics/ForestFire.js - what reads it
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec4 uRect;   // x0, y0, x1, y1 of the rectangle, screen units

void main () {
    vec3 c = texture2D(uTexture, mix(uRect.xy, uRect.zw, vUv)).rgb;
    // Flame only: red with little blue. Smoke is grey, red and blue alike,
    // and must not set trees alight.
    float heat = max(c.r - c.b, 0.0);
    gl_FragColor = vec4(clamp(heat * 0.5, 0.0, 1.0), 0.0, 0.0, 1.0);
}
