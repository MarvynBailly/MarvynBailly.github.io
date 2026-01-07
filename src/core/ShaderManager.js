/**
 * Shader Manager
 * 
 * Handles shader compilation, program linking, and material management.
 * Supports conditional compilation with #define keywords.
 * 
 * References:
 * - architecture.md - ShaderManager
 * - technical_analysis.md - Material System, Shader Keywords
 * - sources.md - GLSL Specifications
 */

import { hashCode } from '../utils/math.js';

/**
 * Material class for shaders with keyword variants
 * Supports conditional compilation using #define directives
 */
export class Material {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {WebGLShader} vertexShader - Compiled vertex shader
     * @param {string} fragmentShaderSource - Fragment shader source code
     */
    constructor(gl, vertexShader, fragmentShaderSource) {
        this.gl = gl;
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = {};
        this.activeProgram = null;
        this.uniforms = {};
    }

    /**
     * Set keywords for conditional compilation
     * Compiles variant if not cached
     * 
     * @param {string[]} keywords - Array of keywords to define
     */
    setKeywords(keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++) {
            hash += hashCode(keywords[i]);
        }

        let program = this.programs[hash];
        if (!program) {
            const fragmentShader = compileShader(
                this.gl,
                this.gl.FRAGMENT_SHADER,
                this.fragmentShaderSource,
                keywords
            );
            program = createProgram(this.gl, this.vertexShader, fragmentShader);
            this.programs[hash] = program;
        }

        if (program === this.activeProgram) return;

        this.uniforms = getUniforms(this.gl, program);
        this.activeProgram = program;
    }

    /**
     * Bind this material's active program
     */
    bind() {
        this.gl.useProgram(this.activeProgram);
    }
}

/**
 * Simple program wrapper
 */
export class Program {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     * @param {WebGLShader} vertexShader - Compiled vertex shader
     * @param {WebGLShader} fragmentShader - Compiled fragment shader
     */
    constructor(gl, vertexShader, fragmentShader) {
        this.gl = gl;
        this.program = createProgram(gl, vertexShader, fragmentShader);
        this.uniforms = getUniforms(gl, this.program);
    }

    /**
     * Bind this program
     */
    bind() {
        this.gl.useProgram(this.program);
    }
}

/**
 * Shader Manager
 */
export class ShaderManager {
    /**
     * @param {WebGLRenderingContext} gl - WebGL context
     */
    constructor(gl) {
        this.gl = gl;
    }

    /**
     * Compile a shader from source
     * 
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param {string} source - Shader source code
     * @param {string[]} defines - Optional array of define keywords
     * @returns {WebGLShader} Compiled shader
     */
    compileShader(type, source, defines = null) {
        return compileShader(this.gl, type, source, defines);
    }

    /**
     * Create a shader program
     * 
     * @param {WebGLShader} vertexShader - Compiled vertex shader
     * @param {WebGLShader} fragmentShader - Compiled fragment shader
     * @returns {WebGLProgram} Linked program
     */
    createProgram(vertexShader, fragmentShader) {
        return createProgram(this.gl, vertexShader, fragmentShader);
    }

    /**
     * Create a material with keyword support
     * 
     * @param {string} vertexSource - Vertex shader source
     * @param {string} fragmentSource - Fragment shader source
     * @returns {Material} Material object
     */
    createMaterial(vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        return new Material(this.gl, vertexShader, fragmentSource);
    }

    /**
     * Get uniform locations from program
     * 
     * @param {WebGLProgram} program - Shader program
     * @returns {Object} Map of uniform name to location
     */
    getUniforms(program) {
        return getUniforms(this.gl, program);
    }
}

/**
 * Compile shader with optional defines
 * 
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} type - Shader type
 * @param {string} source - Shader source
 * @param {string[]} keywords - Keywords to define
 * @returns {WebGLShader} Compiled shader
 */
function compileShader(gl, type, source, keywords) {
    source = addKeywords(source, keywords);

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        console.error('Shader compilation error:', info);
        console.error('Source:', source);
        throw new Error(`Shader compilation failed: ${info}`);
    }

    return shader;
}

/**
 * Add keyword defines to shader source
 * 
 * @param {string} source - Shader source
 * @param {string[]} keywords - Keywords to define
 * @returns {string} Modified source with defines
 */
function addKeywords(source, keywords) {
    if (!keywords || keywords.length === 0) return source;

    let keywordsString = '';
    keywords.forEach(keyword => {
        keywordsString += `#define ${keyword}\n`;
    });

    return keywordsString + source;
}

/**
 * Create and link shader program
 * 
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLShader} vertexShader - Vertex shader
 * @param {WebGLShader} fragmentShader - Fragment shader
 * @returns {WebGLProgram} Linked program
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        console.error('Program linking error:', info);
        throw new Error(`Program linking failed: ${info}`);
    }

    return program;
}

/**
 * Extract uniform locations from program
 * 
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLProgram} program - Shader program
 * @returns {Object} Map of uniform names to locations
 */
function getUniforms(gl, program) {
    const uniforms = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = gl.getActiveUniform(program, i);
        const uniformName = uniformInfo.name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }

    return uniforms;
}
