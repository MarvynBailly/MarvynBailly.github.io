#ifndef PARTICLE_H
#define PARTICLE_H

#include "vec2.h"

struct Particle {
    Vec2 position_current;
    Vec2 position_old;
    Vec2 acceleration;
    float radius;

    CUDA_HOST_DEVICE Particle() {}
    CUDA_HOST_DEVICE Particle(float x, float y, float r)
        : position_current{x, y}, position_old{x, y}, radius(r) {}

    void updatePosition(float dt) {
        const Vec2 velocity = position_current - position_old;
        position_old = position_current;
        // Verlet integration
        position_current = position_current + velocity + acceleration * dt * dt;
        acceleration = {};
    }

    void accelerate(Vec2 acc) {
        acceleration += acc;
    }

    void applyConstraint(const Vec2& minBounds, const Vec2& maxBounds) {
        float radius = 2 * this->radius;
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

#endif // PARTICLE_H
