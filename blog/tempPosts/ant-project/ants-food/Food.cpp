#include "Food.h"

Food::Food(float posX, float posY) : position(posX, posY) {}

void Food::render(sf::RenderWindow& window, float cellWidth, float cellHeight) {
    sf::RectangleShape foodShape(sf::Vector2f(cellWidth, cellHeight));
    foodShape.setPosition(position.x * cellWidth, position.y * cellHeight);
    foodShape.setFillColor(sf::Color::Green); // Color of the food
    window.draw(foodShape);
}
