#include "Slider.h"

Slider::Slider(float x, float y, float width, float height, float min, float max, float value)
    : minValue(min), maxValue(max), currentValue(value), dragging(false) {
    track.setSize(sf::Vector2f(width, height));
    track.setPosition(x, y);
    track.setFillColor(sf::Color::White);

    handle.setSize(sf::Vector2f(height, height));
    handle.setPosition(x + (width - height) * ((value - min) / (max - min)), y);
    handle.setFillColor(sf::Color::Red);
}

void Slider::handleEvent(const sf::Event& event, const sf::RenderWindow& window) {
    if (event.type == sf::Event::MouseButtonPressed) {
        if (handle.getGlobalBounds().contains(window.mapPixelToCoords(sf::Mouse::getPosition(window)))) {
            dragging = true;
        }
    } else if (event.type == sf::Event::MouseButtonReleased) {
        dragging = false;
    } else if (event.type == sf::Event::MouseMoved) {
        if (dragging) {
            float mouseX = window.mapPixelToCoords(sf::Mouse::getPosition(window)).x;
            float newPosX = std::max(track.getPosition().x, std::min(mouseX - handle.getSize().x / 2, track.getPosition().x + track.getSize().x - handle.getSize().x));
            handle.setPosition(newPosX, handle.getPosition().y);
            currentValue = minValue + ((newPosX - track.getPosition().x) / (track.getSize().x - handle.getSize().x)) * (maxValue - minValue);
        }
    }
}

void Slider::render(sf::RenderWindow& window) {
    window.draw(track);
    window.draw(handle);
}

float Slider::getValue() const {
    return currentValue;
}
