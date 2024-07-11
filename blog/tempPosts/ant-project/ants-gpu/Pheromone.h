#ifndef PHEROMONE_H
#define PHEROMONE_H

class Agent;

struct Pheromone {
    float antConcentration;
    float foodConcentration;
    bool hasFood;
    bool hasColony;
    bool hasTerrian;
    std::vector<Agent*> ants;

    Pheromone() : antConcentration(0.0f), foodConcentration(0.0f), hasFood(false), hasColony(false), hasTerrian(false){}
};

#endif // PHEROMONE_H
