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
#include <fstream>
#include "Button.h"
#include <cuda_runtime.h>
#include "diffuse.h"

//---- TODO----
//----SLIDERS----
// add reset button
// add save button
// make menu turn off and on
//----ANTS----
// store all ants in one array rather than in each colony 
// maybe we can have the pheromone array save the indices of the ant when the ants move
// then when each cell is updated, we can have it update its 
// maybe we can reduce the number of for loops by combining tasks within the CUDA kernel and the render/update loops.
//----LONGER TERM
// add other ant colonies
// update ant route finding 
// update ant work flow
// 


// Constants for simulation and menu regions
const int SIMULATION_HEIGHT = 1000;
const int MENU_HEIGHT = 100;

// Function to apply diffusion and evaporation to each cell
void diffuse(std::vector<Pheromone>& grid, int rows, int cols, float diffusionRate, float evapSpeed, float dt) {
    Pheromone* d_grid;
    cudaMalloc((void**)&d_grid, rows * cols * sizeof(Pheromone));

    cudaMemcpy(d_grid, grid.data(), rows * cols * sizeof(Pheromone), cudaMemcpyHostToDevice);

    launchDiffuseKernel(d_grid, rows, cols, diffusionRate, evapSpeed, dt);

    cudaMemcpy(grid.data(), d_grid, rows * cols * sizeof(Pheromone), cudaMemcpyDeviceToHost);

    cudaFree(d_grid);
}

// pheromoneType - 0 for ant and 1 for food
float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<Pheromone>& grid, int pheromoneType, int rows, int cols) {
    float sensorAngle = agent.angle + sensorAngleOffset;
    float targetBias = 5;
    sf::Vector2f sensorDir(cos(sensorAngle), sin(sensorAngle));
    sf::Vector2f sensorCentre = agent.position + sensorDir * sensorSize;
    float sum = 0.0f;

    for (int offsetX = -static_cast<int>(sensorSize); offsetX <= static_cast<int>(sensorSize); ++offsetX) {
        for (int offsetY = -static_cast<int>(sensorSize); offsetY <= static_cast<int>(sensorSize); ++offsetY) {
            sf::Vector2f pos = sensorCentre + sf::Vector2f(offsetX, offsetY);
            int index = static_cast<int>(pos.y) * cols + static_cast<int>(pos.x);
            if (pos.x >= 0 && pos.x < cols && pos.y >= 0 && pos.y < rows) {
                if (pheromoneType == 0) {
                    sum += grid[index].oldFoodConcentration;
                    if (grid[index].hasFood) sum += targetBias;
                } else {
                    sum += grid[index].oldAntConcentration;
                    if (grid[index].hasColony) sum += targetBias;
                }
            }
        }
    }

    return sum;
}

float generateTerrianColor(int x, int y, int xNumber, int yNumber) {
    float nx = static_cast<float>(x) / xNumber * 10;
    float ny = static_cast<float>(y) / yNumber * 10;

    float wavelength = 3;
    float expPow = 1.0f;
    float value = perlin(nx / wavelength, ny / wavelength);
    float scaledValue = value;
    float expValue = pow(scaledValue, expPow);

    if (expValue > 1.0f) {
        expValue = 1.0f;
    } else if (expValue < -1.0f) {
        expValue = -1.0f;
    }

    return expValue;
}

bool isRegionFreeOfTerrain(const std::vector<Pheromone>& grid, int startX, int startY, int size, int rows, int cols) {
    for (int i = 0; i <= size; ++i) {
        for (int j = 0; j <= size; ++j) {
            int x = startX + i;
            int y = startY + j;
            int index = y * cols + x;
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
                if (grid[index].hasTerrian) {
                    return false;
                }
            }
        }
    }
    return true;
}

void resetGrid(std::vector<Pheromone>& grid, const int xNumber, const int yNumber){
    // reset everything
    for (int x = 0; x < xNumber; ++x) {
        for (int y = 0; y < yNumber; ++y) {
            grid[y * xNumber + x].oldAntConcentration = 0.0f;
            grid[y * xNumber + x].newAntConcentration = 0.0f;
            grid[y * xNumber + x].oldFoodConcentration = 0.0f;
            grid[y * xNumber + x].newFoodConcentration = 0.0f;
            grid[y * xNumber + x].hasFood = false;
            grid[y * xNumber + x].hasColony = false;
            grid[y * xNumber + x].hasTerrian = false;
        }
    }
}

