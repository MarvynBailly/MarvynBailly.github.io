/**
 * Scene: Karman Street
 *
 * A cylinder in the channel shedding an alternating vortex street. The
 * effective Reynolds number is set by numerical viscosity, roughly 2D/dx,
 * which at a 38-cell cylinder lands near 75 - inside the 47-190 shedding
 * band, but only just, so it needs a trip to break the discrete symmetry.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { WARM, COOL, scale } from '../../utils/palette.js';

/** Matches the obstacle below; design space maps to the shorter screen axis */
const CYLINDER_X = 0.30;
const CYLINDER_R = 0.075;

const AMBER = scale(WARM, 0.34);
const STEEL = scale(COOL, 0.30);

const TRIP_AT = 1.2;
const TRIP_FOR = 0.4;

export default {
    id: 'karman-street',
    label: 'Karman Street',
    group: 'Tunnel',
    description: 'A cylinder shedding an alternating vortex street',
    requires: 'channel',

    config: {
        VELOCITY_DISSIPATION: 0.02,
        DENSITY_DISSIPATION: 0.2,
        CURL: 18,                    // offsets numerical damping of the shed vortices
        PRESSURE_ITERATIONS: 60,
        WALL_SLIP: 0.80,
        SHADING: false,
        OUTFLOW_BOUNDARY: true,
        CHANNEL_INLET: 100           // St~0.2 gives one shed every ~2s
    },

    // The cylinder replaces the monogram: the wake needs the room
    obstacles: [{ type: 'circle', x: 0.30, y: 0.50, radius: 0.075 }],

    update(ctx, t) {
        // Two filaments straddling the stagnation streamline, close enough to
        // the surface that each is entrained into one shear layer. Colouring
        // them differently is the whole point: once shedding starts, the street
        // alternates, and two colours make the alternation legible where one
        // would just look like a wavy line.
        ctx.dye(0.012, 0.5 + 0.04, AMBER, 0.00018);
        ctx.dye(0.012, 0.5 - 0.04, STEEL, 0.00018);

        // The discretisation is too symmetric to shed on its own in any
        // reasonable time, so the wake is tripped once and then left alone.
        // Real cylinders are tripped by their own imperfections; this one has
        // none, being exact to the texel.
        if (t >= TRIP_AT && t < TRIP_AT + TRIP_FOR) {
            const x = 0.5 + (CYLINDER_X - 0.5) / ctx.aspect;
            ctx.velocity(x, 0.5 + CYLINDER_R * 0.8, 0, -45, 0.0004);
        }
    }
};
