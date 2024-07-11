#include "Colony.h"

extern float randomFloat();
extern float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<std::vector<Pheromone>>& grid, int pheromoneType);


// maybe lets make the searcher ants not go for food pheremone but rather food. 

Colony::Colony(float posX, float posY, int nAnts, int s)
    : position(posX, posY), numAnts(nAnts), size(s) {
    for (int i = 0; i < numAnts; ++i) {
        float startX = posX; //+ randomFloat() - 0.5f; // Slightly randomize start positions around colony center
        float startY = posY;// + randomFloat() - 0.5f;
        float startAngle = randomFloat() * 2.0f * 3.14159f;
        ants.emplace_back(startX, startY, startAngle);
    }
}

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

void Colony::checkIfFeed(Agent& ant, std::vector<std::vector<Pheromone>>& grid){
    int x = static_cast<int>(ant.position.x);
    int y = static_cast<int>(ant.position.y);
    if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
        if (grid[x][y].hasFood) {
            // Ant "picks up" the food
            grid[x][y].hasFood = false; // Remove food from the grid
            grid[x][y].foodConcentration = 0.0f; // Optionally reset the food pheromone concentration
            ant.status = 1;
            ant.angle -= 3.14159f; // Turn around to go back to the colony
        }
    }
}

void Colony::steerAnt(Agent& ant, float sensorAngleSpacing, float turnSpeed, float sensorSize, std::vector<std::vector<Pheromone>>& grid, float dt, int target){
    float weightForward, weightLeft, weightRight;
    float randomSteerStrength = randomFloat(); 

    // Steer based on sensory data
    sense(ant, 0, sensorSize, grid, 1);
    sense(ant, sensorAngleSpacing, sensorSize, grid, 1);
    sense(ant, -sensorAngleSpacing, sensorSize, grid, 1);

    // Steer based on sensory data
    sense(ant, 0, sensorSize, grid, 0);
    sense(ant, sensorAngleSpacing, sensorSize, grid, 0);
    sense(ant, -sensorAngleSpacing, sensorSize, grid, 0);

    // ant is searching
    if(target == 0){
        weightForward = sense(ant, 0, sensorSize, grid, 0);;
        weightLeft =  sense(ant, sensorAngleSpacing, sensorSize, grid, 0);
        weightRight = sense(ant, -sensorAngleSpacing, sensorSize, grid, 0);;
    }
    // ant has food
    else{
        weightForward = sense(ant, 0, sensorSize, grid, 1);
        weightLeft = sense(ant, sensorAngleSpacing, sensorSize, grid, 1);
        weightRight = sense(ant, -sensorAngleSpacing, sensorSize, grid, 1);
    }

    // go forward
    if (weightForward > weightLeft && weightForward > weightRight) {
    ant.angle += 0;
    }
    // go right
    else if (weightRight > weightLeft) {
    ant.angle -= randomSteerStrength * turnSpeed * dt;
    }
    // go left
    else if (weightLeft > weightRight) {
    ant.angle += randomSteerStrength * turnSpeed * dt;
    }
}


void Colony::update(float moveSpeed, float deltaTime, int width, int height, std::vector<std::vector<Pheromone>>& grid) {
    float sensorAngleSpacing = 1.0f;
    float turnSpeed = 0.95f; 
    float sensorSize = 10.0f;


    // release worker ants if food is found
    if(foundFood && numActiveWorkers < 100){
        releaseWorkers(foodDir);
        numActiveWorkers++;
    }

    // handle all things to do with ants
    for (size_t i = 0; i < ants.size(); ++i) {
        Agent& ant = ants[i];
        int target = ant.status;

        // check if ant is on food if searching for food
        if(target == 0){
            checkIfFeed(ant,grid);
        }
        // otherwise check if at home
        else if(target == 1){
            checkIfHome(ant);
        }

        // // if the ant is searching for food, baise the steering towards food pheromone 
        // // but if the ant sees target(home or food), steer towards that

        steerAnt(ant, sensorAngleSpacing, turnSpeed, sensorSize, grid, deltaTime, target);

        // // Move ants
        ant.move(moveSpeed, deltaTime, width, height);
        
        // // Update grid
        ant.updateGrid(grid);
    }
}

void Colony::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    // Render the ants
    for (auto& ant : ants) {
        ant.render(window, cellWidth, cellHeight);
    }
}


void Colony::releaseWorkers(float ang){
    float startX = position.x; //+ randomFloat() - 0.5f; // Slightly randomize start positions around colony center
    float startY = position.y;// + randomFloat() - 0.5f;
    ants.emplace_back(startX, startY, ang);
}