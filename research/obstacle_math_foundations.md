# Mathematical Foundations for Obstacle Boundary Conditions

## Overview

This document provides the mathematical rigor underlying obstacle boundary conditions in grid-based Navier-Stokes solvers. We derive the discrete finite difference formulations and explain how they enforce incompressibility and no-slip conditions at solid walls.

---

## 1. Continuous Navier-Stokes Equations

### 1.1 Governing Equations

For incompressible, viscous fluid flow:

**Momentum Equation**:
```
∂u/∂t + (u·∇)u = -∇p/ρ + ν∇²u + f
```

**Incompressibility Constraint**:
```
∇·u = 0
```

Where:
- **u** = velocity field (vector)
- **p** = pressure field (scalar)
- **ρ** = density (constant for incompressible flow)
- **ν** = kinematic viscosity
- **f** = external forces

### 1.2 Operator Splitting (Stam's Stable Fluids)

Split the complex equation into simpler steps:

1. **Advection**: ∂u/∂t + (u·∇)u = 0
2. **Diffusion**: ∂u/∂t = ν∇²u
3. **External Forces**: ∂u/∂t = f
4. **Projection**: Enforce ∇·u = 0

Each step can be solved separately and composed.

---

## 2. Boundary Conditions - Continuous Formulation

### 2.1 No-Slip Velocity Condition

**Physical Constraint**: Fluid velocity equals wall velocity at solid boundary.

For stationary wall at position **x**_wall:
```
u(x_wall, t) = 0
```

This is a **Dirichlet boundary condition** - we specify the exact value.

### 2.2 Pressure Boundary Condition

**Derivation from Momentum Equation**:

At a stationary wall where **u** = 0:
```
∂u/∂t + (u·∇)u = -∇p/ρ + ν∇²u

Since u = 0 and ∂u/∂t = 0 at wall:
0 = -∇p/ρ + ν∇²u|_wall

Taking dot product with wall normal n:
0 = -(∇p·n)/ρ + ν(∇²u|_wall)·n
```

For most practical cases (especially in projection method), the viscous term becomes small near stationary walls, giving:
```
∇p·n ≈ 0    at wall

Or equivalently: ∂p/∂n = 0
```

This is a **Neumann boundary condition** - we specify the derivative.

### 2.3 Physical Interpretation

- **No-slip**: Prevents fluid from sliding along wall (tangential velocity = 0)
- **Neumann pressure**: Ensures pressure doesn't build up or deplete at walls
- Together they enforce: fluid flows around obstacles, not through them

---

## 3. Grid Discretization

### 3.1 Staggered vs Cell-Centered Grids

**Cell-Centered (Our Implementation)**:
- Velocity and pressure stored at cell centers
- Simpler to implement
- Used in GPU Gems Chapter 38

**Staggered (MAC Grid)**:
- Velocity components on cell faces
- Pressure at cell centers
- Better conservation properties
- More complex (not used in this implementation)

### 3.2 Grid Notation

For 2D grid with spacing Δx = Δy (uniform grid):

**Cell Indices**: (i, j) where i ∈ [0, N-1], j ∈ [0, N-1]

**Cell Center Position**:
```
x_{i,j} = (i + 0.5)Δx
y_{i,j} = (j + 0.5)Δy
```

**Neighbor Notation**:
- (i-1, j): left neighbor
- (i+1, j): right neighbor
- (i, j-1): bottom neighbor
- (i, j+1): top neighbor

### 3.3 Boundary Cell Convention

Following GPU Gems approach:
- Reserve **one-cell perimeter** for boundary values
- Interior domain: i ∈ [1, N-2], j ∈ [1, N-2]
- Boundary cells: i=0, i=N-1, j=0, j=N-1

**Obstacle Cells**: Any interior cell marked as obstacle becomes a "local boundary"

---

## 4. Finite Difference Operators

### 4.1 Gradient

**Continuous**:
```
∇p = (∂p/∂x, ∂p/∂y)
```

**Discrete (Central Difference)**:
```
(∇p)_{i,j} ≈ ((p_{i+1,j} - p_{i-1,j})/(2Δx), (p_{i,j+1} - p_{i,j-1})/(2Δy))
```

For uniform grid (Δx = Δy):
```
(∇p)_{i,j} = (p_{i+1,j} - p_{i-1,j}, p_{i,j+1} - p_{i,j-1}) / (2Δx)
```

### 4.2 Divergence

