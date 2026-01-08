#include "Colony.h"

extern float randomFloat();
extern float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<std::vector<Pheromone>>& grid, int pheromoneType);


Colony::Colony(float posX, float posY, int nAnts, int s)
    : position(posX, posY), numAnts(nAnts), size(s) {
    for (int i = 0; i < numAnts; ++i) {
        float startX = posX; //+ randomFloat() - 0.5f; // Slightly randomize start positions around colony center
        float startY = posY;// + randomFloat() - 0.5f;
        float startAngle = randomFloat() * 2.0f * 3.14159f;
        ants.emplace_back(startX, startY, startAngle);
    }
}

void Colony::update(float moveSpeed, float deltaTime, int width, int height, std::vector<std::vector<Pheromone>>& grid, std::vector<Food>& foods) {
    float sensorAngleSpacing = 1.0f;
    float turnSpeed = 0.95f; 
    float sensorSize = 10.0f;
    // handle all things to do with ants
    for (auto& ant : ants) {
        
        // check if ant is on food if searching for food
        if(ant.status == 0){
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
        // otherwise check if at home
        else{
            int colonyX = static_cast<int>(position.x);
            int colonyY = static_cast<int>(position.y);
            if ((static_cast<int>(ant.position.x) >= colonyX - 1 && static_cast<int>(ant.position.x) <= colonyX + size) &&
                (static_cast<int>(ant.position.y) >= colonyY - 1 && static_cast<int>(ant.position.y) <= colonyY + size)) {
                ant.status = 0;
                ant.angle -= 3.1514;

            }
        }



        // if the ant is searching for food, baise the steering towards food pheromone 
        int target = ant.status;

        // Steer based on sensory data
         sense(ant, 0, sensorSize, grid, 1);
         sense(ant, sensorAngleSpacing, sensorSize, grid, 1);
         sense(ant, -sensorAngleSpacing, sensorSize, grid, 1);

        // Steer based on sensory data
         sense(ant, 0, sensorSize, grid, 0);
         sense(ant, sensorAngleSpacing, sensorSize, grid, 0);
         sense(ant, -sensorAngleSpacing, sensorSize, grid, 0);

        float weightForward, weightLeft, weightRight;

   

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


        float randomSteerStrength = randomFloat(); 

        // go forward
        if (weightForward > weightLeft && weightForward > weightRight) {
            ant.angle += 0;
        }
        // go right
        else if (weightRight > weightLeft) {
            ant.angle -= randomSteerStrength * turnSpeed * deltaTime;
        }
        // go left
        else if (weightLeft > weightRight) {
            ant.angle += randomSteerStrength * turnSpeed * deltaTime;
        }

        ant.move(moveSpeed, deltaTime, width, height);
        ant.updateGrid(grid);
    }

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
