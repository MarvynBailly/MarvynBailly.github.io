/**
 * Site palette
 *
 * The simulation's splat colours were random HSL across all 360 degrees, which
 * fights the restrained palette the rest of the page is built on. These are the
 * same two inks the stylesheet uses, exposed as simulation-space RGB so a scene
 * can ask for "cool" or "warm" instead of picking a hue out of the air.
 *
 * Dye is additive and half-float, so amplitudes here are deliberately low: a
 * value of 0.3 lands around #4d4d4d once composited, which is the ceiling for
 * keeping body text legible over the canvas.
 *
 * References:
 * - style.css - the design tokens these mirror
 */

/** --color-primary #7fb0c9, muted steel-cyan */
export const COOL = { r: 0.498, g: 0.690, b: 0.788 };

/** --color-secondary #c99a5b, muted amber */
export const WARM = { r: 0.788, g: 0.604, b: 0.357 };

/** --color-text-dim #8b93a5, neutral graphite */
export const INK = { r: 0.545, g: 0.576, b: 0.647 };

const FAMILIES = { cool: COOL, warm: WARM, ink: INK };

/**
 * Scale a colour's amplitude
 *
 * @param {Object} color - {r, g, b}
 * @param {number} amount - Multiplier
 * @returns {Object} Scaled colour
 */
export function scale(color, amount) {
    return { r: color.r * amount, g: color.g * amount, b: color.b * amount };
}

/**
 * Pick a palette colour with a little variation
 *
 * Jitter is applied per channel rather than as a hue rotation: it keeps the
 * result inside the family while stopping repeated emissions from banding into
 * a single flat tone.
 *
 * @param {string} family - 'cool', 'warm' or 'ink'
 * @param {number} [amplitude] - Peak channel value
 * @param {number} [jitter] - Per-channel variation, 0 to 1
 * @param {function(): number} [random] - Random source
 * @returns {Object} RGB colour
 */
export function pigment(family, amplitude = 0.3, jitter = 0.08, random = Math.random) {
    const base = FAMILIES[family] || INK;
    const wobble = () => 1 + (random() * 2 - 1) * jitter;
    return {
        r: base.r * amplitude * wobble(),
        g: base.g * amplitude * wobble(),
        b: base.b * amplitude * wobble()
    };
}

/**
 * Blend two colours
 *
 * @param {Object} a - First colour
 * @param {Object} b - Second colour
 * @param {number} t - Mix factor, 0 gives a
 * @returns {Object} Blended colour
 */
export function mix(a, b, t) {
    return {
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t
    };
}
