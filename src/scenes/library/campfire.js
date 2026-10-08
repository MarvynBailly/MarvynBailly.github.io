/**
 * Scene: Campfire
 *
 * A fire on two crossed logs, leaning in a light, gusting breeze.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 */

import { makeFire, log, spread, RAMPS } from '../fire.js';

// The logs cross at the bed's centre and slope at about 27 degrees, which
// matters in ASCII as much as on screen - below 22.5 their long edges would be
// drawn as '-' and the X would read as a box.
const SPAN = 0.08;
const RISE = 0.04;
const CROSS_Y = 0.09;

export default makeFire({
    id: 'campfire',
    label: 'Campfire',
    description: 'A fire on two logs, leaning in a gusting breeze',

    // The tongues sit in the V the logs make above the crossing, so the
    // outer ones climb the arms and the fire looks cradled by the wood
    beds: [{ x: 0.5, y: CROSS_Y + 0.03, slope: RISE / SPAN, tongues: spread(5, 0.05) }],

    obstacles: [
        log(0.5 - SPAN, CROSS_Y - RISE, 0.5 + SPAN, CROSS_Y + RISE, 0.03),
        log(0.5 - SPAN, CROSS_Y + RISE, 0.5 + SPAN, CROSS_Y - RISE, 0.03)
    ],

    ramp: RAMPS.wood,
    rise: 70,
    heat: 0.4,
    breeze: 45,         // leans the column by twenty degrees or so, more in a gust
    sparks: { gap: [0.25, 1.15], rise: 190, heat: 1.6, spread: 0.04 }
});
