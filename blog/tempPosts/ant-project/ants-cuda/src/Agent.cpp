#include "Agent.h"
#include <cmath>

Agent::Agent(float startX, float startY, float startAngle, int colonyId)
    : position(startX, startY), angle(startAngle), status(0), colony(colonyId) {} //0 is searching and 1 is found food

void Agent::move(float moveSpeed, float deltaTime, int width, int height, const std::vector<Pheromone>& grid, int rows, int cols, int id {
    sf::Vector2f direction(std::cos(angle), std::sin(angle));
    sf::Vector2f newPosition = position + direction * moveSpeed * deltaTime;

    int newCellX = static_cast<int>(std::floor(newPosition.x));
    int newCellY = static_cast<int>(std::floor(newPosition.y));
    int index = newCellY * cols + newCellX;

    if (newCellX >= 0 && newCellX < width && newCellY >= 0 && newCellY < height && !grid[index].hasTerrian) {
        position = newPosition;
    } else {
        angle += randomFloat() * 2.0f * 3.14159f;
    }
}



void Agent::updateGrid(std::vector<Pheromone>& grid, int rows, int cols) {
    int newCellX = static_cast<int>(position.x);
    int newCellY = static_cast<int>(position.y);
    int index = newCellY * cols + newCellX;

    if (index >= 0 && index < static_cast<int>(grid.size())) {
        if (status == 0) {
            grid[index].oldAntConcentration = 1.0f;
        } else {
            grid[index].oldFoodConcentration = 1.0f;
        }
    }
}

void Agent::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    sf::CircleShape antShape(cellWidth / 2); 
    antShape.setPosition(position.x * cellWidth, position.y * cellHeight);
    antShape.setFillColor(sf::Color::Red);
    window.draw(antShape);
}
