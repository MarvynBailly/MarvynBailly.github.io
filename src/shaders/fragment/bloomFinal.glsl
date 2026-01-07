/**
 * Bloom Final Shader
 * 
 * Final bloom composite with intensity using separable blur.
 * 
 * References:
 * - technical_analysis.md - Bloom Effect
 */

precision mediump float;
precision mediump sampler2D;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
uniform sampler2D uTexture;
uniform float intensity;

void main () {
    vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
    sum += texture2D(uTexture, vL) * 0.35294117;
    sum += texture2D(uTexture, vR) * 0.35294117;
    
    gl_FragColor = sum * intensity;
}
