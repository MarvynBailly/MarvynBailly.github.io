/**
 * Loading Concept: Boot Log
 *
 * Init stages check themselves off as they complete, ending on a blinking
 * caret. Degrades gracefully on a fast load - fewer lines simply land.
 */

import { STAGES, stageDone } from './stages.js';

/**
 * @param {HTMLElement} root - Stage element to mount into
 * @param {{reduced: boolean}} options - Rendering options
 * @returns {{render: (p: number, now: number) => void}}
 */
export function createBootLog(root, { reduced }) {
    const box = document.createElement('div');
    box.className = 'ld-boot';

    const rows = STAGES.map((stage) => {
        const row = document.createElement('div');
        row.className = 'ld-boot-row';

        const status = document.createElement('span');
        status.className = 'ld-boot-status waiting';
        status.textContent = '[ .. ]';

        const label = document.createElement('span');
        label.className = 'ld-boot-label';
        label.textContent = stage.label;

        const detail = document.createElement('span');
        detail.className = 'ld-boot-detail';
        detail.textContent = stage.detail;

        row.append(status, label, detail);
        box.appendChild(row);
        return { row, status };
    });

    const tail = document.createElement('div');
    tail.className = 'ld-boot-row ld-boot-tail';
    const tailStatus = document.createElement('span');
    tailStatus.className = 'ld-boot-status waiting';
    tailStatus.textContent = '[ .. ]';
    const tailLabel = document.createElement('span');
    tailLabel.className = 'ld-boot-label';
    tailLabel.textContent = 'solver ready';
    const caret = document.createElement('span');
    caret.className = 'ld-caret';
    tailLabel.appendChild(caret);
    tail.append(tailStatus, tailLabel);
    box.appendChild(tail);

    root.appendChild(box);

    return {
        render(p, now) {
            rows.forEach((entry, i) => {
                // A row appears once the previous stage finished, so the line
                // currently being worked on is always visible.
                const visible = i === 0 || stageDone(i - 1, p);
                const done = stageDone(i, p);
                entry.row.classList.toggle('visible', visible);
                entry.status.textContent = done ? '[ ok ]' : '[ .. ]';
                entry.status.classList.toggle('waiting', !done);
            });

            const ready = p >= 1;
            tail.classList.toggle('visible', stageDone(STAGES.length - 2, p));
            tailStatus.textContent = ready ? '[ ok ]' : '[ .. ]';
            tailStatus.classList.toggle('waiting', !ready);
            caret.style.opacity = reduced || Math.floor(now / 470) % 2 ? '1' : '0.15';
        },
    };
}
