# Welcome to Marvyn Bailly's Website

Welcome! This is my personal website featuring a real-time GPU-accelerated Navier-Stokes fluid simulation, blog posts about computational mathematics, and information about my research.

🌐 **Live Site**: [marvynbailly.github.io](https://marvynbailly.github.io)

## 🎯 What's Here

- **Interactive Fluid Simulation**: A WebGL-powered visualization of fluid dynamics running at 60 FPS
- **Blog**: Technical articles on mathematics, simulation, and scientific computing
- **Research**: Overview of my current and past research projects
- **About**: My background, CV, and contact information

## 📁 Site Structure

```
.
├── index.html              # Home page with fluid simulation
├── about/                  # About Me page
│   └── index.html
├── blog/                   # Blog section
│   ├── index.html         # Blog landing page
│   ├── fluid-simulation.html
│   └── style.css
├── research/               # Research projects
│   └── index.html
├── src/                    # Fluid simulation source code
│   ├── core/              # WebGL infrastructure
│   ├── physics/           # Navier-Stokes solver modules
│   ├── rendering/         # Visual effects (bloom, sunrays)
│   ├── interaction/       # User input handling
│   ├── shaders/           # GLSL shader programs
│   └── utils/             # Helper functions
└── style.css              # Global styles
```

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Features

### Fluid Simulation
- Real-time Navier-Stokes solver
- GPU-accelerated using WebGL shaders
- Interactive multi-touch support
- Visual effects: bloom, sunrays, shading
- Customizable physics parameters
- Obstacle boundaries (the "M" shape)
- Wind tunnel mode

### Site Design
- Unified sticky header across all pages
- Glassmorphism UI elements
- Custom scrollbars
- Responsive layout
- Dark theme with cyan accents

## 📚 Technologies

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Graphics**: WebGL 2.0 / WebGL 1.0 with fallback
- **Build Tool**: Vite
- **Styling**: Custom CSS with CSS variables
- **Math Rendering**: MathJax (blog posts)

## 📖 Learn More

Visit the [blog](blog/fluid-simulation.html) for an in-depth explanation of the fluid simulation mathematics and implementation.

---

**Built with Mathematics and WebGL** | © 2026 Marvyn Bailly
