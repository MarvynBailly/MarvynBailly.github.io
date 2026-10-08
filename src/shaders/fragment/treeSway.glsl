/**
 * Tree Sway Shader
 *
 * How far the trees along the shore are leaning, and how fast, as a strip one
 * texel tall across the screen: red is the lean, green its rate of change.
 *
 * Each column is a damped spring. The wind pulls it toward a lean in
 * proportion to the wind's strength, the spring pulls it back upright, and
 * damping takes the energy out, so a gust bends the trees over, they swing
 * back a little past upright, and settle. Without this the trees followed
 * every eddy in the air from frame to frame and twitched rather than swayed.
 *
 * The wind is averaged over a stretch of shore and over the canopy's height,
 * so neighbouring columns of the same tree feel the same air and the tree
 * bends as one piece.
 *
 * References:
 * - shaders/fragment/display.glsl - landscapeAt(), which reads the lean
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uState;      // r: lean, g: rate of lean, per column
uniform sampler2D uVelocity;   // the simulation's wind
uniform float uShore;          // screen height the trees stand on
uniform float uTreeHeight;     // the tallest tree, screen heights
uniform float uBend;           // lean per unit of wind, screen widths
uniform float uStiffness;      // spring constant, per second squared
uniform float uDamping;        // per second
uniform float dt;

void main () {
    // Wind across a stretch of shore about a tree's width, at two heights
    float wind = 0.0;
    for (float i = -3.0; i <= 3.0; i += 1.0) {
        float x = vUv.x + i * 0.006;
        wind += texture2D(uVelocity, vec2(x, uShore + uTreeHeight * 0.35)).x;
        wind += texture2D(uVelocity, vec2(x, uShore + uTreeHeight * 0.8)).x;
    }
    wind /= 14.0;

    float target = clamp(wind * uBend, -0.012, 0.012);

    vec2 state = texture2D(uState, vUv).rg;
    float rate = state.g + (uStiffness * (target - state.r) - uDamping * state.g) * dt;
    float lean = state.r + rate * dt;

    gl_FragColor = vec4(lean, rate, 0.0, 1.0);
}
