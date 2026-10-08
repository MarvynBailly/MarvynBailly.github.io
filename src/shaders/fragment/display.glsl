/**
 * Display Shader
 *
 * Final composite shader with optional shading, bloom, sunrays, obstacles and
 * a water reflection. Uses conditional compilation for feature toggles.
 *
 * Everything a point on screen looks like is worked out by sceneColor(), so
 * the reflection can ask what any other point looks like - its mirror image
 * above the waterline - and get exactly what is drawn there, shading, palette
 * and obstacles included.
 *
 * References:
 * - technical_analysis.md - Display Shader, Shading
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
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

#ifdef REFLECTION
uniform float uWaterline;      // screen height of the water's surface, 0 to 1
uniform vec3 uWaterColor;      // the lake itself, under the reflection
uniform float uReflectivity;   // how much of the scene the water gives back
uniform float uRipple;         // 0: a mirror, 1: a light breeze on the water
uniform float uTime;
uniform float uAspect;
uniform float uFirelight;      // how strongly bright things smear into streaks on the water
uniform float uSwell;          // wind waves rolling across the whole lake, 0 for none

/**
 * Height of the wind swell at a point on the lake
 *
 * The lake is a plane seen from just above it, so a point the screen shows a
 * given depth below the far shore is at distance about 1 / depth across the
 * water. The swell is laid out on that plane - a few trains of waves at
 * different headings and speeds, all rolling in toward the viewer - so it is
 * long and slow in the near water and bunches into fine ridges toward the
 * far shore, where it fades out before it gets fine enough to shimmer.
 */
float swellAt(vec2 uv) {
    float depth = clamp((uWaterline - uv.y) / max(uWaterline, 1e-3), 0.0, 1.0);
    float out_ = 1.0 / (depth + 0.07);
    vec2 p = vec2((uv.x - 0.5) * uAspect * out_, out_);
    float h = 0.5 * sin(dot(p, vec2(2.4, 9.0)) + uTime * 1.1)
            + 0.3 * sin(dot(p, vec2(-5.1, 12.5)) + uTime * 1.45 + 1.3)
            + 0.2 * sin(dot(p, vec2(8.3, 17.0)) + uTime * 1.9 + 4.0);
    return h * smoothstep(0.0, 0.25, depth);
}

#ifdef WAVES
uniform sampler2D uWaves;      // the lake's height field: waterline at y = 0, screen bottom at 1
uniform vec2 uWaveTexel;
uniform float uWaveStrength;   // how far a slope bends the reflection
#endif
#endif

#ifdef LANDSCAPE
uniform sampler2D uLandscape;  // sky and mountains: opaque
uniform sampler2D uTrees;      // pines along the shore, transparent around them
uniform vec2 uTreeBand;        // the strip uTrees covers: bottom and top, screen heights
uniform float uShore;          // screen height the trees stand on
uniform float uTreeHeight;     // the tallest tree, screen heights

#ifdef TREE_WIND
uniform sampler2D uSway;       // how far the trees lean at each x: treeSway.glsl
#endif

/**
 * The landscape behind the fluid at a point
 *
 * The trees bend in the wind: each column's lean, kept by the tree sway pass
 * as a damped spring driven by the simulation's wind, is applied by looking
 * the tree layer up that far upwind - more toward the top than at the trunk,
 * so the trees lean with their roots fixed. Gusts from the pointer bend them
 * over and they swing back; the scene's breeze gives them a lean that comes
 * and goes.
 */
vec3 landscapeAt(vec2 uv) {
    vec3 land = texture2D(uLandscape, uv).rgb;
    vec2 at = uv;

#ifdef TREE_WIND
    float up = clamp((uv.y - uShore) / uTreeHeight, 0.0, 1.0);
    at.x -= texture2D(uSway, vec2(uv.x, 0.5)).r * up * up;
#endif

    float v = (at.y - uTreeBand.x) / (uTreeBand.y - uTreeBand.x);
    vec4 tree = (v > 0.0 && v < 1.0) ? texture2D(uTrees, vec2(at.x, v)) : vec4(0.0);
    return mix(land, tree.rgb, tree.a);
}
#endif

// Linear to gamma color space conversion
vec3 linearToGamma(vec3 color) {
    color = max(color, vec3(0));
    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
}

/**
 * The colour of one point on screen, and its alpha
 */
