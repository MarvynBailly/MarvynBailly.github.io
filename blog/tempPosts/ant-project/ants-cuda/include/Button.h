#ifndef BUTTON_H
#define BUTTON_H

#include <SFML/Graphics.hpp>
#include <string>

class Button {
public:
    Button(float x, float y, float width, float height, const std::string& text);

    void render(sf::RenderWindow& window);
    bool isClicked(const sf::Event& event, const sf::RenderWindow& window);

private:
    sf::RectangleShape buttonShape;
    sf::Text buttonText;
    sf::Font font;
};

#endif // BUTTON_H
