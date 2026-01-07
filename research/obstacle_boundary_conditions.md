# Obstacle Boundary Conditions Research

## Overview

This document synthesizes research on how solid obstacles are represented and handled in grid-based Navier-Stokes fluid solvers, with specific focus on GPU implementations. This research is foundational

 for adding internal wall obstacles to our existing WebGL fluid simulation.

---

## 1. Mathematical Foundation of Boundary Conditions

### 1.1 No-Slip Boundary Condition

**Definition**: A viscous fluid in direct contact with a solid boundary has zero relative velocity with respect to that boundary.[^1]

**Mathematical Formulation**:
```
u|wall = u_wall
```

For a stationary wall:
```
u|wall = 0
```

**Physical Basis**: 
- Strong adhesive forces between fluid molecules and solid surface exceed cohesive forces between fluid molecules
- Causes fluid velocity to diminish to zero at immediate contact with solid[^1]
- Essential for modeling viscous flows and correctly determining drag, lift, energy dissipation, and turbulence

### 1.2 Types of Boundary Conditions

| Condition Type | Velocity Behavior | Use Case |
|---------------|-------------------|----------|
| **No-Slip** | u = 0 (all components zero at wall) | Viscous fluids, realistic walls |
| **Free-Slip** | u⊥ = 0, τ = 0 (normal velocity zero, zero shear stress) | Inviscid fluids, symmetry planes |
| **No-Penetration** | u·n = 0 (only normal component zero) | Prevents flow through boundary |

For our implementation, **no-slip** is the correct choice for realistic solid obstacles.

### 1.3 Pressure Boundary Conditions

**Neumann Boundary Condition** (most common for solid walls):
```
∂p/∂n = 0
```

Where n is the normal direction to the wall. This implies the pressure gradient normal to the wall is zero.[^2][^3]

**Derivation from Navier-Stokes**:
From the momentum equation with no-slip (u = 0) at the wall:
```
∂u/∂t + (u·∇)u = -∇p + ν∇²u

At wall (u = 0):
0 = -∇p + ν∇²u

For no-slip, ∇p·n = 0
```

---

## 2. Jos Stam's "Stable Fluids" Approach

### 2.1 Fixed Boundary Treatment

From Stam's SIGGRAPH 1999 paper and related implementations[^4]:

**Velocity at Boundaries**:
- Normal component of velocity must be zero: prevents penetration
- Implemented as Dirichlet boundary conditions
- Values at boundary set to zero or reflected from inner neighbors

**Pressure at Boundaries**:
- Neumann boundary conditions applied
- ∂p/∂n = 0 ensures divergence-free velocity after projection
- Mathematically equivalent to Dirichlet conditions on velocity for stationary solid

**Implementation Approach**:
- "Ghost cells" or extra layer around simulation domain
- Boundary values set during each solver step
- Can handle both periodic and fixed boundaries (we need fixed for obstacles)

### 2.2 Integration with Solver Steps

**Advection Step**:
- Clamp back-tracing at boundaries
- Boundary cells maintain their constraints

**Diffusion Step**:
- Apply boundary conditions after each Jacobi/Gauss-Seidel iteration
- Velocity normal to wall = 0

**Projection Step** (most critical):
- Divergence computation must account for boundary cells
- Pressure Poisson equation: boundary cells have Neumann condition
- Gradient subtraction: ensure no velocity perpendicular to walls

---

## 3. GPU Gems Chapter 38 Implementation

### 3.1 Boundary Cell Strategy

From Harris (2004) - GPU Gems Chapter 38[^5]:

**Grid Structure**:
- Reserve **single-cell perimeter** of grid for boundary values
- Separate fragment programs for interior vs boundary cells
- Update interior: render quad covering all but 1-pixel border
- Update boundaries: render 4 line primitives along each edge

**Discretization**:
- Boundary lies on edge between boundary cell and nearest interior cell
- Grid values defined at cell centers
- Must compute boundary values so average of two adjacent cells satisfies boundary condition

