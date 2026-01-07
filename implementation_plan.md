# Implementation Plan: Adding Internal Wall Obstacles to Fluid Simulation

## User Review Required

> [!WARNING]
> **Browser Compatibility Consideration**
> The obstacle mask texture will use R8 format if available, falling back to RGBA8 (wasting 3 channels). This follows existing texture creation patterns and should work across all supported browsers.

> [!IMPORTANT]
> **No Breaking Changes**
> All changes are additive. The simulation will work identically with or without obstacles enabled via `config.OBSTACLES_ENABLED = true/false`. Disabling obstacles simply skips the boundary condition checks in shaders.

## Proposed Changes

### Research Documents

#### [NEW] [`research/obstacle_boundary_conditions.md`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/research/obstacle_boundary_conditions.md)
Comprehensive research on boundary condition theory, Jos Stam's approach, GPU Gems implementation, and obstacle representation methods (binary mask vs SDF).

#### [NEW] [`research/implementation_approaches.md`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/research/implementation_approaches.md)
Evaluation of 3 approaches (binary mask, SDF, hybrid). **Recommends binary obstacle mask texture** for Phase 1 due to simplicity, performance, and architectural fit.

#### [NEW] [`research/obstacle_math_foundations.md`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/research/obstacle_math_foundations.md)
Mathematical foundations with discrete finite difference formulations for all operators, explicit boundary condition derivations, and shader-ready equations.

#### [NEW] [`research/codebase_analysis_obstacles.md`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/research/codebase_analysis_obstacles.md)
Analysis of existing modules, shaders, data flow, and required modifications with integration checklist.

---

### Architecture Documents

#### [NEW] [`architecture/obstacle_system_design.md`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/architecture/obstacle_system_design.md)
Complete system architecture with data structures, `ObstacleManager` class specification, module interaction sequences, and texture management strategy.

#### [NEW] [`architecture/shader_modifications_plan.md`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/architecture/shader_modifications_plan.md)
**Exact GLSL code** for modifying 8 shaders with mathematical justifications and performance analysis.

#### [NEW] [`architecture/obstacle_ui_design.md`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/architecture/obstacle_ui_design.md)
UI/UX design for settings panel additions, visual design, user interaction patterns, and accessibility considerations.

---

### Core Module: Obstacle Management

#### [NEW] [`src/core/ObstacleManager.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/core/ObstacleManager.js)
**Purpose**: Generate obstacle mask data from obstacle definitions

**API**:
- `constructor(width, height, config)`
- `addCircle(x, y, radius)` - Rasterize circle to mask
- `addRectangle(x, y, width, height)` - Rasterize rectangle to mask
- `getObstacleData()` - Returns Float32Array mask data
- `clear()` - Reset all cells to fluid

**Implementation**: CPU-side rasterization of geometric shapes to binary grid

#### [MODIFY] [`src/core/TextureManager.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/core/TextureManager.js)
Add `createObstacleTexture(width, height, data)` method:
- Creates R8 or RGBA8 texture from Float32Array
- Converts float (0.0/1.0) to uint8 (0/255)
- Uses NEAREST filtering for sharp boundaries
- Returns texture object with `attach()` method

#### [MODIFY] [`src/core/SimulationManager.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/core/SimulationManager.js)
**Changes in `init()`**: Create `ObstacleManager` after loading config  
**Changes in `_initFramebuffers()`**: Create obstacle texture and pass to modules  
**Changes in module constructors**: Pass `obstacleTexture` to all physics/rendering modules

---

###Physics Modules

#### [MODIFY] [`src/physics/PressureSolverModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/PressureSolverModule.js)
**Constructor**: Accept and store `obstacleTexture` parameter  
**All methods** (`computeDivergence`, `solvePressure`, `subtractGradient`): Bind obstacle texture to unit 2 before blit

#### [MODIFY] [`src/physics/AdvectionModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/AdvectionModule.js)
**Constructor**: Accept and store `obstacleTexture`  
**`advect()` method**: Bind obstacle texture to unit 2

#### [MODIFY] [`src/physics/VorticityModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/VorticityModule.js)
**Constructor**: Accept and store `obstacleTexture  
**All vorticity computation methods**: Bind obstacle texture

#### [MODIFY] [`src/physics/ForcesModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/ForcesModule.js)
**Constructor**: Accept and store `obstacleTexture`  
**Splat methods**: Bind obstacle texture to prevent adding forces in obstacles

---

### Shader Modifications

All shaders add: `uniform sampler2D uObstacles;`

#### [MODIFY] [`src/shaders/fragment/pressure.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/pressure.glsl)
- Add `samplePressure()` helper function for Neumann BC
- Skip solving pressure in obstacle cells
- When sampling neighbors, apply ∂p/∂n = 0 if neighbor is obstacle
- **Lines changed**: ~15 (adding uniform, helper function, obstacle checks)

#### [MODIFY] [`src/shaders/fragment/divergence.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/divergence.glsl)
- Add `sampleVelocity()` helper function for no-slip BC
- Extend existing domain boundary logic to include obstacles
- Reflect velocity at obstacle boundaries (u_neighbor = -u_current)
- **Lines changed**: ~20 (refactoring boundary logic, adding obstacle checks)

#### [MODIFY] [`src/shaders/fragment/gradientSubtract.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/gradientSubtract.glsl)
- Check if current cell is obstacle  
- If obstacle, set velocity to zero and early return  
- **Lines changed**: ~5 (adding obstacle check at beginning)

