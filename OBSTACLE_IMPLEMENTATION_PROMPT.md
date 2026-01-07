# Comprehensive Prompt: Adding Internal Wall Obstacles to Fluid Simulation

## Objective

Add internal wall obstacles to the existing Navier-Stokes fluid simulation that the fluid will realistically interact with and flow around. The implementation must be grounded in computational fluid dynamics (CFD) research, follow best practices, and integrate seamlessly with the existing architecture.

---

## Requirements

### Functional Requirements

1. **Static Obstacles**: Add one or more internal walls/obstacles within the simulation domain
2. **Fluid-Obstacle Interaction**: Fluid must flow around obstacles with realistic behavior
3. **No-Slip Boundary Conditions**: Implement proper boundary conditions at obstacle surfaces
4. **Visual Representation**: Obstacles must be visible in the rendered output
5. **User Control**: Allow users to configure obstacle placement and properties via the settings panel

### Non-Functional Requirements

1. **Performance**: Maintain 60 FPS on desktop with obstacles enabled
2. **Accuracy**: Use physically-based boundary treatment methods from CFD literature
3. **Modularity**: Follow the existing modular architecture
4. **Documentation**: Reference all academic sources and document implementation decisions
5. **Testing**: Create unit tests and visual verification methods

---

## Research Phase Requirements

Before implementation, you must research and document the following:

### 1. Boundary Condition Theory

**Research Questions**:
- How are solid obstacles represented in grid-based Navier-Stokes solvers?
- What are the different types of boundary conditions for obstacles (no-slip, free-slip, no-penetration)?
- How do Jos Stam's "Stable Fluids" and GPU Gems implementations handle obstacles?
- What is the mathematical formulation for no-slip boundary conditions?
- How do boundaries affect the pressure projection step?

**Required Sources**:
- Jos Stam's "Stable Fluids" (SIGGRAPH 1999) - Section on boundary conditions
- GPU Gems Chapter 38 - Obstacle handling on GPU
- Bridson's "Fluid Simulation for Computer Graphics" - Chapter on boundary conditions
- Ronald Fedkiw's papers on level set methods and boundaries (if applicable)
- Academic papers on immersed boundary methods

**Deliverable**: Create `research/obstacle_boundary_conditions.md` documenting:
- Mathematical formulation of boundary conditions
- Different approaches (cell-centered vs face-centered)
- Treatment in advection, diffusion, and pressure steps
- GPU implementation considerations

### 2. Technical Analysis of Current Codebase

**Research Questions**:
- How does the current pressure solver handle domain boundaries?
- Where in the shader pipeline would obstacles be enforced?
- What data structure should represent obstacles (texture, uniform array, etc.)?
- How will obstacles affect each physics module (advection, pressure, vorticity)?
- What shader modifications are needed?

