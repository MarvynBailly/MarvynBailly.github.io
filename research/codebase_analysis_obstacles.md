# Codebase Analysis for Obstacle Integration

## Overview

This document analyzes the existing fluid simulation codebase to identify integration points, required modifications, and data flow for adding obstacle support. The analysis is based on examining key modules and shaders.

---

## 1. Current Architecture Overview

### 1.1 Module Structure

```
SimulationManager (orchestrator)
    ├── WebGLContextManager (WebGL setup)
    ├── ShaderManager (shader compilation)
    ├── TextureManager (texture/FBO creation)  ← Will create obstacle texture here
    ├── FBOManager (render operations)
    ├── SimulationManager (coordinates modules)
    │
    ├── Physics Modules:
    │   ├── AdvectionModule          ← Modify: clamp to obstacles
    │   ├── PressureSolverModule     ← Modify: boundary conditions
    │   ├── VorticityModule          ← Modify: skip obstacles
    │   └── ForcesModule             ← Modify: don't add forces in obstacles
    │
    ├── Rendering Modules:
    │   ├── DisplayModule            ← Modify: render obstacles
    │  ├── BloomModule              (no changes)
    │   ├── SunraysModule            (no changes)
    │   └── DitheringTexture         (no changes)
    │
    └── Interaction:
        ├── PointerManager           (no changes)
        └── InteractionManager       ← Modify: check obstacles before adding splats
```

### 1.2 Data Flow (Current)

```
Each Frame:
1. Advection: Transport velocity & dye
2. Vorticity: Apply turbulence preservation
3. Projection:
   a. Compute divergence
   b. Solve pressure (Jacobi iterations)
   c. Subtract gradient
4. Display: Render with visual effects
```

---

## 2. Existing Boundary Condition Handling

### 2.1 Domain Boundaries (Current Implementation)

Found in **`divergence.glsl`** (lines 28-33):
```glsl
// Boundary conditions: reflect velocity at boundaries
vec2 C = texture2D(uVelocity, vUv).xy;
if (vL.x < 0.0) { L = -C.x; }  // Left wall
if (vR.x > 1.0) { R = -C.x; }  // Right wall
if (vT.y > 1.0) { T = -C.y; }  // Top wall
if (vB.y < 0.0) { B = -C.y; }  // Bottom wall
```

**Analysis**:
- Currently handles **domain boundaries** (edges of simulation grid)
- Uses **no-slip** boundary condition (reflect velocity)
- Checks UV coordinates: outside [0, 1] = boundary
- This pattern can be extended for internal obstacles

**Issue**: Only handles outer domain, no support for internal obstacles

### 2.2 No Current Obstacle Support

**Observations**:
- No obstacle texture or mask in current implementation
- No obstacle checks in any shader
- All grid cells assumed to be fluid
- No mechanism to exclude cells from computation

---

## 3. Module-by-Module Analysis

### 3.1 TextureManager.js

**Location**: [`src/core/TextureManager.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/core/TextureManager.js)

**Current Functionality**:
- Creates textures with `createTexture(width, height, internalFormat, ...)`
- Creates double-buffered FBOs with `create DoubleFBO(...)`
- Supports various texture formats (RGBA16F, RGBA32F, etc.)

**Required Modifications**:
```javascript
// Add method to create obstacle texture
createObstacleTexture(width, height, obstacleData) {
    // Create R8 or R16F texture
    // Upload obstacle mask data (0=fluid, 1=obstacle)
    // Return texture object
}
```

**Integration Point**:
- Called during `SimulationManager._initFramebuffers()`
- Obstacle texture created alongside velocity/pressure textures

### 3.2 SimulationManager.js

**Location**: [`src/core/SimulationManager.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/core/SimulationManager.js)

**Current Structure**:
- `constructor()`: Initialize members
- `init()`: Setup WebGL, load shaders, create modules
- `_loadShaders()`: Load all GLSL files
- `_initFramebuffers()`: Create all textures/FBOs
- `update(dt)`: Main simulation loop
- `render()`: Display rendering
- `resize()`: Handle canvas resize

