/**
 * Scene registry
 *
 * The menu is built from this list, so adding a scene means adding a file under
 * library/ and one line here. Order within a group is the order it appears.
 *
 * A scene's `requires` field names a simulation feature it depends on. Scenes
 * whose feature is not built yet are still listed but marked unavailable, so
 * the menu never offers something that would silently do nothing.
 */

import { MONOGRAM, CURSIVE, CIRCLE, EMPTY } from './library/shapes.js';

import stillWater from './library/still-water.js';
import twoPigments from './library/two-pigments.js';
import chromatography from './library/chromatography.js';
import colourField from './library/colour-field.js';

import frontalPassage from './library/frontal-passage.js';
import stackPlume from './library/stack-plume.js';
import radiationFog from './library/radiation-fog.js';
import virga from './library/virga.js';

import tunnelSection from './library/tunnel-section.js';
import karmanStreet from './library/karman-street.js';
import dyeRake from './library/dye-rake.js';
import venturi from './library/venturi.js';

import probeTraverse from './library/probe-traverse.js';
import vortexWell from './library/vortex-well.js';
import latticeArray from './library/lattice-array.js';

/**
 * Simulation features a scene can require, and whether they exist yet.
 *
 * Flip one to true as its pass lands.
 */
export const FEATURES = {
    channel: true,       // inlet/outlet boundary conditions
    buoyancy: true,      // density-driven vertical force
    paletteRamp: true,   // density mapped through a palette in the display shader
    vortex: true         // rotational body force
};

export const SCENES = [
    MONOGRAM, CURSIVE, CIRCLE, EMPTY,
    stillWater, twoPigments, chromatography, colourField,
    frontalPassage, stackPlume, radiationFog, virga,
    tunnelSection, karmanStreet, dyeRake, venturi,
    probeTraverse, vortexWell, latticeArray
];

export const DEFAULT_SCENE = 'colour-field';

/**
 * Look a scene up by id
 *
 * @param {string} id - Scene id
 * @returns {Object|null} Scene module
 */
export function findScene(id) {
    return SCENES.find(scene => scene.id === id) || null;
}

/**
 * Whether every feature a scene needs has been built
 *
 * @param {Object} scene - Scene module
 * @returns {boolean} True if the scene can run as intended
 */
export function isAvailable(scene) {
    return !scene.requires || FEATURES[scene.requires] === true;
}

/**
 * Scenes grouped for the menu, in registry order
 *
 * @returns {Array<{group: string, scenes: Array}>} Grouped scenes
 */
export function groupedScenes() {
    const groups = [];
    for (const scene of SCENES) {
        let entry = groups.find(g => g.group === scene.group);
        if (!entry) {
            entry = { group: scene.group, scenes: [] };
            groups.push(entry);
        }
        entry.scenes.push(scene);
    }
    return groups;
}
