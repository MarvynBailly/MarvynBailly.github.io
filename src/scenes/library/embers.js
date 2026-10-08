/**
 * Scene: Embers
 *
 * A campfire burning down: a low glow along the logs, wisps of smoke, and now
 * and then a flame that catches, leaps, and dies back.
 *
 * Most of the time almost nothing is happening, which is the point. The flare
 * is what the eye waits for, so it comes at irregular intervals from a
 * different place each time.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 */

import { makeFire, log, spread, RAMPS } from '../fire.js';

const SPAN = 0.08;
const RISE = 0.04;
const CROSS_Y = 0.09;

export default makeFire({
    id: 'embers',
    label: 'Embers',
    description: 'A fire burning down, with the odd flame catching',

    beds: [{ x: 0.5, y: CROSS_Y + 0.025, slope: RISE / SPAN, tongues: spread(7, 0.065, 0.7) }],

    obstacles: [
        log(0.5 - SPAN, CROSS_Y - RISE, 0.5 + SPAN, CROSS_Y + RISE, 0.03),
        log(0.5 - SPAN, CROSS_Y + RISE, 0.5 + SPAN, CROSS_Y - RISE, 0.03)
    ],

    ramp: RAMPS.embers,
    rise: 16,
    heat: 0.07,
    breeze: 18,
    gust: 0.5,
    flicker: 0.6,
    dyeEvery: 3,
    flares: { gap: [1.2, 3.5], length: 0.7, boost: 3.5 },
    sparks: { gap: [1.0, 3.5], rise: 140, heat: 1.2, spread: 0.06 },

    config: {
        DENSITY_DISSIPATION: 1.2,  // what little heat there is lingers as smoke
        BUOYANCY: 90,
        CURL: 20
    }
});