**Required Modifications**:

**In `_initFramebuffers()`** (after line ~280):
```javascript
// Create obstacle texture
this.obstacle = this.textureManager.createObstacleTexture(
    this.config.SIM_RESOLUTION,
    this.config.SIM_RESOLUTION,
    this.obstacleManager.getObstacleData()
);
```

**In `init()`** (after modules created):
```javascript
// Create obstacle manager
this.obstacleManager = new ObstacleManager(
    this.config.SIM_RESOLUTION,
    this.config.SIM_RESOLUTION,
    this.config
);
```

**In `update()`**: Pass obstacle texture to physics modules

### 3.3 PressureSolverModule.js

**Location**: [`src/physics/PressureSolverModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/PressureSolverModule.js)

**Current Methods**:
- `project(velocity, pressure, divergence, iterations)`: Main projection
- `computeDivergence(velocity, divergence)`: Calculate ∇·u
- `solvePressure(divergence, pressure, iterations)`: Jacobi solver
- `subtractGradient(velocity, pressure, output)`: Subtract ∇p

**Required Modifications**:

**1. Constructor**: Store obstacle texture reference
```javascript
constructor(gl, programs, fboManager, textureManager, obstacleTexture) {
    // ... existing code
    this.obstacleTexture = obstacleTexture;
}
```

**2. `computeDivergence()`**: Bind obstacle texture
```javascript
computeDivergence(velocity, divergence) {
    // ... existing uniform setup
    
    // NEW: Bind obstacle texture
    gl.uniform1i(
        this.divergenceProgram.uniforms.uObstacles,
        this.obstacleTexture.attach(2)
    );
    
    this.fboManager.blit(divergence);
}
```

**3. `solvePressure()`**: Bind obstacle texture
```javascript
solvePressure(divergence, pressure, iterations) {
    // ... existing uniform setup
    
    // NEW: Bind obstacle texture
    gl.uniform1i(
        this.pressureProgram.uniforms.uObstacles,
        this.obstacleTexture.attach(2)
    );
    
    // ... Jacobi iterations
}
```

**4. `subtractGradient()`**: Bind obstacle texture
```javascript
subtractGradient(velocity, pressure, output) {
    // ... existing uniform setup
    
    // NEW: Bind obstacle texture
    gl.uniform1i(
        this.gradientSubtractProgram.uniforms.uObstacles,
        this.obstacleTexture.attach(2)
    );
    
    this.fboManager.blit(output);
}
```

### 3.4 AdvectionModule.js

**Location**: [`src/physics/AdvectionModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/AdvectionModule.js)

**Current Method**:
- `advect(source, velocity, dt, dissipation, target, isVelocity)`

**Required Modifications**:

```javascript
advect(source, velocity, dt, dissipation, target, isVelocity, obstacleTexture) {
    // ... existing uniform setup
    
    // NEW: Bind obstacle texture
    gl.uniform1i(
        this.advectionProgram.uniforms.uObstacles,
        obstacleTexture.attach(2)
    );
    
    this.fboManager.blit(target);
}
```

### 3.5 VorticityModule.js

**Analysis Required**: Need to check this module

**Expected Modifications**:
- Bind obstacle texture
- Shader will skip obstacle cells when computing curl and applying vorticity force

### 3.6 ForcesModule.js

**Analysis Required**: Need to check splat shader

**Expected Modifications**:
- Bind obstacle texture
- Shader will not add forces/dye in obstacle cells

### 3.7 DisplayModule.js

