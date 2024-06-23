#ifndef PHEROMONE_H
#define PHEROMONE_H

struct Pheromone {
    float antConcentration;
    float foodConcentration;

    Pheromone() : antConcentration(0.0f), foodConcentration(0.0f) {}
};

#endif // PHEROMONE_H
