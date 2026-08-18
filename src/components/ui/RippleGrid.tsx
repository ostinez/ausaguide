import { useEffect, useRef } from "react"
import { Renderer, Program, Mesh, Triangle, Color } from "ogl"
import "./RippleGrid.css"

export interface RippleGridProps {
  enableRainbow?: boolean
  gridColor?: string
  rippleIntensity?: number
  gridSize?: number
  gridThickness?: number
  fadeDistance?: number
  vignetteStrength?: number
  glowIntensity?: number
  opacity?: number
  mouseInteraction?: boolean | number
  mouseInteractionRadius?: number
  className?: string
}

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uGridColor;
uniform float uRippleIntensity;
uniform float uGridSize;
uniform float uGridThickness;
uniform float uFadeDistance;
uniform float uVignetteStrength;
uniform float uGlowIntensity;
uniform float uOpacity;
uniform float uEnableRainbow;
uniform float uMouseRadius;

varying vec2 vUv;

vec3 hsl2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 mouse = (uMouse - 0.5) * vec2(aspect, 1.0);

  float distToMouse = length(p - mouse);
  
  // Dynamic concentric ripple wave
  float wave = sin(distToMouse * 22.0 - uTime * 3.5) * exp(-distToMouse / max(uMouseRadius, 0.1)) * uRippleIntensity;
  
  // Ambient continuous wave from center
  float distCenter = length(p);
  float ambientWave = sin(distCenter * 14.0 - uTime * 1.8) * 0.015;
  
  vec2 displacedP = p + normalize(p - mouse + 0.0001) * wave + normalize(p + 0.0001) * ambientWave;

  // Grid line calculation
  vec2 grid = abs(fract(displacedP * uGridSize) - 0.5);
  float lineDist = min(grid.x, grid.y);
  
  float lineThickness = (uGridThickness * 0.001) * uGridSize;
  float line = 1.0 - smoothstep(0.0, lineThickness, lineDist);

  // Glow halo effect around grid intersections
  float glow = exp(-lineDist * (30.0 / max(uGridThickness * 0.1, 0.5))) * uGlowIntensity;

  // Vignette and edge fade
  float vignette = clamp(1.0 - distCenter * (uVignetteStrength / max(uFadeDistance, 0.1)), 0.0, 1.0);
  vignette = smoothstep(0.0, 1.0, vignette);

  vec3 color = uGridColor;
  if (uEnableRainbow > 0.5) {
    float hue = fract(distToMouse * 0.3 - uTime * 0.1 + distCenter * 0.2);
    color = hsl2rgb(vec3(hue, 0.85, 0.55));
  }

  float intensity = (line + glow) * vignette * uOpacity;
  gl_FragColor = vec4(color * (line + glow * 1.5), intensity);
}
`

export function RippleGrid({
  enableRainbow = false,
  gridColor = "#0D6F73",
  rippleIntensity = 0.06,
  gridSize = 12,
  gridThickness = 18,
  fadeDistance = 1.8,
  vignetteStrength = 2.5,
  glowIntensity = 0.15,
  opacity = 0.85,
  mouseInteraction = true,
  mouseInteractionRadius = 1.5,
  className = "",
}: RippleGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: Renderer | null = null
    let animationFrameId: number

    try {
      renderer = new Renderer({
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      })
    } catch (e) {
      console.warn("[RippleGrid] WebGL Renderer init failed:", e)
      return
    }

    const gl = renderer.gl
    container.appendChild(gl.canvas)

    const geometry = new Triangle(gl)

    const parsedColor = new Color(gridColor)

    const uniforms = {
      uResolution: { value: [container.clientWidth, container.clientHeight] },
      uTime: { value: 0 },
      uMouse: { value: [0.5, 0.5] },
      uGridColor: { value: [parsedColor.r, parsedColor.g, parsedColor.b] },
      uRippleIntensity: { value: rippleIntensity },
      uGridSize: { value: gridSize },
      uGridThickness: { value: gridThickness },
      uFadeDistance: { value: fadeDistance },
      uVignetteStrength: { value: vignetteStrength },
      uGlowIntensity: { value: glowIntensity },
      uOpacity: { value: opacity },
      uEnableRainbow: { value: enableRainbow ? 1.0 : 0.0 },
      uMouseRadius: { value: mouseInteractionRadius },
    }

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms,
      transparent: true,
    })

    const mesh = new Mesh(gl, { geometry, program })

    const handleResize = () => {
      if (!container || !renderer) return
      const width = container.clientWidth || 300
      const height = container.clientHeight || 300
      renderer.setSize(width, height)
      uniforms.uResolution.value = [width, height]
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(container)

    let mouseTargetX = 0.5
    let mouseTargetY = 0.5
    let currentMouseX = 0.5
    let currentMouseY = 0.5

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction || !container) return
      const rect = container.getBoundingClientRect()
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouseTargetX = (e.clientX - rect.left) / rect.width
        mouseTargetY = 1.0 - (e.clientY - rect.top) / rect.height
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth mouse interpolation
      currentMouseX += (mouseTargetX - currentMouseX) * 0.08
      currentMouseY += (mouseTargetY - currentMouseY) * 0.08

      uniforms.uTime.value = (currentTime - startTime) * 0.001
      uniforms.uMouse.value = [currentMouseX, currentMouseY]

      if (renderer) {
        renderer.render({ scene: mesh })
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      resizeObserver.disconnect()
      if (container && gl.canvas && container.contains(gl.canvas)) {
        container.removeChild(gl.canvas)
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [
    enableRainbow,
    gridColor,
    rippleIntensity,
    gridSize,
    gridThickness,
    fadeDistance,
    vignetteStrength,
    glowIntensity,
    opacity,
    mouseInteraction,
    mouseInteractionRadius,
  ])

  return (
    <div
      ref={containerRef}
      className={`ripple-grid-container ${className}`}
      aria-hidden="true"
    />
  )
}

export default RippleGrid