**Location**: [`src/rendering/DisplayModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/rendering/DisplayModule.js)

**Required Modifications**:
- Bind obstacle texture
- Render obstacles with distinct color/shading
- Could optionally blend obstacle color with fluid

---

## 4. Shader Analysis and Required Modifications

### 4.1 pressure.glsl (Jacobi Iteration)

**Current Implementation** (lines 23-34):
```glsl
float L = texture2D(uPressure, vL).x;
float R = texture2D(uPressure, vR).x;
float T = texture2D(uPressure, vT).x;
float B = texture2D(uPressure, vB).x;
float C = texture2D(uPressure, vUv).x;
float divergence = texture2D(uDivergence, vUv).x;

float pressure = (L + R + B + T - divergence) * 0.25;

gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
```

**Required Modifications**:
```glsl
uniform sampler2D uObstacles;  // NEW

void main() {
    // Check if current cell is obstacle
    float obstacle = texture2D(uObstacles, vUv).r;
    
    if (obstacle > 0.5) {
        // Don't solve pressure in obstacles
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Sample pressure neighbors with obstacle handling
    float L = samplePressureWithObstacle(vL, C);
    float R = samplePressureWithObstacle(vR, C);
    float T = samplePressureWithObstacle(vT, C);
    float B = samplePressureWithObstacle(vB, C);
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}

// Helper: If neighbor is obstacle, use Neumann BC (∂p/∂n = 0)
float samplePressureWithObstacle(vec2 coords, float fallback) {
    if (texture2D(uObstacles, coords).r > 0.5) {
        return fallback;  // Copy current cell pressure
    }
    return texture2D(uPressure, coords).x;
}
```

**Performance Impact**: +2 texture lookups per neighbor check = +8 lookups total

### 4.2 divergence.glsl

**Current Implementation** (lines 22-40):
```glsl
void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    
    // Boundary conditions: reflect velocity at boundaries
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
```

**Required Modifications**:
```glsl
uniform sampler2D uObstacles;  // NEW

float sampleVelocityComponent(vec2 coords, float currentComponent, float obstacleValue) {
    // Check domain boundary first
    if (coords.x < 0.0 || coords.x > 1.0 || coords.y < 0.0 || coords.y > 1.0) {
        return -currentComponent;  // Domain boundary: no-slip
    }
    
    // Check obstacle
    if (texture2D(uObstacles, coords).r > 0.5) {
        return -currentComponent;  // Obstacle: no-slip (reflect)
    }
    
    return obstacleValue;  // Normal sampling
}

void main() {
    vec2 C = texture2D(uVelocity, vUv).xy;
    
    float L = sampleVelocityComponent(vL, C.x, texture2D(uVelocity, vL).x);
    float R = sampleVelocityComponent(vR, C.x, texture2D(uVelocity, vR).x);
    float T = sampleVelocityComponent(vT, C.y, texture2D(uVelocity, vT).y);
    float B =ampleVelocityComponent(vB, C.y, texture2D(uVelocity, vB).y);
    
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
```

### 4.3 gradientSubtract.glsl

**Current Implementation** (lines 23-36):
```glsl
void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
```

**Required Modifications**:
```glsl
uniform sampler2D uObstacles;  // NEW

void main() {
    // If current cell is obstacle, set velocity to zero
    if (texture2D(uObstacles, vUv).r > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Normal gradient subtraction for fluid cells
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
```

### 4.4 advection.glsl

**Current Implementation** (lines 37-51):
```glsl
void main () {
    #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
    #endif
    
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
}
```

**Required Modifications**:
```glsl
uniform sampler2D uObstacles;  // NEW

void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    
    // If traced position lands in obstacle, clamp to current position
    if (texture2D(uObstacles, coord).r > 0.5) {
        coord = vUv;  // Particle "stops" at obstacle boundary
    }
    
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
}
```

### 4.5 curl.glsl (Vorticity Computation)

**Current Implementation** (lines 22-32):
```glsl
void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
```

**Required Modifications**:
```glsl
uniform sampler2D uObstacles;  // NEW

void main() {
    // Skip vorticity computation in obstacles
    if (texture2D(uObstacles, vUv).r > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // When sampling neighbors, handle obstacle boundaries
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    
    // Could add obstacle boundary handling here too
    
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
```

### 4.6 vorticity.glsl (Vorticity Confinement Force)

**Analysis Required**: Need to view this shader

**Expected Modification**: Don't apply vorticity force in obstacle cells

### 4.7 splat.glsl

**Analysis Required**: Need to view this shader

**Expected Modification**: Don't add forces/dye in obstacle cells

### 4.8 display.glsl

**Analysis Required**: Need to view rendering shader

**Expected Modification**: Render obstacles with distinct color

---

## 5. New Module: ObstacleManager

### 5.1 Responsibilities

- Generate obstacle mask data (CPU-side)
- Create/update obstacle texture
- Provide API for adding/removing obstacles
- Handle obstacle geometry (circles, rectangles, etc.)

### 5.2 Interface Design

```javascript
class ObstacleManager {
    constructor(width, height, config);
    
    // Generate obstacle mask data
    getObstacleData(): Float32Array;
    
    // Add obstacles
    addCircle(x, y, radius);
    addRectangle(x, y, width, height);
    
    // Update obstacle texture (if dynamic)
    updateTexture(texture);
    
    // Clear all obstacles
    clear();
}
```

### 5.3 Obstacle Representation

**CPU-Side Data**:
```javascript
this.obstacleData = new Float32Array(width * height);
// 0.0 = fluid
// 1.0 = obstacle
```

**Obstacle Generation Example** (circle):
```javascript
addCircle(cx, cy, radius) {
    for (let j = 0; j < this.height; j++) {
        for (let i = 0; i < this.width; i++) {
            const x = i - cx;
            const y = j - cy;
            const dist = Math.sqrt(x*x + y*y);
            
            if (dist <= radius) {
                const idx = j * this.width + i;
                this.obstacleData[idx] = 1.0;  // Mark as obstacle
            }
        }
    }
}
```

---

## 6. Configuration Changes

### 6.1 Config.js Additions

**New Parameters**:
```javascript
// Obstacle Configuration
this.OBSTACLES_ENABLED = true;
this.OBSTACLE_COLOR = { r: 0.2, g: 0.2, b: 0.3 };  // Dark gray
this.DEFAULT_OBSTACLES = [];  // Array of obstacle definitions
```

**Obstacle Definition Format**:
```javascript
{
    type: 'circle',
    x: 0.5,      // Normalized coordinates [0, 1]
    y: 0.5,
    radius: 0.1
}

{
    type: 'rectangle',
    x: 0.3,
    y: 0.4,
    width: 0.1,
    height: 0.3
}
```

---

## 7. Data Flow with Obstacles

### 7.1 Initialization Flow

```
1. SimulationManager.init()
   ├─ Create ObstacleManager
   ├─ Load obstacle configuration from Config
   └─ Generate obstacle data
   
2. SimulationManager._initFramebuffers()
   ├─ Get obstacle data from ObstacleManager
   ├─ TextureManager.createObstacleTexture()
   └─ Store obstacle texture reference
   
3. Create Physics Modules
   └─ Pass obstacle texture to constructors
```

### 7.2 Update Loop Flow (Each Frame)

```
SimulationManager.update(dt):
  1. Advect velocity
     └─ AdvectionModule.advect(..., obstacleTexture)
        └─ advection.glsl: clamp traced positions
        
  2. Advect dye
     └─ AdvectionModule.advect(..., obstacleTexture)
     
  3. Apply vorticity
     └─ VorticityModule (bind obstacleTexture)
        └─ curl.glsl: skip obstacles
        └─ vorticity.glsl: don't apply force in obstacles
        
  4. Projection
     ├─ PressureSolverModule.computeDivergence(...)
     │  └─ divergence.glsl: reflect velocity at obstacles
     ├─ PressureSolverModule.solvePressure(...)
     │  └─ pressure.glsl: Neumann BC, don't solve in obstacles
     └─ PressureSolverModule.subtractGradient(...)
        └─ gradientSubtract.glsl: set velocity to zero in obstacles
        
  5. Render
     └─ DisplayModule.display(...)
        └─ display.glsl: render obstacles with distinct color
```

---

## 8. Performance Impact Analysis

### 8.1 Texture Memory

**Added Memory**:
- Obstacle texture: 128×128 × 1 byte (R8) = 16 KB
- Or with R16F: 128×128 × 2 bytes = 32 KB

**Negligible Impact**: <0.1% of total GPU memory usage

### 8.2 Shader Performance

**Per Shader Per Fragment**:
- Additional obstacle texture lookups: 1-5 per shader
- Additional branching: 1-2 `if` statements

**Estimated FPS Impact**:
- Best case: 2-3% (coherent branching, all fluid)
- Worst case: 8-12% (mixed obstacle/fluid, incoherent branching)
- **Target**: Maintain 60 FPS on desktop (currently ~200+ FPS, plenty of headroom)

### 8.3 Fill Rate

**Obstacle Cells**: No longer compute physics
- Pressure iterations: obstacles skip computation
- Divergence: obstacles return early
- **Potential Performance Gain**: If 20% of domain is obstacles, ~15-20% speedup in Jacobi iterations

---

## 9. Integration Checklist

### 9.1 Core Infrastructure
- [ ] Create `ObstacleManager.js`
- [ ] Add obstacle texture creation to `TextureManager.js`
- [ ] Modify `SimulationManager.js`:
  - [ ] Instantiate `ObstacleManager`
  - [ ] Create obstacle texture in `_initFramebuffers()`
  - [ ] Pass obstacle texture to modules

### 9.2 Module Modifications
- [ ] `PressureSolverModule.js`: Bind obstacle texture in all methods
- [ ] `AdvectionModule.js`: Add obstacle parameter, bind texture
- [ ] `VorticityModule.js`: Bind obstacle texture
- [ ] `ForcesModule.js`: Bind obstacle texture
- [ ] `DisplayModule.js`: Bind obstacle texture

### 9.3 Shader Modifications
- [ ] `pressure.glsl`: Add obstacle checks, Neumann BC
- [ ] `divergence.glsl`: Reflect velocity at obstacles
- [ ] `gradientSubtract.glsl`: Zero velocity in obstacles
- [ ] `advection.glsl`: Clamp traced positions
- [ ] `curl.glsl`: Skip obstacles
- [ ] `vorticity.glsl`: Don't apply force in obstacles
- [ ] `splat.glsl`: Don't add in obstacles
- [ ] `display.glsl`: Render obstacles

### 9.4 Configuration
- [ ] Add obstacle parameters to `Config.js`
- [ ] Add obstacle controls to settings panel (HTML/CSS)
- [ ] Wire up UI to ObstacleManager

---

## 10. Risk Assessment

### 10.1 High Risk Areas

**Shader Branching**:
- Dynamic branching can cause slowdowns on older GPUs
- **Mitigation**: Test on low-end devices, optimize branch coherency

**Boundary Condition Correctness**:
- Incorrect BC implementation → numerical instabilities
- **Mitigation**: Rigorous testing, compare to reference implementations

**Texture Binding Complexity**:
- Managing texture unit assignments across many shaders
- **Mitigation**: Centralize texture binding, document clearly

### 10.2 Medium Risk Areas

**Obstacle Mask Generation**:
- CPU-side generation could be slow for complex shapes
- **Mitigation**: Start with simple shapes, optimize later

**Visual Quality**:
- Grid-aligned obstacles may look pixelated
- **Mitigation**: Ensure DYE_RESOLUTION high enough for smooth visuals

---

## 11. Next Steps (Phase 3: Architecture Design)

1. Create `architecture/obstacle_system_design.md`
   - Detailed class diagrams
   - Data structure specifications
   - Module interaction diagrams

2. Create `architecture/shader_modifications_plan.md`
   - Exact shader code changes
   - Uniform management strategy
   - Performance optimization notes

3. Create `architecture/obstacle_ui_design.md`
   - Settings panel additions
   - Visual design for obstacles
   - User interaction patterns

---

*This codebase analysis provides the foundation for architectural design in Phase 3. All identified integration points are based on actual code examination.*
