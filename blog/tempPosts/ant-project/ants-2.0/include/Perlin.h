#ifndef PERLIN_H
#define PERLIN_H

#include <iostream>
#include <cmath>
#include <SFML/Graphics.hpp>


typedef struct {
    float x, y;
} vector2;

vector2 randomGradient(int ix, int iy) {
    // Compute pseudo-random angle
    const unsigned w = 8 * sizeof(unsigned);
    const unsigned s = w / 2; 
    unsigned a = ix, b = iy;
    a *= 3284157443;
    b ^= a << s | a >> (w - s);
    b *= 1911520717;
    a ^= b << s | b >> (w - s);
    a *= 2048419325;
    float random = a * (3.14159265 / ~(~0u >> 1)); // in [0, 2*Pi]
    
    // Create the vector from the angle
    vector2 v;
    v.x = sin(random);
    v.y = cos(random);
 
    return v;
}

float cubicInterp(float a0, float a1, float w){
    return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
}


float dotGridGradient(int ix, int iy, float x, float y) {
    // Get gradient vector
    vector2 gradient = randomGradient(ix, iy);

    // Compute distance vector
    float dx = x - (float)ix;
    float dy = y - (float)iy;

    // Compute dot-product
    return (dx * gradient.x + dy * gradient.y);
}


float perlin(float x, float y) {
    // Determine grid cell coordinates
    int x0 = (int)floor(x);
    int y0 = (int)floor(y);
    int x1 = x0 + 1;
    int y1 = y0 + 1;

    // Determine interpolation weights
    float sx = x - (float)x0;
    float sy = y - (float)y0;

    // Interpolate between grid point gradients
    float n0, n1, ix0, ix1, value;

    n0 = dotGridGradient(x0, y0, x, y);
    n1 = dotGridGradient(x1, y0, x, y);
    ix0 = cubicInterp(n0, n1, sx);

    n0 = dotGridGradient(x0, y1, x, y);
    n1 = dotGridGradient(x1, y1, x, y);
    ix1 = cubicInterp(n0, n1, sx);

    value = cubicInterp(ix0, ix1, sy);

    return value;
}

#endif // PERLIN_H