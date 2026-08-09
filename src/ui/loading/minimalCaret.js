/**
 * Loading Concept: Minimal Caret
 *
 * One line of text, a blinking block caret, and a hairline that fills. The
 * restrained option, and the one used when the visitor prefers reduced motion.
 */

import { STAGES, activeStage } from './stages.js';

/**
 * @param {HTMLElement} root - Stage element to mount into
 * @param {{reduced: boolean}} options - Rendering options
 * @returns {{render: (p: number, now: number) => void}}
 */
export function createMinimalCaret(root, { reduced }) {
    const box = document.createElement('div');
    box.className = 'ld-min';

    const line = document.createElement('div');
    line.className = 'ld-min-text';
    const marker = document.createElement('i');
    marker.className = 'ld-min-marker';
    marker.textContent = '»';
    const label = document.createElement('span');
    label.textContent = STAGES[0].label;
    const caret = document.createElement('span');
    caret.className = 'ld-caret';
    line.append(marker, ' ', label, caret);

    const rule = document.createElement('div');
    rule.className = 'ld-min-rule';
    const fill = document.createElement('i');
    rule.appendChild(fill);

    box.append(line, rule);
    root.appendChild(box);

    return {
        render(p, now) {
            label.textContent = p >= 1 ? 'ready' : STAGES[activeStage(p)].label;
            fill.style.width = `${p * 100}%`;
            caret.style.opacity = reduced || Math.floor(now / 470) % 2 ? '1' : '0.15';
        },
    };
}
