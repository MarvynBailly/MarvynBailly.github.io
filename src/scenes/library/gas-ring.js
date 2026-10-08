/**
 * Scene: Gas Ring
 *
 * A row of blue gas jets along a burner, seen side on.
 *
 * Gas comes out under pressure and burns clean, so this is the opposite of
 * a wood fire: many small jets, pushed hard, barely flickering, and cooled so
 * quickly that each one is a short, sharp cone. In the ordinary renderer it is
 * blue; in ASCII's gradient schemes it takes the scheme's colours like any
 * other fire.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 */

import { makeFire, spread, RAMPS } from '../fire.js';

const BURNER_Y = 0.2;

export default makeFire({
    id: 'gas-ring',
    label: 'Gas Ring',
    description: 'A row of steady blue gas jets',

    beds: [{ x: 0.5, y: BURNER_Y + 0.035, tongues: spread(13, 0.2, 0.85) }],

    obstacles: [
        { type: 'roundrect', x: 0.27, y: BURNER_Y, width: 0.46, height: 0.03, radius: 0.012 },
        { type: 'rectangle', x: 0.485, y: -0.02, width: 0.03, height: BURNER_Y + 0.02 }
    ],

    ramp: RAMPS.gas,
    rise: 120,
    heat: 0.34,
    breeze: 6,
    gust: 0.8,
    flicker: 0.25,
    radius: 0.00018,
    dyeRadius: 0.0001,
    dyeEvery: 3,

    config: {
        DENSITY_DISSIPATION: 4.5,  // short, sharp cones
        BUOYANCY: 60,
        CURL: 10
    }
});
