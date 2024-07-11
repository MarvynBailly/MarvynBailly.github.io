#!/bin/bash

# Step 1: Compile the program with profiling enabled
echo "Compiling the program.."
make clean
make

# Step 2: Run the program to generate profiling data
echo "Running the program..."
./bin/main
