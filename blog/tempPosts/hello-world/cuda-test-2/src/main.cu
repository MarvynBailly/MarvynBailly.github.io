#include <iostream>
#include <cuda_runtime.h>

// Kernel function declaration
__global__ void addKernel(int* c, const int* a, const int* b);

void checkCudaError(cudaError_t result, const char* msg) {
    if (result != cudaSuccess) {
        std::cerr << "CUDA Error: " << msg << " : " << cudaGetErrorString(result) << std::endl;
        exit(result);
    }
}

int main() {
    const int arraySize = 5;
    const int a[arraySize] = {1, 2, 3, 4, 5};
    const int b[arraySize] = {10, 20, 30, 40, 50};
    int c[arraySize] = {0};

    int* dev_a = nullptr;
    int* dev_b = nullptr;
    int* dev_c = nullptr;

    checkCudaError(cudaMalloc((void**)&dev_a, arraySize * sizeof(int)), "cudaMalloc dev_a failed");
    checkCudaError(cudaMalloc((void**)&dev_b, arraySize * sizeof(int)), "cudaMalloc dev_b failed");
    checkCudaError(cudaMalloc((void**)&dev_c, arraySize * sizeof(int)), "cudaMalloc dev_c failed");

    checkCudaError(cudaMemcpy(dev_a, a, arraySize * sizeof(int), cudaMemcpyHostToDevice), "cudaMemcpy a to dev_a failed");
    checkCudaError(cudaMemcpy(dev_b, b, arraySize * sizeof(int), cudaMemcpyHostToDevice), "cudaMemcpy b to dev_b failed");

    addKernel<<<1, arraySize>>>(dev_c, dev_a, dev_b);

    checkCudaError(cudaGetLastError(), "Kernel launch failed");
    checkCudaError(cudaDeviceSynchronize(), "Kernel execution failed");

    checkCudaError(cudaMemcpy(c, dev_c, arraySize * sizeof(int), cudaMemcpyDeviceToHost), "cudaMemcpy dev_c to c failed");

    std::cout << "Result: ";
    for (int i = 0; i < arraySize; ++i) {
        std::cout << c[i] << " ";
    }
    std::cout << std::endl;

    cudaFree(dev_a);
    cudaFree(dev_b);
    cudaFree(dev_c);

    return 0;
}
