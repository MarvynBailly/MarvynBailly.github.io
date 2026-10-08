/**
 * Scene: Bonfire
 *
 * A big fire in a teepee of logs, throwing sparks into a steady wind.
 *
 * The teepee is left open at the top: the logs lean in but do not meet, so
 * the heat collected inside has a chimney to leave by, and comes out of it as
 * one tall column rather than leaking between the logs.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 */

import { makeFire, log, spread, RAMPS } from '../fire.js';

export default makeFire({
    id: 'bonfire',
    label: 'Bonfire',
    description: 'A tall fire in a teepee of logs, throwing sparks',

    beds: [{ x: 0.5, y: 0.075, tongues: spread(9, 0.1, 0.5) }],

    obstacles: [
        // Two long logs leaning in, open at the top
        log(0.31, 0.02, 0.465, 0.30, 0.032),
        log(0.69, 0.02, 0.535, 0.30, 0.032),
        // Two shorter ones in front, leaning the other way
        log(0.37, 0.02, 0.44, 0.20, 0.026),
        log(0.63, 0.02, 0.56, 0.20, 0.026),
        // The base log the pile is built on
        log(0.30, 0.025, 0.70, 0.025, 0.03)
    ],

    ramp: RAMPS.wood,
    rise: 95,
    heat: 0.42,
    breeze: 32,
    gust: 0.5,
    dyeEvery: 3,        // nine tongues; feeding a third of them a frame keeps it cheap
    sparks: { gap: [0.05, 0.35], rise: 260, heat: 1.8, spread: 0.05 },

    config: {
        DENSITY_DISSIPATION: 1.5,  // a bonfire's flames are tall
        BUOYANCY: 150,
        CURL: 32
    }
});