vec4 sceneColor(vec2 uv) {
    vec3 c = texture2D(uTexture, uv).rgb;
    // Reduce max brightness to prevent white saturation
    c *= .95;

#ifdef PALETTE_RAMP
    // Dye stops carrying colour: only how much of it there is survives, and the
    // ramp decides what that looks like. Saturating rather than clipping keeps
    // a heavy splat inside the palette instead of blowing out to white.
    float peak = max(c.r, max(c.g, c.b));
    float density = 1.0 - exp(-2.2 * peak);
  #ifdef SMOKE
    // Smoke is grey and flame is orange, so how much blue there is against
    // the brightest channel tells them apart - flame has about a sixth, smoke
    // nearly all. Smoke is drawn as a grey haze over the background, and
    // where smoke and flame mix, so do their colours.
    float smokiness = smoothstep(0.35, 0.8, c.b / max(peak, 1e-4));
    vec3 haze = mix(uRamp0, vec3(0.36, 0.38, 0.44), clamp(density * 1.8, 0.0, 1.0));
    c = mix(paletteMap(density), haze, smokiness);
  #else
    c = paletteMap(density);
  #endif

    // A low-contrast dark ramp bands badly at 8 bits; the dithering texture is
    // already bound, so borrow it for a sub-step of noise.
    c += (texture2D(uDithering, uv * ditherScale).r * 2.0 - 1.0) / 255.0;
#endif


#ifdef SHADING
    // Normal-based shading using dye density gradient
    vec3 lc = texture2D(uTexture, uv - vec2(texelSize.x, 0.0)).rgb;
    vec3 rc = texture2D(uTexture, uv + vec2(texelSize.x, 0.0)).rgb;
    vec3 tc = texture2D(uTexture, uv + vec2(0.0, texelSize.y)).rgb;
    vec3 bc = texture2D(uTexture, uv - vec2(0.0, texelSize.y)).rgb;

    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);

    vec3 n = normalize(vec3(dx, dy, length(texelSize)));
    vec3 l = vec3(0.0, 0.0, 1.0);

    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
#endif

#ifdef BLOOM
    vec3 bloom = texture2D(uBloom, uv).rgb;
#endif

#ifdef SUNRAYS
    float sunrays = texture2D(uSunrays, uv).r;
    c *= sunrays;
    #ifdef BLOOM
        bloom *= sunrays;
    #endif
#endif

#ifdef BLOOM
    float noise = texture2D(uDithering, uv * ditherScale).r;
    noise = noise * 2.0 - 1.0;
    bloom += noise / 255.0;
    bloom = linearToGamma(bloom);
    c += bloom;
#endif

#ifdef LANDSCAPE
    // The fire is light, so it adds to the landscape rather than covering it.
    // On a palette scene the ramp's first stop is what empty air was painted
    // as; only what the fluid adds above that is the fire's own light.
  #ifdef PALETTE_RAMP
    vec3 glow = max(c - uRamp0, vec3(0.0));
  #else
    vec3 glow = c;
  #endif
    c = landscapeAt(uv) + glow;
    float a = 1.0;
#else
    float a = max(c.r, max(c.g, c.b));
#endif

#ifdef SHOW_OBSTACLES
    // The obstacle field stores signed distance, so the silhouette is
    // reconstructed here at screen resolution: one smoothstep across a single
    // pixel gives a clean edge however coarse the simulation grid is, and both
    // the body and the contour come off that one distance read.
    float stored = texture2D(uObstacles, uv).r;
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

    return vec4(c, a);
}

#ifdef REFLECTION
/**
 * What the water shows at a point below the waterline
 *
 * The mirror image of the point as far above the surface as this one is
 * below it, pushed about by ripples, and dimmed and tinted toward the colour
 * of the water. Ripples are bands that run across the lake; they are packed
 * tight near the surface and spread out toward the bottom of the screen, as
 * waves do seen from the shore, where the near water is under the eye and the
 * far water is foreshortened toward the horizon.
 */
