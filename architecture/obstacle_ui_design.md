# Obstacle UI/UX Design

## Overview

This document specifies the user interface and user experience for obstacle configuration and visualization. It covers settings panel additions, visual design for obstacles, and user interaction patterns.

---

## 1. Settings Panel Additions

### 1.1 Current Settings Panel Structure

**Location**: `index.html` lines 88-118

**Current Sections**:
1. Visual Effects (bloom, sunrays, shading toggles)
2. Physics (velocity/density dissipation, vorticity, pressure iterations)
3. Interaction (force strength, splat radius)

### 1.2 New Obstacles Section

**Placement**: After "Interaction" section, before "Reset" button

**HTML Addition**:
```html
<div class='settings-section'>
    <h3>Obstacles</h3>
    
    <!-- Enable/Disable Obstacles -->
    <label class='checkbox-label'>
        <input type='checkbox' id='obstacles-toggle' checked>
        <span>Enable Obstacles</span>
    </label>
    
    <!-- Obstacle Visibility -->
    <label class='checkbox-label'>
        <input type='checkbox' id='obstacle-visibility-toggle' checked>
        <span>Show Obstacles</span>
    </label>
    
    <!-- Obstacle Color Picker (optional for v1, useful for v2) -->
    <div class='color-picker-control'>
        <label>Obstacle Color:</label>
        <input type='color' id='obstacle-color' value='#333344'>
     </div>
    
    <!-- Future: Add/Clear Obstacles -->
    <!-- <button id='clear-obstacles' class='btn-secondary'>Clear All</button> -->
</div>
```

**CSS Additions** (`style.css`):
```css
.color-picker-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 8px 0;
}

.color-picker-control label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
}

.color-picker-control input[type='color'] {
    width: 50px;
    height: 30px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
```

### 1.3 JavaScript Wiring

**File**: `src/main.js` (or new `src/interaction/SettingsController.js`)

**Event Listeners**:
```javascript
// Obstacles Toggle
document.getElementById('obstacles-toggle').addEventListener('change', (e) => {
    simulation.config.OBSTACLES_ENABLED = e.target.checked;
    // Note: Requires simulation restart or dynamic update
});

// Obstacle Visibility Toggle
document.getElementById('obstacle-visibility-toggle').addEventListener('change', (e) => {
    simulation.config.SHOW_OBSTACLES = e.target.checked;
    // Affects display shader only
});

// Obstacle Color Picker
document.getElementById('obstacle-color').addEventListener('input', (e) => {
    const color = hexToRgb(e.target.value);
    simulation.config.OBSTACLE_COLOR = color;
});

// Helper function
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0.2, g: 0.2, b: 0.3 };
}
```

---

## 2. Visual Design for Obstacles

### 2.1 Obstacle Rendering Strategy

**Approach**: Render obstacles as **solid, distinct regions** in the simulation

**Design Principles**:
1. **Contrast**: Obstacles should be clearly distinguishable from fluid
2. **Non-intrusive**: Should not dominate the visual
3. **Informative**: User should understand these are solid boundaries

### 2.2 Color Scheme

**Recommended Default**:
```javascript
OBSTACLE_COLOR = { r: 0.2, g: 0.2, b: 0.3 }  // Dark blue-gray
```

**Rationale**:
- Dark enough to contrast with colorful fluid
- Subtle blue tint suggests "solid" vs fluid
- Not pure black (maintains some visual interest)

**Alternative Options**:
- **Charcoal Gray**: `{ r: 0.15, g: 0.15, b: 0.15 }` - Very neutral
- **Steel Blue**: `{ r: 0.25, g: 0.3, b: 0.35 }` - More distinct
- **User-Defined**: Via color picker in settings

### 2.3 Visual Effects on Obstacles

**Phase 1 (Current)**:
- Solid color rendering
- No bloom on obstacles
- No sunrays from obstacles

**Phase 2 (Future Enhancement)**:
- Optional outline/border rendering
- Subtle shading to show 3D depth
- Specular highlights (as if shiny surface)

### 2.4 Mockup (Text Description)

```
+------------------------------------------+
|                                          |
|    ~ ~ Fluid Flow ~ ~                    |
|  ~ ~ ~ ~ ↓ ↓ ↓ ~ ~ ~ ~                   |
| ~ ~ ~ ~ ↓ ↓ ↓ ~ ~ ~ ~ ~                  |
|~ ~ ~ ~ [■■■■■] ~ ~ ~ ~ ~     ← Circular  |
| ~ ~ ~ ~ ↓ ↓ ↓ ~ ~ ~ ~ ~        obstacle  |
|  ~ ~ ~ ~ ↓ ↓ ↓ ~ ~ ~ ~         (dark)    |
|    ~ ~ Fluid Flow ~ ~                    |
|                                          |
+------------------------------------------+

Legend:
  ~ ~ ~ = Colorful fluid (constantly changing)
  ■■■■■ = Dark obstacle (static solid color)
  ↓ ↓ ↓ = Flow direction (illustrative)
```

---

## 3. User Interaction Patterns

### 3.1 Phase 1: View-Only Obstacles