#### [MODIFY] [`src/shaders/fragment/advection.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/advection.glsl)
- After backtracing, check if traced position lands in obstacle  
- If so, clamp to current position (particle stops at wall)  
- **Lines changed**: ~5 (adding obstacle check after coord calculation)

#### [MODIFY] [`src/shaders/fragment/curl.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/curl.glsl)
- Skip vorticity computation in obstacle cells (early return)  
- **Lines changed**: ~5 (adding obstacle check at beginning)

#### [MODIFY] [`src/shaders/fragment/vorticity.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/vorticity.glsl)
- Don't apply vorticity confinement force in obstacle cells  
- **Lines changed**: ~5 (adding obstacle check)

#### [MODIFY] [`src/shaders/fragment/splat.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/splat.glsl)
- Don't add force/dye in obstacle cells  
- **Lines changed**: ~5 (adding obstacle check)

#### [MODIFY] [`src/shaders/fragment/display.glsl`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/display.glsl)
- Add `uniform vec3 uObstacleColor;`  
- Add `uniform bool uShowObstacles;`  
- If cell is obstacle and visibility enabled, render with obstacle color  
- **Lines changed**: ~10 (adding obstacle rendering logic)

---

### Rendering Module

#### [MODIFY] [`src/rendering/DisplayModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/rendering/DisplayModule.js)
**Constructor**: Accept and store `obstacleTexture`  
**Display method**: Bind obstacle texture and pass `uObstacleColor`, `uShowObstacles` uniforms

---

### Configuration System

#### [MODIFY] [`src/config.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/config.js)
Add new configuration fields in constructor:
```javascript
// Obstacle Configuration
this.OBSTACLES_ENABLED = true;
this.SHOW_OBSTACLES = true;
this.OBSTACLE_COLOR = { r: 0.2, g: 0.2, b: 0.3 };  // Dark blue-gray
this.DEFAULT_OBSTACLES = [
    { type: 'circle', x: 0.5, y: 0.5, radius: 0.1 }
];
```

---

### UI Components

#### [MODIFY] [`index.html`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/index.html)
Add new "Obstacles" section in settings panel after "Interaction" section (~line 116):
- Checkbox: Enable/Disable Obstacles
- Checkbox: Show/Hide Obstacles
- Color picker: Obstacle color
- **Lines added**: ~15-20

#### [MODIFY] [`style.css`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/style.css)
Add styles for color picker control:
- `.color-picker-control` styles
- **Lines added**: ~10

#### [MODIFY] [`src/main.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/main.js)
Add event listeners for new obstacle controls:
- Obstacles toggle handler
- Visibility toggle handler
- Color picker handler
- Add `hexToRgb()` utility function
- **Lines added**: ~30

---

## Verification Plan

### Automated Tests

Due to the WebGL nature and lack of existing unit test infrastructure for this specific project, automated testing will be limited. Future work could add Jest tests with WebGL mocking.

**Note**: The `package.json` includes Jest configuration but no tests exist in `src/` currently. Adding full WebGL mock tests is out of scope for Phase 1.

### Manual Verification

#### Test 1: Obstacle Visibility
**Steps**:
1. Start dev server: `npm run dev`
2. Open `http://localhost:5173` in browser
3. **Expected**: See a circular obstacle (dark blue-gray) in center of simulation
4. Drag mouse around obstacle
5. **Expected**: Fluid flows around obstacle, no penetration through it

#### Test 2: Settings Panel - Visibility Toggle
**Steps**:
1. Click "Settings" button
2. Scroll to "Obstacles" section
3. Uncheck "Show Obstacles"
4. **Expected**: Obstacle disappears visually but physics still active (fluid still can't penetrate)
5. Check "Show Obstacles" again
6. **Expected**: Obstacle reappears

#### Test 3: Settings Panel - Color Picker
**Steps**:
1. Open Settings → Obstacles
2. Click color picker, select bright red (#FF0000)
3. **Expected**: Obstacle changes to bright red

#### Test 4: Physics Validation - No Penetration
**Steps**:
1. Drag fast across the obstacle
2. **Expected**: Fluid stops at obstacle boundary, doesn't pass through
3. Observe velocity field near obstacle
4. **Expected**: Velocity is zero inside obstacle cells

#### Test 5: Physics Validation - Vortex Shedding
**Steps**:
1. Add constant force upstream of circular obstacle (drag continuously above obstacle)
2. Observe flow behind obstacle
3. **Expected**: Alternating vortices should form behind obstacle (von Kármán vortex street pattern) if Reynolds number appropriate

#### Test 6: Performance Check
**Steps**:
1. Press 'S' key to show performance stats
2. **Expected**: FPS should remain ≥ 55-60 on desktop (acceptable 5-10% drop from baseline)

#### Test 7: Mobile Compatibility
**Steps**:
1. Open on mobile device or use browser devtools mobile emulation
2. **Expected**: Simulation runs smoothly with adapted resolution
3. Touch interactions work around obstacles

---

## Implementation Notes

- All shader modifications include mathematical justifications in comments referencing research documents
- Obstacle texture uses consistent texture unit 2 across all shaders
- Binary mask approach chosen for Phase 1 simplicity; SDF upgrade possible in Phase 2
- No breaking changes: obstacles can be disabled via config
- Follows existing code patterns and architecture

---

**Estimated Complexity**: Medium-High  
**Estimated Implementation Time**: 40-60 tool calls for full implementation + testing  
**Risk Level**: Low (well-researched, no breaking changes, incremental testing possible)

---

*Implementation plan based on comprehensive research (4 docs), architecture design (3 docs), and codebase analysis. All changes backed by academic CFD literature.*