**Continuous**:
```
∇·u = ∂u_x/∂x + ∂u_y/∂y
```

**Discrete (Central Difference)**:
```
(∇·u)_{i,j} = (u^x_{i+1,j} - u^x_{i-1,j})/(2Δx) + (u^y_{i,j+1} - u^y_{i,j-1})/(2Δy)
```

For uniform grid:
```
(∇·u)_{i,j} = ((u^x_{i+1,j} - u^x_{i-1,j}) + (u^y_{i,j+1} - u^y_{i,j-1})) / (2Δx)
```

**In GLSL** (from GPU Gems):
```glsl
float halfrdx = 0.5 / gridScale;
vec2 uR = texture2D(u, coords + vec2(1, 0) * gridScale).xy;
vec2 uL = texture2D(u, coords - vec2(1, 0) * gridScale).xy;
vec2 uT = texture2D(u, coords + vec2(0, 1) * gridScale).xy;
vec2 uB = texture2D(u, coords - vec2(0, 1) * gridScale).xy;

float div = halfrdx * ((uR.x - uL.x) + (uT.y - uB.y));
```

### 4.3 Laplacian

**Continuous**:
```
∇²p = ∂²p/∂x² + ∂²p/∂y²
```

**Discrete (5-Point Stencil)**:
```
(∇²p)_{i,j} = (p_{i+1,j} + p_{i-1,j} + p_{i,j+1} + p_{i,j-1} - 4p_{i,j}) / Δx²
```

---

## 5. Pressure Projection with Obstacles

### 5.1 Pressure Poisson Equation

**Goal**: Find pressure field **p** such that corrected velocity is divergence-free.

Given intermediate velocity **w** (after advection/diffusion/forces):
```
w = u^{n+1} + Δt ∇p

Require: ∇·u^{n+1} = 0

Therefore:
∇·w = Δt ∇·∇p = Δt ∇²p

Poisson equation:
∇²p = (∇·w) / Δt
```

**Discrete Form**:
```
(p_{i+1,j} + p_{i-1,j} + p_{i,j+1} + p_{i,j-1} - 4p_{i,j}) / Δx² = (∇·w)_{i,j} / Δt
```

### 5.2 Jacobi Iteration

Rearrange Poisson equation to iterative form:
```
p^{k+1}_{i,j} = (p^k_{i+1,j} + p^k_{i-1,j} + p^k_{i,j+1} + p^k_{i,j-1} + α b_{i,j}) / β
```

Where:
- α = -(Δx)²
- β = 4
- b_{i,j} = (∇·w)_{i,j}

**Convergence**: After sufficient iterations (20-80), p^k → p (solution to Poisson equation)

### 5.3 Boundary Conditions in Jacobi Iteration

**At Obstacle Cells**:

**Option 1**: Don't solve pressure equation in obstacles
```
if (isObstacle(i, j)) {
    p_{i,j} = 0  // or undefined, don't update
}
```

**Option 2**: Set pressure to average of fluid neighbors (for smoother field)
```
if (isObstacle(i, j)) {
    p_{i,j} = avg(p of fluid neighbors)
}
```

**When Sampling Neighbors**:

If neighbor cell (i+1, j) is an obstacle:
```
Neumann BC: ∂p/∂n = 0
Discrete: p_{i+1,j} = p_{i,j}

So in Jacobi iteration, use current cell's pressure value
```

**Complete Jacobi Iteration with Obstacles**:
```glsl
float pL = samplePressure(coords, vec2(-1, 0), pCenter);
float pR = samplePressure(coords, vec2(1, 0), pCenter);
float pB = samplePressure(coords, vec2(0, -1), pCenter);
float pT = samplePressure(coords, vec2(0, 1), pCenter);

float samplePressure(vec2 coords, vec2 offset, float fallback) {
    vec2 samplePos = coords + offset * gridScale;
    if (isObstacle(samplePos)) {
        return fallback;  // Neumann: ∂p/∂n = 0
    }
    return texture2D(pressure, samplePos).r;
}

if (!isObstacle(coords)) {
    pNew = (pL + pR + pB + pT + alpha * bC) * rBeta;
} else {
    pNew = 0.0;  // Don't solve in obstacles
}
```

---

## 6. Velocity Boundary Conditions

### 6.1 No-Slip Implementation

**Discrete No-Slip at Left Wall (i=0)**:

