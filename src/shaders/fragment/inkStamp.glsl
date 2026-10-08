/**
 * Ink Stamp Shader
 *
 * Writes a set of rounded rectangles into the dye field in one pass. This is
 * what turns a page into fluid: the boxes handed in are where the layout's
 * panels are, so after this runs the dye field is holding the shape of the page
 * and the solver can carry it away.
 *
 * It is deliberately the opposite of the splat shader, which masks itself
 * *against* obstacles so a drag cannot inject dye inside a wall. Here the walls
 * are the subject - they are about to be released, and the ink standing in for
 * them has to be laid down before that happens.
 *
 * All the boxes go in one pass rather than one pass each. The dye buffer is the
 * largest in the simulation, and a page of nine panels is nine full-screen
 * read-modify-writes if they are stamped separately - which lands as a dropped
 * frame at exactly the moment the visitor is watching for movement.
 *
 * References:
 * - shaders/fragment/splat.glsl - the masked counterpart
 * - Inigo Quilez, "2D distance functions"
 */

precision highp float;
precision highp sampler2D;

#define MAX_BOXES 24

varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;

// xy: centre in uv space, zw: half extents in uv space
uniform vec4 uBoxes[MAX_BOXES];
uniform int uCount;

uniform vec3 uColor;
uniform float uRadius;   // corner radius, in screen heights
uniform float uEdge;     // softness of the fill's outer edge
uniform float uRim;      // width of the brighter band along the outline
uniform float uRimGain;  // how much brighter that band is than the fill

/**
 * Signed distance to a rounded box centred on the origin
 *
 * @param p Point, in aspect-corrected space
 * @param extent Half extents, in the same space
 * @param r Corner radius
 */
float sdRoundBox(vec2 p, vec2 extent, float r) {
    vec2 d = abs(p) - extent + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

void main () {
    // Nearest surface among all the boxes. A union of shapes is the minimum of
    // their distances, so one accumulator covers the whole page.
    float d = 1e9;

    for (int i = 0; i < MAX_BOXES; i++) {
        if (i >= uCount) break;

        vec4 box = uBoxes[i];
        vec2 p = vUv - box.xy;
        p.x *= aspectRatio;

        vec2 extent = vec2(box.z * aspectRatio, box.w);
        d = min(d, sdRoundBox(p, extent, uRadius));
    }

    // Body, and a brighter rule just inside the outline - the same two-part
    // reading the display shader gives a solid obstacle, so what the dye holds
    // immediately after this pass looks like the panel that was there.
    float body = 1.0 - smoothstep(0.0, uEdge, d);
    float rim = exp(-abs(d + uRim) / uRim) * step(d, uEdge);

    vec3 ink = uColor * (body + rim * uRimGain);
    vec3 base = texture2D(uTarget, vUv).xyz;

    gl_FragColor = vec4(base + ink, 1.0);
}
