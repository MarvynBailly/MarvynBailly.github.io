#ifndef PHEROMONE_H
#define PHEROMONE_H

struct Pheromone {
    float antConcentration;
    float foodConcentration;
    bool hasFood;
    bool hasColony;

    Pheromone() : antConcentration(0.0f), foodConcentration(0.0f), hasFood(false), hasColony(false) {}
};

#endif // PHEROMONE_H