void setUpGround(std::vector<Pheromone>& pheromoneGrid, const int xNumber, const int yNumber){
    // Let's make a map using noise
    float xOffSet = randomFloat() * 2000;
    float yOffSet = randomFloat() * 2000;

    for (int x = 0; x < xNumber; ++x) {
        for (int y = 0; y < yNumber; ++y) {
            float noise = generateTerrianColor(x + xOffSet, y + yOffSet, xNumber, yNumber);
            float threshold = 0.1f;
            bool ground = noise > threshold ? true : false;
            pheromoneGrid[y * xNumber + x].hasTerrian = ground;
        }
    }
}

void setUpColonies(std::vector<Colony>& colonies, std::vector<Pheromone>& pheromoneGrid, std::vector<Agent>& ants, const int xNumber, const int yNumber, const int numberOfColonies, const int initialColonyPopulationSize, const int colonySize){
    for(int colonyId = 0; colonyId < numberOfColonies; ++colonyId){
        // Generate a spot not on the terrain
        float colonyX, colonyY;
        do {
            colonyX = static_cast<int>(randomFloat() * (xNumber - colonySize));
            colonyY = static_cast<int>(randomFloat() * (yNumber - colonySize));
        } while (!isRegionFreeOfTerrain(pheromoneGrid, colonyX, colonyY, colonySize, yNumber, xNumber));

        for (int j = 0; j < initialColonyPopulationSize; ++j) {
            float startX = colonyX; 
            float startY = colonyY;
            float startAngle = randomFloat() * 2.0f * 3.14159f;
            ants.emplace_back(startX, startY, startAngle, colonyId);
        }

        colonies.emplace_back(colonyX, colonyY, initialColonyPopulationSize, colonySize);
        // Update the relevant grid cells to set hasColony = true
        int colonyXInt = static_cast<int>(colonyX);
        int colonyYInt = static_cast<int>(colonyY);
        for (int i = 0; i <= colonySize; ++i) {
            for (int j = 0; j <= colonySize; ++j) {
                int x = colonyXInt + i;
                int y = colonyYInt + j;
                if (x >= 0 && x < xNumber && y >= 0 && y < yNumber) {
                    pheromoneGrid[y * xNumber + x].hasColony = true;
                }
            }
        }
    }
}

void setUpFood(std::vector<Pheromone>& pheromoneGrid, const int xNumber, const int yNumber, const int amountOfFood, const int foodClusterSize){
    // Create food clusters
    for (int i = 0; i < amountOfFood; ++i) {
        float foodX = 0;
        float foodY = 0;
        do {
            foodX = static_cast<int>(randomFloat() * (xNumber - foodClusterSize));
            foodY = static_cast<int>(randomFloat() * (yNumber - foodClusterSize));
        } while (!isRegionFreeOfTerrain(pheromoneGrid, foodX, foodY, foodClusterSize, yNumber, xNumber));

        for (int ii = -foodClusterSize; ii < foodClusterSize; ii++) {
            for (int jj = -foodClusterSize; jj < foodClusterSize; jj++) {
                int x = foodX + ii;
                int y = foodY + jj;
                if (x >= 0 && x < xNumber && y >= 0 && y < yNumber) {
                    pheromoneGrid[y * xNumber + x].hasFood = true;
                    pheromoneGrid[y * xNumber + x].oldFoodConcentration = 1.0f; // add a food pheromone concentration
                }
            }
        }
    }
}

void init(std::vector<Pheromone>& pheromoneGrid, std::vector<Colony>& colonies, std::vector<Agent>& ants, const int xNumber, const int yNumber, const int numberOfColonies, const int initialColonyPopulationSize, const int colonySize, const int amountOfFood, const int foodClusterSize){

    //reset the grid
    resetGrid(pheromoneGrid, xNumber, yNumber);



    // setUpGround
    setUpGround(pheromoneGrid, xNumber, yNumber);

    setUpColonies(colonies, pheromoneGrid, ants, xNumber, yNumber, numberOfColonies, initialColonyPopulationSize, colonySize);

    setUpFood(pheromoneGrid, xNumber, yNumber, amountOfFood, foodClusterSize);
}

