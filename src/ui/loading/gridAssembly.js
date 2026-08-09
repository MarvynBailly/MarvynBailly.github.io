/**
 * Loading Concept: Grid Assembly
 *
 * A quad mesh sweeps into existence behind an amber wavefront and relaxes
 * straight as it goes - a nod to the frame-fields grid generation research.
 */

import { createCanvas, monoFont, easeOut, smooth, clamp01, hash01, COLOR } from './helpers.js';

const NX = 22;
const NY = 13;

/**
 * @param {HTMLElement} root - Stage element to mount into
 * @returns {{render: (p: number, now: number) => void}}
 */
export function createGridAssembly(root) {
    const { begin } = createCanvas(root);

    // Per-node offsets, fixed so the mesh relaxes rather than jitters.
    const jitter = [];
    for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) {
            const seed = i * 37 + j * 91;
            jitter.push([hash01(seed) * 2 - 1, hash01(seed * 7 + 3) * 2 - 1]);
        }
    }

    return {
        render(p) {
            const { ctx, W, H } = begin();
            const pad = Math.min(W, H) * 0.13;
            const gw = W - pad * 2;
            const gh = H - pad * 2;

            const relax = smooth(clamp01(p * 1.25));
            const amp = (1 - relax) * Math.min(gw / NX, gh / NY) * 0.72;
            const reveal = easeOut(p);

            const node = (i, j) => {
                const [rx, ry] = jitter[j * (NX + 1) + i];
                return [pad + (gw * i) / NX + rx * amp, pad + (gh * j) / NY + ry * amp];
            };
            // Diagonal wavefront, mostly left-to-right
            const live = (i, j) => (i / NX) * 0.78 + (j / NY) * 0.22 <= reveal * 1.04;

            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(127, 176, 201, ${0.28 + relax * 0.34})`;
            for (let j = 0; j <= NY; j++) {
                for (let i = 0; i <= NX; i++) {
                    if (!live(i, j)) continue;
                    const [x, y] = node(i, j);
                    if (i < NX && live(i + 1, j)) {
                        const [x2, y2] = node(i + 1, j);
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                    if (j < NY && live(i, j + 1)) {
                        const [x2, y2] = node(i, j + 1);
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                }
            }

            // Wavefront highlight
            if (p < 1) {
                const wx = pad + gw * clamp01(reveal / 0.78);
                const gradient = ctx.createLinearGradient(wx - 26, 0, wx + 6, 0);
                gradient.addColorStop(0, 'rgba(201, 154, 91, 0)');
                gradient.addColorStop(1, 'rgba(201, 154, 91, 0.5)');
                ctx.fillStyle = gradient;
                ctx.fillRect(wx - 26, pad, 32, gh);
            }

            const { font } = monoFont(W);
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.fillStyle = p >= 1 ? COLOR.amber : COLOR.dim;
            ctx.fillText(p >= 1 ? 'grid ready' : `assembling grid   ${NX}x${NY}`, W / 2, H - pad * 0.42);
        },
    };
}
