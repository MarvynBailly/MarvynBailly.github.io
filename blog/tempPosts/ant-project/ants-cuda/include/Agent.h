#ifndef AGENT_H
#define AGENT_H

#include <SFML/Graphics.hpp>
#include <vector>
#include "Utilities.h"
#include "Pheromone.h"

class Agent {
public:
    Agent(float startX, float startY, float startAngle, int colonyId);
    void move(float moveSpeed, float deltaTime, int width, int height, std::vector<Pheromone>& grid, int rows, int cols, int id);
    void updateGrid(std::vector<Pheromone>& grid, int rows, int cols);
    void render(sf::RenderWindow& window, float cellWidth, float cellHeight);

    sf::Vector2f position;
    float angle;
    int status;
    int colony;
};

#endif // AGENT_H
