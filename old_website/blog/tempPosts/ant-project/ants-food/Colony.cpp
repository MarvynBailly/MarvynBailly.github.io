#include "Colony.h"
#include "Agent.h"

extern float randomFloat();
extern float sense(const Agent& agent, float sensorAngleOffset, float sensorSize, const std::vector<std::vector<float>>& grid);


Colony::Colony(float posX, float posY, int nAnts)
    : position(posX, posY), numAnts(nAnts) {
    for (int i = 0; i < numAnts; ++i) {
        float startX = posX; //+ randomFloat() - 0.5f; // Slightly randomize start positions around colony center
        float startY = posY;// + randomFloat() - 0.5f;
        float startAngle = randomFloat() * 2.0f * 3.14159f;
        ants.emplace_back(startX, startY, startAngle);
    }
}

void Colony::update(float moveSpeed, float deltaTime, int width, int height, std::vector<std::vector<float>>& grid) {
    float sensorAngleSpacing = 0.5f;
    float turnSpeed = 0.5f; 
    float sensorSize = 2.0f;
    // move ants
    for (auto& ant : ants) {
        // Steer based on sensory data
        float weightForward = sense(ant, 0, sensorSize, grid);
        float weightLeft = sense(ant, sensorAngleSpacing, sensorSize, grid);
        float weightRight = sense(ant, -sensorAngleSpacing, sensorSize, grid);

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
    for(int i = -1; i <= 1; i++){
        for(int j = -1; j <= 1; j++){
            int x = colonyX + i;
            int y = colonyY + j;
            if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
                grid[x][y] = 1.0f;
            }
        } 
    }

}

void Colony::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    // Render the ants
    for (auto& ant : ants) {
        ant.render(window, cellWidth, cellHeight);
    }
    sf::CircleShape colonyShape(cellWidth);
    colonyShape.setPosition(position.x * cellWidth, position.y * cellHeight);
    colonyShape.setFillColor(sf::Color::Blue);
    window.draw(colonyShape);
}