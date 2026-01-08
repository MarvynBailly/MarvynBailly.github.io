#include <cuda_runtime.h>
#include "Pheromone.h"

__global__ void diffuseKernel(Pheromone* grid, int rows, int cols, float diffusionRate, float evapSpeed, float dt) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;

    if (x < rows && y < cols) {
        float antSum = 0.0f;
        float foodSum = 0.0f;
        float antOriginalVal = grid[x * cols + y].oldAntConcentration;
        float foodOriginalVal = grid[x * cols + y].oldFoodConcentration;
        int count = 0;

        for (int dx = -1; dx <= 1; ++dx) {
            for (int dy = -1; dy <= 1; ++dy) {
                int nx = x + dx;
                int ny = y + dy;
                if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                    antSum += grid[nx * cols + ny].oldAntConcentration;
                    foodSum += grid[nx * cols + ny].oldFoodConcentration;
                    count++;
                }
            }
        }

        float antBlur = antSum / count;
        float foodBlur = foodSum / count;
        float antDiffused = antOriginalVal + diffusionRate * dt * (antBlur - antOriginalVal);
        float foodDiffused = foodOriginalVal + diffusionRate * dt * (foodBlur - foodOriginalVal);
        float antDiffusedAndEvap = max(0.0f, antDiffused - evapSpeed * dt);
        float foodDiffusedAndEvap = max(0.0f, foodDiffused - evapSpeed * dt);
        grid[x * cols + y].newAntConcentration = antDiffusedAndEvap;
        grid[x * cols + y].newFoodConcentration = foodDiffusedAndEvap;

        // keep feed smelly
        if(grid[x * cols + y].hasFood){
            grid[x * cols + y].newFoodConcentration = 1.0f;
        }

        // keep the base smelly
        if(grid[x * cols + y].hasColony){
            grid[x * cols + y].newAntConcentration = 1.0f;
        }
    }
}

__global__ void update(Pheromone* grid, int rows, int cols){
    // Swap new and old concentrations
    for (int i = 0; i < rows * cols; ++i) {
        grid[i].oldAntConcentration = grid[i].newAntConcentration;
        grid[i].oldFoodConcentration = grid[i].newFoodConcentration;
    }
}

extern "C" void launchDiffuseKernel(Pheromone* grid, int rows, int cols, float diffusionRate, float evapSpeed, float dt) {
    dim3 blockSize(16, 16);
    dim3 gridSize((rows + blockSize.x - 1) / blockSize.x, (cols + blockSize.y - 1) / blockSize.y);
    diffuseKernel<<<gridSize, blockSize>>>(grid, rows, cols, diffusionRate, evapSpeed, dt);
    update<<<gridSize, blockSize>>>(grid, rows, cols);
    cudaDeviceSynchronize();
}
