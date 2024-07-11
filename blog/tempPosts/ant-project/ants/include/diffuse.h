#ifndef DIFFUSE_H
#define DIFFUSE_H

#include "Pheromone.h"

// Kernel function declaration
__global__ void diffuseKernel(Pheromone* grid, Pheromone* newGrid, int rows, int cols, float diffusionRate, float evapSpeed, float dt);

#endif // DIFFUSE_H
