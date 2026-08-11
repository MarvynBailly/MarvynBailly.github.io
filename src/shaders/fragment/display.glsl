/**
 * Display Shader
 *
 * Final composite shader with optional shading, bloom, sunrays and obstacles.
 * Uses conditional compilation for feature toggles.
 *
 * References:
 * - technical_analysis.md - Display Shader, Shading
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uTexture;
uniform sampler2D uBloom;
uniform sampler2D uSunrays;
uniform sampler2D uDithering;
uniform vec2 ditherScale;
uniform vec2 texelSize;

#ifdef SHOW_OBSTACLES
uniform sampler2D uObstacles;
uniform vec3 uObstacleFill;
uniform vec3 uObstacleEdge;
// x: full width of the stored distance range, in field texels
// y: device pixels per field texel
uniform vec2 uObstacleParams;
#endif

#ifdef PALETTE_RAMP
uniform vec3 uRamp0;
uniform vec3 uRamp1;
uniform vec3 uRamp2;
uniform vec3 uRamp3;

/**
 * Map density onto a four-stop ramp
 *
 * Stops are fixed at 0, 0.35, 0.7 and 1 rather than passed in: GLSL ES 1.0
 * restricts indexing into uniform arrays, and four named stops read more
 * clearly than the loop that would replace them.
 */
vec3 paletteMap(float density) {
    vec3 mapped = mix(uRamp0, uRamp1, smoothstep(0.0, 0.35, density));
    mapped = mix(mapped, uRamp2, smoothstep(0.35, 0.70, density));
    mapped = mix(mapped, uRamp3, smoothstep(0.70, 1.0, density));
    return mapped;
}
#endif

// Linear to gamma color space conversion
vec3 linearToGamma(vec3 color) {
    color = max(color, vec3(0));
    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
}

void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    // Reduce max brightness to prevent white saturation
    c *= .95;

#ifdef PALETTE_RAMP
    // Dye stops carrying colour: only how much of it there is survives, and the
    // ramp decides what that looks like. Saturating rather than clipping keeps
    // a heavy splat inside the palette instead of blowing out to white.
    float density = 1.0 - exp(-2.2 * max(c.r, max(c.g, c.b)));
    c = paletteMap(density);

    // A low-contrast dark ramp bands badly at 8 bits; the dithering texture is
    // already bound, so borrow it for a sub-step of noise.
    c += (texture2D(uDithering, vUv * ditherScale).r * 2.0 - 1.0) / 255.0;
#endif


#ifdef SHADING
    // Normal-based shading using dye density gradient
    vec3 lc = texture2D(uTexture, vL).rgb;
    vec3 rc = texture2D(uTexture, vR).rgb;
    vec3 tc = texture2D(uTexture, vT).rgb;
    vec3 bc = texture2D(uTexture, vB).rgb;

    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);

    vec3 n = normalize(vec3(dx, dy, length(texelSize)));
    vec3 l = vec3(0.0, 0.0, 1.0);

    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
#endif

#ifdef BLOOM
    vec3 bloom = texture2D(uBloom, vUv).rgb;
#endif

#ifdef SUNRAYS
    float sunrays = texture2D(uSunrays, vUv).r;
    c *= sunrays;
    #ifdef BLOOM
        bloom *= sunrays;
    #endif
#endif

#ifdef BLOOM
    float noise = texture2D(uDithering, vUv * ditherScale).r;
    noise = noise * 2.0 - 1.0;
    bloom += noise / 255.0;
    bloom = linearToGamma(bloom);
    c += bloom;
#endif

    float a = max(c.r, max(c.g, c.b));

#ifdef SHOW_OBSTACLES
    // The obstacle field stores signed distance, so the silhouette is
    // reconstructed here at screen resolution: one smoothstep across a single
    // pixel gives a clean edge however coarse the simulation grid is, and both
    // the body and the contour come off that one distance read.
    float stored = texture2D(uObstacles, vUv).r;
    float texels = (0.5 - stored) * uObstacleParams.x;   // signed distance
    float reach = 0.5 * uObstacleParams.x;               // where the field clamps

    // The cutoff is measured against the stored range rather than in pixels, so
    // it always lands inside the range at any window size. In pixels it did not:
    // on a tall window the field's clamp fell within the cutoff, and every pixel
    // on the canvas took the branch.
    if (texels < reach * 0.75) {
        float pixels = texels * uObstacleParams.y;
        float body = 1.0 - smoothstep(-0.5, 0.5, pixels);

        // A rule set just inside the silhouette, drawn like an engraved edge
        float rule = 1.0 - smoothstep(0.5, 1.7, abs(pixels + 1.6));

        // Body: slightly brighter towards the edge, so it reads as a solid
        // object catching light rather than a flat hole in the canvas.
        vec3 fill = uObstacleFill * (0.85 + 0.45 * exp(texels * 0.1));
        c = mix(c, fill, body);

        // Contour. Composited rather than added, and at a fixed strength: both
        // matter, because an additive rule takes on whatever the fluid behind it
        // is doing, and a dye-modulated one clips every channel to white when a
        // bright splat arrives. The letter should keep one colour.
        c = mix(c, uObstacleEdge, rule);

        a = max(max(a, body), max(c.r, max(c.g, c.b)));
    }
#endif

    gl_FragColor = vec4(c, a);
}
