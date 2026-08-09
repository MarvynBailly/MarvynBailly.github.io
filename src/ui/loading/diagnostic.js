/**
 * Loading Concept: Diagnostic Readout
 *
 * Tabular percentage, segmented bar, live stage name and shader file counter.
 * The most conventional of the concepts, and the most legible on a fast load.
 */

import { STAGES, activeStage, SHADER_COUNT } from './stages.js';

const SEGMENTS = 34;

/**
 * @param {HTMLElement} root - Stage element to mount into
 * @returns {{render: (p: number, now: number) => void}}
 */
export function createDiagnostic(root) {
    const box = document.createElement('div');
    box.className = 'ld-diag';

    const percent = document.createElement('div');
    percent.className = 'ld-diag-pct';
    const number = document.createElement('b');
    number.textContent = '0';
    const unit = document.createElement('span');
    unit.textContent = '%';
    percent.append(number, unit);

    const bar = document.createElement('div');
    bar.className = 'ld-diag-bar';
    const segments = Array.from({ length: SEGMENTS }, () => {
        const seg = document.createElement('i');
        seg.className = 'ld-diag-seg';
        bar.appendChild(seg);
        return seg;
    });

    const meta = document.createElement('div');
    meta.className = 'ld-diag-meta';
    const stage = document.createElement('b');
    stage.textContent = STAGES[0].label;
    const counter = document.createElement('span');
    counter.className = 'ld-diag-count';
    counter.textContent = `00 / ${SHADER_COUNT}`;
    meta.append(stage, counter);

    box.append(percent, bar, meta);
    root.appendChild(box);

    return {
        render(p) {
            number.textContent = String(Math.round(p * 100));

            const filled = Math.round(p * SEGMENTS);
            segments.forEach((seg, i) => {
                seg.classList.toggle('on', i < filled);
                seg.classList.toggle('tip', i === filled - 1 && p < 1);
            });

            stage.textContent = p >= 1 ? 'ready' : STAGES[activeStage(p)].label;
            const files = String(Math.round(p * SHADER_COUNT)).padStart(2, '0');
            counter.textContent = `${files} / ${SHADER_COUNT}`;
        },
    };
}
