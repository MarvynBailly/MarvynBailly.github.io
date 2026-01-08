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

// OKAY BIG OPTIMIZE HERE. RATHER THAN CHECK ALL THE FOOD, STORE THE FOOD IN SUCH A WAY THAT WE CAN JUST CHECK IF THE GRID CELL THAT THE ANT IS ON IS A FOOD CELL
void Colony::checkIfFeed(Agent& ant, std::vector<Food>& foods){
    for (auto it = foods.begin(); it != foods.end();) {
        int foodX = static_cast<int>(it->position.x);
        int foodY = static_cast<int>(it->position.y);
        if (static_cast<int>(ant.position.x) == foodX && static_cast<int>(ant.position.y) == foodY) {
            // Ant "picks up" the food
            it = foods.erase(it);
            ant.status = 1;
            ant.angle -= 3.1514;
        } else {
            ++it;
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


void Colony::update(float moveSpeed, float deltaTime, int width, int height, std::vector<std::vector<Pheromone>>& grid, std::vector<Food>& foods) {
    float sensorAngleSpacing = 1.0f;
    float turnSpeed = 0.95f; 
    float sensorSize = 10.0f;


    // release worker ants if food is found
    if(foundFood && numActiveWorkers < 100){
        releaseWorkers(foodDir);
        numActiveWorkers++;
    }
    
    //release smell around the home
    updateGrid(grid);

    // handle all things to do with ants
    for (auto& ant : ants) {
        int target = ant.status;

        // check if ant is on food if searching for food
        if(target == 0){
            checkIfFeed(ant,foods);
        }
        // otherwise check if at home
        else if(target == 1){
            checkIfHome(ant);
        }

        // if the ant is searching for food, baise the steering towards food pheromone 
        // but if the ant sees target(home or food), steer towards that
        
        steerAnt(ant, sensorAngleSpacing, turnSpeed, sensorSize, grid, deltaTime, target);

        // Move ants
        ant.move(moveSpeed, deltaTime, width, height);
        
        // Update grid
        ant.updateGrid(grid);
    }
}

void Colony::updateGrid(std::vector<std::vector<Pheromone>>& grid){
    // let's make the home a little smelly for the queen ant
    int colonyX = static_cast<int>(position.x);
    int colonyY = static_cast<int>(position.y);
    for(int i = 0; i < size; i++){
        for(int j = 0; j < size; j++){
            int x = colonyX + i;
            int y = colonyY + j;
            if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
                grid[x][y].antConcentration = 1.0f;
            }
        } 
    }
}

void Colony::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    // Render the ants
    for (auto& ant : ants) {
        ant.render(window, cellWidth, cellHeight);
    }
    // Render the colony position as four grid cells
    sf::RectangleShape colonyShape(sf::Vector2f(cellWidth, cellHeight));
    for (int i = 0; i < size; ++i) {
        for (int j = 0; j < size; ++j) {
            colonyShape.setPosition((position.x + i) * cellWidth, (position.y + j) * cellHeight);
            colonyShape.setFillColor(sf::Color::Blue);
            window.draw(colonyShape);
        }
    }
}


void Colony::releaseWorkers(float ang){
    float startX = position.x; //+ randomFloat() - 0.5f; // Slightly randomize start positions around colony center
    float startY = position.y;// + randomFloat() - 0.5f;
    ants.emplace_back(startX, startY, ang);
}