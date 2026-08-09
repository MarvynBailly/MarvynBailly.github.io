/**
 * Loading Screen
 *
 * Picks one of several loading concepts at random on each visit and drives it
 * from real initialization progress reported by SimulationManager.init().
 *
 * Append ?loader=<name> to the URL to force a specific one, e.g.
 * ?loader=convergence - handy for checking a concept without reloading until
 * it comes up.
 */

import { createBootLog } from './loading/bootLog.js';
import { createConvergence } from './loading/convergence.js';
import { createGridAssembly } from './loading/gridAssembly.js';
import { createDiagnostic } from './loading/diagnostic.js';
import { createVectorField } from './loading/vectorField.js';
import { createMinimalCaret } from './loading/minimalCaret.js';

/** Registry of available concepts, keyed by the ?loader= name. */
const CONCEPTS = {
    'boot-log': createBootLog,
    'convergence': createConvergence,
    'grid-assembly': createGridAssembly,
    'diagnostic': createDiagnostic,
    'vector-field': createVectorField,
    'minimal-caret': createMinimalCaret,
};

/**
 * Shortest time the loading screen stays up, so a warm cache doesn't reduce it
 * to a flash. Set to 0 to always hand off the moment the sim is ready.
 */
const MIN_VISIBLE_MS = 700;

/** How long the finished state is held before fading out. */
const HOLD_MS = 160;

/** Must be at least the .loading opacity transition in style.css (250ms). */
const FADE_MS = 300;

/** @param {number} ms @returns {Promise<void>} */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class LoadingScreen {
    /**
     * @param {HTMLElement} root - The #loading element
     */
    constructor(root) {
        this.root = root;
        this.progress = 0;
        this.startedAt = performance.now();
        this.frame = null;
        this.stopped = false;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.name = LoadingScreen._pick(reduced);

        root.replaceChildren();
        root.dataset.loader = this.name;

        this.stage = document.createElement('div');
        this.stage.className = 'loading-stage';
        root.appendChild(this.stage);

        this.concept = CONCEPTS[this.name](this.stage, { reduced });

        this._tick = this._tick.bind(this);
        this.frame = requestAnimationFrame(this._tick);
    }

    /**
     * Choose a concept: an explicit ?loader= wins, then reduced-motion pins the
     * quiet one, otherwise it's random.
     *
     * @param {boolean} reduced - Whether the visitor prefers reduced motion
     * @returns {string} Concept name
     */
    static _pick(reduced) {
        const names = Object.keys(CONCEPTS);
        const requested = new URLSearchParams(window.location.search).get('loader');
        if (requested && Object.prototype.hasOwnProperty.call(CONCEPTS, requested)) {
            return requested;
        }
        if (reduced) return 'minimal-caret';
        return names[Math.floor(Math.random() * names.length)];
    }

    /**
     * Report init progress. Monotonic - progress never goes backwards.
     *
     * @param {number} p - Progress in [0, 1]
     */
    setProgress(p) {
        this.progress = Math.min(1, Math.max(this.progress, p));
    }

    /** @param {number} now - rAF timestamp */
    _tick(now) {
        if (this.stopped) return;
        this.concept.render(this.progress, now);
        this.frame = requestAnimationFrame(this._tick);
    }

    /**
     * Complete the animation, hold briefly, then fade out to reveal the sim.
     *
     * @returns {Promise<void>} Resolves once the screen is hidden
     */
    async finish() {
        this.setProgress(1);

        const elapsed = performance.now() - this.startedAt;
        await wait(Math.max(0, MIN_VISIBLE_MS - elapsed) + HOLD_MS);

        this.root.classList.add('hidden');
        await wait(FADE_MS);

        this._stop();
    }

    /**
     * Replace the animation with an error message and stop rendering.
     *
     * @param {string} message - Message to display
     */
    error(message) {
        this._stop();
        this.root.classList.remove('hidden');
        const p = document.createElement('p');
        p.className = 'loading-message';
        p.textContent = message;
        this.root.replaceChildren(p);
    }

    /** Stop the render loop and release the concept's DOM. */
    _stop() {
        if (this.stopped) return;
        this.stopped = true;
        cancelAnimationFrame(this.frame);
        this.stage.replaceChildren();
    }
}
