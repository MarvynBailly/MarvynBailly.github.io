/**
 * Scene: Tunnel / Section A
 *
 * The wind tunnel done properly: an inlet-outlet channel with free-slip
 * walls, so flow crosses the screen instead of recirculating in a box.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { WARM, COOL, scale } from '../../utils/palette.js';

const FILAMENTS = 7;
const PER_FRAME = 3;
const AMBER = scale(WARM, 0.30);
const STEEL = scale(COOL, 0.26);

export default {
    id: 'tunnel-section',
    label: 'Tunnel / Section A',
    group: 'Tunnel',
    description: 'A real inlet-outlet channel past the monogram',
    requires: 'channel',

    config: {
        VELOCITY_DISSIPATION: 0.02,  // drag at 0.2 eats the free stream mid-transit
        DENSITY_DISSIPATION: 0.35,
        CURL: 12,
        PRESSURE_ITERATIONS: 50,     // through-flow needs pressure to cross the domain
        WALL_SLIP: 0.86,
        SHADING: false,              // embosses thin filaments into noise
        OUTFLOW_BOUNDARY: true,
        CHANNEL_INLET: 120           // simulation cells/second
    },

    obstacles: 'monogram',

    update(ctx) {
        // Only dye is emitted here. The inlet velocity is a boundary condition
        // inside the divergence stencil, so unlike every other scene there is
        // nothing to push: the channel is already moving before this runs.
        for (let n = 0; n < PER_FRAME; n++) {
            const i = (ctx.frame * PER_FRAME + n) % FILAMENTS;
            const y = 0.18 + (0.64 * i) / (FILAMENTS - 1);

            // Each filament is refreshed every FILAMENTS/PER_FRAME frames, so
            // the amplitude carries the frames it skipped. At the inlet speed
            // that puts successive deposits about 1.5 radii apart, which reads
            // as a continuous streakline rather than a dotted one.
            const boost = FILAMENTS / PER_FRAME;
            const ink = i === (FILAMENTS - 1) / 2 ? STEEL : AMBER;
            ctx.dye(0.012, y, scale(ink, boost), 0.00015);
        }
    }
};
