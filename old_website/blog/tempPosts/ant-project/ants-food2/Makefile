# Compiler
CXX = g++
# Compiler flags
CXXFLAGS = -std=c++17 -Wall -I/usr/include/SFML
# Linker flags
LDFLAGS = -lsfml-graphics -lsfml-window -lsfml-system

# Executable name
EXEC = main

# Source files
SRCS = main.cpp Agent.cpp Colony.cpp Food.cpp Slider.cpp

# Object files
OBJS = $(SRCS:.cpp=.o)

# Default target
all: $(EXEC)

# Link object files to create the executable
$(EXEC): $(OBJS)
	$(CXX) $(OBJS) -o $(EXEC) $(LDFLAGS)

# Compile source files to object files
%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Clean up object files and executable
clean:
	rm -f $(OBJS) $(EXEC)

# Phony targets
.PHONY: all clean
