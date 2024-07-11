#include "Agent.h"
#include <cmath>

Agent::Agent(float startX, float startY, float startAngle)
    : position(startX, startY), angle(startAngle) {status = 0;} //0 is searching and 1 is found food

void Agent::move(float moveSpeed, float deltaTime, int width, int height, const std::vector<std::vector<Pheromone>>& grid) {
    sf::Vector2f direction(std::cos(angle), std::sin(angle));
    sf::Vector2f newPosition = position + direction * moveSpeed * deltaTime;

    // Calculate the new cell coordinates
    int newCellX = static_cast<int>(std::floor(newPosition.x));
    int newCellY = static_cast<int>(std::floor(newPosition.y));
    
    // Check if the new position is within bounds and does not have terrain
    if (newCellX >= 0 && newCellX < width && newCellY >= 0 && newCellY < height && !grid[newCellX][newCellY].hasTerrian) {
        position = newPosition;
    } else {
        angle += randomFloat() * 2.0f * 3.14159f; // Change angle randomly
    }
}



void Agent::updateGrid(std::vector<std::vector<Pheromone>>& grid) {
    int newCellX = static_cast<int>(position.x);
    int newCellY = static_cast<int>(position.y);

    // Add to new cell
    if (newCellX >= 0 && newCellX < static_cast<int>(grid.size()) && newCellY >= 0 && newCellY < static_cast<int>(grid[0].size())) {
        grid[newCellX][newCellY].ants.push_back(this);
    }

    // Update pheromone concentration
    if (newCellX >= 0 && newCellX < static_cast<int>(grid.size()) && newCellY >= 0 && newCellY < static_cast<int>(grid[0].size())) {
        // if searching for food, leave a trail to find home
        if(status == 0){
            grid[newCellX][newCellY].antConcentration = 1.0f;
        }
        // otherwise, leave behind a food smell
        else{
            grid[newCellX][newCellY].foodConcentration = 1.0f;
        }
    }
}

void Agent::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    sf::CircleShape antShape(cellWidth / 2); 
    antShape.setPosition(position.x * cellWidth, position.y * cellHeight);
    antShape.setFillColor(sf::Color::Red);
    window.draw(antShape);
}
