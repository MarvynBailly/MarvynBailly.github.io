# Compiler
CXX = g++
NVCC = nvcc

# CUDA path
CUDA_PATH = /usr/local/cuda

# Default compiler flags
CXXFLAGS = -std=c++17 -Wall -Iinclude -fopenmp -I$(CUDA_PATH)/include

# Default linker flags
LDFLAGS = -lsfml-graphics -lsfml-window -lsfml-system -fopenmp -L$(CUDA_PATH)/lib64 -lcudart

# Directories
SRCDIR = src
INCDIR = include
OBJDIR = obj
BINDIR = bin

# Executable name
EXEC = $(BINDIR)/main

# Source files
SRCS = $(wildcard $(SRCDIR)/*.cpp)
CUDA_SRCS = $(SRCDIR)/diffuse.cu

# Object files
OBJS = $(patsubst $(SRCDIR)/%.cpp,$(OBJDIR)/%.o,$(SRCS))
CUDA_OBJS = $(OBJDIR)/diffuse.o

# Default target
all: $(EXEC)

# Link object files to create the executable
$(EXEC): $(OBJS) $(CUDA_OBJS)
	@mkdir -p $(BINDIR)
	$(CXX) $(OBJS) $(CUDA_OBJS) -o $(EXEC) $(LDFLAGS)

# Compile C++ source files to object files
$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Compile CUDA source files to object files
$(OBJDIR)/diffuse.o: $(SRCDIR)/diffuse.cu
	@mkdir -p $(OBJDIR)
	$(NVCC) -std=c++17 -Iinclude -I$(CUDA_PATH)/include -c $< -o $@

# Clean up object files and executable
clean:
	rm -rf $(OBJDIR) $(BINDIR)

# Phony targets
.PHONY: all clean