#ifndef AGENT_H
#define AGENT_H

#include <SFML/Graphics.hpp>
#include <vector>
#include "Utilities.h"

class Agent {
public:
    sf::Vector2f position;
    float angle;

    Agent(float startX, float startY, float startAngle);

    void move(float moveSpeed, float deltaTime, int width, int height);
    void updateGrid(std::vector<std::vector<float>>& grid);
    void render(sf::RenderWindow& window, float cellWidth, float cellHeight);
};

#endif // AGENT_H
