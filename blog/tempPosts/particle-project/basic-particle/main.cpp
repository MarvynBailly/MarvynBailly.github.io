#include <SFML/Graphics.hpp>
#include <SFML/System.hpp>
#include <SFML/Window.hpp>

#include <vector>
#include <cmath>

class Particle {
public:
    float x, y;     // Position
    float vx, vy;   // Velocity
    float ax, ay;   // Acceleration

    Particle(float x, float y, float vx, float vy)
        : x(x), y(y), vx(vx), vy(vy), ax(0), ay(0) {}

    void update(float dt) {
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;
    }
};

void simulate(std::vector<Particle>& particles, float dt) {
    for (auto& particle : particles) {
        particle.update(dt);
    }
}

int main() {
    sf::RenderWindow window(sf::VideoMode(800, 600), "Particle Simulation");

    std::vector<Particle> particles;
    for (int i = 0; i < 100; ++i) {
        particles.emplace_back(rand() % 800, rand() % 600, (rand() % 200 - 100) / 10.0, (rand() % 200 - 100) / 10.0);
    }

    sf::CircleShape shape(2);
    shape.setFillColor(sf::Color::White);

    sf::Font font;
    if (!font.loadFromFile("arial.ttf")) {
        return -1; // Ensure you have a font file in the same directory or provide the correct path
    }
    sf::Text fpsText;
    fpsText.setFont(font);
    fpsText.setCharacterSize(20);
    fpsText.setFillColor(sf::Color::White);
    fpsText.setPosition(10, 10);

    sf::Clock clock;
    sf::Clock fpsClock;
    while (window.isOpen()) {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)
                window.close();
        }

        float dt = clock.restart().asSeconds();
        simulate(particles, dt);

        // Calculate FPS
        float fps = 1.0f / fpsClock.restart().asSeconds();
        fpsText.setString("FPS: " + std::to_string(static_cast<int>(fps)));

        window.clear();
        for (const auto& particle : particles) {
            shape.setPosition(particle.x, particle.y);
            window.draw(shape);
        }
        window.draw(fpsText);
        window.display();
    }

    return 0;
}
