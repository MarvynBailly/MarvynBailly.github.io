#ifndef FOOD_H
#define FOOD_H

#include <SFML/Graphics.hpp>
#include "Pheromone.h"

class Food {
public:
    sf::Vector2f position;

    Food(float posX, float posY);

    void render(sf::RenderWindow& window, float cellWidth, float cellHeight);
    void update(std::vector<std::vector<Pheromone>>& grid);
};

#endif // FOOD_H
