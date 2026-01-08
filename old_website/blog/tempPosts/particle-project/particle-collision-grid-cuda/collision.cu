#include "collision.h"

__global__ void detectCollisionsKernel(Particle* d_particles, int numParticles, int gridWidth, int gridHeight, int cellWidth, int cellHeight, float response_coef) {
    int cell_x = blockIdx.x;
    int cell_y = blockIdx.y;

    int start_x = cell_x * cellWidth;
    int start_y = cell_y * cellHeight;
    int end_x = start_x + cellWidth;
    int end_y = start_y + cellHeight;

    for (int i = 0; i < numParticles; ++i) {
        Particle& particle_1 = d_particles[i];
        if (particle_1.position_current.x >= start_x && particle_1.position_current.x < end_x &&
            particle_1.position_current.y >= start_y && particle_1.position_current.y < end_y) {
            
            // Check collisions within the cell and its neighbors
            for (int dx = -1; dx <= 1; ++dx) {
                for (int dy = -1; dy <= 1; ++dy) {
                    int neighbor_x = cell_x + dx;
                    int neighbor_y = cell_y + dy;
                    if (neighbor_x >= 0 && neighbor_x < gridWidth && neighbor_y >= 0 && neighbor_y < gridHeight) {
                        int neighbor_start_x = neighbor_x * cellWidth;
                        int neighbor_start_y = neighbor_y * cellHeight;
                        int neighbor_end_x = neighbor_start_x + cellWidth;
                        int neighbor_end_y = neighbor_start_y + cellHeight;

                        for (int j = 0; j < numParticles; ++j) {
                            Particle& particle_2 = d_particles[j];
                            if (particle_2.position_current.x >= neighbor_start_x && particle_2.position_current.x < neighbor_end_x &&
                                particle_2.position_current.y >= neighbor_start_y && particle_2.position_current.y < neighbor_end_y) {

                                if (&particle_1 == &particle_2) continue;

                                float dx = particle_1.position_current.x - particle_2.position_current.x;
                                float dy = particle_1.position_current.y - particle_2.position_current.y;
                                float dist2 = dx * dx + dy * dy;
                                float min_dist = particle_1.radius + particle_2.radius;
                                
                                if (dist2 < min_dist * min_dist) {
                                    float dist = sqrt(dist2);
                                    float nx = dx / dist;
                                    float ny = dy / dist;
                                    float mass_ratio_1 = particle_1.radius / (particle_1.radius + particle_2.radius);
                                    float mass_ratio_2 = particle_2.radius / (particle_1.radius + particle_2.radius);
                                    float delta = 0.5f * response_coef * (dist - min_dist);
                                    particle_1.position_current.x -= nx * (mass_ratio_2 * delta);
                                    particle_1.position_current.y -= ny * (mass_ratio_2 * delta);
                                    particle_2.position_current.x += nx * (mass_ratio_1 * delta);
                                    particle_2.position_current.y += ny * (mass_ratio_1 * delta);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

void detectCollisions(Particle* d_particles, int numParticles, int gridWidth, int gridHeight, int cellWidth, int cellHeight, float response_coef, dim3 threadsPerBlock) {
    dim3 numBlocks(gridWidth, gridHeight);
    detectCollisionsKernel<<<numBlocks, threadsPerBlock>>>(d_particles, numParticles, gridWidth, gridHeight, cellWidth, cellHeight, response_coef);
    cudaDeviceSynchronize();
}
