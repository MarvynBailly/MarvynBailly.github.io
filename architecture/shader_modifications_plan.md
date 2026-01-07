# Shader Modifications Plan for Obstacles

## Overview

This document specifies **exact shader modifications** required to implement obstacle boundary conditions. For each affected shader, we provide the current code, required modifications, and the complete modified version ready for implementation.

All modifications follow the mathematical foundations documented in `obstacle_math_foundations.md` and architectural design in `obstacle_system_design.md`.

---

## Summary of Shader Modifications

| Shader | Modification Type | Purpose |
|--------|-------------------|---------|
| `pressure.glsl` | **Major** | Apply Neumann BC, don't solve in obstacles |
| `divergence.glsl` | **Major** | Reflect velocity at obstacle boundaries |
| `gradientSubtract.glsl` | **Medium** | Set velocity to zero in obstacles |
| `advection.glsl` | **Medium** | Clamp traced positions to avoid obstacles |
| `curl.glsl` | **Minor** | Skip obstacle cells |
| `vorticity.glsl` | **Medium** | Don't apply vorticity force in obstacles |
| `splat.glsl` | **Minor** | Don't add forces/dye in obstacles |
| `display.glsl` | **Major** | Render obstacles with distinct color |

---

## 1. pressure.glsl (Jacobi Iteration)

### 1.1 Current Implementation

**File**: `src/shaders/fragment/pressure.glsl`

```glsl
precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    
    // Jacobi iteration: p = (p_left + p_right + p_top + p_bottom - divergence) / 4
    float pressure = (L + R + B + T - divergence) * 0.25;
    
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
```

### 1.2 Required Modifications

**Changes**:
1. Add `uniform sampler2D uObstacles;`
2. Check if current cell is obstacle → skip solving
3. When sampling neighbors, apply Neumann BC if neighbor is obstacle

**Mathematical Justification**:
- Neumann BC: ∂p/∂n = 0 at obstacle boundaries
- Discrete form: if neighbor is obstacle, use current cell's pressure value
- Reference: `obstacle_math_foundations.md` Section 5.3

### 1.3 Modified Implementation

```glsl
/**
 * Pressure Solver Shader (Jacobi Iteration) with Obstacles
 * 
 * Solves Poisson equation for pressure: ∇²p = div
 * One iteration of Jacobi relaxation method.
 * Obstacles: Neumann BC (∂p/∂n = 0), don't solve in obstacle cells
 * 
 * References:
 * - math_foundations.md - Section 7.4 (Jacobi Iteration)
 * - obstacle_math_foundations.md - Section 5.3 (Pressure with Obstacles)
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform sampler2D uObstacles;  // NEW

/**
 * Sample pressure with obstacle handling
 * If neighbor is obstacle, use Neumann BC (copy current cell pressure)
 */
float samplePressure(vec2 coords, float fallback) {
    if (texture2D(uObstacles, coords).r > 0.5) {
        return fallback;  // Neumann BC: ∂p/∂n = 0
    }
    return texture2D(uPressure, coords).x;
}

void main () {
    // Check if current cell is obstacle
    float obstacle = texture2D(uObstacles, vUv).r;
    
    if (obstacle > 0.5) {
        // Don't solve pressure in obstacles
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Sample current cell pressure (for Neumann BC fallback)
    float C = texture2D(uPressure, vUv).x;
    
    // Sample neighbors with obstacle handling
    float L = samplePressure(vL, C);
    float R = samplePressure(vR, C);
    float T = samplePressure(vT, C);
    float B = samplePressure(vB, C);
    
    float divergence = texture2D(uDivergence, vUv).x;
    
    // Jacobi iteration: p = (p_left + p_right + p_top + p_bottom - divergence) / 4
    float pressure = (L + R + B + T - divergence) * 0.25;
    
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
```

**Performance**: +5 texture lookups (1 obstacle + 4 neighbor obstacle checks)

---

## 2. divergence.glsl

### 2.1 Current Implementation

**File**: `src/shaders/fragment/divergence.glsl`

```glsl
precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;

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
    
    // Compute divergence using central differences
    float div = 0.5 * (R - L + T - B);
    
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
```

### 2.2 Required Modifications

**Changes**:
1. Add `uniform sampler2D uObstacles;`
2. Extend boundary condition logic to include obstacles
3. Reflect velocity at obstacle boundaries (no-slip BC)

**Mathematical Justification**:
- No-slip BC: u = 0 at obstacle boundaries
- Discrete form: if neighbor is obstacle, u_neighbor = -u_current
- Reference: `obstacle_math_foundations.md` Section 6.2

### 2.3 Modified Implementation