**Required Actions**:
1. Analyze [`src/physics/PressureSolverModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/PressureSolverModule.js) - How is divergence/gradient computed?
2. Analyze [`src/physics/AdvectionModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/physics/AdvectionModule.js) - How is boundary sampling handled?
3. Analyze all relevant GLSL shaders in [`src/shaders/fragment/`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/shaders/fragment/)
4. Review [`src/config.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/config.js) - What config parameters are needed?
5. Review [`src/rendering/DisplayModule.js`](file:///c:/Users/admin/Documents/GitHub/MarvynBailly.github.io/src/rendering/DisplayModule.js) - How to render obstacles?

**Deliverable**: Create `research/codebase_analysis_obstacles.md` documenting:
- Current boundary handling (if any)
- Required modifications to each module
- Data flow diagram showing where obstacles are checked
- Performance impact analysis

### 3. Implementation Approaches

**Research Questions**:
- Should obstacles be represented as a texture (obstacle mask)?
- Should we use cell-centered or face-centered obstacle representation?
- How do we handle obstacle geometry (circles, rectangles, arbitrary shapes)?
- Should we support dynamic (movable) obstacles or only static ones?
- What's the best way to render obstacles visually?

**Required Evaluation**:
Compare at least 3 different approaches:

**Approach A: Binary Obstacle Mask Texture**
- Pros, cons, performance, complexity
- How it integrates with current architecture
- Academic references supporting this approach

**Approach B: Signed Distance Field (SDF)**
- Pros, cons, performance, complexity
- How it integrates with current architecture
- Academic references supporting this approach

**Approach C: [Another approach from research]**
- Pros, cons, performance, complexity
- How it integrates with current architecture
- Academic references supporting this approach

**Deliverable**: Create `research/implementation_approaches.md` with detailed comparison and recommended approach with justification.

### 4. Mathematical Foundations

**Required Documentation**:
- How pressure boundary conditions are modified: ∇p·n = 0 at solid walls
- How velocity is enforced: u = 0 (no-slip) or u·n = 0 (free-slip)
- How divergence computation changes near boundaries
- How gradient subtraction changes near boundaries
- How vorticity confinement is affected by boundaries

**Deliverable**: Create `research/obstacle_math_foundations.md` with:
- Continuous mathematical formulation
- Discretized (finite difference) formulation
- Boundary condition handling in each solver step
- Diagrams showing grid cells near obstacles

---

## Architecture Planning Requirements

After research, create a detailed architecture plan:

### 5. System Architecture

**Required Deliverable**: Create `architecture/obstacle_system_design.md` including:

**Data Structures**:
- Obstacle representation format (texture format, dimensions, data type)
- Configuration parameters to add to `Config` class
- New classes/modules needed (e.g., `ObstacleManager`, `ObstacleRenderer`)

**Module Design**:
- New modules to create (with interfaces and responsibilities)
- Existing modules to modify (with specific changes)
- Shader modifications needed (list all affected shaders)

**Data Flow**:
- Mermaid diagram showing how obstacle data flows through the pipeline
- Where obstacles are checked in each frame
- How obstacle texture is created and updated

**Integration Points**:
- How obstacles integrate with `SimulationManager`
- How obstacles are configured via settings panel
- How obstacles are rendered in the display

### 6. Shader Modifications Plan

**Required Deliverable**: Create `architecture/shader_modifications_plan.md` documenting:

**For Each Affected Shader** (e.g., `pressure.glsl`, `divergence.glsl`, `gradientSubtract.glsl`, `advection.glsl`):
- Current shader responsibility
- Why it needs modification for obstacles
- Specific code changes needed (pseudocode acceptable)
- Boundary condition enforcement strategy
- Expected performance impact

**New Shaders**:
- List any new shaders needed (e.g., obstacle rendering shader)
- Their purpose and specifications

### 7. UI/UX Design

**Required Deliverable**: Create `architecture/obstacle_ui_design.md` including:

**Settings Panel Additions**:
- New controls for obstacle configuration
- Parameters to expose (position, size, shape, etc.)
- Visual mockup or detailed description

**Visual Design**:
- How obstacles appear in the simulation (color, shading, transparency)
- How to distinguish obstacles from fluid
- Whether obstacles cast shadows or affect bloom/sunrays

**User Interactions**:
- Can users add/remove obstacles dynamically?
- Can users drag obstacles to move them?
- Reset to default obstacles button?

---

## Implementation Plan Requirements

### 8. Detailed Implementation Plan

**Required Deliverable**: Create `implementation_plan.md` following the exact format used previously:

**Structure**:
```markdown
# Adding Internal Wall Obstacles to Fluid Simulation

## User Review Required

[Breaking changes, design decisions requiring user feedback]

## Proposed Changes

### Research Documents
- [NEW] research/obstacle_boundary_conditions.md
- [NEW] research/codebase_analysis_obstacles.md
- [NEW] research/implementation_approaches.md
- [NEW] research/obstacle_math_foundations.md

---

### Architecture Documents
- [NEW] architecture/obstacle_system_design.md
- [NEW] architecture/shader_modifications_plan.md
- [NEW] architecture/obstacle_ui_design.md

---

### Core Module: Obstacle Management
[Description of changes]

#### [NEW] src/core/ObstacleManager.js
[Purpose, API, responsibilities]

#### [MODIFY] src/core/SimulationManager.js
[Specific additions to integrate ObstacleManager]

---

### Physics Modules
[For each module: AdvectionModule, PressureSolverModule, etc.]

#### [MODIFY] src/physics/PressureSolverModule.js
[Specific changes for pressure boundary conditions]

---

### Shader Modifications
[Group by shader]

#### [MODIFY] src/shaders/fragment/pressure.glsl
[Specific changes for obstacle checking]

---

### Configuration System

#### [MODIFY] src/config.js
[New parameters: OBSTACLES_ENABLED, OBSTACLE_POSITIONS, etc.]

---

### Rendering

#### [MODIFY] src/rendering/DisplayModule.js
[How to render obstacles visually]

---

### UI Components

#### [MODIFY] index.html
[Settings panel HTML additions]

#### [MODIFY] style.css
[Styling for obstacle controls]

---

## Verification Plan

### Automated Tests
- Unit test for ObstacleManager obstacle mask generation
- Unit test for boundary condition enforcement in shaders
- Integration test for full simulation with obstacles

### Manual Verification
- Visual: Fluid flows around obstacles realistically
- Visual: No fluid penetration through obstacles
- Visual: Vortices form behind obstacles (von Kármán vortex street for cylinders)
- Performance: Maintain 60 FPS with obstacles
- UI: Settings panel controls work correctly

### Physics Validation
- Compare obstacle flow patterns to reference implementations
- Check for numerical instabilities at boundaries
- Verify conservation of mass (no divergence at obstacles)
```

---

## Testing Strategy Requirements

### 9. Test Plan

**Required Deliverable**: Create `testing/obstacle_test_plan.md` including:

**Unit Tests** (specific test cases):
- Test obstacle mask texture generation
- Test boundary condition in pressure step (mock WebGL)
- Test velocity clamping at obstacles
- Test configuration validation

**Integration Tests**:
- Test full simulation loop with obstacles
- Test obstacle rendering
- Test settings panel integration

**Visual/Manual Tests**:
- Test fluid flow around circular obstacle (verify von Kármán vortex street)
- Test fluid flow around rectangular obstacle (verify corner eddies)
- Test multiple obstacles interaction
- Test obstacle visibility and rendering

**Performance Tests**:
- Benchmark FPS with 0, 1, 5, 10 obstacles
- Measure GPU memory usage increase

**Edge Cases**:
- Obstacle at domain boundary
- Overlapping obstacles
- Very small obstacles (< 5 pixels)
- Very large obstacles (> 50% domain)
- Extreme pressure/velocity near obstacles

---

## Documentation Requirements

### 10. Educational Documentation

**Required Deliverable**: After implementation, update `blog/index.html` or create new section:

**Content Requirements**:
- Explain boundary condition theory for obstacles
- Show mathematical derivation of no-slip conditions
- Explain GPU implementation approach
- Include diagrams (created via code, not AI-generated images)
- Show before/after comparisons (screenshots from actual implementation)
- Reference all academic sources

---

## Constraints and Guidelines

### Must Follow
1. ✅ **Academic Rigor**: All techniques must be referenced from CFD literature
2. ✅ **No Guessing**: Every implementation decision must be justified by research
3. ✅ **Modular Architecture**: Follow existing patterns (core/physics/rendering/interaction)
4. ✅ **Test-Driven**: Write tests before or alongside implementation
5. ✅ **Documentation**: JSDoc comments with references to design docs
6. ✅ **Performance**: No degradation to existing 60 FPS target
7. ✅ **Browser Compatibility**: Must work on all currently supported browsers

### Must Avoid
1. ❌ **No Shortcuts**: Don't implement without research phase
2. ❌ **No Copied Code**: Build from first principles using academic sources
3. ❌ **No Breaking Changes**: Don't break existing simulation without obstacles
4. ❌ **No UI-First**: Don't build UI before backend logic is solid
5. ❌ **No Hardcoding**: Make obstacle configuration flexible and parameterized

---

## Execution Instructions for AI Assistant

When this prompt is provided to you, follow this exact sequence:

### Phase 1: Research (PLANNING Mode)
1. Start with `task_boundary` - Mode: PLANNING, TaskName: "Researching Obstacle Boundary Conditions"
2. Research boundary condition theory from academic sources
3. Create all 4 research documents in `research/` directory
4. Update `task.md` with research tasks

### Phase 2: Codebase Analysis (PLANNING Mode)
1. `task_boundary` - Mode: PLANNING, TaskName: "Analyzing Codebase for Obstacle Integration"
2. Deep dive into existing modules and shaders
3. Create codebase analysis document
4. Update `task.md`

### Phase 3: Architecture Design (PLANNING Mode)
1. `task_boundary` - Mode: PLANNING, TaskName: "Designing Obstacle System Architecture"
2. Design data structures, modules, and integration points
3. Create all 3 architecture documents
4. Update `task.md`

### Phase 4: Implementation Planning (PLANNING Mode)
1. `task_boundary` - Mode: PLANNING, TaskName: "Creating Implementation Plan"
2. Write detailed `implementation_plan.md`
3. Write `testing/obstacle_test_plan.md`
4. Call `notify_user` to request approval of implementation plan
5. Update `task.md`

### Phase 5: Implementation (EXECUTION Mode - ONLY AFTER USER APPROVAL)
1. `task_boundary` - Mode: EXECUTION, TaskName: "Implementing Obstacle Core Module"
2. Create/modify files as specified in implementation plan
3. Follow modular approach (core → physics → shaders → rendering → UI)
4. Update `task.md` as components are completed

### Phase 6: Testing (VERIFICATION Mode)
1. `task_boundary` - Mode: VERIFICATION, TaskName: "Testing Obstacle Implementation"
2. Run all tests from test plan
3. Verify visual behavior matches CFD expectations
4. Document any issues and fix them
5. Update `task.md`

### Phase 7: Documentation (VERIFICATION Mode)
1. Create walkthrough.md showing what was built
2. Update blog or create educational content
3. Update PROJECT_SUMMARY.md with obstacle feature
4. Call `notify_user` with final walkthrough

---

## Expected Timeline

- **Research**: 30-50 tool calls
- **Codebase Analysis**: 20-30 tool calls
- **Architecture Design**: 20-30 tool calls
- **Implementation Planning**: 10-15 tool calls
- **Implementation**: 40-60 tool calls
- **Testing & Verification**: 20-30 tool calls
- **Documentation**: 10-15 tool calls

**Total**: ~150-230 tool calls for complete, rigorous implementation

---

## Success Criteria

### Technical Success
- ✅ Fluid flows realistically around obstacles (no penetration)
- ✅ Proper boundary conditions enforced (backed by theory)
- ✅ 60 FPS maintained on desktop
- ✅ All tests pass
- ✅ Zero console errors or WebGL warnings

### Documentation Success
- ✅ All research documents reference academic sources
- ✅ Implementation plan approved by user
- ✅ Code comments reference design documents
- ✅ Educational blog content created

### User Experience Success
- ✅ Settings panel allows obstacle configuration
- ✅ Obstacles are visually distinct and attractive
- ✅ Feature integrates seamlessly with existing UI
- ✅ Users can understand and interact with obstacles

---

## Final Notes

This is a **complex computational physics feature** that requires:
- Deep understanding of Navier-Stokes numerical methods
- GPU programming and shader optimization
- Careful architectural integration
- Rigorous testing and validation

**Do not rush this implementation.** Quality and correctness are more important than speed. Every step should be grounded in research and best practices from the CFD literature.

If you encounter any ambiguity or need to make a design choice, **stop and ask the user** rather than guessing.

---

**Ready to begin? Copy this entire prompt and provide it to me when you want to start the obstacle implementation.**
