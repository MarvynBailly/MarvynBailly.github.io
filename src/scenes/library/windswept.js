/**
 * Scene: Windswept
 *
 * The campfire in a gale: the flames lie down along the ground, the smoke
 * streams flat across the screen, and the sparks go sideways.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 */

import { makeFire, log, spread, RAMPS } from '../fire.js';

const SPAN = 0.08;
const RISE = 0.04;
const CROSS_Y = 0.09;

export default makeFire({
    id: 'windswept',
    label: 'Windswept',
    description: 'A campfire in a gale, flames lying flat',

    beds: [{ x: 0.42, y: CROSS_Y + 0.03, slope: RISE / SPAN, tongues: spread(5, 0.05) }],

    // Upwind of centre, so the flames have the rest of the screen to stream into
    obstacles: [
        log(0.42 - SPAN, CROSS_Y - RISE, 0.42 + SPAN, CROSS_Y + RISE, 0.03),
        log(0.42 - SPAN, CROSS_Y + RISE, 0.42 + SPAN, CROSS_Y - RISE, 0.03)
    ],

    ramp: RAMPS.wood,
    rise: 70,
    heat: 0.45,
    breeze: 150,
    gust: 0.3,
    sparks: { gap: [0.08, 0.4], rise: 120, heat: 1.6, spread: 0.05 },

    config: {
        DENSITY_DISSIPATION: 1.6,  // carried further before it cools: the streamer is the picture
        BUOYANCY: 80,              // less lift, so the wind wins
        CURL: 34
    }
});
