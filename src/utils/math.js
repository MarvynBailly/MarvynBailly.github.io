/**
 * Vector and math utility functions
 * 
 * References:
 * - math_foundations.md - Vector Calculus Operations
 */

/**
 * Generate random number in range
 * 
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random value in [min, max]
 */
export function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Clamp value to range [0, 1]
 * 
 * @param {number} value - Value to clamp
 * @returns {number} Clamped value
 */
export function clamp01(value) {
    return Math.min(Math.max(value, 0), 1);
}

/**
 * Clamp value to arbitrary range
 * 
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * 
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor [0, 1]
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Generate HSL color (for colorful splats)
 * 
 * @param {number} h - Hue [0, 360]
 * @param {number} s - Saturation [0, 100]
 * @param {number} l - Lightness [0, 100]
 * @returns {Object} RGB color {r, g, b} in [0, 1]
 */
export function HSLtoRGB(h, s, l) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    return {
        r: r + m,
        g: g + m,
        b: b + m
    };
}

/**
 * Generate random vibrant color
 * 
 * @returns {Object} RGB color {r, g, b} in [0, 1]
 */
export function generateColor() {
    const h = random(0, 360);
    const s = random(50, 100);
    const l = random(40, 60);
    return HSLtoRGB(h, s, l);
}

/**
 * Compute hash code for string (used for shader keyword caching)
 * 
 * @param {string} str - String to hash
 * @returns {number} Hash code
 */
export function hashCode(str) {
    if (str.length === 0) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
}
