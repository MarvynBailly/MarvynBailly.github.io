#ifndef FOOD_H
#define FOOD_H

#include <SFML/Graphics.hpp>

class Food {
public:
    sf::Vector2f position;

    Food(float posX, float posY);

    void render(sf::RenderWindow& window, float cellWidth, float cellHeight);
};

#endif // FOOD_H
