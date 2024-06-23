#include <iostream>
#include <cuda_runtime.h>

__global__ void testKernel(int* d_out) {
    int idx = threadIdx.x;
    d_out[idx] = idx;
}

int main() {
    const int arraySize = 256;
    int h_out[arraySize];

    int* d_out;
    cudaMalloc((void**)&d_out, arraySize * sizeof(int));

    testKernel<<<1, arraySize>>>(d_out);
    cudaMemcpy(h_out, d_out, arraySize * sizeof(int), cudaMemcpyDeviceToHost);

    for (int i = 0; i < arraySize; ++i) {
        std::cout << "h_out[" << i << "] = " << h_out[i] << std::endl;
    }

    cudaFree(d_out);
    return 0;
}