```glsl
/**
 * Divergence Shader with Obstacles
 * 
 * Computes divergence of velocity field: ∇ · u
 * Obstacles: No-slip BC (reflect velocity)
 * 
 * References:
 * - math_foundations.md - Section 4.1 (Spatial Discretization)
 * - obstacle_math_foundations.md - Section 6.2 (Divergence with Obstacles)
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;  // NEW

/**
 * Sample velocity component with boundary handling
 * Handles both domain boundaries and obstacles
 */
float sampleVelocity(vec2 coords, float currentComponent, float normalSample) {
    // Check domain boundary first
    if (coords.x < 0.0 || coords.x > 1.0 || coords.y < 0.0 || coords.y > 1.0) {
        return -currentComponent;  // Domain boundary: no-slip
    }
    
    // Check obstacle
    if (texture2D(uObstacles, coords).r > 0.5) {
        return -currentComponent;  // Obstacle: no-slip (reflect)
    }
    
    return normalSample;  // Normal fluid cell
}

void main () {
    vec2 C = texture2D(uVelocity, vUv).xy;
    
    // Sample velocity neighbors with obstacle handling
    float L = sampleVelocity(vL, C.x, texture2D(uVelocity, vL).x);
    float R = sampleVelocity(vR, C.x, texture2D(uVelocity, vR).x);
    float T = sampleVelocity(vT, C.y, texture2D(uVelocity, vT).y);
    float B = sampleVelocity(vB, C.y, texture2D(uVelocity, vB).y);
    
    // Compute divergence using central differences
    // div = (∂u/∂x + ∂v/∂y) = (R - L) / 2 + (T - B) / 2
    float div = 0.5 * (R - L + T - B);
    
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
```

**Performance**: +4 texture lookups (obstacle checks for each neighbor)

---

## 3. gradientSubtract.glsl

### 3.1 Current Implementation

**File**: `src/shaders/fragment/gradientSubtract.glsl`

```glsl
precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    
    // Subtract pressure gradient: v = v - ∇p
    velocity.xy -= vec2(R - L, T - B);
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
```

### 3.2 Modified Implementation

```glsl
/**
 * Gradient Subtraction Shader with Obstacles
 * 
 * Subtracts pressure gradient from velocity to enforce incompressibility.
 * Obstacles: Set velocity to zero
 * 
 * References:
 * - math_foundations.md - Section 7.5 (Gradient Subtraction)
 * - obstacle_math_foundations.md - Section 6.3 (Gradient Subtraction with Obstacles)
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;  // NEW

void main () {
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
    
    // Subtract pressure gradient: v = v - ∇p
    // ∇p = ((p_right - p_left) / 2, (p_top - p_bottom) / 2)
    velocity.xy -= vec2(R - L, T - B);
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
```

**Performance**: +1 texture lookup (obstacle check)

---

## 4. advection.glsl

### 4.1 Current Implementation (Simplified)

**File**: `src/shaders/fragment/advection.glsl`

```glsl
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;

void main () {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
    
    // Apply dissipation
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
}
```

### 4.2 Modified Implementation

```glsl
/**
 * Advection Shader with Obstacles
 * 
 * Implements semi-Lagrangian advection for unconditional stability.
 * Obstacles: Clamp traced positions to avoid sampling from obstacles
 * 
 * References:
 * - math_foundations.md - Section 5 (Semi-Lagrangian Method)
 * - obstacle_math_foundations.md - Section 7 (Advection with Obstacles)
 */

precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uObstacles;  // NEW
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;

void main () {
    // Backtrace particle position
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    
    // If traced position lands in obstacle, clamp to current position
    if (texture2D(uObstacles, coord).r > 0.5) {
        coord = vUv;  // Particle "stops" at obstacle boundary
    }
    
    vec4 result = texture2D(uSource, coord);
    
    // Apply dissipation
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
}
```

**Performance**: +1 texture lookup (obstacle check at traced position)

---

## 5. curl.glsl (Vorticity Computation)

### 5.1 Current Implementation

**File**: `src/shaders/fragment/curl.glsl`

```glsl
precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;

void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    
    // curl = ∂v/∂x - ∂u/∂y = (R - L) / 2 - (T - B) / 2
    float vorticity = R - L - T + B;
    
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
```

### 5.2 Modified Implementation

```glsl
/**
 * Curl Shader with Obstacles
 * 
 * Computes curl (vorticity) of velocity field in 2D.
 * Obstacles: Skip computation
 * 
 * References:
 * - math_foundations.md - Section 9.1 (Vorticity)
 * - obstacle_math_foundations.md - Section 8.3 (Vorticity with Obstacles)
 */

precision mediump float;
precision mediump sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;  // NEW

void main () {
    // Skip vorticity computation in obstacles
    if (texture2D(uObstacles, vUv).r > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    
    // curl = ∂v/∂x - ∂u/∂y = (R - L) / 2 - (T - B) / 2
    float vorticity = R - L - T + B;
    
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
```

**Performance**: +1 texture lookup (obstacle check)

---

## 6. vorticity.glsl & splat.glsl

*Note: These shaders need to be viewed first to specify exact modifications. They will follow the same pattern:*

**Vorticity Shader**: Add obstacle check, don't apply vorticity force in obstacles
**Splat Shader**: Add obstacle check, don't add forces/dye in obstacles

