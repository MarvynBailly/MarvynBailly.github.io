#include <iostream>
#include <cuda_runtime.h>

void printCudaDevices() {
    int deviceCount = 0;
    cudaError_t error_id = cudaGetDeviceCount(&deviceCount);

    if (error_id != cudaSuccess) {
        std::cerr << "cudaGetDeviceCount returned " << static_cast<int>(error_id) << "\n";
        std::cerr << "-> " << cudaGetErrorString(error_id) << "\n";
        std::cout << "Result = FAIL\n";
        exit(EXIT_FAILURE);
    }

    std::cout << "Detected " << deviceCount << " CUDA capable device(s)\n";

    for (int dev = 0; dev < deviceCount; ++dev) {
        cudaSetDevice(dev);
        cudaDeviceProp deviceProp;
        cudaGetDeviceProperties(&deviceProp, dev);

        std::cout << "Device " << dev << ": " << deviceProp.name << "\n";
        std::cout << "  Total amount of global memory:                 " << (deviceProp.totalGlobalMem / 1048576.0f) << " MBytes\n";
        std::cout << "  (Multiprocessors: " << deviceProp.multiProcessorCount << ")\n";
        std::cout << "  Compute Capability: " << deviceProp.major << "." << deviceProp.minor << "\n";
        std::cout << "  Clock rate: " << deviceProp.clockRate * 1e-3f << " MHz\n";
        std::cout << "  Total amount of constant memory: " << deviceProp.totalConstMem << " bytes\n";
        std::cout << "  Total amount of shared memory per block: " << deviceProp.sharedMemPerBlock << " bytes\n";
        std::cout << "  Total number of registers available per block: " << deviceProp.regsPerBlock << "\n";
        std::cout << "  Warp size: " << deviceProp.warpSize << "\n";
        std::cout << "  Maximum number of threads per block: " << deviceProp.maxThreadsPerBlock << "\n";
        std::cout << "  Maximum sizes of each dimension of a block: " << deviceProp.maxThreadsDim[0] << " x " << deviceProp.maxThreadsDim[1] << " x " << deviceProp.maxThreadsDim[2] << "\n";
        std::cout << "  Maximum sizes of each dimension of a grid: " << deviceProp.maxGridSize[0] << " x " << deviceProp.maxGridSize[1] << " x " << deviceProp.maxGridSize[2] << "\n";
    }
}

int main() {
    printCudaDevices();
    return 0;
}
