/**
 * Scene: Candle
 *
 * One small, steady flame on a candle, in a room with only a draught.
 *
 * A candle burns slowly and evenly, so this is the fire builder turned right
 * down: a single tongue, little flicker, heat that cools fast enough to keep
 * the flame short, and just enough air moving to bend it now and then and
 * carry the thread of smoke away.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 */

import { makeFire, RAMPS } from '../fire.js';

const TOP = 0.34;

export default makeFire({
    id: 'candle',
    label: 'Candle',
    description: 'A single steady flame in a draught',

    beds: [{ x: 0.5, y: TOP + 0.025, tongues: [{ offset: 0, vigour: 1 }] }],

    obstacles: [
        { type: 'roundrect', x: 0.46, y: -0.05, width: 0.08, height: TOP + 0.05, radius: 0.012 }
    ],

    ramp: RAMPS.candle,
    rise: 34,
    heat: 1.0,
    breeze: 7,
    gust: 0.7,          // a draught comes and goes
    flicker: 0.35,      // a candle hardly flickers until something disturbs it
    radius: 0.00034,
    dyeRadius: 0.0002,
    dyeEvery: 1,
    flares: { gap: [3, 7], length: 0.35, boost: 1.5 },

    config: {
        DENSITY_DISSIPATION: 2.8,  // short: a candle flame is a teardrop, not a column
        BUOYANCY: 90,
        CURL: 14
    }
});