vec3 reflection(vec2 uv) {
    float below = uWaterline - uv.y;
    float depth = clamp(below / max(uWaterline, 1e-3), 0.0, 1.0);

    // Band phase grows fastest just under the surface: foreshortening
    float phase = 46.0 * sqrt(below);
    float wave = 0.6 * sin(phase * 6.0 - uTime * 1.7 + uv.x * uAspect * 3.0) +
                 0.4 * sin(phase * 9.5 + uTime * 2.3 - uv.x * uAspect * 7.0);

    // Displacement grows toward the viewer, and never quite vanishes at the
    // surface so the reflection always looks wet
    float sway = uRipple * (0.0015 + 0.009 * depth);
    vec2 mirror = vec2(uv.x + wave * sway / uAspect,
                       uWaterline + below + wave * sway * 0.35);

    // Real waves from the solver: the surface's slope tilts the mirror, so the
    // reflection is pushed aside where a ring passes, and a slope facing the
    // fire catches its light
    float tilt = 0.0;

    // The swell: its slope pushes the mirror about and tilts the surface,
    // so the reflection sways and glints run across the open water
    if (uSwell > 0.0) {
        float e = 0.0025;
        float h = swellAt(uv);
        vec2 grad = vec2(swellAt(uv + vec2(e, 0.0)) - h, swellAt(uv + vec2(0.0, e)) - h) / e;
        grad = clamp(grad * 0.004, vec2(-1.0), vec2(1.0));
        mirror += grad * uSwell * vec2(0.004 / uAspect, 0.012) * (0.3 + depth);
        tilt += grad.y * uSwell * 0.09;
    }

#ifdef WAVES
    vec2 lake = vec2(uv.x, depth);
    vec2 slope = vec2(
        texture2D(uWaves, lake + vec2(uWaveTexel.x, 0.0)).r - texture2D(uWaves, lake - vec2(uWaveTexel.x, 0.0)).r,
        texture2D(uWaves, lake + vec2(0.0, uWaveTexel.y)).r - texture2D(uWaves, lake - vec2(0.0, uWaveTexel.y)).r
    );
    // Clamped, so however rough the water gets the reflection only ripples
    mirror += clamp(slope * uWaveStrength, vec2(-0.004), vec2(0.004)) * vec2(1.0 / uAspect, 0.6);
    slope = clamp(slope, vec2(-0.12), vec2(0.12));
    tilt += slope.y;
#endif

    vec3 image = sceneColor(clamp(mirror, vec2(0.0), vec2(1.0))).rgb;

    // Firelight: a light seen in water is stretched into a vertical streak,
    // because every ripple between it and the eye shows it at a slightly
    // different angle. Averaging the reflection along a short vertical run,
    // longer further down the lake, draws that streak.
    vec3 streak = vec3(0.0);
    float reach = 0.006 + 0.03 * depth;
    for (float k = 1.0; k <= 3.0; k += 1.0) {
        streak += sceneColor(clamp(mirror + vec2(0.0, k * reach), vec2(0.0), vec2(1.0))).rgb;
        streak += sceneColor(clamp(mirror - vec2(0.0, k * reach), vec2(0.0), vec2(1.0))).rgb;
    }
    streak /= 6.0;

    // Water gives back less the further you look down into it, and light
    // glints along the crests
    float glint = 1.0 + 0.18 * uRipple * smoothstep(0.55, 1.0, wave) + clamp(tilt * 3.0, -0.5, 0.9);
    float giveBack = uReflectivity * mix(0.95, 0.45, depth) * glint;
    vec3 water = uWaterColor * (0.85 + 0.15 * depth);

    // The surface itself catches a faint line of light
    float surface = (1.0 - smoothstep(0.0, 0.004, below)) * 0.35;

    // The streak adds light on top: only bright things make one, so it is
    // measured above the water's own colour, and it shimmers with the glints
    vec3 light = max(streak - water, vec3(0.0)) * uFirelight * max(glint, 0.3) * (1.0 - 0.4 * depth);

    // Wave crests tilted toward the eye pick up the sky: a faint cool sheen,
    // which is what shows a ring on open water where there is nothing bright
    // above it to reflect
    // The side of a ring facing away is a touch darker, so even a small ring
    // reads as a ring - a light edge and a dark edge - and not a smudge
    vec3 sheen = vec3(0.55, 0.62, 0.75) * (0.09 * smoothstep(0.002, 0.045, tilt)
                                         - 0.03 * smoothstep(0.002, 0.045, -tilt));

    return mix(water, image, clamp(giveBack, 0.0, 1.0)) + surface * image + light + sheen;
}
#endif

void main () {
#ifdef REFLECTION
    if (vUv.y < uWaterline) {
        gl_FragColor = vec4(reflection(vUv), 1.0);
        return;
    }
#endif

    gl_FragColor = sceneColor(vUv);
}
