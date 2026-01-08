#ifndef PHEROMONE_H
#define PHEROMONE_H

class Agent;

struct Pheromone {
    float oldAntConcentration = 0.0f;
    float newAntConcentration = 0.0f;
    float oldFoodConcentration = 0.0f;
    float newFoodConcentration = 0.0f;
    bool hasFood = false;
    bool hasColony = false;
    bool hasTerrian = false;
    std::vector<Agent*> ants;
};

#endif // PHEROMONE_H