**Capabilities**:
- ✅ View predefined obstacles
- ✅ Toggle obstacle visibility
- ✅ Change obstacle color
- ❌ Add/remove obstacles (future)
- ❌ Move obstacles (future)

**User Experience**:
1. User sees obstacle(s) in simulation on initial load
2. Fluid flows realistically around obstacles
3. User can toggle visibility in settings to see "pure" fluid
4. User can customize obstacle color for aesthetics

### 3.2 Phase 2: Interactive Obstacles (Future)

**Additional Capabilities**:
- ✅ Click to add circular obstacle
- ✅ Drag to create rectangular obstacle
- ✅ Click obstacle to remove it
- ✅ Drag obstacle to reposition (dynamic update)

**UI Additions**:
```html
<div class='obstacle-tools'>
    <button id='add-circle-btn' class='tool-btn'>
        <svg><!-- Circle icon --></svg>
        Add Circle
    </button>
    <button id='add-rect-btn' class='tool-btn'>
        <svg><!-- Rectangle icon --></svg>
        Add Rectangle
    </button>
    <button id='erase-btn' class='tool-btn'>
        <svg><!-- Eraser icon --></svg>
        Remove
    </button>
</div>

<div class='slider-control'>
    <label>Obstacle Size: <span id='obstacle-size-value'>0.1</span></label>
    <input type='range' id='obstacle-size' min='0.05' max='0.3' value='0.1' step='0.01'>
</div>
```

**Interaction Flow**:
1. User selects "Add Circle" tool
2. User clicks on simulation canvas
3. `InteractionManager` detects click
4. `ObstacleManager.addCircle(x, y, radius)` called
5. Obstacle texture updated via `gl.texSubImage2D()`
6. Simulation continues with new obstacle

---

## 4. Accessibility Considerations

### 4.1 Settings Panel

**Keyboard Navigation**:
- All controls should be keyboard accessible
- Tab order: top to bottom, following visual layout
- Enter/Space to toggle checkboxes, buttons

**Screen Reader Support**:
- All form elements have proper `<label>` associations
- Buttons have `aria-label` attributes
- Sliders have `aria-valuemin`, `aria-valuemax`, `aria-valuenow`

**Example**:
```html
<label class='checkbox-label'>
    <input type='checkbox' id='obstacles-toggle' checked aria-label='Enable obstacles'>
    <span>Enable Obstacles</span>
</label>
```

### 4.2 Visual Contrast

**Obstacle Color**:
- Default color ensures sufficient contrast with both:
  - Dark background
  - Bright fluid colors
- WCAG AA compliance for large areas

**Settings Panel**:
- Maintain existing high contrast design
- Labels: `rgba(255, 255, 255, 0.8)` on dark background

---

## 5. Performance Impact of UI

### 5.1 Color Picker

**Impact**: None
- Color stored in JavaScript config
- Passed as uniform to display shader
- No additional GPU work

### 5.2 Toggle Obstacles Visibility

**Impact**: Minimal
- Single uniform bool passed to display shader
- ```glsl
  if (!showObstacles|| texture2D(uObstacles, vUv).r < 0.5) {
      // Render fluid normally
  }
  ```

### 5.3 Dynamic Obstacle Updates (Phase 2)

**Impact**: Moderate
- `gl.texSubImage2D()` to update obstacle texture
- Only updated region needs GPU upload
- ~1-2ms per update (acceptable for user interaction)

---

## 6. Implementation Checklist

### 6.1 HTML
- [ ] Add "Obstacles" section to settings panel
- [ ] Add obstacle enable/disable checkbox
- [ ] Add obstacle visibility checkbox
- [ ] Add obstacle color picker
- [ ] (Future) Add obstacle tools (add/remove)

### 6.2 CSS
- [ ] Style obstacle controls section
- [ ] Style color picker input
- [ ] Ensure visual consistency with existing settings
- [ ] Add hover/focus states for new controls

### 6.3 JavaScript
- [ ] Wire up obstacles toggle event listener
- [ ] Wire up visibility toggle event listener
- [ ] Wire up color picker event listener
- [ ] Add `hexToRgb()` utility function
- [ ] Update Config with new fields
- [ ] Pass config values to display shader

### 6.4 Config.js
- [ ] Add `OBSTACLES_ENABLED` field (default: true)
- [ ] Add `SHOW_OBSTACLES` field (default: true)
- [ ] Add `OBSTACLE_COLOR` field (default: dark blue-gray)

### 6.5 Display Shader
- [ ] Add `uniform bool uShowObstacles;`
- [ ] Add `uniform vec3 uObstacleColor;`
- [ ] Implement obstacle rendering logic

---

## 7. User Feedback & Help

### 7.1 Info Panel Addition

**Location**: Modify existing info panel (`#info-panel` in `index.html`)

**Add Section**:
```html
<h3>Obstacles</h3>
<p>
    Dark regions in the simulation are solid obstacles. The fluid flows
    realistically around these obstacles, demonstrating no-slip boundary
    conditions and vortex shedding.
</p>
<ul>
    <li><strong>Toggle Visibility:</strong> Use settings to show/hide obstacles</li>
    <li><strong>Customize Color:</strong> Click color picker in settings</li>
</ul>
```

