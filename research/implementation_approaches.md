# Implementation Approaches for Obstacle Representation

## Executive Summary

This document evaluates three primary approaches for representing and handling obstacles in our WebGL Navier-Stokes fluid simulation. Based on academic literature, performance considerations, and architectural fit, **Approach A: Binary Obstacle Mask Texture is recommended** for initial implementation.

---

## Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Performance** | High | Must maintain 60 FPS on desktop |
| **Accuracy** | High | Physically correct boundary conditions |
| **Implementation Complexity** | Medium | Development time and code maintainability |
| **Architectural Fit** | High | Integration with existing texture-based system |
| **Extensibility** | Medium | Future support for dynamic/complex obstacles |
| **Memory Usage** | Medium | GPU texture memory footprint |

---

## Approach A: Binary Obstacle Mask Texture

### Description

Store obstacle locations in a single-channel texture where each texel represents whether a grid cell contains an obstacle (1.0) or fluid (0.0). This texture is sampled by all physics shaders to apply appropriate boundary conditions.

### Technical Specification

**Data Structure**:
```javascript
class ObstacleTexture {
    texture: WebGLTexture;     // R8 or R16F format
    resolution: number;         // Match SIM_RESOLUTION
    data: Float32Array;         // CPU-side buffer for generation
}
```

**Texture Format**: 
- R8 (8-bit single channel) for static obstacles
- R16F (16-bit float) if need sub-cell interpolation
- Same resolution as velocity/pressure simulation grid

**Shader Integration**:
```glsl
uniform sampler2D u_obstacleTexture;

bool isObstacle(vec2 coords) {
    return texture2D(u_obstacleTexture, coords).r > 0.5;
}

// In pressure solver:
if (isObstacle(coords)) {
    // Don't solve pressure equation
    pNew = 0.0;
} else {
    // Standard Jacobi iteration
    float pL = sampleWithObstacleBC(coords, vec2(-1, 0));
    // ...
}
```

### Academic Foundation

**References**:
- GPU Gems Chapter 38 (Harris, 2004): Uses obstacle cells in grid
- "Fast Fluid Dynamics on the GPU" (various implementations): Standard obstacle mask approach
- Real-Time Fluid Dynamics for Games (GDC presentations): Proven in production

**Proven in Production**:
- Used in Unity's VFX Graph fluid simulation
- WebGL fluid demos (Pavel Dobryakov, et al.)
- Game engines (Unreal, Unity particle fluids)

### Advantages

✅ **Simple Implementation**
- Single texture lookup per fragment
- Boolean logic easy to understand and debug
- Minimal shader code modification

✅ **Performance**
- O(1) lookup time per fragment
- Minimal memory bandwidth (8-bit texture)
- Cache-friendly with spatial locality
- Estimated impact: ~5-10% performance overhead

✅ **Architectural Fit**
- Perfect match for existing texture-based architecture
- Integrates naturally with FBOManager and TextureManager
- No new rendering paradigms needed

✅ **Composability**
- Easy to combine multiple obstacles using bitwise OR
- Can paint obstacles programmatically or from images
- Simple to add/remove obstacles dynamically

✅ **Debugging**
- Can visualize obstacle texture directly
- Easy to verify correctness
- Clear mapping between cells and obstacles

### Disadvantages

❌ **Grid Resolution Limitations**
- Obstacle boundaries aligned to grid cells
- Staircase artifacts on diagonal/curved boundaries
- Small obstacles (<5 cells) may not flow correctly

❌ **Binary Representation**
- Cell is either fully obstacle or fully fluid
- No sub-cell accuracy
- Sharp transitions

❌ **Visual Quality**
- Pixelated obstacle edges at low simulation resolution
- Requires high DYE_RESOLUTION for smooth visual
- Not ideal for very fine details

### Performance Analysis

**Memory Usage**:
```
SIM_RESOLUTION = 128x128
Texture size = 128 × 128 × 1 byte (R8) = 16 KB
DYE_RESOLUTION = 1024x1024
Texture size = 1024 × 1024 × 1 byte = 1 MB

Total added memory: ~1-1.5 MB
```

**Computational Cost**:
- Per fragment: 1 texture lookup + 1 comparison
- Modern GPUs: negligible (<1 clock cycle per fragment)
- Estimated FPS impact: 5-10% worst case

**Branching Cost**:
- Dynamic branching on `if (isObstacle)` statements
- Modern GPUs handle well with coherent branching
- Fragments in same wavefront usually hit same branch

### Implementation Roadmap

**Phase 1: Core Infrastructure**
1. Create `ObstacleManager` class
2. Generate obstacle mask texture
3. Bind texture to all shaders

**Phase 2: Shader Modifications**
1. Modify `pressure.glsl` - apply Neumann BC
2. Modify `divergence.glsl` - reflect velocity at boundaries
3. Modify `gradient Subtract.glsl` - set velocity to zero in obstacles
4. Modify `advection.glsl` - clamp traced positions
5. Modify `vorticity.glsl` - skip obstacle cells

