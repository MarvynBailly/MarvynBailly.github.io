/**
 * Advection Shader with Obstacles
 * 
 * Implements semi-Lagrangian advection for unconditional stability.
 * Obstacles: Clamp traced positions to avoid sampling from obstacles
 * 
 * References:
 * - math_foundations.md - Section 5 (Semi-Lagrangian Method)
 * - obstacle_math_foundations.md - Section 7 (Advection with Obstacles)
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uObstacles;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;

// Bilinear interpolation for manual filtering (WebGL1 fallback)
vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
    #ifdef MANUAL_FILTERING
        // Manual bilinear filtering for devices without linear float filtering
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    #else
        // Use hardware linear filtering
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    #endif
    
    // If traced position lands in obstacle, clamp to current position
    if (texture2D(uObstacles, coord).r > 0.5) {
        coord = vUv;  // Particle "stops" at obstacle boundary
    }
    
    #ifdef MANUAL_FILTERING
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec4 result = texture2D(uSource, coord);
    #endif
    
    // Apply dissipation
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
}
