#ifndef COLONY_H
#define COLONY_H

#include "Agent.h"
#include <vector>

class Colony {
public:
    sf::Vector2f position;
    int numAnts;
    std::vector<Agent> ants;

    Colony(float posX, float posY, int nAnts);

    void update(float moveSpeed, float deltaTime, int width, int height, std::vector<std::vector<float>>& grid);
    void render(sf::RenderWindow& window, float cellWidth, float cellHeight);
};

#endif // COLONY_H
