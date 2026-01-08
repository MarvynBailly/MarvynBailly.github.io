#!/bin/bash

# Define variables
EXEC=bin/main
PROFILE_OUTPUT=profile/analysis.txt
DOT_FILE=profile/analysis.dot
SVG_FILE=profile/analysis.svg

# Step 1: Compile the program with profiling enabled
echo "Compiling the program with profiling enabled..."
make clean
make

# Step 2: Run the program to generate profiling data
echo "Running the program to generate profiling data..."
./$EXEC

# Step 3: Generate the gprof report
echo "Generating the gprof report..."
gprof ./$EXEC gmon.out > $PROFILE_OUTPUT

# Step 4: Convert the gprof report to a dot file
echo "Converting the gprof report to a dot file..."
gprof2dot -f prof $PROFILE_OUTPUT -o $DOT_FILE

# Step 5: Convert the dot file to an SVG image
echo "Converting the dot file to an SVG image..."
dot -Tsvg $DOT_FILE -o $SVG_FILE

echo "Profiling complete."
