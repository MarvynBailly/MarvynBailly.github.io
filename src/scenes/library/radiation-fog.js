/**
 * Scene: Radiation Fog
 *
 * A shallow, almost motionless fog layer creeping across the floor and
 * licking the monogram's feet. Deliberately the quietest scene here.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { stream } from '../emitters.js';
import { COOL, INK, mix, scale } from '../../utils/palette.js';

const TWO_PI = Math.PI * 2;

// Graphite pulled a third of the way towards the cool ink: fog reads as grey
// with a hint of the sky in it, never as a colour. Peak channel 0.063, which is
// about a fifth of what the tunnel scenes inject - this one accumulates for
// minutes rather than being flushed downstream in seconds.
const FOG = scale(mix(INK, COOL, 0.35), 0.09);

// Cells per second. A third of the slowest inlet in the library, and
// VELOCITY_DISSIPATION 0.35 takes another bite out of it: fog reaches the
// monogram's feet in about five seconds and the far edge in fifteen.
const DRIFT_SPEED = 30;

// A single push at the inlet is not enough. At VELOCITY_DISSIPATION 0.35 a
// parcel released at 30 cells/s coasts 30/0.35 = 86 cells before it stops,
// an eighth of the width, and the layer would pile up against nothing at
// x 0.15. Real radiation fog drifts under a weak gradient across the whole
// surface, not out of a nozzle, so the push is spread along the ground and
// eases off downstream.
const STATIONS = [
    { x: 0.32, dx: 24 },
    { x: 0.60, dx: 20 },
    { x: 0.86, dx: 16 }
];

const GROUND_Y = 0.06;

// 0.10 keeps fog looking like it is not going anywhere, which is right for the
// first minute. But a source that never stops feeding a buffer that never
// forgets ends as a flat wash over the lower half with no contrast left in it.
// Walking dissipation up to 0.30 (a ~3.3s e-fold, the same order as the tunnel
// scenes) over 90 seconds bounds the total without anyone seeing it happen:
// dye lifetime changes by 0.2% per second against a layer that takes fifteen
// seconds to cross the canvas.
const SETTLE_SECONDS = 90;
const SETTLED_DISSIPATION = 0.30;

export default {
    id: 'radiation-fog',
    label: 'Radiation Fog',
    group: 'Weather',
    description: 'A slow layer creeping across the floor',

    config: {
        DENSITY_DISSIPATION: 0.10,   // fog does not evaporate
        VELOCITY_DISSIPATION: 0.35,  // raised: heavy damping makes it creep, not swirl
        CURL: 6,
        PRESSURE_ITERATIONS: 24,
        WALL_SLIP: 0.80,
        WALL_BAND: 2.0,              // stickier ground
        SHADING: false,              // shading gives fog a plastic edge
        OUTFLOW_BOUNDARY: true
    },

    obstacles: 'monogram',

    update(ctx, t) {
        const settled = Math.min(t / SETTLE_SECONDS, 1);
        ctx.config.DENSITY_DISSIPATION = 0.10 + (SETTLED_DISSIPATION - 0.10) * settled;

        // Two incommensurate periods so the top of the layer wanders instead of
        // breathing on a beat you can count. Range 0.063 to 0.137, and the dye
        // radius carries it up to about 0.22 - just onto the monogram's feet.
        const height = 0.10
            + 0.025 * Math.sin(TWO_PI * t / 37)
            + 0.012 * Math.sin(TWO_PI * t / 53);

        // dy is zero everywhere in this scene, deliberately. Radiation fog forms
        // under a stable inversion; anything that lofts it stops being fog.
        stream(ctx, {
            x: 0.02,
            y: height,
            dx: DRIFT_SPEED, dy: 0,
            radius: 0.012,
            color: FOG,
            dyeRadius: 0.016,
            dyeEvery: 4
        });

        for (const station of STATIONS) {
            ctx.velocity(station.x, GROUND_Y, station.dx, 0, 0.014);
        }
    }
};
