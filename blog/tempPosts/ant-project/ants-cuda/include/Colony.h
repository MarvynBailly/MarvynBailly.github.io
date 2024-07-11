#ifndef COLONY_H
#define COLONY_H

#include <vector>
#include "Agent.h"
#include "Pheromone.h"

class Colony {
public:
    Colony(float posX, float posY, int nAnts, int s);
    void update(float moveSpeed, float deltaTime, int width, int height, std::vector<Pheromone>& grid, float sensorAngleSpacing, float turnSpeed, float sensorSize);
    void checkIfHome(Agent& ant);
    void checkIfFeed(Agent& ant, std::vector<Pheromone>& grid, int cols);
    void steerAnt(Agent& ant, float sensorAngleSpacing, float turnSpeed, float sensorSize, std::vector<Pheromone>& grid, float dt, int target, int rows, int cols);
    void releaseWorkers(float ang);

private:
    sf::Vector2f position;
    int numAnts;
    int size;
    bool foundFood = false;
    float foodDir;
    int numActiveWorkers = 0;
};

#endif // COLONY_H
