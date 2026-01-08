# Compiler
CXX = g++

# Compiler flags add -pg to profile
# CXXFLAGS = -pg -std=c++17 -Wall -Iinclude -fopenmp
CXXFLAGS = -std=c++17 -Wall -Iinclude -fopenmp


# Linker flags add -pg to profile
# LDFLAGS = -pg -lsfml-graphics -lsfml-window -lsfml-system -fopenmp
LDFLAGS = -lsfml-graphics -lsfml-window -lsfml-system -fopenmp

# Directories
SRCDIR = src
INCDIR = include
OBJDIR = obj
BINDIR = bin

# Executable name
EXEC = $(BINDIR)/main

# Source files
SRCS = $(wildcard $(SRCDIR)/*.cpp)

# Object files
OBJS = $(patsubst $(SRCDIR)/%.cpp,$(OBJDIR)/%.o,$(SRCS))

# Default target
all: $(EXEC)

# Link object files to create the executable
$(EXEC): $(OBJS)
	@mkdir -p $(BINDIR)
	$(CXX) $(OBJS) -o $(EXEC) $(LDFLAGS)

# Compile source files to object files
$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	@mkdir -p $(OBJDIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Clean up object files and executable
clean:
	rm -rf $(OBJDIR) $(BINDIR)

# Phony targets
.PHONY: all clean
