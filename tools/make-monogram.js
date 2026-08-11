/**
 * Monogram Preset Generator
 *
 * Writes presets/geometric-m.json from the same letterform code the simulation
 * loads by default, so the preset in the settings menu and the shape the page
 * boots with cannot drift apart.
 *
 * Usage:
 *   node tools/make-monogram.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { geometricM } from '../src/geometry/monogram.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(here, '..', 'presets', 'geometric-m.json');

const preset = {
    name: 'Geometric M',
    description: 'Monolinear geometric M, generated from src/geometry/monogram.js',
    obstacles: geometricM()
};

fs.writeFileSync(target, JSON.stringify(preset, null, 4) + '\n');
console.log(`Wrote ${target} (${preset.obstacles[0].vertices.length} vertices)`);