Boundary is at x = 0 (between cells i=0 and i=1).
Velocity at boundary should be zero:
```
(u_{0,j} + u_{1,j}) / 2 = 0

Therefore: u_{0,j} = -u_{1,j}
```

**Generalized for Any Boundary**:
```
u_{obstacle} = -u_{fluid}  (reflection across boundary)
```

### 6.2 Application in Divergence Computation

When computing divergence at cell (i, j), if left neighbor (i-1, j) is obstacle:

**Standard Divergence**:
```
(∇·u)_{i,j} = (u^x_{i+1,j} - u^x_{i-1,j}) / (2Δx) + ...
```

**With Obstacle at i-1**:
```
u^x_{i-1,j} = -u^x_{i,j}  (no-slip)

(∇·u)_{i,j} = (u^x_{i+1,j} - (-u^x_{i,j})) / (2Δx) + ...
            = (u^x_{i+1,j} + u^x_{i,j}) / (2Δx) + ...
```

**In GLSL**:
```glsl
vec2 sampleVelocity(vec2 coords, vec2 offset) {
    vec2 samplePos = coords + offset * gridScale;
    if (isObstacle(samplePos)) {
        // No-slip: reflected velocity
        return -texture2D(velocity, coords).xy;
    }
    return texture2D(velocity, samplePos).xy;
}

vec2 uL = sampleVelocity(coords, vec2(-1, 0));
vec2 uR = sampleVelocity(coords, vec2(1, 0));
// ...
float div = halfrdx * ((uR.x - uL.x) + (uT.y - uB.y));
```

### 6.3 Application inGradient Subtraction

After solving pressure, update velocity:
```
u^{n+1} = w - Δt ∇p
```

**In Obstacle Cells**:
```
u^{n+1}_{obstacle} = 0  (enforce no-slip directly)
```

**In GLSL**:
```glsl
vec2 uNew = texture2D(w, coords).xy;

if (isObstacle(coords)) {
    uNew = vec2(0.0, 0.0);  // No velocity in obstacles
} else {
    float pL = texture2D(pressure, coords - vec2(gridScale, 0)).r;
    float pR = texture2D(pressure, coords + vec2(gridScale, 0)).r;
    float pB = texture2D(pressure, coords - vec2(0, gridScale)).r;
    float pT = texture2D(pressure, coords + vec2(0, gridScale)).r;
    
    vec2 grad = vec2(pR - pL, pT - pB) * 0.5 * rdx;
    uNew -= dt * grad;
}
```

---

## 7. Advection with Obstacles

### 7.1 Semi-Lagrangian Advection

**Algorithm**:
1. Trace particle backward in time: x' = x - Δt·u(x)
2. Interpolate quantity at x'
3. Assign to current cell x

**Issue with Obstacles**:
- Traced position x' might land inside obstacle
- Can't interpolate from obstacle cells (they have no valid fluid velocity)

### 7.2 Boundary Clamping

**Solution**: Clamp traced position to remain in fluid domain

```
x' = x - Δt·u(x)

if (isObstacle(x')) {
    // Clamp to boundary or use current position
    x' = x  // particle "stops" at wall
}

q(x) = interpolate(q, x')
```

**In GLSL**:
```glsl
vec2 pos = coords - dt * rdx * texture2D(u, coords).xy;

// Check if traced position is in obstacle
if (isObstacle(pos)) {
    pos = coords;  // Stay at current position
}

vec4 advectedValue = texture2D(quantity, pos);  // bilinear interpolation
```

### 7.3 Alternative: Ray Marching to Boundary

More sophisticated approach:
1. Trace ray from x in direction -u
2. If ray hits obstacle, stop at obstacle boundary
3. Interpolate from boundary

This provides more accurate "stopping" behavior but is more expensive.

---

## 8. Vorticity Confinement with Obstacles

### 8.1 Vorticity (Curl of Velocity)

**2D Curl (Scalar)**:
```
ω = ∇×u = ∂u_y/∂x - ∂u_x/∂y
```

**Discrete**:
```
ω_{i,j} = (u^y_{i+1,j} - u^y_{i-1,j})/(2Δx) - (u^x_{i,j+1} - u^x_{i,j-1})/(2Δy)
```

### 8.2 Vorticity Confinement Force

**Goal**: Add force to preserve small-scale vortices lost to numerical dissipation

```
f_conf = ε (N × ω) Δx

Where:
N = ∇|ω| / |∇|ω||  (normalized gradient of vorticity magnitude)
ε = confinement strength parameter
```

