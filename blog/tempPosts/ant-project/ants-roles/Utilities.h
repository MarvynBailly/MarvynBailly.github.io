#ifndef UTILITIES_H
#define UTILITIES_H

#include <cstdlib>

// Function to generate a random float between 0 and 1
inline float randomFloat() {
    return static_cast<float>(rand()) / static_cast<float>(RAND_MAX);
}

// Linear interpolation function
inline float lerp(float a, float b, float t) {
    return a + t * (b - a);
}

// Function to return the maximum of two floats
inline float max(float a, float b) {
    return (a > b) ? a : b;
}

#endif // UTILITIES_H
