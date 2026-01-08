#ifndef COLONY_H
#define COLONY_H

#include "Food.h"
#include "Agent.h"
#include "Pheromone.h"
#include <vector>


class Colony {
public:
    sf::Vector2f position;
    int numAnts;
    int size;
    float foodDir;
    bool foundFood = false;
    int numActiveWorkers = 0;
    std::vector<Agent> ants;

    Colony(float posX, float posY, int nAnts, int size);

    void update(float moveSpeed, float deltaTime, int width, int height,  std::vector<std::vector<Pheromone>>& grid, std::vector<Food>& foods);
    void render(sf::RenderWindow& window, float cellWidth, float cellHeight);
    void releaseWorkers(float angle);
};

#endif // COLONY_H