### 3.2 Velocity Boundary Implementation

**No-Slip on Left Side** (example):
```
(u₀,ⱼ + u₁,ⱼ) / 2 = 0

Therefore: u₀,ⱼ = -u₁,ⱼ
```

**Fragment Shader Pattern**:
```glsl
// velocity boundary: negate and copy interior value
vec2 offset = vec2(scale.x, 0.0);  // for left boundary
boundaryValue = -texture2D(x, coords + offset);
```

### 3.3 Pressure Boundary Implementation

**Pure Neumann Condition**:
```
(p₁,ⱼ - p₀,ⱼ) / Δx = 0

Therefore: p₀,ⱼ = p₁,ⱼ
```

**Fragment Shader Pattern**:
```glsl
// pressure boundary: copy interior value
vec2 offset = vec2(scale.x, 0.0);  // for left boundary
boundaryValue = texture2D(x, coords + offset);
```

### 3.4 Unified Boundary Shader

GPU Gems shows a single shader can handle both:[^5]

```glsl
void boundary(
    vec2 coords,
    out vec4 value,
    uniform vec2 offset,  // direction to interior cell
    uniform float scale,   // 1.0 for pressure, -1.0 for velocity
    uniform sampler2D x    // field to bound
) {
    value = scale * texture2D(x, coords + offset);
}
```

---

## 4. Obstacle Representation Methods

### 4.1 Binary Obstacle Mask Texture

**Description**: 
- Additional texture channel storing 1 for obstacle, 0 for fluid
- Each texel corresponds to a grid cell
- Can be precomputed for static obstacles

**Advantages**:
- Simple to implement
- Fast lookups (single texture sample)
- Easy to composite multiple obstacles
- Works with existing texture-based architecture

**Disadvantages**:
- Staircase artifacts for diagonal boundaries
- Limited to grid resolution
- Binary nature (cell is fully obstacle or fully fluid)

**Implementation in Shaders**:
```glsl
uniform sampler2D obstacleTexture;  // R channel: 1=obstacle, 0=fluid

// Check if current cell is obstacle
float isObstacle = texture2D(obstacleTexture, coords).r;

if (isObstacle > 0.5) {
    // Apply obstacle boundary condition
    velocity = vec2(0.0);  // no-slip
} else {
    // Normal fluid computation
}
```

### 4.2 Signed Distance Field (SDF)

**Description**:
- Continuous function returning distance to nearest obstacle surface
- Negative inside obstacle, positive outside, zero at boundary
- Can represent arbitrary shapes smoothly

**Advantages**:
- Smooth boundaries at any resolution
- Sub-cell accuracy
- Can compute normals via gradient
- Efficient O(1) distance queries

**Disadvantages**:
- More complex to generate
- Requires SDF computation/storage for each obstacle
- Slightly more expensive shader sampling

**Implementation**:
```glsl
uniform sampler2D sdfTexture;  // signed distance to obstacles

float sdf = texture2D(sdfTexture, coords).r;

if (sdf < 0.0) {
    // Inside obstacle
    velocity = vec2(0.0);
} else if (sdf < epsilon) {
    // Near boundary - apply boundary forces
    vec2 normal = normalize(grad(sdf));
    // Reflect or clamp velocity
}
```

### 4.3 Voxelization with Velocity Field

**Description** (from GPU Gems)[^6]:
- "Inside-outside" texture marks solid regions
- Optional "obstacle velocity" texture for dynamic obstacles
- Updated when obstacles move/deform

**Advantages**:
- Supports moving obstacles
- Can apply obstacle velocity to fluid
- Standard voxelization approach

**Disadvantages**:
- Requires regeneration for dynamic obstacles
- Still grid-aligned

---

## 5. Boundary Condition Application in Each Solver Step

### 5.1 Advection

**Goal**: Transport quantities along velocity field

