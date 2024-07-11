#include <SFML/Graphics.hpp>
#include "Agent.h"
#include "Colony.h"
#include "Pheromone.h"
#include "Utilities.h"
#include "Perlin.h"
#include "Slider.h"
#include <vector>
#include <cstdlib>
#include <ctime>
#include <cmath>

// I'm not liking how I'm handling the switching from one pheromone to the other. I Let's make it that in the sum function, it gives more wait to the desired target.
// Let's also add that the ants loss the strength of their pheromone the longer they are away from the source

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

            // keep feed smelly
            if(grid[x][y].hasFood){
                newGrid[x][y].foodConcentration = 1.0f;
            }

            // keep the base smelly
            if(grid[x][y].hasColony){
                newGrid[x][y].antConcentration = 1.0f;
            }
        }
    }

    grid = newGrid; // Update the original grid with the new values
}

// pheromoneType - 0 for ant and 1 for food
float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<std::vector<Pheromone>>& grid, int pheromoneType) {
    float sensorAngle = agent.angle + sensorAngleOffset;
    float targetBias = 5;
    sf::Vector2f sensorDir(cos(sensorAngle), sin(sensorAngle));
    sf::Vector2f sensorCentre = agent.position + sensorDir * sensorSize;
    float sum = 0.0f;

    for (int offsetX = -static_cast<int>(sensorSize); offsetX <= static_cast<int>(sensorSize); ++offsetX) {
        for (int offsetY = -static_cast<int>(sensorSize); offsetY <= static_cast<int>(sensorSize); ++offsetY) {
            sf::Vector2f pos = sensorCentre + sf::Vector2f(offsetX, offsetY);
            if (pos.x >= 0 && pos.x < grid.size() && pos.y >= 0 && pos.y < grid[0].size()) {
                if(pheromoneType == 0){
                    sum += grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)].foodConcentration;
                    //steer hard towards food
                    if(grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)].hasFood){sum+=targetBias;}
                }else{
                    sum += grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)].antConcentration;
                    // steer hard towards home
                    if(grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)].hasColony){sum+=targetBias;}
                }
            }
        }
    }

    return sum;
}

float generateTerrianColor(int x, int y, int xNumber, int yNumber){
    float nx = static_cast<float>(x) / xNumber * 10; // Scale the noise coordinates
    float ny = static_cast<float>(y) / yNumber * 10; // Scale the noise coordinates

    float wavelength = 2;
    float expPow = 1.0f;
    float value = perlin(nx / wavelength, ny / wavelength);
    // float value =    1 * perlin(1 * nx, 1 * ny) +  0.5 * perlin(2 * nx, 2 * ny) + 0.25 * perlin(4 * nx, 4 * ny);
    float scaledValue = value; // (1 + 0.5 + 0.25);
    float expValue = pow(scaledValue, expPow);

    if(expValue > 1.0f){
        expValue = 1.0f;
    }else if(expValue < -1.0f){
        expValue = -1.0f;
    }

    // float threshold = 0.0f;
    // float thesholdValue = expValue > threshold ? expValue : 0.0f;
    // int color = (int)(((thesholdValue + 1.0f) * 0.5f) * 255); 
    // float color = lerp(0,255,thesholdValue);
    return expValue;
}

