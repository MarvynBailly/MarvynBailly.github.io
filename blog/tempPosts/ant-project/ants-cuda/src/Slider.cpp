#include "Slider.h"

Slider::Slider(float x, float y, float width, float height, float minValue, float maxValue, float initialValue, const std::string& name)
    : minValue(minValue), maxValue(maxValue), value(initialValue), isDragging(false) {

    background.setPosition(x, y);
    background.setSize(sf::Vector2f(width, height));
    background.setFillColor(sf::Color(200, 200, 200));

    handle.setSize(sf::Vector2f(height, height));
    handle.setFillColor(sf::Color(100, 100, 100));
    handle.setPosition(x + (initialValue - minValue) / (maxValue - minValue) * (width - height), y);

    if (!font.loadFromFile("arial.ttf")) {
        // Handle error
    }

    labelText.setFont(font);
    labelText.setString(name);
    labelText.setCharacterSize(static_cast<unsigned int>(height - 5));
    labelText.setFillColor(sf::Color::Black);
    labelText.setPosition(x, y);
}

void Slider::handleEvent(const sf::Event& event, sf::RenderWindow& window) {
    if (event.type == sf::Event::MouseButtonPressed) {
        if (event.mouseButton.button == sf::Mouse::Left && handle.getGlobalBounds().contains(event.mouseButton.x, event.mouseButton.y)) {
            isDragging = true;
        }
    } else if (event.type == sf::Event::MouseButtonReleased) {
        if (event.mouseButton.button == sf::Mouse::Left) {
            isDragging = false;
        }
    } else if (event.type == sf::Event::MouseMoved) {
        if (isDragging) {
            float mouseX = static_cast<float>(event.mouseMove.x);
            float newX = std::max(background.getPosition().x, std::min(mouseX, background.getPosition().x + background.getSize().x - handle.getSize().x));
            handle.setPosition(newX, handle.getPosition().y);
            value = minValue + (newX - background.getPosition().x) / (background.getSize().x - handle.getSize().x) * (maxValue - minValue);
        }
    }
}

void Slider::render(sf::RenderWindow& window) {
    window.draw(background);
    window.draw(handle);
    window.draw(labelText);
}

float Slider::getValue() const {
    return value;
}
