/**
 * Loading Concept Helpers
 *
 * Small shared utilities for the loading screen concepts: canvas sizing,
 * easing, and a deterministic pseudo-random source (so a given concept looks
 * identical on every load rather than reshuffling mid-animation).
 */

/** Clamp a value into [0, 1]. */
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Quadratic ease-out. */
export const easeOut = (t) => 1 - Math.pow(1 - t, 2.1);

/** Smoothstep. */
export const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Deterministic pseudo-random value in [0, 1) for an integer seed.
 *
 * @param {number} n - Seed
 * @returns {number}
 */
export function hash01(n) {
    const s = Math.sin(n * 12.9898) * 43758.5453;
    return s - Math.floor(s);
}

/**
 * Create a canvas that fills its parent and stays crisp on high-DPI displays.
 *
 * @param {HTMLElement} root - Element to append the canvas to
 * @returns {{canvas: HTMLCanvasElement, begin: () => {ctx: CanvasRenderingContext2D, W: number, H: number}}}
 */
export function createCanvas(root) {
    const canvas = document.createElement('canvas');
    root.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    /** Resize to the current box, reset the transform, and clear. */
    const begin = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
            canvas.width = W * dpr;
            canvas.height = H * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        return { ctx, W, H };
    };

    return { canvas, begin };
}

/**
 * Monospace font string scaled to the stage width.
 *
 * @param {number} W - Stage width in CSS pixels
 * @returns {{font: string, size: number}}
 */
export function monoFont(W) {
    const size = Math.max(8, Math.min(12, W * 0.022));
    return { font: `${size}px 'JetBrains Mono', ui-monospace, monospace`, size };
}

/** Palette pulled from the site's design tokens. */
export const COLOR = {
    primary: '#7fb0c9',
    amber: '#c99a5b',
    text: '#dde2e8',
    dim: '#8b93a5',
    grid: '#1e232d',
    axis: '#39404e',
};
