/**
 * Scene: Braziers
 *
 * Three braziers in a row, in a wind strong enough to lay their flames over.
 *
 * The interest is downstream: each brazier sits in the hot wake of the one
 * upwind of it, so the second and third flames are fed air that is already
 * moving and already warm, and burn differently from the first.
 *
 * References:
 * - scenes/fire.js - how every fire scene works
 */

import { makeFire, log, spread, RAMPS } from '../fire.js';

const POSITIONS = [0.2, 0.5, 0.8];
const BOWL_Y = 0.16;

/**
 * A brazier: a bowl on a post
 *
 * @param {number} x - Centre, design x
 * @returns {Array<Object>} Obstacles
 */
function brazier(x) {
    return [
        {
            type: 'polygon',
            vertices: [
                { x: x - 0.065, y: BOWL_Y + 0.04 },
                { x: x + 0.065, y: BOWL_Y + 0.04 },
                { x: x + 0.03, y: BOWL_Y },
                { x: x - 0.03, y: BOWL_Y }
            ]
        },
        log(x, -0.02, x, BOWL_Y, 0.014)
    ];
}

export default makeFire({
    id: 'braziers',
    label: 'Braziers',
    description: 'Three braziers in a row, flames laid over by the wind',

    beds: POSITIONS.map((x) => ({ x, y: BOWL_Y + 0.055, tongues: spread(3, 0.035, 0.7) })),

    obstacles: POSITIONS.flatMap(brazier),

    ramp: RAMPS.wood,
    rise: 65,
    heat: 0.38,
    breeze: 125,
    gust: 0.35,
    sparks: { gap: [0.15, 0.6], rise: 150, heat: 1.4, spread: 0.04 },

    config: {
        DENSITY_DISSIPATION: 2.0,
        BUOYANCY: 85               // three plumes lift hard; less, or they stand up to the wind
    }
});
