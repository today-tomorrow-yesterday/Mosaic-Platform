"use client"

import React, { useRef, useEffect } from "react"
import { loadThree } from "./loadThree"

// ============================================================================
// WAVE PARTICLE GRID (Three.js)
// Ported 1:1 from specimen diagnostics V10.0
// High-performance BufferGeometry with points + line segments growing from floor.
// Container-sized via ResizeObserver.
// ============================================================================

export interface WaveParams { ecoMode: boolean }
export const DEFAULT_WAVE_PARAMS: WaveParams = { ecoMode: false }

export function WaveBackground({ params }: { params: WaveParams }): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{ rafId: number; ro: ResizeObserver | null }>({ rafId: 0, ro: null })

  useEffect(() => {
    let active = true

    loadThree().then(() => {
      if (!active || !containerRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as any).THREE
      const el = containerRef.current
      const w = el.clientWidth || 100, h = el.clientHeight || 100

      const scene = new THREE.Scene()
      scene.background = new THREE.Color("#000")
      scene.fog = new THREE.FogExp2("#000", 0.01)
      const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
      camera.position.set(14.4, 1.0, 37.9)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      el.appendChild(renderer.domElement)

      const ROWS = 50, COLS = 100, GAP = 1.11
      const count = ROWS * COLS

      // Points
      const particlePositions = new Float32Array(count * 3)
      const particleColors = new Float32Array(count * 3)
      const particlesGeo = new THREE.BufferGeometry()
      particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))
      particlesGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3))

      // Lines (2 verts per particle — top + bottom)
      const linePositions = new Float32Array(count * 2 * 3)
      const lineColors = new Float32Array(count * 2 * 3)
      const linesGeo = new THREE.BufferGeometry()
      linesGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3))
      linesGeo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3))

      // Procedural soft dot texture
      const dotCanvas = document.createElement("canvas")
      dotCanvas.width = 32; dotCanvas.height = 32
      const dotCtx = dotCanvas.getContext("2d")
      if (dotCtx) {
        const grad = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
        grad.addColorStop(0, "rgba(255,255,255,1)")
        grad.addColorStop(1, "rgba(255,255,255,0)")
        dotCtx.fillStyle = grad
        dotCtx.fillRect(0, 0, 32, 32)
      }
      const dotTexture = new THREE.CanvasTexture(dotCanvas)

      const pointsMat = new THREE.PointsMaterial({
        size: 0.20, map: dotTexture, vertexColors: true,
        transparent: true, opacity: 0.99, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const linesMat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending,
      })

      scene.add(new THREE.Points(particlesGeo, pointsMat))
      scene.add(new THREE.LineSegments(linesGeo, linesMat))

      // Layout + color init
      const c1 = new THREE.Color("#5ff785"), c2 = new THREE.Color("#004cff")
      const offsetX = (COLS * GAP) / 2, offsetZ = (ROWS * GAP) / 2
      let idx = 0, lineIdx = 0
      for (let x = 0; x < COLS; x++) {
        const mix = x / COLS
        const col = c1.clone().lerp(c2, mix)
        for (let z = 0; z < ROWS; z++) {
          const px = x * GAP - offsetX, pz = z * GAP - offsetZ
          particlePositions[idx * 3] = px
          particlePositions[idx * 3 + 2] = pz
          particleColors[idx * 3] = col.r
          particleColors[idx * 3 + 1] = col.g
          particleColors[idx * 3 + 2] = col.b

          linePositions[lineIdx * 3] = px
          linePositions[lineIdx * 3 + 2] = pz
          linePositions[(lineIdx + 1) * 3] = px
          linePositions[(lineIdx + 1) * 3 + 2] = pz

          lineColors[lineIdx * 3] = col.r
          lineColors[lineIdx * 3 + 1] = col.g
          lineColors[lineIdx * 3 + 2] = col.b
          lineColors[(lineIdx + 1) * 3] = col.r * 0.3
          lineColors[(lineIdx + 1) * 3 + 1] = col.g * 0.3
          lineColors[(lineIdx + 1) * 3 + 2] = col.b * 0.3

          idx++; lineIdx += 2
        }
      }
      particlesGeo.attributes.color.needsUpdate = true
      linesGeo.attributes.color.needsUpdate = true

      let time = 0
      const floorLevel = -5.0
      const clock = new THREE.Clock()

      const animate = (): void => {
        if (!active) return
        stateRef.current.rafId = requestAnimationFrame(animate)
        time += 0.0033

        let i = 0, li = 0
        for (let x = 0; x < COLS; x++) {
          for (let z = 0; z < ROWS; z++) {
            const px = particlePositions[i * 3] ?? 0
            const pz = particlePositions[i * 3 + 2] ?? 0
            const py = Math.sin(px * 0.27 + time) * 0.60
              + Math.cos(pz * 0.52 + time * 0.5) * 0.60
              + Math.sin((px + pz) * 0.1 + time) * 2.30

            particlePositions[i * 3 + 1] = py
            // Line grows from particle down to floor
            linePositions[li * 3 + 1] = py
            linePositions[(li + 1) * 3 + 1] = floorLevel

            i++; li += 2
          }
        }
        particlesGeo.attributes.position.needsUpdate = true
        linesGeo.attributes.position.needsUpdate = true
        renderer.render(scene, camera)
      }
      animate()

      const ro = new ResizeObserver(() => {
        if (!el || !active) return
        camera.aspect = el.clientWidth / el.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(el.clientWidth, el.clientHeight)
      })
      ro.observe(el)
      stateRef.current.ro = ro
    })

    return () => {
      active = false
      if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId)
      stateRef.current.ro?.disconnect()
      if (containerRef.current) containerRef.current.innerHTML = ""
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" style={{ overflow: "hidden", background: "#000" }} />
}
