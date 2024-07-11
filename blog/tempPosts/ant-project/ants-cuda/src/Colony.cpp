#include "Colony.h"

extern float randomFloat();
extern float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<Pheromone>& grid, int pheromoneType, int rows, int cols);


// maybe lets make the searcher ants not go for food pheremone but rather food. 

Colony::Colony(float posX, float posY, int nAnts, int s)
    : position(posX, posY), numAnts(nAnts), size(s) {}

void Colony::checkIfHome(Agent& ant){
    int colonyX = static_cast<int>(position.x);
    int colonyY = static_cast<int>(position.y);
    if ((static_cast<int>(ant.position.x) >= colonyX - 1 && static_cast<int>(ant.position.x) <= colonyX + size) &&
        (static_cast<int>(ant.position.y) >= colonyY - 1 && static_cast<int>(ant.position.y) <= colonyY + size)) {
        ant.status = 0;
        ant.angle -= 3.1514;
        if(!foundFood && numActiveWorkers == 0){
            foundFood = true;
            foodDir = ant.angle;
        }
    }
}


void Colony::checkIfFeed(Agent& ant, std::vector<Pheromone>& grid, int cols) {
    int x = static_cast<int>(ant.position.x);
    int y = static_cast<int>(ant.position.y);
    int index = y * cols + x;
    if (index >= 0 && index < static_cast<int>(grid.size())) {
        if (grid[index].hasFood) {
            // Ant "picks up" the food
            grid[index].hasFood = false; // Remove food from the grid
            grid[index].oldFoodConcentration = 0.0f;
            ant.status = 1;
            ant.angle -= 3.14159f; // Turn around to go back to the colony
        }
    }
}


void Colony::steerAnt(Agent& ant, float sensorAngleSpacing, float turnSpeed, float sensorSize, std::vector<Pheromone>& grid, float dt, int target, int rows, int cols) {
    float weightForward, weightLeft, weightRight;
    float randomSteerStrength = randomFloat(); 

    if (target == 0) {
        weightForward = sense(ant, 0, sensorSize, grid, 0, rows, cols);
        weightLeft = sense(ant, sensorAngleSpacing, sensorSize, grid, 0, rows, cols);
        weightRight = sense(ant, -sensorAngleSpacing, sensorSize, grid, 0, rows, cols);
    } else {
        weightForward = sense(ant, 0, sensorSize, grid, 1, rows, cols);
        weightLeft = sense(ant, sensorAngleSpacing, sensorSize, grid, 1, rows, cols);
        weightRight = sense(ant, -sensorAngleSpacing, sensorSize, grid, 1, rows, cols);
    }

    if (weightForward > weightLeft && weightForward > weightRight) {
        ant.angle += 0;
    } else if (weightForward < weightLeft && weightForward < weightRight) {
        ant.angle += (randomSteerStrength - 0.5) * 2 * turnSpeed * dt;
    } else if (weightRight > weightLeft) {
        ant.angle -= randomSteerStrength * turnSpeed * dt;
    } else if (weightLeft > weightRight) {
        ant.angle += randomSteerStrength * turnSpeed * dt;
    }
}


void Colony::update(float moveSpeed, float deltaTime, int width, int height, std::vector<Pheromone>& grid, float sensorAngleSpacing, float turnSpeed, float sensorSize) {
    if (foundFood && numActiveWorkers < 100) {
        // releaseWorkers(foodDir);
        numActiveWorkers++;
    }
}


// void Colony::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
//     // Render the ants
//     for (auto& ant : ants) {
//         ant.render(window, cellWidth, cellHeight);
//     }
// }


// void Colony::releaseWorkers(float ang){
//     float startX = position.x; //+ randomFloat() - 0.5f; // Slightly randomize start positions around colony center
//     float startY = position.y;// + randomFloat() - 0.5f;
//     ants.emplace_back(startX, startY, ang);
// }