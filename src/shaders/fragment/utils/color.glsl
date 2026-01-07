/**
 * Color Shader
 * 
 * Outputs solid color.
 * 
 * References:
 * - technical_analysis.md - Utility Shaders
 */

precision mediump float;

uniform vec4 color;

void main () {
    gl_FragColor = color;
}
