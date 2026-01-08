#ifndef SLIDER_H
#define SLIDER_H

#include <SFML/Graphics.hpp>

class Slider {
public:
    Slider(float x, float y, float width, float height, float min, float max, float value);
    void handleEvent(const sf::Event& event, const sf::RenderWindow& window);
    void render(sf::RenderWindow& window);
    float getValue() const;

private:
    sf::RectangleShape track;
    sf::RectangleShape handle;
    float minValue;
    float maxValue;
    float currentValue;
    bool dragging;
};

#endif // SLIDER_H
