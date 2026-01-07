/**
 * Utility functions for browser detection and device capabilities
 * 
 * References:
 * - technical_analysis.md - Mobile Optimization
 */

/**
 * Detect if device is mobile
 * 
 * @returns {boolean} True if mobile device
 */
export function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Get device pixel ratio clamped to reasonable range
 * Prevents excessive memory usage on high-DPI displays
 * 
 * @returns {number} Device pixel ratio (clamped to max 2)
 */
export function getDevicePixelRatio() {
    return Math.min(window.devicePixelRatio || 1, 2);
}

/**
 * Check if browser supports WebGL2
 * 
 * @returns {boolean} True if WebGL2 is supported
 */
export function supportsWebGL2() {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
}

/**
 * Detect if user prefers reduced motion (accessibility)
 * 
 * @returns {boolean} True if reduced motion preferred
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