**Phase 3: Rendering**
1. Modify `display.glsl` - render obstacles with distinct color
2. Add obstacle visualization option

**Estimated Implementation Time**: 30-40 tool calls

---

## Approach B: Signed Distance Field (SDF)

### Description

Store signed distance to nearest obstacle surface in a texture. Distance is negative inside obstacles, positive outside, zero at boundary. Provides sub-cell accuracy and smooth boundaries.

### Technical Specification

**Data Structure**:
```javascript
class ObstacleSDF {
    texture: WebGLTexture;     // R16F or R32F format
    resolution: number;         // Can be higher than SIM_RESOLUTION
    shapes: ObstacleShape[];    // Analytical shapes for SDF generation
}
```

**Texture Format**:
- R16F (16-bit float) for moderate precision
- R32F (32-bit float) for high precision
- Potentially higher resolution than simulation grid

**Shader Integration**:
```glsl
uniform sampler2D u_sdfTexture;

float getSDF(vec2 coords) {
    return texture2D(u_sdfTexture, coords).r;
}

bool isObstacle(vec2 coords) {
    return getSDF(coords) < 0.0;
}

// Can compute normals from gradient
vec2 getObstacleNormal(vec2 coords) {
    float dx = getSDF(coords + vec2(epsilon, 0)) - getSDF(coords - vec2(epsilon, 0));
    float dy = getSDF(coords + vec2(0, epsilon)) - getSDF(coords - vec2(0, epsilon));
    return normalize(vec2(dx, dy));
}
```

### Academic Foundation

**References**:
- Osher & Sethian (1988): "Fronts Propagating with Curvature-Dependent Speed" - original level set method
- Bridson (2015): "Fluid Simulation for Computer Graphics" - Chapter on rigid bodies with SDFs
- Columbia University (2023): "Fluid Simulation with SDFs" - neural SDF approach
- Multiple papers on SDF-based collision detection in CFD

**Use in CFD**:
- Immersed boundary methods with SDFs
- Level set methods for free surfaces
- Sub-grid obstacle representation

### Advantages

✅ **Smooth Boundaries**
- Sub-pixel accuracy for obstacle edges
- No staircase artifacts
- Beautiful at any resolution

✅ **Sub-Cell Accuracy**
- Can represent features smaller than grid spacing
- Smooth flow around curved obstacles
- Better physical accuracy near boundaries

✅ **Normal Computation**
- Can compute exact surface normals via gradient
- Useful for advanced boundary conditions (reflection, friction)
- Enables sophisticated wall models

✅ **Analytical Shapes**
- Can generate SDF for circles, rectangles analytically
- Fast generation for simple shapes
- Composable via min/max operations

### Disadvantages

❌ **Complexity**
- SDF generation algorithm needed
- More complex shader logic
- Harder to debug
- Not as widely documented for real-time fluids

❌ **Generation Cost**
- CPU-side SDF generation can be expensive
- Jump flooding algorithm for arbitrary shapes: O(n log n)
- GPU-side generation adds complexity

❌ **Memory Usage**
- Requires 16 or 32-bit float (vs 8-bit for mask)
- Higher resolution for accurate gradients
- 4-8x more memory than binary mask

❌ **Performance**
- Gradient computation requires additional texture samples
- More arithmetic operations per fragment
- Estimated 10-20% FPS impact

### Performance Analysis

**Memory Usage**:
```
SIM_RESOLUTION = 128x128
SDF texture = 256x256 (2x for gradient quality)
Size = 256 × 256 × 2 bytes (R16F) = 128 KB

or for R32F:
Size = 256 × 256 × 4 bytes = 256 KB

Total added memory: ~128-256 KB (vs 16 KB for mask)
```

**Computational Cost**:
- Per fragment: 1-5 texture lookups (for normals)
- Additional arithmetic for interpolation
- Estimated FPS impact: 10-20%

### Implementation Roadmap

**Phase 1: SDF Generation**
1. Implement CPU-side SDF generation for simple shapes
2. Consider GPU jump flooding algorithm for complex shapes
3. Create ObstacleSDFManager

**Phase 2: Shader Modifications**
1. Add SDF sampling utilities
2. Modify all physics shaders with SDF-based checks
3. Implement normal-based boundary conditions

**Phase 3: Advanced Features**
1. Sub-cell interpolation
2. Smooth obstacle-fluid interface

**Estimated Implementation Time**: 60-80 tool calls

---

## Approach C: Hybrid Mask + SDF (Future Enhancement)

### Description

Use binary mask for performance-critical decisions and SDF for visual/accuracy enhancements. Store both in a 2-channel texture (RG format).

### Technical Specification

