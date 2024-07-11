#include "Food.h"

Food::Food(float posX, float posY) : position(posX, posY) {}

void Food::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    sf::RectangleShape foodShape(sf::Vector2f(cellWidth, cellHeight));
    foodShape.setPosition(position.x * cellWidth, position.y * cellHeight);
    foodShape.setFillColor(sf::Color::Green); // Color of the food
    window.draw(foodShape);
}

void Food::update(std::vector<std::vector<Pheromone>>& grid) {
    int x = static_cast<int>(position.x);
    int y = static_cast<int>(position.y);
    if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
        grid[x][y].foodConcentration = 1.0f; // Type 1 for food pheromone
    }
}