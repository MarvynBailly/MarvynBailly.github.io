#include <SFML/Graphics.hpp>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <cmath>

// Function to generate a random float between 0 and 1
float randomFloat() {
    return static_cast<float>(rand()) / static_cast<float>(RAND_MAX);
}

// Linear interpolation function
float lerp(float a, float b, float t) {
    return a + t * (b - a);
}

// Function to return the maximum of two floats
float max(float a, float b) {
    return (a > b) ? a : b;
}

// Agent class representing an agent that moves and leaves a trail
class Agent {
public:
    sf::Vector2f position;
    float angle;

    Agent(float startX, float startY, float startAngle)
        : position(startX, startY), angle(startAngle) {}

    void move(float moveSpeed, float deltaTime, int width, int height) {
        sf::Vector2f direction(cos(angle), sin(angle));
        position += direction * moveSpeed * deltaTime;

        // Clamp position to map boundaries and change direction if hitting boundary
        if (position.x < 0 || position.x >= width || position.y < 0 || position.y >= height) {
            position.x = std::min(static_cast<float>(width - 0.01f), std::max(0.0f, position.x));
            position.y = std::min(static_cast<float>(height - 0.01f), std::max(0.0f, position.y));
            angle = randomFloat() * 2.0f * 3.14159f;
        }
    }

    void updateGrid(std::vector<std::vector<float>>& grid) {
        int x = static_cast<int>(position.x);
        int y = static_cast<int>(position.y);
        if (x >= 0 && x < static_cast<int>(grid.size()) && y >= 0 && y < static_cast<int>(grid[0].size())) {
            grid[x][y] = 1.0f;
        }
    }
};

// Function to apply diffusion and evaporation to each cell
void diffuse(std::vector<std::vector<float>>& grid, float diffusionRate, float evapSpeed, float dt) {
    int rows = grid.size();
    int cols = grid[0].size();
    std::vector<std::vector<float>> newGrid = grid; // Copy the original grid

    for (int x = 0; x < rows; ++x) {
        for (int y = 0; y < cols; ++y) {
            float sum = 0.0f;
            float originalVal = grid[x][y];
            int count = 0;

            // Collect all valid neighboring cells including the cell itself
            for (int dx = -1; dx <= 1; ++dx) {
                for (int dy = -1; dy <= 1; ++dy) {
                    int nx = x + dx;
                    int ny = y + dy;
                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                        sum += grid[nx][ny];
                        count++;
                    }
                }
            }

            float blur = sum / static_cast<float>(count);
            float diffused = lerp(originalVal, blur, diffusionRate * dt);
            float diffusedAndEvap = max(0.0f, diffused - evapSpeed * dt);
            newGrid[x][y] = diffusedAndEvap;
        }
    }

    grid = newGrid; // Update the original grid with the new values
}

float sense(Agent agent, float sensorAngleOffset, float sensorSize, const std::vector<std::vector<float>>& grid) {
        float sensorAngle = agent.angle + sensorAngleOffset;
        sf::Vector2f sensorDir(cos(sensorAngle), sin(sensorAngle));
        sf::Vector2f sensorCentre = agent.position + sensorDir * sensorSize;
        float sum = 0.0f;

        for (int offsetX = -static_cast<int>(sensorSize); offsetX <= static_cast<int>(sensorSize); ++offsetX) {
            for (int offsetY = -static_cast<int>(sensorSize); offsetY <= static_cast<int>(sensorSize); ++offsetY) {
                sf::Vector2f pos = sensorCentre + sf::Vector2f(offsetX, offsetY);
                if (pos.x >= 0 && pos.x < grid.size() && pos.y >= 0 && pos.y < grid[0].size()) {
                    sum += grid[static_cast<int>(pos.x)][static_cast<int>(pos.y)];
                }
            }
        }

        return sum;
    }

int main() {
    // Seed the random number generator
    std::srand(static_cast<unsigned>(std::time(nullptr)));

    // Define the number of subgrids in the x and y directions
    const int xNumber = 200;
    const int yNumber = 200;

    // Define the size of the window
    const int windowSize = 800;
    const int subGridWidth = windowSize / xNumber;
    const int subGridHeight = windowSize / yNumber;

    // Create a 2D array to store the gray shade of each subgrid
    std::vector<std::vector<float>> gridColors(xNumber, std::vector<float>(yNumber, 0.0f));

    // Create multiple ants
    const int numAnts = 1000;
    std::vector<Agent> ants;
    for (int i = 0; i < numAnts; ++i) {
        float startX = randomFloat() * xNumber;
        float startY = randomFloat() * yNumber;
        float startAngle = randomFloat() * 2.0f * 3.14159f;
        ants.emplace_back(startX, startY, startAngle);
    }

    // Define the diffusion rate, evaporation speed, and time delta
    const float diffusionRate = 0.9f;
    const float evapSpeed = 0.02f;
    const float moveSpeed = 1.0f; // Speed at which the agent moves
    const float dt = 1.0f; // Assuming a fixed time step for simplicity

    // Create the SFML window
    sf::RenderWindow window(sf::VideoMode(windowSize, windowSize), "SFML Grid");

    while (window.isOpen()) {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)
                window.close();
        }

        window.clear();

        // Apply the diffusion function
        diffuse(gridColors, diffusionRate, evapSpeed, dt);

        // Move each ant and update the grid
        float sensorAngleSpacing = 0.25f;
        float turnSpeed = 0.5f; 
        int sensorSize = 3;
        for (auto& ant : ants) {
            // Steer based on sensory data
            float weightForward = sense(ant, 0, sensorSize, gridColors);
            float weightLeft = sense(ant, sensorAngleSpacing, sensorSize, gridColors);
            float weightRight = sense(ant, -sensorAngleSpacing, sensorSize, gridColors);

            float randomSteerStrength = randomFloat();

            // go forward
            if(weightForward > weightLeft && weightForward > weightRight){
                ant.angle += 0;
            }
            // add some random
            else if(weightForward < weightLeft && weightForward < weightRight){
                ant.angle += (randomSteerStrength - 0.5) * 2 * turnSpeed * dt;
            }
            // go right
            else if(weightRight > weightLeft)
            {
                ant.angle -= randomSteerStrength * turnSpeed * dt;
            }
            // go left
            else if(weightLeft > weightRight)
            {
                ant.angle += randomSteerStrength * turnSpeed * dt;
            }

            ant.move(moveSpeed, dt, xNumber, yNumber);
            ant.updateGrid(gridColors);
        }

        // Draw the grid
        for (int x = 0; x < xNumber; ++x) {
            for (int y = 0; y < yNumber; ++y) {
                sf::RectangleShape cell(sf::Vector2f(subGridWidth, subGridHeight));
                cell.setPosition(x * subGridWidth, y * subGridHeight);
                float shade = gridColors[x][y];
                int colorValue = static_cast<int>(shade * 255);
                cell.setFillColor(sf::Color(colorValue, colorValue, colorValue));
                window.draw(cell);
            }
        }

        window.display();
    }

    return 0;
}