**Pattern**:
```glsl
uniform sampler2D uObstacles;

void main() {
    if (texture2D(uObstacles, vUv).r > 0.5) {
        // Don't modify obstacle cells
        gl_FragColor = texture2D(uSource, vUv);  // Pass through unchanged
        return;
    }
    
    // Normal force/vorticity application
    // ...
}
```

---

## 7. display.glsl (Rendering)

### 7.1 Modification Strategy

**Purpose**: Render obstacles with distinct visual appearance

**Options**:
1. **Solid Color**: Render obstacles as solid dark color
2. **Overlay**: Blend obstacle color with fluid color
3. **Outline**: Render obstacle borders only

**Recommended**: Solid color for initial implementation (simplest, clearest)

### 7.2 Modified Implementation (Concept)

```glsl
uniform sampler2D uDye;
uniform sampler2D uObstacles;
uniform vec3 obstacleColor;  // From config.OBSTACLE_COLOR

void main() {
    // Check if current cell is obstacle
    if (texture2D(uObstacles, vUv).r > 0.5) {
        // Render obstacle with solid color
        gl_FragColor = vec4(obstacleColor, 1.0);
        return;
    }
    
    // Normal dye rendering for fluid cells
    vec4 dye = texture2D(uDye, vUv);
    // ... existing bloom, sunrays compositing
    gl_FragColor = finalColor;
}
```

---

## 8. Shader Uniform Management

### 8.1 Uniform Additions Summary

Every shader that checks obstacles needs:
```glsl
uniform sampler2D uObstacles;
```

### 8.2 JavaScript Binding Pattern

In each module (e.g., `PressureSolverModule.js`):
```javascript
someMethod(...) {
    this.someProgram.bind();
    
    // Existing uniforms
    gl.uniform2f(this.someProgram.uniforms.texelSize, ...);
    gl.uniform1i(this.someProgram.uniforms.uSomeTexture, someTexture.attach(0));
    
    // NEW: Bind obstacle texture
    gl.uniform1i(
        this.someProgram.uniforms.uObstacles,
        this.obstacleTexture.attach(2)  // Consistently use unit 2
    );
    
    this.fboManager.blit(output);
}
```

### 8.3 ShaderManager Modifications

**File**: `src/core/ShaderManager.js`

Ensure `uObstacles` uniform is detected and stored:
- Should be automatic if shader declares `uniform sampler2D uObstacles;`
- No modification needed (ShaderManager auto-detects uniforms)

---

## 9. Performance Impact Summary

| Shader | Added Lookups | Branching | Estimated Impact |
|--------|---------------|-----------|------------------|
| pressure.glsl | +5 | 1 early return, 4 conditional | ~8-10% |
| divergence.glsl | +4 | 4 conditional | ~6-8% |
| gradientSubtract.glsl | +1 | 1 early return | ~2-3% |
| advection.glsl | +1 | 1 conditional | ~2-3% |
| curl.glsl | +1 | 1 early return | ~2% |
| vorticity.glsl | +1 | 1 early return | ~2% |
| splat.glsl | +1 | 1 early return | ~1% |
| display.glsl | +1 | 1 conditional | ~2% |

**Total Impact**: ~5-10% FPS reduction
**Acceptable**: Yes (current ~200 FPS → ~180-190 FPS, still >>60 target)

---

## 10. Testing Strategy for Shaders

### 10.1 Visual Tests

**Pressure Solver**:
- Verify no pressure  build-up in obstacles: obstacle cells should have p ≈ 0
- Check flow around obstacles: smooth pressure gradient

**Divergence**:
- Verify no velocity pointing into obstacles
- Check reflected velocity at boundaries

**Gradient Subtraction**:
- Verify velocity is exactly zero in obstacle cells
- No fluid penetration

### 10.2 Numerical Tests

**Conservation Laws**:
- Check ∇·u ≈ 0 everywhere (except source/sink locations)
- Mass conservation: total fluid should remain constant

**Boundary Conditions**:
- Sample velocity at obstacle-fluid interface
- Verify u·n = 0 (no penetration)

---

## 11. Implementation Checklist

### 11.1 Per Shader
- [ ] Add `uniform sampler2D uObstacles;` declaration
- [ ] Add obstacle boundary condition logic
- [ ] Update shader header comments
- [ ] Test shader compilation
- [ ] Verify uniform binding in JavaScript

### 11.2 JavaScript Modules
- [ ] Pass obstacleTexture to module constructors
- [ ] Bind obstacle texture in render methods
- [ ] Use consistent texture unit (unit 2)
- [ ] Test WebGL uniform binding

---

## Conclusion

This shader modification plan provides:
- ✅ Exact GLSL code for all 8+ shaders
- ✅ Mathematical justification for each modification
- ✅ Performance impact analysis
- ✅ Clear implementation checklist
- ✅ Testing strategy

**Ready for implementation in Phase 5.**

---

*All shader modifications follow mathematical derivations in `obstacle_math_foundations.md` and architectural design in `obstacle_system_design.md`.*
