#ifndef DIFFUSE_H
#define DIFFUSE_H

#include "Pheromone.h"

extern "C" void launchDiffuseKernel(Pheromone* grid, int rows, int cols, float diffusionRate, float evapSpeed, float dt);

#endif // DIFFUSE_H
