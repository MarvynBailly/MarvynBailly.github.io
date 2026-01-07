# Obstacle Test Plan

## Overview

This document specifies testing strategy for the obstacle implementation. Given the WebGL nature of the project and lack of existing test infrastructure, the focus is on **manual verification** with a path toward automated testing in future phases.

---

## Test Strategy

### Approach: Manual Visual Testing + Physics Validation

**Rationale**:
1. Current project has Jest configured but no existing tests
2. WebGL testing requires complex mocking (gl-matrix, WebGL contexts)
3. Visual/physics validation is most critical for this feature
4. Manual testing faster for initial implementation
5. Automated tests can be added incrementally in Phase 2

---

## Test Cases

### TC-001: Obstacle Rendering

**Objective**: Verify obstacles are visible and correctly positioned

**Prerequisites**: Development server running (`npm run dev`)

**Steps**:
1. Open `http://localhost:5173` in Chrome/Firefox
2. Observe simulation display

**Expected Results**:
- ✅ Circular obstacle visible at center (x=0.5, y=0.5)
- ✅ Obstacle color is dark blue-gray (#333344)
- ✅ Obstacle has sharp, clean edges (not blurry)

**Actual Result**: _[To be filled during verification]_

**Status**: ❌ PENDING

---

### TC-002: Obstacle Physics - No Penetration

**Objective**: Verify fluid cannot penetrate obstacles

**Steps**:
1. Click and drag rapidly across the obstacle in multiple directions
2. Observe fluid behavior at obstacle boundary

**Expected Results**:
- ✅ Fluid flows around obstacle, not through it
- ✅ No dye visible inside obstacle region  
- ✅ Velocity vectors point tangentially along obstacle surface

**Actual Result**: _[To be filled]_

**Status**: ❌ PENDING

---

### TC-003: Obstacle Physics - No-Slip Boundary Condition

**Objective**: Verify velocity is zero at obstacle boundary

**Steps**:
1. Add dye upstream of obstacle (click and drag above obstacle)
2. Observe dye behavior very close to obstacle surface
3. Note: If possible, enable debug mode to visualize velocity field

**Expected Results**:
- ✅ Dye slows down near obstacle surface
- ✅ Dye stops completely at obstacle boundary (no slip)
- ✅ No dye "slides along" obstacle surface

**Actual Result**: _[To be filled]_

**Status**: ❌ PENDING

---

### TC-004: Obstacle Physics - Vortex Shedding

**Objective**: Verify realistic flow patterns (Von Kármán vortex street)

**Steps**:
1. Add continuous dye/velocity upstream of circular obstacle
2. Observe flow downstream (behind) the obstacle
3. Look for alternating vortices forming and shedding

**Expected Results**:
- ✅ Vortices form on alternating sides of obstacle
- ✅ Vortices shed periodically (if Reynolds number appropriate)
- ✅ Flow pattern resembles classic von Kármán vortex street

**Visual Reference**: [Wikipedia - Vortex Street](https://en.wikipedia.org/wiki/K%C3%A1rm%C3%A1n_vortex_street)

**Actual Result**: _[To be filled]_

**Status**: ❌ PENDING

---

### TC-005: Settings - Obstacle Visibility Toggle

**Objective**: Verify obstacle visibility can be toggled without affecting physics

**Steps**:
1. Open Settings panel
2. Scroll to "Obstacles" section
3. Uncheck "Show Obstacles"
4. Add dye around where obstacle was visible

**Expected Results**:
- ✅ Obstacle disappears visually  
- ✅ Fluid still cannot penetrate (physics still active)
- ✅ Checking "Show Obstacles" makes it reappear

**Actual Result**: _[To be filled]_

**Status**: ❌ PENDING

---

### TC-006: Settings - Obstacle Color Picker

**Objective**: Verify obstacle color can be changed

**Steps**:
1. Open Settings → Obstacles
2. Click color picker
3. Select bright red (#FF0000)
4. Select bright green (#00FF00)

**Expected Results**:
- ✅ Obstacle changes to selected color immediately
- ✅ Color persists across interactions
- ✅ No visual artifacts or flashing

**Actual Result**: _[To be filled]_

**Status**: ❌ PENDING

---

### TC-007: Performance - Frame Rate

**Objective**: Verify performance remains acceptable (≥55 FPS on desktop)

**Prerequisites**: Desktop PC, not mobile

**Steps**:
1. Press 'S' key to show performance stats
2. Note baseline FPS without obstacles
3. Enable obstacles (if not already enabled)
4. Run simulation for 30 seconds
5. Note average FPS

**Expected Results**:
- ✅ FPS ≥ 55 with obstacles enabled
- ✅ FPS drop ≤ 10% compared to baseline
- ✅ No stuttering or frame drops during interaction

**Baseline FPS** (without obstacles): ____ FPS  
**FPS with obstacles**: ____ FPS  
**% Decrease**: ____%

**Status**: ❌ PENDING

---

### TC-008: Browser Compatibility - Chrome

**Objective**: Verify functionality on Chrome/Edge (Chromium)

**Environment**: Chrome version ____ on Windows/macOS/Linux

**Steps**:
1. Open simulation in Chrome
2. Execute TC-001 through TC-006
3. Check console for errors

**Expected Results**:
- ✅ All visual tests pass
- ✅ All physics tests pass
- ✅ No WebGL errors in console
- ✅ No JavaScript errors

**Status**: ❌ PENDING

---

### TC-009: Browser Compatibility - Firefox

**Objective**: Verify functionality on Firefox

**Environment**: Firefox version ____ on Windows/macOS/Linux

**Steps**:
1. Open simulation in Firefox
2. Execute TC-001 through TC-006
3. Check console for errors

**Expected Results**:
- ✅ All visual tests pass
- ✅ All physics tests pass
- ✅ No WebGL errors

**Status**: ❌ PENDING

---

### TC-010: Browser Compatibility - Safari

**Objective**: Verify functionality on Safari (WebGL 1.0)

**Environment**: Safari version ____ on macOS/iOS

**Steps**:
1. Open simulation in Safari
2. Execute TC-001 through TC-006
3. Check console for WebGL warnings

**Expected Results**:
- ✅ All visual tests pass (may be lower resolution on iOS)
- ✅ Physics still correct
- ✅ Graceful degradation if extensions unavailable

**Note**: Safari may not support all WebGL 2.0 features; fallback behavior is acceptable

**Status**: ❌ PENDING

---

### TC-011: Mobile Compatibility - Touch Interaction

**Objective**: Verify obstacles work on mobile devices

**Environment**: Mobile device or browser devtools mobile emulation

**Steps**:
1. Open simulation on mobile browser
2. Touch and drag around obstacle
3. Verify performance (FPS may be lower, ≥30 acceptable)

**Expected Results**:
- ✅ Touch interactions work correctly
- ✅ Fluid flows around obstacle
- ✅ Performance acceptable (≥30 FPS on modern mobile)
- ✅ UI controls accessible and usable on small screen

**Status**: ❌ PENDING

---

### TC-012: Edge Cases - Obstacle at Domain Boundary

**Objective**: Verify obstacle partially outside simulation domain doesn't break

**Steps**:
1. Modify `config.DEFAULT_OBSTACLES` to place obstacle at edge:
   ```javascript
   { type: 'circle', x: 0.0, y: 0.5, radius: 0.1 }
   ```
2. Reload page

**Expected Results**:
- ✅ No errors or crashes
- ✅ Obstacle clipped at domain boundary
- ✅ Physics still correct in visible region

**Status**: ❌ PENDING

---

### TC-013: Edge Cases - Very Small Obstacle

**Objective**: Verify small obstacles (<5 grid cells) don't cause issues

**Steps**:
1. Set `DEFAULT_OBSTACLES = [{ type: 'circle', x: 0.5, y: 0.5, radius: 0.02 }]`
2. Reload page

**Expected Results**:
- ✅ Small obstacle visible (may be pixelated)
- ✅ Fluid still flows around it
- ✅ No numerical instabilities

**Status**: ❌ PENDING

---

### TC-014: Edge Cases - Large Obstacle (>50% domain)

**Objective**: Verify large obstacles don't cause instability

**Steps**:
1. Set `DEFAULT_OBSTACLES = [{ type: 'circle', x: 0.5, y: 0.5, radius: 0.4 }]`
2. Reload page

**Expected Results**:
- ✅ Large obstacle visible
- ✅ Fluid confined to narrow channels
- ✅ Simulation remains stable (no divergence)

**Status**: ❌ PENDING

---

### TC-015: Edge Cases - Multiple Obstacles

**Objective**: Verify multiple obstacles work correctly

**Steps**:
1. Set `DEFAULT_OBSTACLES`:
   ```javascript
   [
       { type: 'circle', x: 0.3, y: 0.3, radius: 0.08 },
       { type: 'circle', x: 0.7, y: 0.7, radius: 0.08 },
       { type: 'rectangle', x: 0.45, y: 0.2, width: 0.1, height: 0.6 }
   ]
   ```
2. Reload page

**Expected Results**:
- ✅ All 3 obstacles visible
- ✅ Fluid flows around all obstacles correctly
- ✅ No interaction artifacts between obstacles

**Status**: ❌ PENDING

---

## Physics Validation Tests

### PV-001: Divergence-Free Constraint

**Objective**: Verify fluid remains incompressible (∇·u ≈ 0)

**Method**: Visual inspection + theory

**Steps**:
1. Run simulation with obstacles for 60 seconds
2. Observe dye concentration

**Expected Results**:
- ✅ Dye doesn't "bunch up" or create voids (would indicate compressibility)
- ✅ Dye spreads smoothly
- ✅ No visible density discontinuities

**Status**: ❌ PENDING

---

### PV-002: Mass Conservation

**Objective**: Verify total fluid "mass" conserved

**Method**: Qualitative observation

**Steps**:
1. Add large amount of dye to simulation
2. Wait 120 seconds
3. Compare total brightness

**Expected Results**:
- ✅ Dye dissipates gradually (expected due to `DENSITY_DISSIPATION`)
- ✅ No sudden appearance/disappearance of dye
- ✅ Rate of dissipation matches configured value

**Status**: ❌ PENDING

---

### PV-003: Pressure Distribution

**Objective**: Verify pressure doesn't build up in obstacles

**Method**: Reasoning (no direct pressure visualization in this implementation)

**Theory Check**:
- Pressure should be ~0 in obstacle cells (per shader implementation)
- Pressure gradient should be smooth around obstacles

**Expected**: No crashes or divergence (indirect evidence pressure is correct)

**Status**: ❌ PENDING

---

## Regression Tests

### RT-001: Simulation Without Obstacles

**Objective**: Verify simulation still works correctly with obstacles disabled

**Steps**:
1. Set `config.OBSTACLES_ENABLED = false`
2. Reload page
3. Run standardfluid interactions

**Expected Results**:
- ✅ Simulation runs identically to pre-obstacle implementation
- ✅ No performance degradation
- ✅ No visual artifacts

**Status**: ❌ PENDING

---

### RT-002: Existing Settings Panel Controls

**Objective**: Verify existing controls still function correctly

**Steps**:
1. Test all existing settings:
   - Bloom toggle
   - Sunrays toggle
   - Shading toggle
   - All physics sliders
   - Interaction sliders

**Expected Results**:
- ✅ All controls work as before
- ✅ No interference from new obstacle controls

**Status**: ❌ PENDING

---

## Test Execution Checklist

### Pre-Implementation
- [ ] Review all test cases
- [ ] Confirm test environment setup (browsers installed)
- [ ] Prepare test device/emulator for mobile tests

### During Implementation
- [ ] Run TC-001 after obstacle rendering implemented
- [ ] Run TC-002 after physics boundary conditions implemented
- [ ] Run TC-007 after each shader modification (monitor performance)

### Post-Implementation
- [ ] Execute all test cases TC-001 through TC-015
- [ ] Execute physics validation PV-001 through PV-003
- [ ] Execute regression tests RT-001 through RT-002
- [ ] Document all failures and create bug tickets
- [ ] Re-test after bug fixes

### Final Verification
- [ ] All critical tests (TC-001 through TC-007) must pass
- [ ] At least 2 browsers tested and passing
- [ ] Mobile compatibility verified
- [ ] No console errors
- [ ] Performance acceptable

---

## Future: Automated Testing

### Phase 2: Add Jest Unit Tests

**Potential Tests**:
```javascript
// tests/core/ObstacleManager.test.js
describe('ObstacleManager', () => {
    test('addCircle creates correct mask', () => {
        const manager = new ObstacleManager(10, 10, config);
        manager.addCircle(0.5, 0.5, 0.3);
        const data = manager.getObstacleData();
        
        // Check center cell is obstacle
        expect(data[5 * 10 + 5]).toBe(1.0);
        
        // Check corners are fluid
        expect(data[0]).toBe(0.0);
    });
});

// tests/core/TextureManager.test.js (requires WebGL mocking)
describe('TextureManager', () => {
    test('createObstacleTexture returns valid texture', () => {
        // Mock WebGL context
        const mockGl = createMockGLContext();
        const manager = new TextureManager(mockGl, ext);
        
        const data = new Float32Array([0, 1, 0, 1]);
        const texture = manager.createObstacleTexture(2, 2, data);
        
        expect(texture).toHaveProperty('texture');
        expect(texture).toHaveProperty('attach');
    });
});
```

**Dependencies Needed**:
- `jest-webgl-canvas-mock` or similar
- Manually mock WebGL functions

---

## Test Results Summary

| Test ID | Test Name | Status | Notes |
|---------|-----------|----------|-------|
| TC-001 | Obstacle Rendering | ❌ PENDING | |
| TC-002 | No Penetration | ❌ PENDING | |
| TC-003 | No-Slip BC | ❌ PENDING | |
| TC-004 | Vortex Shedding | ❌ PENDING | |
| TC-005 | Visibility Toggle | ❌ PENDING | |
| TC-006 | Color Picker | ❌ PENDING | |
| TC-007 | Performance | ❌ PENDING | |
| TC-008 | Chrome Compat | ❌ PENDING | |
| TC-009 | Firefox Compat | ❌ PENDING | |
| TC-010 | Safari Compat | ❌ PENDING | |
| TC-011 | Mobile Compat | ❌ PENDING | |
| TC-012 | Edge: Boundary | ❌ PENDING | |
| TC-013 | Edge: Small | ❌ PENDING | |
| TC-014 | Edge: Large | ❌ PENDING | |
| TC-015 | Edge: Multiple | ❌ PENDING | |
| PV-001 | Divergence-Free | ❌ PENDING | |
| PV-002 | Mass Conservation | ❌ PENDING | |
| PV-003 | Pressure | ❌ PENDING | |
| RT-001 | No Obstacles | ❌ PENDING | |
| RT-002 | Existing Controls | ❌ PENDING | |

**Pass Rate**: 0/20 (0%) - Pre-implementation

---

## Acceptance Criteria

To consider obstacle implementation **complete and verified**, the following must be true:

### Critical (Must Pass)
- ✅ TC-001: Obstacles visible
- ✅ TC-002: No fluid penetration
- ✅ TC-005: Visibility toggle works
- ✅ TC-007: Performance ≥ 55 FPS desktop
- ✅ TC-008: Chrome compatibility
- ✅ PV-001: Visually divergence-free
- ✅ RT-001: Works with obstacles disabled

### Important (Should Pass)
- TC-003: No-slip boundary visible
- TC-004: Vortex shedding present (may depend on config parameters)
- TC-006: Color picker functional
- TC-009: Firefox compatibility
- TC-011: Mobile compatibility

### Nice-to-Have
- TC-010: Safari compatibility (graceful degradation acceptable)
- TC-012 through TC-015: Edge cases (may reveal bugs for future fixes)

---

**Test Plan Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Ready for execution post-implementation

---

*Manual testing approach chosen due to WebGL complexity and lack of existing test infrastructure. Automated tests feasible for Phase 2 with appropriate mocking.*
