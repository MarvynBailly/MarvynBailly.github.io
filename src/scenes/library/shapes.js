/**
 * Scene: Shapes
 *
 * The obstacle-only scenes the preset menu used to offer, carried across so
 * nothing that worked before is lost. No emitters: just geometry and the
 * stock physics.
 *
 * References:
 * - scenes/SceneManager.js - the context passed to update()
 * - scenes/emitters.js - the helpers used here
 */

/**
 * Build a geometry-only scene
 *
 * @param {string} id - Scene id
 * @param {string} label - Menu label
 * @param {string} description - One line
 * @param {*} obstacles - Obstacle spec
 * @returns {Object} Scene module
 */
function shape(id, label, description, obstacles) {
    return { id, label, group: 'Shapes', description, obstacles, config: {} };
}

export const MONOGRAM = shape(
    'monogram', 'Monogram', 'The geometric M alone', 'monogram');

export const CURSIVE = shape(
    'cursive', 'Cursive M', 'A traced cursive M', { preset: 'cursive-m' });

export const CIRCLE = shape(
    'circle', 'Circle', 'A single cylinder', [{ type: 'circle', x: 0.5, y: 0.5, radius: 0.15 }]);

export const EMPTY = shape(
    'empty', 'Open Water', 'No obstacles at all', []);
