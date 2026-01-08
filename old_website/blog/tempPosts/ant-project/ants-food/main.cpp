#include <SFML/Graphics.hpp>
#include "Agent.h"
#include "Colony.h"
#include "Food.h"
#include <vector>
#include <cstdlib>
#include <ctime>
#include <cmath>

// Function to apply diffusion and evaporation to each cell
void diffuse(std::vector<std::vector<float>>& grid, float diffusionRate, float evapSpeed, float dt) {
    int rows = grid.size();
    int cols = grid[0].size();
    std::vector<std::vector<float>> newGrid = grid; // Copy the original grid

    for (int x = 0; x < rows; ++x) {
        for (int y = 0; y < cols; ++y) {
            float sum = 0.0f;
            float originalVal = grid[x][y];
            int count = 0;

            // Collect all valid neighboring cells including the cell itself
            for (int dx = -1; dx <= 1; ++dx) {
                for (int dy = -1; dy <= 1; ++dy) {
                    int nx = x + dx;
                    int ny = y + dy;
                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                        sum += grid[nx][ny];
                        count++;
                    }
                }
            }

            float blur = sum / static_cast<float>(count);
            float diffused = lerp(originalVal, blur, diffusionRate * dt);
            float diffusedAndEvap = max(0.0f, diffused - evapSpeed * dt);
            newGrid[x][y] = diffusedAndEvap;
        }
    }

    grid = newGrid; // Update the original grid with the new values
}

float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<std::vector<float>>& grid) {
    float sensorAngle = agent.angle + sensorAngleOffset;
    sf::Vector2f sensorDir(cos(sensorAngle), sin(sensorAngle));
    sf::Vector2f sensorCentre = agent.position + sensorDir * sensorSize;
    float sum = 0.0f;

    for (int offsetX = -static_cast<int>(sensorSize); offsetX <= static_cast<int>(sensorSize); ++offsetX) {
        for (int offsetY = -static_cast<int>(sensorSize); offsetY <= static_cast<int>(sensorSize); ++offsetY) {
            sf::Vector2f pos = sensorCentre + sf::Vector2f(offsetX, offsetY);
            if (pos.x >= 0 && pos.x < grid.size() && pos.y >= 0 && pos.y < grid[0].size()) {
                sum += grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)];
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
    const int windowSize = 800;
    const int subGridWidth = windowSize / xNumber;
    const int subGridHeight = windowSize / yNumber;

    // Create a 2D array to store the gray shade of each subgrid
    std::vector<std::vector<float>> grid(xNumber, std::vector<float>(yNumber, 0.0f));
    std::vector<std::vector<float>> foodGrid(xNumber, std::vector<float>(yNumber, 0.0f));

    // Create a colony of ants
    const int colonySize = 1000;
    Colony colony(xNumber / 2.0f, yNumber / 2.0f, colonySize);

    // Define the diffusion rate, evaporation speed, and time delta
    const float diffusionRate = 0.4f;
    const float evapSpeed = 0.001f;
    const float moveSpeed = 1.0f; 
    const float dt = 1.0f; 


    // Create food clusters
    const int amountOfFood = 2;
    const int foodClusterSize = 3;
    std::vector<Food> foods;
    for (int i = 0; i < amountOfFood; ++i) {
        float foodX = randomFloat() * xNumber;
        float foodY = randomFloat() * yNumber;
        for (int ii = -foodClusterSize; ii < foodClusterSize; ii++){
            for (int jj = -foodClusterSize; jj < foodClusterSize; jj++){
                int x = foodX + ii;
                int y = foodY + jj;
                if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
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
        diffuse(grid, diffusionRate, evapSpeed, dt);

        // Update the colony
        colony.update(moveSpeed, dt, xNumber, yNumber, grid);

        // Draw the grid
        for (int x = 0; x < xNumber; ++x) {
            for (int y = 0; y < yNumber; ++y) {
                sf::RectangleShape cell(sf::Vector2f(subGridWidth, subGridHeight));
                cell.setPosition(x * subGridWidth, y * subGridHeight);
                float shade = grid[x][y];
                int colorValue = static_cast<int>(shade * 255);
                cell.setFillColor(sf::Color(colorValue, colorValue, colorValue));
                window.draw(cell);
            }
        }

        // Render the colony and its ants
        colony.render(window, subGridWidth, subGridHeight);

        // Render food
        for (auto& food : foods) {
            food.render(window, subGridWidth, subGridHeight);
        }


        window.display();
    }

    return 0;
}
