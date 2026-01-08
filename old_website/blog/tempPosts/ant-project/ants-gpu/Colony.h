#ifndef COLONY_H
#define COLONY_H

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


    void checkIfHome(Agent& ant);
    void checkIfFeed(Agent& ant, std::vector<std::vector<Pheromone>>& grid);
    void steerAnt(Agent& ant, float sensorAngleSpacing, float turnSpeed, float sensorSize, std::vector<std::vector<Pheromone>>& grid, float dt, int target);
    void update(float moveSpeed, float deltaTime, int width, int height,  std::vector<std::vector<Pheromone>>& grid);
    void releaseWorkers(float angle);
    // void render(sf::RenderWindow& window, float cellWidth, float cellHeight);
};

#endif // COLONY_H
