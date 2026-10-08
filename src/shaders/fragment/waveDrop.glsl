/**
 * Wave Drop Shader
 *
 * Pushes the lake's surface down (or up) in a round dent: something landing in
 * the water. The dent goes into the current and the previous height alike, so
 * it starts at rest and the rings come from the surface springing back.
 *
 * Distances are measured in grid cells, so the dent is round on the grid. The
 * grid is squashed on screen to look like water seen from the shore, so on
 * screen the dent - and every ring it makes - is a flattened ellipse.
 *
 * References:
 * - physics/WaterModule.js - drop()
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uField;
uniform vec2 uGrid;     // field size in cells
uniform vec2 point;     // where the drop lands, field coordinates
uniform float radius;   // in cells
uniform float amount;   // depth of the dent; negative pushes the surface down

void main () {
    vec2 h = texture2D(uField, vUv).rg;
    vec2 d = (vUv - point) * uGrid;
    float dent = amount * exp(-dot(d, d) / (radius * radius));
    gl_FragColor = vec4(h + dent, 0.0, 1.0);
}
