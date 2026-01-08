/**
 * Display Shader
 * 
 * Final composite shader with optional shading, bloom, and sunrays.
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
uniform vec3 uObstacleColor;
#endif

// Linear to gamma color space conversion
vec3 linearToGamma(vec3 color) {
    color = max(color, vec3(0));
    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
}

void main () {
#ifdef SHOW_OBSTACLES
    // Check if current pixel is an obstacle
    float obstacle = texture2D(uObstacles, vUv).r;
    if (obstacle > 0.5) {
        // Render obstacle with specified color
        gl_FragColor = vec4(uObstacleColor, 1.0);
        return;
    }
#endif

    vec3 c = texture2D(uTexture, vUv).rgb;
    // Reduce max brightness to prevent white saturation
    c *= .95;


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
    gl_FragColor = vec4(c, a);
}
