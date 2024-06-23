#ifndef PHEROMONE_H
#define PHEROMONE_H

struct Pheromone {
    float concentration;
    int type; // 0 for ant, 1 for food

    Pheromone() : concentration(0.0f), type(0) {}
};

#endif // PHEROMONE_H
