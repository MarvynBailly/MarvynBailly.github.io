/**
 * ASCII colour schemes
 *
 * In the fluid's own colours the text is as busy as the dye: every cell can be
 * a different hue, and at a few pixels per glyph that reads as noise. A scheme
 * throws the hue away and spends the colour on the one thing the glyph is
 * already saying - how much fluid is there - by running density through a
 * single gradient over a ground chosen to sit under it.
 *
 * Every gradient climbs in brightness from its first stop to its last, so the
 * colour and the glyph agree: a sparse '.' is dim and a dense '@' is bright.
 * The first stop is close to the ground, so the faintest dye fades into it
 * rather than stopping at a hard edge.
 *
 * The fire schemes all read as flame, but not all as the same flame: some are
 * colour maps that happen to run through fire's colours, one is the colour of
 * a hot body at rising temperature, and four are what a flame looks like with
 * a particular metal in it - the flame test from school chemistry.
 *
 * Fields:
 *   group  - heading the scheme is listed under
 *   ground - background, CSS hex
 *   stops  - gradient from faintest to densest, CSS hex, evenly spaced
 *   edge   - obstacle contour colour; defaults to the last stop
 */

export const ASCII_SCHEMES = [
    {
        id: 'scene',
        label: 'Scene colours',
        group: 'Scene'
        // No gradient: the dye keeps the colours the scene gave it
    },

    // ----- Fire -----------------------------------------------------------
    {
        id: 'inferno',
        label: 'Inferno',
        group: 'Fire',
        // matplotlib's inferno, sampled at even steps: perceptually uniform,
        // so equal steps in density look like equal steps in colour
        ground: '#000004',
        stops: ['#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
        edge: '#fcffa4'
    },
    {
        id: 'magma',
        label: 'Magma',
        group: 'Fire',
        // inferno's sibling: through rose and salmon to a cream top, softer
        // and pinker, like fire seen through smoke
        ground: '#000004',
        stops: ['#1c1044', '#4f127b', '#812581', '#b5367a', '#e55064', '#fb8761', '#fec287', '#fcfdbf'],
        edge: '#fcfdbf'
    },
    {
        id: 'blackbody',
        label: 'Blackbody',
        group: 'Fire',
        // The colour of a hot body as it heats: dull red, orange, yellow, and
        // finally white. The one scheme here that is physics rather than taste.
        ground: '#020000',
        stops: ['#2e0500', '#6e1200', '#b02a00', '#e85a00', '#ff9124', '#ffc46b', '#ffe8bd', '#ffffff'],
        edge: '#ffe8bd'
    },
    {
        id: 'hot',
        label: 'Hot',
        group: 'Fire',
        // matplotlib's hot: red, then yellow, then white, each channel
        // saturating in turn. Harsher than blackbody, and louder.
        ground: '#050000',
        stops: ['#4a0000', '#a00000', '#f20000', '#ff5500', '#ffaa00', '#ffff00', '#ffff80', '#ffffff'],
        edge: '#ffff80'
    },
    {
        id: 'ember',
        label: 'Ember',
        group: 'Fire',
        // A fire that never gets bright: deep red to a glowing orange, with
        // no yellow and no white at the top
        ground: '#070302',
        stops: ['#2a0703', '#5e0f05', '#9b1e07', '#d2410c', '#f57a1f', '#ffa257'],
        edge: '#f57a1f'
    },
    {
        id: 'copper',
        label: 'Copper (green flame)',
        group: 'Fire',
        // Copper salts burn green - fireworks, and driftwood that has been
        // in the sea
        ground: '#010805',
        stops: ['#052a17', '#0b5e33', '#16a34a', '#4ade80', '#b7ffcf', '#f2fff6'],
        edge: '#b7ffcf'
    },
    {
        id: 'strontium',
        label: 'Strontium (crimson flame)',
        group: 'Fire',
        // Strontium burns crimson: the red in a road flare
        ground: '#0a0104',
        stops: ['#3a0614', '#7a0d2a', '#c2133f', '#ff3d6a', '#ff9db4', '#fff0f4'],
        edge: '#ff9db4'
    },
    {
        id: 'potassium',
        label: 'Potassium (lilac flame)',
        group: 'Fire',
        // Potassium burns a pale lilac, the faintest of the flame tests
        ground: '#07040d',
        stops: ['#251040', '#4c2380', '#8a4fc4', '#c89bf0', '#f3e6ff'],
        edge: '#c89bf0'
    },
    {
        id: 'butane',
        label: 'Butane (blue flame)',
        group: 'Fire',
        // A clean gas flame: deep blue at its thinnest, near white in the
        // inner cone where it burns hottest
        ground: '#02040d',
        stops: ['#06134d', '#0f2fa3', '#2f6bff', '#7fb3ff', '#e0efff'],
        edge: '#7fb3ff'
    },

    // ----- Other ----------------------------------------------------------
    {
        id: 'phosphor',
        label: 'Phosphor',
        group: 'Other',
        // A P1 green terminal: the glow sits in the green channel and only
        // the densest glyphs burn toward white
        ground: '#030904',
        stops: ['#0b2a12', '#14692b', '#2bb34f', '#7dff9a', '#e4ffe8'],
        edge: '#b9ffc6'
    },
    {
        id: 'amber',
        label: 'Amber',
        group: 'Other',
        // P3 amber, the other monochrome monitor
        ground: '#0b0602',
        stops: ['#2e1802', '#7a4204', '#d07c06', '#ffb000', '#fff0c8'],
        edge: '#ffd27a'
    },
    {
        id: 'viridis',
        label: 'Viridis',
        group: 'Other',
        // matplotlib's viridis, on a ground darker than its first stop so
        // the thinnest dye still separates from the background
        ground: '#0a0612',
        stops: ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'],
        edge: '#fde725'
    },
    {
        id: 'blueprint',
        label: 'Blueprint',
        group: 'Other',
        // White line on cyanotype blue; walls in the same white as the ink,
        // as on a drawing
        ground: '#0a2a52',
        stops: ['#14406f', '#2f68a3', '#6f9fd2', '#b9d6f2', '#ffffff'],
        edge: '#ffffff'
    },
    {
        id: 'synthwave',
        label: 'Synthwave',
        group: 'Other',
        // Violet through magenta to a cyan highlight
        ground: '#0d0221',
        stops: ['#2a0b52', '#6a1b9a', '#c2185b', '#ff4fa3', '#ff9be2', '#7df9ff'],
        edge: '#7df9ff'
    },
    {
        id: 'deep-water',
        label: 'Deep water',
        group: 'Other',
        // The site's own ramp, extended past its last stop to near-white foam
        // so the densest glyphs have somewhere brighter to go
        ground: '#10131a',
        stops: ['#0e2836', '#185063', '#266a76', '#4f9c9e', '#8bc8c4', '#d4f3ee'],
        edge: '#7fb0c9'
    }
];

/**
 * Find a scheme by id, falling back to the scene's own colours
 *
 * @param {string} id - Scheme id
 * @returns {Object} Scheme
 */
export function findScheme(id) {
    return ASCII_SCHEMES.find((scheme) => scheme.id === id) || ASCII_SCHEMES[0];
}

/**
 * Sample a scheme's gradient at evenly spaced points
 *
 * @param {string[]} stops - CSS hex colours, faintest first
 * @param {number} count - Number of samples
 * @returns {string[]} CSS hex colours
 */
export function sampleGradient(stops, count) {
    const rgb = stops.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
    const out = [];

    for (let k = 0; k < count; k++) {
        const t = (k / (count - 1)) * (rgb.length - 1);
        const i = Math.min(rgb.length - 2, Math.floor(t));
        const f = t - i;
        out.push('#' + [0, 1, 2]
            .map((c) => Math.round(rgb[i][c] + (rgb[i + 1][c] - rgb[i][c]) * f).toString(16).padStart(2, '0'))
            .join(''));
    }

    return out;
}