bool isRegionFreeOfTerrain(const std::vector<std::vector<Pheromone>>& grid, int startX, int startY, int size) {
    for (int i = 0; i <= size; ++i) {
        for (int j = 0; j <= size; ++j) {
            int x = startX + i;
            int y = startY + j;
            if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
                if (grid[x][y].hasTerrian) {
                    return false;
                }
            }
        }
    }
    return true;
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

    // Let's make a map using noise
    float xOffSet = randomFloat() * 100;
    float yOffSet = randomFloat() * 100;
    for (int x = 0; x < xNumber; ++x) {
        for (int y = 0; y < yNumber; ++y) {      
            // returns number between -1 and 1
            float noise = generateTerrianColor(x + xOffSet ,y + yOffSet, xNumber, yNumber);
            float threshold = 0.1f;    
            bool ground = noise > threshold ? true : false; 
            pheromoneGrid[x][y].hasTerrian = ground;
        }
    }




    // Create a colony of ants
    const int initialColonyPopulationSize = 20;
    const int colonySize = 10;

    // Generate a spot not on the terrian
    float colonyX, colonyY;
    do {
        colonyX = static_cast<int>(randomFloat() * (xNumber - colonySize));
        colonyY = static_cast<int>(randomFloat() * (yNumber - colonySize));
    } while (!isRegionFreeOfTerrain(pheromoneGrid, colonyX, colonyY, colonySize));

    Colony colony(colonyX, colonyY, initialColonyPopulationSize, colonySize);
    // Update the relevant grid cells to set hasColony = true
    int colonyXInt = static_cast<int>(colonyX);
    int colonyYInt = static_cast<int>(colonyY);
    for (int i = 0; i <= colonySize; ++i) {
        for (int j = 0; j <= colonySize; ++j) {
            int x = colonyXInt + i;
            int y = colonyYInt + j;
            if (x >= 0 && x < static_cast<int>(pheromoneGrid.size()) && y >= 0 && y < static_cast<int>(pheromoneGrid[0].size())) {
                pheromoneGrid[x][y].hasColony = true;
            }
        }
    }


    // Define the diffusion rate, evaporation speed, and time delta
    float diffusionRate = 0.01f;
    float evapSpeed = 0.0001f;
    float moveSpeed = 1.0f; 
    float dt = 1.0f; 

    // Create sliders
    Slider diffusionSlider(10, windowSize - 40, 200, 20, 0.0f, 1.0f, diffusionRate);
    Slider evapSpeedSlider(220, windowSize - 40, 200, 20, 0.0f, 0.01f, evapSpeed);
    Slider dtSlider(430, windowSize - 40, 200, 20, 0.0f, 10.0f, dt);

    // Create food clusters
    const int amountOfFood = 2;
    const int foodClusterSize = 5;
    for (int i = 0; i < amountOfFood; ++i) {
        float foodX = 0;
        float foodY = 0;
        do {
            foodX = static_cast<int>(randomFloat() * (xNumber - foodClusterSize));
            foodY = static_cast<int>(randomFloat() * (yNumber - foodClusterSize));
        } while (!isRegionFreeOfTerrain(pheromoneGrid, foodX, foodY, foodClusterSize));

        for (int ii = -foodClusterSize; ii < foodClusterSize; ii++){
            for (int jj = -foodClusterSize; jj < foodClusterSize; jj++){
                int x = foodX + ii;
                int y = foodY + jj;
                if (x >= 0 && x < static_cast<int>(pheromoneGrid.size()) && y >= 0 && y < static_cast<int>(pheromoneGrid[0].size())) {
                    pheromoneGrid[x][y].hasFood = true;
                    pheromoneGrid[x][y].foodConcentration = 1.0f; // add a food pheromone concentration
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
            
            // Handle slider events
            diffusionSlider.handleEvent(event, window);
            evapSpeedSlider.handleEvent(event, window);
            dtSlider.handleEvent(event, window);
        }

        // Update slider values
        diffusionRate = diffusionSlider.getValue();
        evapSpeed = evapSpeedSlider.getValue();
        dt = dtSlider.getValue();

        window.clear();

        // Apply the diffusion function
        diffuse(pheromoneGrid, diffusionRate, evapSpeed, dt);

        // Update the colony - OPT: okay maybe it isn't smart to send the window info everytime. Maybe make it a var in colony
        colony.update(moveSpeed, dt, xNumber, yNumber, pheromoneGrid);

        // Draw the grid
        sf::RectangleShape cell(sf::Vector2f(subGridWidth, subGridHeight));
        for (int x = 0; x < xNumber; ++x) {
            for (int y = 0; y < yNumber; ++y) {
                cell.setPosition(x * subGridWidth, y * subGridHeight);

                // If cell has food, render food
                if(pheromoneGrid[x][y].hasFood){
                    cell.setFillColor(sf::Color::Green); // Color of the food
                }
                // if cell has colonym render colony
                else if(pheromoneGrid[x][y].hasColony){
                    cell.setFillColor(sf::Color::Blue); // Color of the colony
                }
                // Determine color based on pheromone concentrations
                else{
                    float antConcentration = pheromoneGrid[x][y].antConcentration;
                    float foodConcentration = pheromoneGrid[x][y].foodConcentration;

                    int antColorValue = static_cast<int>(antConcentration * 255);
                    int foodColorValue = static_cast<int>(foodConcentration * 255);

                    if (foodConcentration > antConcentration){
                        cell.setFillColor(sf::Color(foodColorValue, foodColorValue, 0)); // Yellow-ish
                    }else{
                        cell.setFillColor(sf::Color(antColorValue, antColorValue, antColorValue));
                    }
                }
                if(pheromoneGrid[x][y].hasTerrian){
                    cell.setFillColor(sf::Color(137, 87, 35)); // color of the terrian
                }
                window.draw(cell);
            }
        }
        
        // Render the ants
        sf::CircleShape antShape(subGridWidth/2); 
        antShape.setFillColor(sf::Color::Red);
        for (int x = 0; x < xNumber; ++x) {
            for (int y = 0; y < yNumber; ++y) {
                for (Agent* ant : pheromoneGrid[x][y].ants) {
                    antShape.setPosition(ant->position.x * subGridWidth, ant->position.y * subGridHeight);
                    window.draw(antShape);
                }

                // Clear the ants vector in each cell after rendering
                // okay not the best but struggling to get it to work
                pheromoneGrid[x][y].ants.clear();
            }
        }
        
        // Render sliders
        diffusionSlider.render(window);
        evapSpeedSlider.render(window);
        dtSlider.render(window);

        window.display();
    }

    return 0;
}
