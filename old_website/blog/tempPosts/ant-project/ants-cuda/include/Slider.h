#ifndef SLIDER_H
#define SLIDER_H

#include <SFML/Graphics.hpp>
#include <string>

class Slider {
public:
    Slider(float x, float y, float width, float height, float minValue, float maxValue, float initialValue, const std::string& name);

    void handleEvent(const sf::Event& event, sf::RenderWindow& window);
    void render(sf::RenderWindow& window);
    float getValue() const;

private:
    sf::RectangleShape background;
    sf::RectangleShape handle;
    sf::Font font;
    sf::Text labelText;
    float minValue;
    float maxValue;
    float value;
    bool isDragging;
};

#endif // SLIDER_H