int main() {
    // Seed the random number generator
    std::srand(static_cast<unsigned>(std::time(nullptr)));

    // Define the number of subgrids in the x and y directions
    const int xNumber = 250;
    const int yNumber = 250;

    // Define the size of the window
    const int windowWidth = 1000;
    const int windowHeight = SIMULATION_HEIGHT + MENU_HEIGHT;

    // Subgrid size
    const int subGridWidth = windowWidth / xNumber;
    const int subGridHeight = SIMULATION_HEIGHT / yNumber;

    // Create a 1D array to store the gray shade of each subgrid
    std::vector<Pheromone> pheromoneGrid(xNumber * yNumber);

    // Create a colony of ants
    const int initialColonyPopulationSize = 50;
    const int colonySize = 10;
    const int numberOfColonies = 2;

    std::vector<Colony> colonies;
    colonies.reserve(numberOfColonies);
    
    std::vector<Agent> ants;
    ants.reserve(initialColonyPopulationSize * numberOfColonies);

    // food clusters
    const int amountOfFood = 2;
    const int foodClusterSize = 5;

    // Define the diffusion rate, evaporation speed, and time delta
    float diffusionRate = 0.01f;
    float evapSpeed = 0.0001f;
    float moveSpeed = 1.0f;
    float dt = 1.0f;
    float sensorAngleSpacing = 1.0f;
    float turnSpeed = 0.95f; 
    float sensorSize = 10.0f;
    init(pheromoneGrid, colonies, ants, xNumber, yNumber, numberOfColonies, initialColonyPopulationSize, colonySize, amountOfFood, foodClusterSize);

    // Create sliders
    Slider diffusionSlider(10, SIMULATION_HEIGHT + 10, 200, 20, 0.0f, 1.0f, diffusionRate, "Diffuse");
    Slider evapSpeedSlider(220, SIMULATION_HEIGHT + 10, 200, 20, 0.0f, 0.01f, evapSpeed, "Evap Speed");
    Slider dtSlider(430, SIMULATION_HEIGHT + 10, 200, 20, 0.0f, 10.0f, dt, "dt");
    Slider sensorAngleSpacingSlider(10, SIMULATION_HEIGHT + 40, 200, 20, 0.0f, 10.0f, sensorAngleSpacing, "sens ang space");
    Slider turnSpeedSlider(220, SIMULATION_HEIGHT + 40, 200, 20, 0.0f, 2.0f, turnSpeed, "turn speed");
    Slider sensorSizeSlider(430, SIMULATION_HEIGHT + 40, 200, 20, 0.0f, 30.0f, sensorSize, "sensor size");


     // Create buttons
    Button saveButton(650, SIMULATION_HEIGHT + 10, 100, 40, "Save");
    Button resetButton(650, SIMULATION_HEIGHT + 60, 100, 40, "Reset");

    // Create the SFML window
    sf::RenderWindow window(sf::VideoMode(windowWidth, windowHeight), "Ant Simulation");

    while (window.isOpen()) {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)
                window.close();

            // Handle slider events
            if(MENU_HEIGHT > 0){
                diffusionSlider.handleEvent(event, window);
                evapSpeedSlider.handleEvent(event, window);
                dtSlider.handleEvent(event, window);
                sensorAngleSpacingSlider.handleEvent(event,window);
                turnSpeedSlider.handleEvent(event,window);
                sensorSizeSlider.handleEvent(event,window);

                                // Handle button events
                if (saveButton.isClicked(event, window)) {
                    std::ofstream outFile("slider_values.txt");
                    outFile << diffusionRate << std::endl;
                    outFile << evapSpeed << std::endl;
                    outFile << dt << std::endl;
                    outFile << sensorAngleSpacing << std::endl;
                    outFile << turnSpeed << std::endl;
                    outFile << sensorSize << std::endl;
                    outFile.close();
                }

                if (resetButton.isClicked(event, window)) {
                    init(pheromoneGrid, colonies,ants, xNumber, yNumber, numberOfColonies, initialColonyPopulationSize, colonySize, amountOfFood, foodClusterSize);
                }
            }
        }

        // Update slider values
        if(MENU_HEIGHT > 0){
            diffusionRate = diffusionSlider.getValue();
            evapSpeed = evapSpeedSlider.getValue();
            dt = dtSlider.getValue();
            sensorAngleSpacing = sensorAngleSpacingSlider.getValue();
            turnSpeed = turnSpeedSlider.getValue();
            sensorSize = sensorSizeSlider.getValue();
        }



        window.clear();

        // Apply the diffusion function
        diffuse(pheromoneGrid, yNumber, xNumber, diffusionRate, evapSpeed, dt);

        // Update the colony
        for(int i = 0; i < numberOfColonies; ++i){
            colonies[i].update(moveSpeed, dt, xNumber, yNumber, pheromoneGrid, sensorAngleSpacing, turnSpeed, sensorSize);
        }
        
        // update ants
        for (size_t i = 0; i < ants.size(); ++i) {
            Agent& ant = ants[i];
            int target = ant.status;

            if (target == 0) {
                colonies[ant.colony].checkIfFeed(ant, pheromoneGrid, xNumber);
            } else if (target == 1) {
                colonies[ant.colony].checkIfHome(ant);
            }

            colonies[ant.colony].steerAnt(ant, sensorAngleSpacing, turnSpeed, sensorSize, pheromoneGrid, dt, target, yNumber, xNumber);

            ant.move(moveSpeed, dt, xNumber, yNumber, pheromoneGrid, yNumber, xNumber, i);
            ant.updateGrid(pheromoneGrid, yNumber, xNumber);
        }

        // Draw the grid
        sf::RectangleShape cell(sf::Vector2f(subGridWidth, subGridHeight));
        for (int x = 0; x < xNumber; ++x) {
            for (int y = 0; y < yNumber; ++y) {
                cell.setPosition(x * subGridWidth, y * subGridHeight);

                // If cell has food, render food
                if (pheromoneGrid[y * xNumber + x].hasFood) {
                    cell.setFillColor(sf::Color::Green); // Color of the food
                }
                // if cell has colonym render colony
                else if (pheromoneGrid[y * xNumber + x].hasColony) {
                    cell.setFillColor(sf::Color::Blue); // Color of the colony
                }
                // Determine color based on pheromone concentrations
                else {
                    float antConcentration = pheromoneGrid[y * xNumber + x].oldAntConcentration;
                    float foodConcentration = pheromoneGrid[y * xNumber + x].oldFoodConcentration;

                    int antColorValue = static_cast<int>(antConcentration * 255);
                    int foodColorValue = static_cast<int>(foodConcentration * 255);

                    if (foodConcentration > antConcentration) {
                        cell.setFillColor(sf::Color(foodColorValue, foodColorValue, 0)); // Yellow-ish
                    } else {
                        cell.setFillColor(sf::Color(antColorValue, antColorValue, antColorValue));
                    }
                }
                if (pheromoneGrid[y * xNumber + x].hasTerrian) {
                    cell.setFillColor(sf::Color(137, 87, 35)); // color of the terrain
                }
                window.draw(cell);
            }
        }

        // Render the ants
        // sf::CircleShape antShape(subGridWidth / 2);
        // antShape.setFillColor(sf::Color::Red);

        // Draw grey background for the menu region
        sf::RectangleShape menuBackground(sf::Vector2f(windowWidth, MENU_HEIGHT));
        menuBackground.setFillColor(sf::Color(128, 128, 128)); // Grey color
        menuBackground.setPosition(0, SIMULATION_HEIGHT);
        window.draw(menuBackground);

        // Render sliders in the menu region
        if(MENU_HEIGHT > 0){
            diffusionSlider.render(window);
            evapSpeedSlider.render(window);
            dtSlider.render(window);
            sensorAngleSpacingSlider.render(window);
            turnSpeedSlider.render(window); 
            sensorSizeSlider.render(window);
            saveButton.render(window);
            resetButton.render(window);
        }


        window.display();
    }

    return 0;
}