### 7.2 Tooltips (Optional)

**Implementation**: CSS-only tooltips on hover

```html
<label class='checkbox-label' data-tooltip='Enable or disable obstacle physics'>
    <input type='checkbox' id='obstacles-toggle' checked>
    <span>Enable Obstacles</span>
</label>
```

```css
[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
}
```

---

## 8. Responsive Design

### 8.1 Mobile Considerations

**Settings Panel on Mobile**:
- Already responsive (scrollable panel)
- Obstacle controls fit within existing layout
- Color picker may be larger on touch devices (browser default)

**Obstacle Visualization on Mobile**:
- Lower resolution (SIM_RESOLUTION reduced to 64 or 96)
- Obstacles still visible and functional
- May appear more pixelated (acceptable trade-off)

### 8.2 Small Screen Adaptations

**Minimum Width**: 320px (existing constraint)

**Layout**:
- Settings panel collapses to full width below 768px
- Obstacle controls stack vertically
- No horizontal scrolling

---

## 9. Future Enhancement Ideas

### 9.1 Predefined Obstacle Presets

**UI**:
```html
<div class='preset-controls'>
    <label>Obstacle Preset:</label>
    <select id='obstacle-preset'>
        <option value='none'>None</option>
        <option value='single-circle'>Single Circle</option>
        <option value='double-circle'>Double Circle</option>
        <option value='vertical-wall'>Vertical Wall</option>
        <option value='maze'>Simple Maze</option>
    </select>
</div>
```

**Implementation**:
- Each preset has predefined obstacle definitions
- Selecting preset clears and recreates obstacles
- Easy way for users to experiment

### 9.2 Export/Import Obstacles

**Feature**: Save/load obstacle configurations

**UI**:
```html
<button id='export-obstacles'>Export Obstacles</button>
<input type='file' id='import-obstacles' accept='.json'>
```

**Format** (JSON):
```json
{
  "version": "1.0",
  "obstacles": [
    { "type": "circle", "x": 0.5, "y": 0.5, "radius": 0.1 },
    { "type": "rectangle", "x": 0.3, "y": 0.2, "width": 0.05, "height": 0.6 }
  ]
}
```

### 9.3 Animated Obstacles

**Feature**: Obstacles that move/rotate

**UI**:
```html
<label class='checkbox-label'>
    <input type='checkbox' id='animate-obstacles'>
    <span>Animate Obstacles</span>
</label>
```

**Implementation**:
- Update obstacle positions each frame
- Regenerate obstacle texture with `texSubImage2D()`
- Demonstrates moving boundary conditions

---

## 10. Visual Design Examples

### 10.1 Light Theme Alternative (Future)

**Current**: Dark background with colorful fluid

**Light Theme**:
- Background: light gray/white
- Obstacles: dark obstacles still visible
- Fluid: vibrant colors show well on light background

**Config**:
```javascript
THEME = 'dark' | 'light';
if (THEME === 'light') {
    BACK_COLOR = { r: 0.95, g: 0.95, b: 0.95 };
    OBSTACLE_COLOR = { r: 0.2, g: 0.2, b: 0.25 };
} else {
    BACK_COLOR = { r: 0, g: 0, b: 0 };
    OBSTACLE_COLOR = { r: 0.2, g: 0.2, b: 0.3 };
}
```

### 10.2 Obstacle Outline Mode

**Feature**: Render only obstacle borders, not fill

**Shader Approach**:
```glsl
// Check if current cell is obstacle
float isObstacle = texture2D(uObstacles, vUv).r;

// Check if any neighbor is fluid (= we're on boundary)
float hasFluidNeighbor = 
    (texture2D(uObstacles, vL).r < 0.5) ||
    (texture2D(uObstacles, vR).r < 0.5) ||
    (texture2D(uObstacles, vT).r < 0.5) ||
    (texture2D(uObstacles, vB).r < 0.5) ? 1.0 : 0.0;

if (isObstacle > 0.5 && hasFluidNeighbor > 0.5) {
    // Render obstacle border
    gl_FragColor = vec4(obstacleColor, 1.0);
} else if (isObstacle > 0.5) {
    // Interior of obstacle: transparent or fluid color
    gl_FragColor = texture2D(uDye, vUv);
} else {
    // Normal fluid rendering
}
```

---

## Summary

This UI/UX design provides:
- ✅ Clean, minimal settings panel additions
- ✅ Clear visual distinction for obstacles
- ✅ User control over obstacle visibility and appearance
- ✅ Future extensibility (interactive obstacles, presets, animation)
- ✅ Accessibility considerations
- ✅ Responsive design for mobile/desktop

**Implementation Priority**:
1. **Phase 1** (Current): Basic visibility toggle and color picker
2. **Phase 2**: Interactive obstacle drawing/editing
3. **Phase 3**: Presets, animation, advanced features

---

*UI/UX design grounded in usability principles and aligned with existing application aesthetics.*
