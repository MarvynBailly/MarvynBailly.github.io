# Compiler and flags
CXX = g++
NVCC = nvcc
CXXFLAGS = -std=c++17 -Wall -I./include -I/usr/include/SFML -I/usr/local/cuda/include
NVCCFLAGS = -arch=sm_35 -I./include -I/usr/include/SFML -I/usr/local/cuda/include

# Directories
SRC_DIR = src
OBJ_DIR = obj
BIN_DIR = bin

# Source files
CPP_SOURCES = main.cpp Agent.cpp Colony.cpp Utilities.cpp Slider.cpp
CU_SOURCES = diffuse.cu

# Object files
CPP_OBJECTS = $(CPP_SOURCES:%.cpp=$(OBJ_DIR)/%.o)
CU_OBJECTS = $(CU_SOURCES:%.cu=$(OBJ_DIR)/%.o)

# Target executable
TARGET = $(BIN_DIR)/ant_simulation

# Rules
all: $(TARGET)

# Linking
$(TARGET): $(CPP_OBJECTS) $(CU_OBJECTS)
	mkdir -p $(BIN_DIR)
	$(CXX) $(CPP_OBJECTS) $(CU_OBJECTS) -o $(TARGET) -lsfml-graphics -lsfml-window -lsfml-system -lcudart

# Compiling C++ sources
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
	mkdir -p $(OBJ_DIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Compiling CUDA sources
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cu
	mkdir -p $(OBJ_DIR)
	$(NVCC) $(NVCCFLAGS) -c $< -o $@

# Clean up
clean:
	rm -rf $(OBJ_DIR) $(BIN_DIR)

.PHONY: all clean
