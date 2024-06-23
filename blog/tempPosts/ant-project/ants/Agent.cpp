#include "Agent.h"
#include <cmath>

Agent::Agent(float startX, float startY, float startAngle)
    : position(startX, startY), angle(startAngle) {status = 0;} //0 is searching and 1 is found food

void Agent::move(float moveSpeed, float deltaTime, int width, int height) {
    sf::Vector2f direction(cos(angle), sin(angle));
    position += direction * moveSpeed * deltaTime;

    // Clamp position to map boundaries and change direction if hitting boundary
    if (position.x < 0 || position.x >= width || position.y < 0 || position.y >= height) {
        position.x = std::min(static_cast<float>(width - 0.01f), std::max(0.0f, position.x));
        position.y = std::min(static_cast<float>(height - 0.01f), std::max(0.0f, position.y));
        angle = randomFloat() * 2.0f * 3.14159f;
    }
}

void Agent::updateGrid(std::vector<std::vector<Pheromone>>& grid) {
    int x = static_cast<int>(position.x);
    int y = static_cast<int>(position.y);
    if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
        // if searching for food, leave a trail to find home
        if(status == 0){
            grid[x][y].antConcentration = 1.0f;
        }
        // otherwise, leave behind a food smell
        else{
            grid[x][y].foodConcentration = 1.0f;
        }
    }
}

void Agent::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    sf::CircleShape antShape(cellWidth / 2); 
    antShape.setPosition(position.x * cellWidth, position.y * cellHeight);
    antShape.setFillColor(sf::Color::Red);
    window.draw(antShape);
}
