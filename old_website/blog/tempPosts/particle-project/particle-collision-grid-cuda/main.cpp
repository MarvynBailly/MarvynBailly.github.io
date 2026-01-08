#include <SFML/Graphics.hpp>
#include <SFML/System.hpp>
#include <SFML/Window.hpp>
#include <vector>
#include <cmath>
#include <iostream>
#include "particle.h"
#include "collision.h"

const float PARTICLE_SIZE = 5.0f;
const int POPULATION_SIZE = 3000;
const int NUM_CELLS = 20;  // Number of cells per dimension


struct Solver {
    Vec2 gravity = {0.0f, 50.0f};
    std::vector<Particle> particles;
    Vec2 minBounds = {0.0f, 0.0f};
    Vec2 maxBounds = {800.0f, 600.0f};
    int cellWidth;
    int cellHeight;
    Particle* d_particles;

    Solver() {
        cellWidth = (maxBounds.x - minBounds.x) / NUM_CELLS;
        cellHeight = (maxBounds.y - minBounds.y) / NUM_CELLS;
        cudaMalloc(&d_particles, POPULATION_SIZE * sizeof(Particle));
    }

    ~Solver() {
        cudaFree(d_particles);
    }

    void update(float dt) {
        const int sub_steps = 10;
        const float sub_dt = dt / sub_steps;
        for (int i = 0; i < sub_steps; i++) {
            applyGravity();
            applyConstraints();
            solveCollisions();
            updatePositions(sub_dt);
        }
    }

    void updatePositions(float dt) {
        for (auto& particle : particles) {
            particle.updatePosition(dt);
        }
    }

    void applyGravity() {
        for (auto& particle : particles) {
            particle.accelerate(gravity);
        }
    }

    void applyConstraints() {
        for (auto& particle : particles) {
            particle.applyConstraint(minBounds, maxBounds);
        }
    }

    void solveCollisions() {
        cudaMemcpy(d_particles, particles.data(), particles.size() * sizeof(Particle), cudaMemcpyHostToDevice);
        dim3 threadsPerBlock(16, 16);
        detectCollisions(d_particles, particles.size(), NUM_CELLS, NUM_CELLS, cellWidth, cellHeight, 0.25f, threadsPerBlock);
        cudaMemcpy(particles.data(), d_particles, particles.size() * sizeof(Particle), cudaMemcpyDeviceToHost);
    }
};

int main() {
    sf::RenderWindow window(sf::VideoMode(800, 600), "Particle Simulation");

    Solver solver;

    Vec2 spawn{10.0f, 100.0f};
    Vec2 spawnAcc{20000.0f, 0.0f};

    constexpr uint32_t fps_cap = 60;

    // Main loop
    const float dt = 1.0f / static_cast<float>(fps_cap);

    Particle p(spawn.x, spawn.y, PARTICLE_SIZE);
    p.accelerate(spawnAcc);
    solver.particles.push_back(p);

    sf::Font font;
    if (!font.loadFromFile("arial.ttf")) {
        return -1;
    }
    sf::Text fpsText;
    fpsText.setFont(font);
    fpsText.setCharacterSize(20);
    fpsText.setFillColor(sf::Color::White);
    fpsText.setPosition(10, 10);

    sf::Text popText;
    popText.setFont(font);
    popText.setCharacterSize(20);
    popText.setFillColor(sf::Color::White);
    popText.setPosition(10, 40);

    unsigned int frameCount = 0;
    const unsigned int spawnInterval = 10;

    sf::Clock clock;
    sf::Clock fpsClock;
    while (window.isOpen()) {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)
                window.close();
        }

        float fps = 1.0f / fpsClock.restart().asSeconds();
        fpsText.setString("FPS: " + std::to_string(static_cast<int>(fps)));
        int pop_count = solver.particles.size();
        popText.setString("Pop Count: " + std::to_string(pop_count));

        frameCount++;
        if (frameCount % spawnInterval == 0 && solver.particles.size() < POPULATION_SIZE) {
            Particle p(spawn.x, spawn.y, PARTICLE_SIZE);
            p.accelerate(spawnAcc);
            solver.particles.push_back(p);
        }

        solver.update(dt);
        window.clear();
        sf::CircleShape shape(PARTICLE_SIZE);
        for (const auto& particle : solver.particles) {
            shape.setFillColor(sf::Color::White);
            shape.setPosition(particle.position_current.x, particle.position_current.y);
            window.draw(shape);
        }

        window.draw(fpsText);
        window.draw(popText);
        window.display();
    }

    return 0;
}
