/**
 * Scene: Frontal Passage
 *
 * Two air masses of different speed slide past each other; the shear layer
 * rolls into Kelvin-Helmholtz billows that the monogram then shreds. The
 * one scene here a passing fluid dynamicist would recognise on sight.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { stream } from '../emitters.js';
import { COOL, WARM, scale } from '../../utils/palette.js';

const TWO_PI = Math.PI * 2;

// Cells per second. The wind tunnel this scene replaces added 3.2 and 1.4 per
// frame; at the 60Hz it was tuned against that is 192 and 84 per second, and 84
// is the inlet speed the other tunnel scenes already ship, so the slow sheet
// lands exactly where the rest of the library sits.
const WARM_SPEED = 190;
const COOL_SPEED = 84;

// The floor on the band separation is a colour constraint, not a fluid one:
// amber over cyan sums to the exact grey of the body text, so the two dye
// ribbons have to stay out of each other. 0.28 apart with a dye radius of
// 0.008 leaves each band at 14% of peak where the other one is centred.
const WARM_Y = 0.62;
const COOL_Y = 0.34;
const SHEAR_Y = (WARM_Y + COOL_Y) / 2;

// Wide enough that the two Gaussians overlap into a single monotone velocity
// profile between them. Narrower and the gap reads as a wake - a low-speed
// notch between two jets - which sheds the wrong instability.
const SHEET_RADIUS = 0.018;

// Deliberately tighter than the velocity: the ribbon has to stay a ribbon to
// show a billow, and it keeps the two colours apart at the inlet.
const DYE_RADIUS = 0.008;

// The fast sheet stretches its tracer over 2.3x the distance, so it carries
// less dye per unit length at the same injection rate. The amplitudes only
// partly compensate - fully equalising would put the warm peak past 0.7 and
// the canvas would stop being a background.
const AMBER = scale(WARM, 0.40);
const STEEL = scale(COOL, 0.34);

// Billow spacing is set by forcing, not by the natural mode. Two sheets 0.28 of
// the height apart make a shear layer ~70 cells thick, whose most-amplified
// wavelength (~7 layer thicknesses) is longer than the 455-cell grid: left
// alone the interface waves once and never closes a roll. Billows convect at
// the mean of the two speeds, ~137 cells/s, so a 0.85s period spaces them about
// 115 cells apart - four across the canvas.
const SEED_PERIOD = 0.85;

// About an eighth of the 106 cells/s difference between the sheets: enough to
// choose the wavelength, not so much that the whole layer flaps bodily.
const SEED_SPEED = 14;

export default {
    id: 'frontal-passage',
    label: 'Frontal Passage',
    group: 'Weather',
    description: 'Two air masses shearing into billows',

    config: {
        DENSITY_DISSIPATION: 0.35,   // ~3s e-fold: the cool sheet takes ~6s to
                                     // cross and fades as it goes, the warm one
                                     // ~2.4s and stays bright the whole way
        VELOCITY_DISSIPATION: 0.06,  // the shear layer must survive long enough to roll up
        CURL: 18,                    // 30 shreds billows before they close
        PRESSURE_ITERATIONS: 32,
        WALL_SLIP: 0.86,             // a real wake off the strokes
        OUTFLOW_BOUNDARY: true,
        SHADING: true,
        BLOOM: false
    },

    obstacles: 'monogram',

    update(ctx, t) {
        // Two incommensurate periods, so the pair only repeats every 17x23 =
        // 391s - longer than anyone stays. The interface therefore never finds
        // a steady standing wave: the shear across it wanders between 58 and
        // 155 cells/s, and the billows loosen and tighten with it.
        const warmSpeed = WARM_SPEED * (1 + 0.16 * Math.sin(TWO_PI * t / 17));
        const coolSpeed = COOL_SPEED * (1 + 0.22 * Math.sin(TWO_PI * t / 23));

        // Common-mode: the front as a whole rides up and down, but both sheets
        // carry the same offset, so the 0.28 gap is preserved exactly.
        const drift = 0.015 * Math.sin(TWO_PI * t / 31);

        stream(ctx, {
            x: 0.015,
            y: WARM_Y + drift,
            dx: warmSpeed, dy: 0,
            radius: SHEET_RADIUS,
            color: AMBER,
            dyeRadius: DYE_RADIUS,
            dyeEvery: 4
        });

        stream(ctx, {
            x: 0.015,
            y: COOL_Y + drift,
            dx: coolSpeed, dy: 0,
            radius: SHEET_RADIUS,
            color: STEEL,
            dyeRadius: DYE_RADIUS,
            dyeEvery: 4,
            phase: 2
        });

        // Transverse forcing on the interface, just downstream of the inlets
        // where the shear is strongest and the layer is still thin. Tight
        // radius (1/e about 10 cells) so it nudges the interface rather than
        // stirring either air mass.
        ctx.velocity(
            0.07, SHEAR_Y + drift,
            0, SEED_SPEED * Math.sin(TWO_PI * t / SEED_PERIOD),
            0.0016
        );
    }
};