**Data Structure**:
```javascript
class HybridObstacle {
    texture: WebGLTexture;     // RG16F or RG8 format
    // R channel: binary mask (0 or 1)
    // G channel: signed distance field
}
```

**Shader Integration**:
```glsl
uniform sampler2D u_obstacleTexture;

bool isObstacle(vec2 coords) {
    return texture2D(u_obstacleTexture, coords).r > 0.5;  // fast binary
}

float getObstacleSDF(vec2 coords) {
    return texture2D(u_obstacleTexture, coords).g;  // smooth distance
}
```

### Advantages

✅ **Best of Both Worlds**
- Fast binary decisions for physics
- Smooth boundaries for rendering
- Optimal performance with good quality

✅ **Flexible**
- Can use mask for coarse checks
- Use SDF for fine details
- Adaptive quality based on location

### Disadvantages

❌ **Most Complex**
- Requires both generation systems
- Larger implementation effort
- Hardest to maintain

❌ **Memory**
- 2 channels vs 1
- Double the memory of simple mask

### Implementation Roadmap

**Not Recommended for Initial Implementation**
- Should be considered as Phase 2 enhancement
- After both mask and SDF are proven separately

---

## Comparison Matrix

| Criterion | Mask Texture | SDF | Hybrid |
|-----------|--------------|-----|--------|
| **Performance** | ⭐⭐⭐⭐⭐ (95% speed) | ⭐⭐⭐⭐ (85% speed) | ⭐⭐⭐⭐ (90% speed) |
| **Accuracy** | ⭐⭐⭐ (grid-aligned) | ⭐⭐⭐⭐⭐ (sub-cell) | ⭐⭐⭐⭐ |
| **Implementation Complexity** | ⭐⭐⭐⭐⭐ (simple) | ⭐⭐ (complex) | ⭐⭐ (very complex) |
| **Architectural Fit** | ⭐⭐⭐⭐⭐ (perfect) | ⭐⭐⭐⭐ (good) | ⭐⭐⭐⭐ (good) |
| **Visual Quality** | ⭐⭐⭐ (pixelated) | ⭐⭐⭐⭐⭐ (smooth) | ⭐⭐⭐⭐⭐ (smooth) |
| **Memory Usage** | ⭐⭐⭐⭐⭐ (16 KB) | ⭐⭐⭐ (128-256 KB) | ⭐⭐⭐ (32-256 KB) |
| **Debugging Ease** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Academic Support** | ⭐⭐⭐⭐⭐ (proven) | ⭐⭐⭐⭐ (established) | ⭐⭐⭐ (novel) |

---

## Recommendation

### ✅ Recommended: Approach A - Binary Obstacle Mask Texture

**Justification**:

1. **Proven Approach**: Used in GPU Gems Chapter 38 and countless real-time fluid implementations
2. **Perfect Fit**: Aligns with existing texture-based architecture
3. **Simplicity**: 30-40 tool calls vs 60-80 for SDF
4. **Performance**: Minimal overhead (5-10% vs 10-20% for SDF)
5. **Debugging**: Easy to visualize and verify correctness
6. **Incremental Path**: Can enhance with SDF later if needed

**For Our Use Case**:
- Static obstacles (no need for dynamic SDF regeneration)
- Real-time requirement (performance critical)
- Educational purpose (simpler to explain)
- First implementation (lower risk)

### Phase 2 Consideration: Approach B (SDF)

**When to Revisit**:
- User requests smoother obstacle boundaries
- After mask approach is fully validated
- If implementing dynamic/moving obstacles
- Performance budget allows (still hitting 60 FPS with headroom)

---

## Implementation Decision Tree

```
START
  |
  ├─ Need sub-cell accuracy? 
  |    ├─ YES ➜ Consider SDF (Approach B)
  |    └─ NO  ➜ Mask Texture (Approach A) ✅
  |
  ├─ Complex/curved obstacles?
  |    ├─ YES ➜ SDF provides better results
  |    └─ NO  ➜ Mask is sufficient ✅
  |
  ├─ Performance critical (must hit 60 FPS)?
  |    ├─ YES ➜ Mask Texture (Approach A) ✅
  |    └─ NO  ➜ SDF acceptable
  |
  └─ Development time constrained?
       ├─ YES ➜ Mask Texture (Approach A) ✅
       └─ NO  ➜ Can invest in SDF
```

**Result**: All paths for our current requirements lead to **Mask Texture (Approach A)**

---

## Next Steps

1. Proceed with Binary Obstacle Mask Texture (Approach A)
2. Design `ObstacleManager` class (Phase 3: Architecture)
3. Plan shader modifications (Phase 3: Architecture)
4. Create detailed implementation plan (Phase 4)

---

*This document evaluated three approaches using academic references, performance analysis, and architectural considerations. The recommended approach balances correctness, performance, and implementation complexity.*
