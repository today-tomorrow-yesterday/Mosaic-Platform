"use client"

import React, { useRef, useEffect } from "react"

// ============================================================================
// FOREST BACKGROUND (Canvas 2D)
// Procedural parallax forest with layered tree silhouettes and fog.
// Lightweight Canvas 2D — no Three.js dependency.
// ============================================================================

export interface ForestParams { ecoMode: boolean }
export const DEFAULT_FOREST_PARAMS: ForestParams = { ecoMode: false }

export function ForestBackground({ params }: { params: ForestParams }): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let w = 0, h = 0, active = true, time = 0

    const resize = (): void => {
      const parent = canvas.parentElement
      if (!parent) return
      w = canvas.width = parent.offsetWidth
      h = canvas.height = parent.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    // Pre-generate tree positions per layer for consistency
    const layers = 5
    const treeLayers: Array<Array<{ x: number; h: number; w: number }>> = []
    for (let l = 0; l < layers; l++) {
      const trees: Array<{ x: number; h: number; w: number }> = []
      const count = 15 + l * 8
      for (let i = 0; i < count; i++) {
        trees.push({
          x: Math.random() * 3000,
          h: 40 + Math.random() * 80 * (1 + l * 0.3),
          w: 8 + Math.random() * 15,
        })
      }
      treeLayers.push(trees)
    }

    const drawTree = (x: number, baseY: number, treeH: number, treeW: number, color: string): void => {
      // Trunk
      ctx.fillStyle = color
      ctx.fillRect(x - treeW * 0.15, baseY - treeH * 0.3, treeW * 0.3, treeH * 0.3)
      // Canopy (triangle)
      ctx.beginPath()
      ctx.moveTo(x, baseY - treeH)
      ctx.lineTo(x - treeW, baseY - treeH * 0.25)
      ctx.lineTo(x + treeW, baseY - treeH * 0.25)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    }

    const animate = (): void => {
      if (!active) return
      requestAnimationFrame(animate)
      time += 0.3

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
      skyGrad.addColorStop(0, "#b7cdd7")
      skyGrad.addColorStop(0.6, "#8aabb8")
      skyGrad.addColorStop(1, "#2a3a2a")
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Parallax layers (back to front)
      for (let l = 0; l < layers; l++) {
        const depth = layers - l
        const speed = depth * 0.3
        const baseY = h * (0.5 + l * 0.08)
        const alpha = 0.15 + l * 0.17
        const shade = Math.floor(10 + l * 20)
        const color = `rgba(${shade}, ${shade + 10}, ${shade + 5}, ${alpha + 0.3})`

        // Ground strip
        ctx.fillStyle = `rgba(${shade}, ${shade + 8}, ${shade}, ${alpha + 0.2})`
        ctx.fillRect(0, baseY, w, h - baseY)

        // Trees
        const trees = treeLayers[l] ?? []
        for (const tree of trees) {
          const tx = ((tree.x - time * speed) % (w + 200)) - 100
          drawTree(tx, baseY, tree.h * (0.5 + l * 0.15), tree.w, color)
        }

        // Fog layer
        ctx.fillStyle = `rgba(183, 205, 215, ${0.08 * depth})`
        ctx.fillRect(0, baseY - 40, w, 80)
      }
    }
    animate()

    return () => { active = false; ro.disconnect() }
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  )
}