### 8.3 Obstacle Handling

**Don't Apply in Obstacles**:
```
if (isObstacle(coords)) {
    f_conf = 0
}
```

**When Computing Curl**:
- If neighbor is obstacle, use boundary condition (reflected velocity)
- Similar to divergence computation

---

## 9. Summary of Discrete Boundary Conditions

### 9.1 Quick Reference Table

| Quantity | Fluid Cell | Obstacle Cell | Obstacle Neighbor Sampling |
|----------|-----------|---------------|----------------------------|
| **Velocity** | Solve equation | u = 0 | Reflect: -u_fluid |
| **Pressure** | Solve Poisson | Don't solve (p=0) | Copy: p_fluid (Neumann) |
| **Divergence** | Compute normally | Skip | Use reflected u |
| **Vorticity** | Compute normally | Skip | Use reflected u |

### 9.2 Shader Modifications Checklist

✅ **advection.glsl**:
- Clamp traced position if lands in obstacle

✅ **curl.glsl**:
- Skip obstacle cells
- Reflect velocity when sampling obstacle neighbors

✅ **divergence.glsl**:
- Reflect velocity when sampling obstacle neighbors

✅ **pressure.glsl** (Jacobi):
- Don't solve in obstacle cells
- Copy pressure value when sampling obstacle neighbors (Neumann BC)

✅ **gradientSubtract.glsl**:
- Set velocity to zero in obstacle cells

✅ **vorticity.glsl**:
- Don't apply vorticity force in obstacle cells

✅ **display.glsl**:
- Render obstacles with distinct color

---

## 10. Proofs and Validation

### 10.1 Incompressibility Preservation

**Theorem**: If pressure Poisson equation is solved correctly with proper boundary conditions, the corrected velocity field is divergence-free.

**Proof Sketch**:
```
Given:
1. u^{n+1} = w - Δt∇p
2. ∇²p = ∇·w / Δt  (Poisson equation)

Take divergence of (1):
∇·u^{n+1} = ∇·w - Δt∇·∇p
          = ∇·w - Δt∇²p
          = ∇·w - Δt(∇·w / Δt)  (substitute from 2)
          = 0  ✓

Therefore, u^{n+1} is divergence-free (incompressible).
```

**With Obstacles**:
- This holds as long as boundary conditions are applied correctly
- Neumann BC on pressure ensures no flow through obstacle boundaries
- No-slip BC ensures proper momentum conservation

### 10.2 Conservation of Mass

For incompressible flow, ∇·u = 0 is equivalent to mass conservation.

**Integral Form**:
```
∫∫ (∇·u) dA = ∮ (u·n) ds = 0

Over any closed region not containing obstacles
```

**With Obstacles**:
- At obstacle boundaries, u·n = 0 (no penetration)
- Mass is conserved in fluid domain

### 10.3 Expected Flow Patterns

**Von Kármán Vortex Street**:
- For circular obstacles at moderate Reynolds number
- Alternating vortices shed behind obstacle
- Validates correct momentum transfer and vorticity

**Recirculation Zones**:
- Behind rectangular obstacles, expect low-velocity eddies
- Validates correct pressure distribution

**Stagnation Points**:
- Upstream of obstacle, velocity should approach zero
- High pressure region forms

---

## 11. References

1. **Stam, Jos (1999)**: "Stable Fluids", SIGGRAPH - Original projection method
2. **Harris, Mark J. (2004)**: GPU Gems Chapter 38 - Discrete formulation and boundary implementation
3. **Bridson, Robert (2015)**: "Fluid Simulation for Computer Graphics" - Mathematical foundations
4. **Chorin, Alexandre (1968)**: "Numerical Solution of the Navier-Stokes Equations" - Projection method origin
5. **Fedkiw et al. (2001)**: "Level Set Methods and Fluid-Structure Interaction" - Advanced boundary handling

---

## Conclusion

This document provided:
- ✅ Continuous mathematical formulation of Navier-Stokes with boundaries
- ✅ Discrete finite difference formulations for all operators
- ✅ Detailed derivation of boundary conditions (no-slip, Neumann)
- ✅ Explicit formulas for shader implementation
- ✅ Validation approach (conservation laws, expected flow patterns)

All formulations are ready for translation to GLSL shaders in the implementation phase.

---

*Mathematical foundations derived from academic CFD literature and validated against GPU Gems Chapter 38 implementation.*
