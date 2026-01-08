#include "Pheromone.h"

// Kernel function declaration
__global__ void diffuseKernel(Pheromone* grid, Pheromone* newGrid, int rows, int cols, float diffusionRate, float evapSpeed, float dt);

__global__ void diffuseKernel(Pheromone* grid, Pheromone* newGrid, int rows, int cols, float diffusionRate, float evapSpeed, float dt) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;

    if (x < rows && y < cols) {
        float antSum = 0.0f;
        float foodSum = 0.0f;
        int count = 0;

        for (int dx = -1; dx <= 1; ++dx) {
            for (int dy = -1; dy <= 1; ++dy) {
                int nx = x + dx;
                int ny = y + dy;
                if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                    antSum += grid[nx * cols + ny].antConcentration;
                    foodSum += grid[nx * cols + ny].foodConcentration;
                    count++;
                }
            }
        }

        float antBlur = antSum / count;
        float foodBlur = foodSum / count;
        float antDiffused = antBlur * diffusionRate * dt;
        float foodDiffused = foodBlur * diffusionRate * dt;
        float antDiffusedAndEvap = max(0.0f, antDiffused - evapSpeed * dt);
        float foodDiffusedAndEvap = max(0.0f, foodDiffused - evapSpeed * dt);

        newGrid[x * cols + y].antConcentration = antDiffusedAndEvap;
        newGrid[x * cols + y].foodConcentration = foodDiffusedAndEvap;

        // Ensure colony and food cells maintain their pheromone concentration
        if (grid[x * cols + y].hasColony == true) {
            newGrid[x * cols + y].antConcentration = 1.0f;
        }
        if (grid[x * cols + y].hasFood) {
            newGrid[x * cols + y].foodConcentration = 1.0f;
        }
    }
}
