#include <SFML/Graphics.hpp>
#include <SFML/System.hpp>
#include <SFML/Window.hpp>

#include <vector>
#include <cmath>

const float PARTICLE_SIZE = 5.0f;
const int POPULATION_SIZE = 3000;


// Definition of vec2
struct Vec2 {
    float x, y;

    Vec2() : x(0), y(0) {}
    Vec2(float x, float y) : x(x), y(y) {}

    Vec2 operator+(const Vec2& other) const {
        return Vec2(x + other.x, y + other.y);
    }

    Vec2 operator-(const Vec2& other) const {
        return Vec2(x - other.x, y - other.y);
    }

    Vec2 operator*(float scalar) const {
        return Vec2(x * scalar, y * scalar);
    }

    Vec2& operator+=(const Vec2& other) {
        x += other.x;
        y += other.y;
        return *this;
    }

    Vec2& operator-=(const Vec2& other) {
        x -= other.x;
        y -= other.y;
        return *this;
    }

    Vec2& operator*=(float scalar) {
        x *= scalar;
        y *= scalar;
        return *this;
    }

    Vec2 operator/(float scalar) const {
        return Vec2(x / scalar, y / scalar);
    }
    Vec2& operator/=(float scalar) {
        x /= scalar;
        y /= scalar;
        return *this;
    }

    float length() const {
        return std::sqrt(x * x + y * y);
    }

    Vec2 normalized() const {
        float len = length();
        return Vec2(x / len, y / len);
    }
};


struct Particle
{
    Vec2 position_current;
    Vec2 position_old;
    Vec2 acceleration;
    float radius;

    Particle(float x, float y, float r)
        : position_current(x,y), position_old(x,y), radius(r) {}

    void updatePosition(float dt)
    {
        const Vec2 velocity = position_current - position_old;
        position_old = position_current;
        //verlet integration
        position_current = position_current + velocity + acceleration * dt * dt; 
        acceleration = {};
    }

    void accelerate(Vec2 acc)
    {
        acceleration += acc;
    }

    void applyConstraint(const Vec2& minBounds, const Vec2& maxBounds) {
        float radius = 2*PARTICLE_SIZE;
        if (position_current.x - radius < minBounds.x) {
            position_current.x = minBounds.x + radius;
            position_old.x = position_current.x;
        } else if (position_current.x + radius > maxBounds.x) {
            position_current.x = maxBounds.x - radius;
            position_old.x = position_current.x;
        }

        if (position_current.y - radius < minBounds.y) {
            position_current.y = minBounds.y + radius;
            position_old.y = position_current.y;
        } else if (position_current.y + radius > maxBounds.y) {
            position_current.y = maxBounds.y - radius;
            position_old.y = position_current.y;
        }
    }
};



struct Solver
{
    Vec2 gravity = {0.0f, 10.0f};
    std::vector<Particle> particles;
    Vec2 minBounds = {0.0f, 0.0f};
    Vec2 maxBounds = {800.0f, 600.0f};
    

    void update(float dt)
    {
        //let's do sub-stepping
        const int sub_steps = 10;
        const float sub_dt = dt/sub_steps;
        for(int i = 0; i < sub_steps; i++)
        {
            applyGravity();
            applyConstraints();
            solveCollusions();
            updatePositions(sub_dt);
        }
    }

    void updatePositions(float dt)
    {
        for(auto& particle : particles){
            particle.updatePosition(dt);
        }
    }

    void applyGravity()
    {
        for(auto& particle : particles){
            particle.accelerate(gravity);
        }
    }

    void applyConstraints() {
        for (auto& particle : particles) {
            particle.applyConstraint(minBounds, maxBounds);
        }
    }

    void solveCollusions() {
        const float response_coef = 0.75f;
        const size_t objects_count = particles.size();
        // Iterate on all particles
        for (size_t i = 0; i < objects_count; ++i) {
            Particle& particle_1 = particles[i];
            // Iterate on object involved in new collision pairs
            for (size_t k = i + 1; k < objects_count; ++k) {
                Particle& particle_2 = particles[k];
                const Vec2 v = particle_1.position_current - particle_2.position_current;
                const float dist2 = v.x * v.x + v.y * v.y;
                const float min_dist = particle_1.radius + particle_2.radius;
                // Check overlapping
                if (dist2 < min_dist * min_dist) {
                    const float dist = std::sqrt(dist2);
                    const Vec2 n = v / dist;
                    const float mass_ratio_1 = particle_1.radius / (particle_1.radius + particle_2.radius);
                    const float mass_ratio_2 = particle_2.radius / (particle_1.radius + particle_2.radius);
                    const float delta = 0.5f * response_coef * (dist - min_dist);
                    // Update positions
                    particle_1.position_current -= n * (mass_ratio_2 * delta);
                    particle_2.position_current += n * (mass_ratio_1 * delta);
                }
            }
        }
    }
};


int main() {
    sf::RenderWindow window(sf::VideoMode(800, 600), "Particle Simulation");

    Solver solver;


    Vec2 spawn{10.0f,100.0f};
    Vec2 spawnAcc{20000.0f,0.0f};
    float dt = 0.05;
    // for (int i = 0; i < POPULATION_SIZE; ++i) {
        Particle p(spawn.x,spawn.y,PARTICLE_SIZE);
        p.accelerate(spawnAcc);
        solver.particles.push_back(p);
    // }

    sf::Font font;
    if (!font.loadFromFile("arial.ttf")) {
        return -1; // Ensure you have a font file in the same directory or provide the correct path
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

        // Calculate FPS
        float fps = 1.0f / fpsClock.restart().asSeconds();
        fpsText.setString("FPS: " + std::to_string(static_cast<int>(fps)));
        int pop_count = solver.particles.size();
        popText.setString("Pop Count: " + std::to_string(pop_count));


        // spawn more particles
        frameCount++;
        if (frameCount % spawnInterval == 0 && solver.particles.size() < POPULATION_SIZE) {
            Particle p(spawn.x, spawn.y, PARTICLE_SIZE); // Spawn at the center with a specified radius
            p.accelerate(spawnAcc);
            solver.particles.push_back(p);
        }

        solver.update(dt);
        window.clear();
        for (const auto& particle : solver.particles) {
            sf::CircleShape shape(particle.radius);
            shape.setFillColor(sf::Color::White);
            shape.setPosition(particle.position_current.x, particle.position_current.y);
            window.draw(shape);
        }


        window.draw(fpsText);
        window.draw(popText);
        window.display();
    }

    return 0;
};