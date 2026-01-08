#include <SFML/Graphics.hpp>
#include "Agent.h"
#include "Colony.h"
#include "Food.h"
#include "Pheromone.h"
#include "Utilities.h"
#include <vector>
#include <cstdlib>
#include <ctime>
#include <cmath>

// I'm not liking how I'm handling the switching from one pheromone to the other. I Let's make it that in the sum function, it gives more wait to the desired target.
// Let's also add that the ants loss the strength of their pheromone the longer they are away from the source

//let's add that if the ant see its target (colony or food), it just goes for that rather than follow phero

// let's add a nice ui with slider and such

// Function to apply diffusion and evaporation to each cell
void diffuse(std::vector<std::vector<Pheromone>>& grid, float diffusionRate, float evapSpeed, float dt) {
    int rows = grid.size();
    int cols = grid[0].size();
    std::vector<std::vector<Pheromone>> newGrid = grid; // Copy the original grid

    for (int x = 0; x < rows; ++x) {
        for (int y = 0; y < cols; ++y) {
            float antSum = 0.0f;
            float foodSum = 0.0f;
            float antOriginalVal = grid[x][y].antConcentration;
            float foodOriginalVal = grid[x][y].foodConcentration;
            int count = 0;

            // Collect all valid neighboring cells including the cell itself
            for (int dx = -1; dx <= 1; ++dx) {
                for (int dy = -1; dy <= 1; ++dy) {
                    int nx = x + dx;
                    int ny = y + dy;
                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                        antSum += grid[nx][ny].antConcentration;
                        foodSum += grid[nx][ny].foodConcentration;
                        count++;
                    }
                }
            }

            float antBlur = antSum / static_cast<float>(count);
            float foodBlur = foodSum / static_cast<float>(count);
            float antDiffused = lerp(antOriginalVal, antBlur, diffusionRate * dt);
            float foodDiffused = lerp(foodOriginalVal, foodBlur, diffusionRate * dt);
            float antDiffusedAndEvap = max(0.0f, antDiffused - evapSpeed * dt);
            float foodDiffusedAndEvap = max(0.0f, foodDiffused - evapSpeed * dt);
            newGrid[x][y].antConcentration = antDiffusedAndEvap;
            newGrid[x][y].foodConcentration = foodDiffusedAndEvap;
        }
    }

    grid = newGrid; // Update the original grid with the new values
}

// pheromoneType - 0 for ant and 1 for food
float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<std::vector<Pheromone>>& grid, int pheromoneType) {
    float sensorAngle = agent.angle + sensorAngleOffset;
    sf::Vector2f sensorDir(cos(sensorAngle), sin(sensorAngle));
    sf::Vector2f sensorCentre = agent.position + sensorDir * sensorSize;
    float sum = 0.0f;

    for (int offsetX = -static_cast<int>(sensorSize); offsetX <= static_cast<int>(sensorSize); ++offsetX) {
        for (int offsetY = -static_cast<int>(sensorSize); offsetY <= static_cast<int>(sensorSize); ++offsetY) {
            sf::Vector2f pos = sensorCentre + sf::Vector2f(offsetX, offsetY);
            if (pos.x >= 0 && pos.x < grid.size() && pos.y >= 0 && pos.y < grid[0].size()) {
                if(pheromoneType == 0){
                    sum += grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)].foodConcentration;
                }else{
                    sum += grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)].antConcentration;
                }
            }
        }
    }

    return sum;
}

int main() {
    // Seed the random number generator
    std::srand(static_cast<unsigned>(std::time(nullptr)));

    // Define the number of subgrids in the x and y directions
    const int xNumber = 200;
    const int yNumber = 200;

    // Define the size of the window
    const int windowSize = 1000;
    const int subGridWidth = windowSize / xNumber;
    const int subGridHeight = windowSize / yNumber;

    // Create a 2D array to store the gray shade of each subgrid
    std::vector<std::vector<Pheromone>> pheromoneGrid(xNumber, std::vector<Pheromone>(yNumber));

    // Create a colony of ants
    const int colonySize = 20;
    Colony colony(10.0f, 10.0f, colonySize, 10);

    // Define the diffusion rate, evaporation speed, and time delta
    const float diffusionRate = 0.01f;
    const float evapSpeed = 0.0001f;
    const float moveSpeed = 1.0f; 
    const float dt = 1.0f; 


    // Create food clusters
    const int amountOfFood = 2;
    const int foodClusterSize = 5;
    std::vector<Food> foods;
    for (int i = 0; i < amountOfFood; ++i) {
        float foodX = randomFloat() * xNumber;
        float foodY = randomFloat() * yNumber;
        for (int ii = -foodClusterSize; ii < foodClusterSize; ii++){
            for (int jj = -foodClusterSize; jj < foodClusterSize; jj++){
                int x = foodX + ii;
                int y = foodY + jj;
                if (x >= 0 && x < static_cast<int>(pheromoneGrid.size()) && y >= 0 && y < static_cast<int>(pheromoneGrid[0].size())) {
                    foods.emplace_back(x, y);
                }
            }
        }
    }

    // Create the SFML window
    sf::RenderWindow window(sf::VideoMode(windowSize, windowSize), "SFML Grid");

    while (window.isOpen()) {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)
                window.close();
        }

        window.clear();

        // Apply the diffusion function
        diffuse(pheromoneGrid, diffusionRate, evapSpeed, dt);

        // Update the colony
        colony.update(moveSpeed, dt, xNumber, yNumber, pheromoneGrid, foods);

        // Draw the grid
        for (int x = 0; x < xNumber; ++x) {
            for (int y = 0; y < yNumber; ++y) {
                sf::RectangleShape cell(sf::Vector2f(subGridWidth, subGridHeight));
                cell.setPosition(x * subGridWidth, y * subGridHeight);

                // Determine color based on pheromone concentrations
                float antConcentration = pheromoneGrid[x][y].antConcentration;
                float foodConcentration = pheromoneGrid[x][y].foodConcentration;

                int antColorValue = static_cast<int>(antConcentration * 255);
                int foodColorValue = static_cast<int>(foodConcentration * 255);

                if (foodConcentration > antConcentration){
                    cell.setFillColor(sf::Color(foodColorValue, foodColorValue, 0)); // Yellow-ish
                }else{
                    cell.setFillColor(sf::Color(antColorValue, antColorValue, antColorValue));
                }
                window.draw(cell);
            }
        }

        // Render the colony and its ants
        colony.render(window, subGridWidth, subGridHeight);

        // Render food
        for (auto& food : foods) {
            food.update(pheromoneGrid);
            food.render(window, subGridWidth, subGridHeight);
        }


        window.display();
    }

    return 0;
}
