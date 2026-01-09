/**
 * Image-to-Polygon Conversion Tool
 * 
 * Converts an image to polygon vertex data for the fluid simulation obstacle system.
 * 
 * Usage:
 *   node tools/image-to-polygon.js <image-path> [options]
 * 
 * Options:
 *   --epsilon, -e    RDP simplification tolerance in pixels (default: 2)
 *   --threshold, -t  Binary threshold 0-255 (default: 128)
 *   --invert, -i     Invert colors (treat white as shape)
 *   --scale, -s      Scale factor for output coordinates (default: 1.0)
 *   --center-x       Center X offset (default: 0.5)
 *   --center-y       Center Y offset (default: 0.5)
 * 
 * References:
 *   - Moore-Neighbor Tracing for contour extraction
 *   - Ramer-Douglas-Peucker for polygon simplification
 *   - Earcut for triangulation
 */

import { Jimp } from 'jimp';
import earcut from 'earcut';

// Parse command line arguments
function parseArgs(args) {
    const options = {
        imagePath: null,
        epsilon: 2,
        threshold: 128,
        invert: false,
        scale: 1.0,
        centerX: 0.5,
        centerY: 0.5
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--epsilon' || arg === '-e') {
            options.epsilon = parseFloat(args[++i]);
        } else if (arg === '--threshold' || arg === '-t') {
            options.threshold = parseInt(args[++i]);
        } else if (arg === '--invert' || arg === '-i') {
            options.invert = true;
        } else if (arg === '--scale' || arg === '-s') {
            options.scale = parseFloat(args[++i]);
        } else if (arg === '--center-x') {
            options.centerX = parseFloat(args[++i]);
        } else if (arg === '--center-y') {
            options.centerY = parseFloat(args[++i]);
        } else if (!arg.startsWith('-')) {
            options.imagePath = arg;
        }
    }

    return options;
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
        return Math.sqrt(
            Math.pow(point.x - lineStart.x, 2) +
            Math.pow(point.y - lineStart.y, 2)
        );
    }

    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
    const nearestX = lineStart.x + t * dx;
    const nearestY = lineStart.y + t * dy;

    return Math.sqrt(
        Math.pow(point.x - nearestX, 2) +
        Math.pow(point.y - nearestY, 2)
    );
}

/**
 * Ramer-Douglas-Peucker polygon simplification
 * Reference: https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm
 */
function rdpSimplify(points, epsilon) {
    if (points.length <= 2) return points;

    const start = points[0];
    const end = points[points.length - 1];

    let maxDist = 0;
    let maxIdx = 0;

    for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDistance(points[i], start, end);
        if (dist > maxDist) {
            maxDist = dist;
            maxIdx = i;
        }
    }

    if (maxDist > epsilon) {
        const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
        const right = rdpSimplify(points.slice(maxIdx), epsilon);
        return [...left.slice(0, -1), ...right];
    }

    return [start, end];
}

/**
 * Moore-Neighbor Contour Tracing Algorithm
 * Traces the boundary of a binary shape using 8-connectivity
 * Reference: https://en.wikipedia.org/wiki/Moore_neighborhood
 */
function traceContour(bitmap, width, height) {
    // Direction vectors for 8-connectivity (clockwise from right)
    // 0: right, 1: down-right, 2: down, 3: down-left, 4: left, 5: up-left, 6: up, 7: up-right
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1, 1, 0, -1, -1, -1];

    // Find starting point (first black pixel scanning from top-left)
    let startX = -1, startY = -1;
    outer:
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (bitmap[idx] === 0) { // Black pixel
                startX = x;
                startY = y;
                break outer;
            }
        }
    }

    if (startX === -1) {
        console.error('No shape found in image');
        return [];
    }

    const contour = [];
    let currentX = startX;
    let currentY = startY;
    let direction = 0; // Start looking to the right

    const maxIterations = width * height * 2; // Safety limit
    let iterations = 0;

    do {
        contour.push({ x: currentX, y: currentY });

        // Start searching from (direction + 6) % 8 (back-left of entry direction)
        let searchDir = (direction + 6) % 8;

        for (let i = 0; i < 8; i++) {
            const checkDir = (searchDir + i) % 8;
            const nx = currentX + dx[checkDir];
            const ny = currentY + dy[checkDir];

            // Check bounds
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = (ny * width + nx) * 4;
                if (bitmap[idx] === 0) { // Found black pixel
                    currentX = nx;
                    currentY = ny;
                    direction = checkDir;
                    break;
                }
            }
        }

        iterations++;
    } while ((currentX !== startX || currentY !== startY) && iterations < maxIterations);

    if (iterations >= maxIterations) {
        console.warn('Warning: Contour tracing reached iteration limit');
    }

    return contour;
}

