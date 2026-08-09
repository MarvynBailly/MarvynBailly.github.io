/**
 * Loading Concept: Convergence Plot
 *
 * Residual dropping six decades on a log axis while the simulation loads -
 * initialization drawn as the thing this site is actually about.
 */

import { createCanvas, monoFont, easeOut, hash01, COLOR } from './helpers.js';

const SAMPLES = 90;

/**
 * @param {HTMLElement} root - Stage element to mount into
 * @returns {{render: (p: number, now: number) => void}}
 */
export function createConvergence(root) {
    const { begin } = createCanvas(root);

    // Fixed wobble so the curve is stable frame to frame.
    const wobble = Array.from({ length: SAMPLES }, (_, i) => hash01(i));

    /** Residual in decades below 1e0 at a normalized iteration position. */
    const decadesAt = (f, i) => Math.min(6 * f + wobble[i] * 0.22 * (1 - f), 6);

    return {
        render(p) {
            const { ctx, W, H } = begin();
            const margin = { l: W * 0.16, r: W * 0.07, t: H * 0.18, b: H * 0.26 };
            const pw = W - margin.l - margin.r;
            const ph = H - margin.t - margin.b;
            const { font, size } = monoFont(W);
            ctx.font = font;

            // Horizontal grid lines, one per decade pair
            ctx.strokeStyle = COLOR.grid;
            ctx.lineWidth = 1;
            for (let i = 0; i <= 6; i++) {
                const y = margin.t + (ph * i) / 6;
                ctx.beginPath();
                ctx.moveTo(margin.l, y);
                ctx.lineTo(margin.l + pw, y);
                ctx.stroke();
            }

            // Axes
            ctx.strokeStyle = COLOR.axis;
            ctx.beginPath();
            ctx.moveTo(margin.l, margin.t);
            ctx.lineTo(margin.l, margin.t + ph);
            ctx.lineTo(margin.l + pw, margin.t + ph);
            ctx.stroke();

            // Axis labels
            ctx.fillStyle = COLOR.dim;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 0; i <= 6; i += 2) {
                ctx.fillText(`1e-${i}`, margin.l - 7, margin.t + (ph * i) / 6);
            }
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('iteration', margin.l + pw / 2, margin.t + ph + 9);

            // Residual curve, drawn up to current progress
            const count = Math.max(2, Math.floor(SAMPLES * easeOut(p)));
            ctx.beginPath();
            for (let i = 0; i < count; i++) {
                const f = i / (SAMPLES - 1);
                const x = margin.l + pw * f;
                const y = margin.t + (ph * decadesAt(f, i)) / 6;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = COLOR.primary;
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Leading point
            const last = count - 1;
            const f = last / (SAMPLES - 1);
            ctx.fillStyle = p >= 1 ? COLOR.amber : COLOR.primary;
            ctx.beginPath();
            ctx.arc(margin.l + pw * f, margin.t + (ph * decadesAt(f, last)) / 6, 2.6, 0, Math.PI * 2);
            ctx.fill();

            // Readout above the plot
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            const y = margin.t - size * 0.9;
            ctx.fillStyle = COLOR.dim;
            ctx.fillText('residual', margin.l, y);
            ctx.fillStyle = p >= 1 ? COLOR.amber : COLOR.text;
            ctx.fillText(p >= 1 ? 'converged' : Math.pow(10, -6 * f).toExponential(2), margin.l + size * 5.4, y);
        },
    };
}
