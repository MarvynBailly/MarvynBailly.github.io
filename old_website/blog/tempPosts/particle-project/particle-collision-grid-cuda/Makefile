# Compiler and linker
CXX = g++
NVCC = nvcc

# Compiler flags
CXXFLAGS = -std=c++11 -Wall -I/usr/local/cuda/include
NVCCFLAGS = -I/usr/local/cuda/include
LDFLAGS = -L/usr/local/cuda/lib64 -lcudart -lsfml-graphics -lsfml-window -lsfml-system

# Source files
CPP_SOURCES = main.cpp
CU_SOURCES = collision.cu

# Object files
CPP_OBJECTS = $(CPP_SOURCES:.cpp=.o)
CU_OBJECTS = $(CU_SOURCES:.cu=.o)

# Executable
EXECUTABLE = particle_simulation

# Rules
all: $(EXECUTABLE)

$(EXECUTABLE): $(CPP_OBJECTS) $(CU_OBJECTS)
	$(NVCC) -o $@ $(CPP_OBJECTS) $(CU_OBJECTS) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

%.o: %.cu
	$(NVCC) $(NVCCFLAGS) -c $< -o $@

clean:
	rm -f $(CPP_OBJECTS) $(CU_OBJECTS) $(EXECUTABLE)

.PHONY: all clean