/**
 * Main processing function
 */
async function processImage(options) {
    console.error(`Processing: ${options.imagePath}`);
    console.error(`Options: epsilon=${options.epsilon}, threshold=${options.threshold}, invert=${options.invert}`);

    // Load image
    const image = await Jimp.read(options.imagePath);
    const { width, height } = image.bitmap;
    console.error(`Image size: ${width}x${height}`);

    // Convert to grayscale and threshold
    image.greyscale();

    image.scan(0, 0, width, height, function (x, y, idx) {
        const gray = this.bitmap.data[idx];
        let binary;
        if (options.invert) {
            binary = gray >= options.threshold ? 0 : 255;
        } else {
            binary = gray < options.threshold ? 0 : 255;
        }
        this.bitmap.data[idx] = binary;
        this.bitmap.data[idx + 1] = binary;
        this.bitmap.data[idx + 2] = binary;
    });

    // Extract contour
    const contour = traceContour(image.bitmap.data, width, height);
    console.error(`Contour points (raw): ${contour.length}`);

    if (contour.length === 0) {
        console.error('Error: No contour found');
        process.exit(1);
    }

    // Simplify with RDP
    const simplified = rdpSimplify(contour, options.epsilon);
    console.error(`Contour points (simplified): ${simplified.length}`);

    // Normalize coordinates to [0,1] and apply scale/offset
    // Image origin is top-left, we want bottom-left for WebGL
    const aspectRatio = width / height;
    const normalizedScale = options.scale;

    const normalized = simplified.map(p => ({
        x: options.centerX + (p.x / width - 0.5) * normalizedScale * aspectRatio,
        y: options.centerY + (0.5 - p.y / height) * normalizedScale  // Flip Y
    }));

    // Triangulate using earcut
    const flatCoords = normalized.flatMap(p => [p.x, p.y]);
    const triangleIndices = earcut(flatCoords);
    console.error(`Triangles: ${triangleIndices.length / 3}`);

    // Build triangle definitions
    const triangles = [];
    for (let i = 0; i < triangleIndices.length; i += 3) {
        triangles.push({
            type: 'triangle',
            v0: {
                x: parseFloat(normalized[triangleIndices[i]].x.toFixed(4)),
                y: parseFloat(normalized[triangleIndices[i]].y.toFixed(4))
            },
            v1: {
                x: parseFloat(normalized[triangleIndices[i + 1]].x.toFixed(4)),
                y: parseFloat(normalized[triangleIndices[i + 1]].y.toFixed(4))
            },
            v2: {
                x: parseFloat(normalized[triangleIndices[i + 2]].x.toFixed(4)),
                y: parseFloat(normalized[triangleIndices[i + 2]].y.toFixed(4))
            }
        });
    }

    // Output as JavaScript code
    const output = `this.DEFAULT_OBSTACLES = ${JSON.stringify(triangles, null, 4)
        .replace(/"type"/g, 'type')
        .replace(/"v0"/g, 'v0')
        .replace(/"v1"/g, 'v1')
        .replace(/"v2"/g, 'v2')
        .replace(/"x"/g, 'x')
        .replace(/"y"/g, 'y')
        .replace(/"triangle"/g, "'triangle'")
        };`;

    console.log(output);

    // Also output polygon version for reference
    console.error('\n--- Polygon version (single contour, not triangulated) ---');
    console.error(`Vertices: ${normalized.length}`);

    return triangles;
}

// Main entry point
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Image-to-Polygon Conversion Tool

Usage:
  node tools/image-to-polygon.js <image-path> [options]

Options:
  --epsilon, -e    RDP simplification tolerance (default: 2)
  --threshold, -t  Binary threshold 0-255 (default: 128)
  --invert, -i     Invert colors (treat white as shape)
  --scale, -s      Scale factor 0-1 (default: 1.0)
  --center-x       Center X position (default: 0.5)
  --center-y       Center Y position (default: 0.5)

Example:
  node tools/image-to-polygon.js logo.png -e 3 -s 0.4
`);
    process.exit(0);
}

const options = parseArgs(args);

if (!options.imagePath) {
    console.error('Error: No image path provided');
    process.exit(1);
}

processImage(options).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