**Obstacle Handling**:
- During back-tracing, check if traced position lands in obstacle
- If so, clamp to obstacle boundary or use boundary cell value
- Ensure fluid doesn't advect into obstacles

**Shader Modification**:
```glsl
vec2 tracedPos = coords - dt * velocity;

// Check if traced position is in obstacle
if (isObstacle(tracedPos)) {
    // Use current position value instead (particle stops at wall)
    tracedPos = coords;
}

newValue = texture2D(field, tracedPos);
```

### 5.2 Divergence Computation

**Goal**: Compute ∇·u for pressure projection

**Obstacle Handling**:
- When sampling neighboring cells, check for obstacles
- If neighbor is obstacle, treat as boundary:
  - For velocity: use reflected value (u_neighbor = -u_current for no-slip)
  - Adjusts divergence calculation near obstacles

**Shader Modification**:
```glsl
vec2 uL = sampleVelocity(coords, vec2(-1, 0));  // left neighbor
vec2 uR = sampleVelocity(coords, vec2(1, 0));   // right neighbor

vec2 sampleVelocity(vec2 coords, vec2 offset) {
    vec2 samplePos = coords + offset * gridScale;
    if (isObstacle(samplePos)) {
        // Obstacle: return negated current velocity (no-slip)
        return -texture2D(velocity, coords).xy;
    }
    return texture2D(velocity, samplePos).xy;
}

float div = (uR.x - uL.x + uT.y - uB.y) * 0.5 * rdx;
```

### 5.3 Pressure Solve (Jacobi Iteration)

**Goal**: Solve ∇²p = ∇·w (pressure Poisson equation)

**Obstacle Handling**:
- Obstacles don't compute pressure (or set to neighboring fluid pressure)
- When sampling pressure neighbors for Jacobi iteration:
  - If neighbor is obstacle, use Neumann condition (∂p/∂n = 0)
  - Practically: use current cell's pressure value

**Shader Modification**:
```glsl
float pL = samplePressure(coords, vec2(-1, 0));
float pR = samplePressure(coords, vec2(1, 0));
float pB = samplePressure(coords, vec2(0, -1));
float pT = samplePressure(coords, vec2(0, 1));

float samplePressure(vec2 coords, vec2 offset) {
    vec2 samplePos = coords + offset * gridScale;
    if (isObstacle(samplePos)) {
        // Neumann BC: no gradient across boundary
        return texture2D(pressure, coords).r;
    }
    return texture2D(pressure, samplePos).r;
}

// Standard Jacobi iteration
float pNew = (pL + pR + pB + pT + alpha * bC) * rBeta;

// If current cell is obstacle, don't update
if (isObstacle(coords)) {
    pNew = 0.0;  // or maintain previous value
}
```

### 5.4 Gradient Subtraction

**Goal**: u = w - ∇p (make velocity divergence-free)

**Obstacle Handling**:
- Don't subtract gradient in obstacle cells
- Ensures velocity remains zero in obstacles

**Shader Modification**:
```glsl
vec2 uNew = texture2D(w, coords).xy;

if (!isObstacle(coords)) {
    float pL = texture2D(pressure, coords - vec2(gridScale, 0)).r;
    float pR = texture2D(pressure, coords + vec2(gridScale, 0)).r;
    float pB = texture2D(pressure, coords - vec2(0, gridScale)).r;
    float pT = texture2D(pressure, coords + vec2(0, gridScale)).r;
    
    uNew -= 0.5 * rdx * vec2(pR - pL, pT - pB);
} else {
    // Obstacle: enforce no-slip
    uNew = vec2(0.0);
}
```

### 5.5 Vorticity Confinement

**Obstacle Handling**:
- Compute vorticity only in fluid cells
- Don't apply vorticity force in obstacles
- When computing curl, treat obstacle neighbors appropriately

---

## 6. Recommended Approach for Our Implementation

### 6.1 Obstacle Mask Texture (Recommended)

