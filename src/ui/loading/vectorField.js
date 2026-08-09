/**
 * Loading Concept: Vector Field Settling
 *
 * Randomly oriented arrows rotate into a coherent flow field, staggered across
 * the grid - a preview of what the page is about before the sim appears.
 */

import { createCanvas, monoFont, smooth, clamp01, hash01, COLOR } from './helpers.js';

const NX = 26;
const NY = 15;

/**
 * @param {HTMLElement} root - Stage element to mount into
 * @returns {{render: (p: number, now: number) => void}}
 */
export function createVectorField(root) {
    const { begin } = createCanvas(root);

    // Fixed starting angles so the field settles rather than churns.
    const start = [];
    for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
            start.push(hash01(i * 53 + j * 17) * Math.PI * 2);
        }
    }

    return {
        render(p) {
            const { ctx, W, H } = begin();
            const step = Math.min((W * 0.76) / NX, (H * 0.76) / NY);
            const length = step * 0.62;
            const ox = (W - step * NX) / 2 + step / 2;
            const oy = (H - step * NY) / 2 + step / 2;

            ctx.lineWidth = 1.35;
            for (let j = 0; j < NY; j++) {
                for (let i = 0; i < NX; i++) {
                    const x = ox + i * step;
                    const y = oy + j * step;

                    // Target orientation: a smooth curl-like field
                    const u = (i / NX - 0.5) * 3.2;
                    const v = (j / NY - 0.5) * 3.2;
                    const target = Math.atan2(
                        Math.sin(u) * 0.9 + v * 0.55,
                        Math.cos(v) * 0.9 - u * 0.55
                    );

                    // Stagger the settle so it sweeps across the field
                    const delay = (i / NX) * 0.32 + (j / NY) * 0.12;
                    const w = smooth(clamp01((p - delay) / (1 - delay + 1e-3)));

                    const from = start[j * NX + i];
                    let delta = target - from;
                    while (delta > Math.PI) delta -= Math.PI * 2;
                    while (delta < -Math.PI) delta += Math.PI * 2;

                    const angle = from + delta * w;
                    const len = length * (0.42 + 0.58 * w);
                    const dx = (Math.cos(angle) * len) / 2;
                    const dy = (Math.sin(angle) * len) / 2;

                    ctx.strokeStyle = `rgba(127, 176, 201, ${0.2 + 0.62 * w})`;
                    ctx.beginPath();
                    ctx.moveTo(x - dx, y - dy);
                    ctx.lineTo(x + dx, y + dy);
                    ctx.moveTo(x + dx, y + dy);
                    ctx.lineTo(x + dx - Math.cos(angle - 0.45) * len * 0.3, y + dy - Math.sin(angle - 0.45) * len * 0.3);
                    ctx.moveTo(x + dx, y + dy);
                    ctx.lineTo(x + dx - Math.cos(angle + 0.45) * len * 0.3, y + dy - Math.sin(angle + 0.45) * len * 0.3);
                    ctx.stroke();
                }
            }

            const { font } = monoFont(W);
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.fillStyle = p >= 1 ? COLOR.amber : COLOR.dim;
            ctx.fillText(p >= 1 ? 'field initialised' : 'seeding velocity field', W / 2, H - H * 0.05);
        },
    };
}
