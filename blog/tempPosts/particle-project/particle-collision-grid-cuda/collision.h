#ifndef COLLISION_H
#define COLLISION_H

#include <cuda_runtime.h>
#include "particle.h"

void detectCollisions(Particle* d_particles, int numParticles, int gridWidth, int gridHeight, int cellWidth, int cellHeight, float response_coef, dim3 threadsPerBlock);

#endif // COLLISION_H