**Rationale**:
1. **Simplicity**: Aligns perfectly with existing texture-based architecture
2. **Performance**: Single texture lookup per fragment
3. **Composability**: Easy to combine multiple obstacles using texture ops
4. **Proven**: Used in GPU Gems and many real-time implementations
5. **Static Use Case**: Our initial implementation is for static obstacles

**Storage**:
- Single R8 or R16F texture same resolution as velocity texture
- 0.0 = fluid, 1.0 = obstacle
- Can use alpha channel of existing texture to save memory

### 6.2 Integration Architecture

**Data Flow**:
```
1. Create obstacle texture (preprocessing or dynamic generation)
2. Bind obstacle texture to all physics shaders
3. In each shader:
   - Sample obstacle texture for current/neighbor cells
   - Branch or modify computation based on obstacle presence
   - Enforce boundary conditions
```

**Shader Modifications Needed**:
- `advection.glsl`: Check traced positions against obstacles
- `curl.glsl`: Don't compute curl in obstacles
- `divergence.glsl`: Use boundary conditions when sampling obstacle neighbors
- `pressure.glsl` (Jacobi): Apply Neumann BC, don't solve in obstacles
- `gradientSubtract.glsl`: Don't update velocity in obstacles
- `vorticity.glsl`: Don't apply vorticity force in obstacles
- `splat.glsl`: Don't add forces/dye in obstacles

### 6.3 Boundary Condition Summary

| Shader | Obstacle Treatment |
|--------|-------------------|
| Advection | Clamp traced position to boundary |
| Divergence | Reflect velocity at boundary (u_obstacle = -u_fluid) |
| Pressure (Jacobi) | Copy neighbor pressure (Neumann: ∂p/∂n = 0) |
| Gradient Subtract | Set velocity to zero in obstacles |
| Vorticity | Skip obstacle cells |
| Display | Render obstacles with distinct color |

---

## 7. Grid Discretization Considerations

### 7.1 Cell-Centered vs Face-Centered

**Current Implementation**: Cell-centered (velocity and pressure at cell centers)

**Obstacle Representation**:
- Obstacle mask is also cell-centered
- Cell is either fully obstacle or fully fluid (binary decision)
- Boundary lies between obstacle and fluid cells

**Staggered Grid Alternative** (MAC grid):
- Velocity components stored on cell faces
- Pressure at cell centers
- More complex but potentially more accurate
- **Not recommended for first implementation** - too complex

### 7.2 Handling Grid Resolution

**Challenges**:
- Small obstacles (< 3-5 cells) may not flow correctly
- Staircase artifacts on diagonal boundaries

**Mitigations**:
- Ensure obstacles are at least 5-10 cells wide
- Use higher DYE_RESOLUTION for visual smoothness
- Future: implement sub-cell refinement or SDF for smoothness

---

## 8. References

[^1]: sim-flow.com - "No-Slip Boundary Condition in CFD"
[^2]: Stam, Jos (1999). "Stable Fluids" - SIGGRAPH 1999
[^3]: Bridson, R. "Fluid Simulation for Computer Graphics" - Boundary Conditions Chapter
[^4]: Multiple sources on Stam's Stable Fluids implementation (wisc.edu, medium.com, gatech.edu)
[^5]: Harris, Mark J. (2004). "Fast Fluid Dynamics Simulation on the GPU" - GPU Gems Chapter 38
[^6]: NVIDIA GPU Gems - "Chapter 30: Real-Time Fluid Dynamics Simulation" (LBM with obstacles)

---

## Next Steps

1. Analyze existing codebase modules and shaders (Phase 2)
2. Design ObstacleManager module and data structures (Phase 3)
3. Create detailed shader modification plan (Phase 3)
4. Implement and test iteratively (Phase 5)

---

*This research document provides the theoretical foundation for obstacle implementation. All techniques referenced are from peer-reviewed academic sources or industry-standard references.*
