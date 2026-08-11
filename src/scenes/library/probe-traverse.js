/**
 * Scene: Probe Traverse
 *
 * The cursor becomes a towed probe leaving a wake. When nobody is there, an
 * invisible one flies a programmed traverse, so the page is always mid-
 * experiment rather than dead for the visitors who never move a mouse.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

import { COOL, scale } from '../../utils/palette.js';

// The traverse. 0.11 and 0.17 rad/s share no common factor, so the 57s sweep
// in x and the 37s sweep in y never come back into step and the track never
// closes on itself. Slow on purpose: an autonomous cursor that darts about
// reads as a haunted page rather than as an instrument.
const AX = 0.34, WX = 0.11;
const AY = 0.30, WY = 0.17, PY = 1.1;

// Six seconds is long enough that it never fires between two strokes of a
// visitor who is actually using the canvas, short enough that a page left
// alone comes back to life while it is still on screen.
const IDLE_TAKEOVER = 6.0;
const RAMP_IN = 2.0;
const RAMP_OUT = 0.8;   // shorter: yielding should feel prompter than arriving

// Raw shader radii, exp(-r^2/radius), measured in screen heights.
const TRACE_RADIUS = 0.0009;   // 1/e at 0.03 - a filament, not a blob
const WAKE_RADIUS = 0.0016;    // 0.04, wider than the dye it has to carry
const WAKE_LAG = 0.024;        // the push trails the nose by ~0.8 trace radii

// Dye amplitude laid down per unit of path length, in screen heights. One pass
// of the kernel integrates to TRACE_DENSITY * sqrt(pi * TRACE_RADIUS) = 0.48,
// about 0.38 after the ~1s pass is eaten into by DENSITY_DISSIPATION, so COOL's
// strongest channel lands near 0.30 - the ceiling for keeping text legible.
const TRACE_DENSITY = 9.0;

export default {
    id: 'probe-traverse',
    label: 'Probe Traverse',
    group: 'Geometry',
    description: 'An idle probe flying a programmed traverse',

    config: {
        SPLAT_RADIUS: 0.09,          // a trace, not a blob
        SPLAT_FORCE: 2600,           // smaller radius needs more force for equal momentum
        DENSITY_DISSIPATION: 0.5,
        VELOCITY_DISSIPATION: 0.12,
        CURL: 26,
        PRESSURE_ITERATIONS: 40,
        CONTINUOUS_COLOR_CHANGE: false,  // the rainbow loop is the most toy-like thing here
        PALETTE_POINTER: true,
        POINTER_FAMILY: 'warm',      // the visitor is warm, the ghost is cool
        SHADING: true
    },

    obstacles: 'monogram',

    setup(ctx) {
        // How much of the traverse is actually being injected, 0 to 1.
        //
        // This scales what the probe emits, not the size of the figure it flies.
        // Ramping the Lissajous amplitude instead would drag the emitter from
        // the edge of the screen to the middle of it in RAMP_OUT seconds - seven
        // times the probe's own speed, straight across the text - every time a
        // visitor arrived.
        ctx.state.amplitude = 0;
    },

    update(ctx, t, dt) {
        const s = ctx.state;

        // idleFor() is Infinity until someone touches the canvas, so for most
        // visits the ghost is the normal state rather than the exception.
        const wanted = ctx.idleFor() >= IDLE_TAKEOVER ? 1 : 0;
        const step = dt / (wanted ? RAMP_IN : RAMP_OUT);
        s.amplitude = Math.max(0, Math.min(1, s.amplitude + (wanted ? step : -step)));

        // While the visitor is driving, this scene costs nothing at all
        if (s.amplitude <= 0) return;

        // Smoothstep, so the trace eases off its ends instead of appearing and
        // vanishing at a constant rate
        const env = s.amplitude * s.amplitude * (3 - 2 * s.amplitude);

        const x = 0.5 + AX * Math.sin(WX * t);
        const y = 0.5 + AY * Math.sin(WY * t + PY);

        // Screen-normalised units per second, differentiated analytically so the
        // envelope stays out of it: the ramp changes what is injected, never
        // where, and cannot smear a phantom sprint into the field.
        const dx = AX * WX * Math.cos(WX * t);
        const dy = AY * WY * Math.cos(WY * t + PY);

        // The splat kernel measures distance as (dx * aspect, dy) - screen
        // heights, isotropic. Simulation cells are square with the short side of
        // the grid at SIM_RESOLUTION, so these are the cells spanned by one full
        // unit of each normalised axis, and velocity is cells per second.
        const cellsX = ctx.config.SIM_RESOLUTION * Math.max(1, ctx.aspect);
        const cellsY = ctx.config.SIM_RESOLUTION * Math.max(1, 1 / ctx.aspect);

        const hx = dx * ctx.aspect, hy = dy;
        const speed = Math.hypot(hx, hy);   // screen heights/second, peaks near 0.084
        if (speed < 1e-6) return;           // both cosines through zero at once

        // Behind the nose, along the heading. The dye is then laid into fluid
        // that has not been pushed yet, so the push stretches the trace backwards
        // into a wake instead of shoving the whole filament sideways.
        const bx = x - (hx / speed) * WAKE_LAG / ctx.aspect;
        const by = y - (hy / speed) * WAKE_LAG;

        // Injected as an acceleration rather than an impulse: the same value
        // lands every frame for as long as the kernel covers a given cell, which
        // is sqrt(pi * WAKE_RADIUS) / speed ~ 1.3s, so the fluid settles at
        // roughly the probe's own 14 cells/s - what a towed body drags with it.
        // Without the dt the wake would be sixty times that, and a jet.
        ctx.velocity(bx, by, dx * cellsX * dt * env, dy * cellsY * dt * env, WAKE_RADIUS);

        // Dye per unit of path length, not per unit of time, so the slow corners
        // of the traverse leave the same trail brightness as the fast middles
        // instead of pooling into a knot wherever the probe nearly stalls.
        ctx.dye(x, y, scale(COOL, TRACE_DENSITY * speed * dt * env), TRACE_RADIUS);
    }
};
