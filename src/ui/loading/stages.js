/**
 * Loading Stages
 *
 * The canonical list of initialization stages, shared by every loading concept
 * so they all report the same thing. Thresholds are the progress value at which
 * each stage is complete; SimulationManager.init() drives progress to match.
 */

/** Number of .glsl files fetched during init (see SimulationManager._loadShaders). */
export const SHADER_COUNT = 17;

/** Number of linked GL programs (see SimulationManager.programs). */
export const PROGRAM_COUNT = 14;

/**
 * Ordered init stages. `at` is the progress value marking the stage complete.
 */
export const STAGES = [
    { label: 'webgl context', detail: 'acquired', at: 0.10 },
    { label: 'shader sources', detail: `${SHADER_COUNT} files`, at: 0.70 },
    { label: 'program link', detail: `${PROGRAM_COUNT} programs`, at: 0.82 },
    { label: 'framebuffers', detail: 'allocated', at: 0.92 },
    { label: 'velocity field', detail: 'seeded', at: 1.00 },
];

/**
 * Index of the stage currently in flight for a given progress value.
 *
 * @param {number} p - Progress in [0, 1]
 * @returns {number} Stage index
 */
export function activeStage(p) {
    for (let i = 0; i < STAGES.length; i++) {
        if (p < STAGES[i].at) return i;
    }
    return STAGES.length - 1;
}

/**
 * Whether a stage has completed at a given progress value.
 *
 * @param {number} index - Stage index
 * @param {number} p - Progress in [0, 1]
 * @returns {boolean}
 */
export function stageDone(index, p) {
    return p >= STAGES[index].at;
}
