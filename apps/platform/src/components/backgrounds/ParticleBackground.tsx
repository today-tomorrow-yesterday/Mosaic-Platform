"use client"

import React, { useRef, useEffect } from "react"

// ============================================================================
// PARTICLE BACKGROUND (Canvas 2D)
// Ported 1:1 from specimen diagnostics V10.0
// Optimized Canvas rendering loop with 3D rotation math, wind physics,
// gravity, turbulence, and per-particle image sprites.
// Container-sized via ResizeObserver.
// ============================================================================

export interface ParticleParams {
  ecoMode: boolean
  bgColor: string
  minWind: number
  maxWind: number
  minSize: number
  maxSize: number
  emitterY: number
  emitterSpread: number
  gravity: number
  turbulence: number
  rotationSpeed: number
  tumbleStrength: number
  staticTilt: number
  particleCount: number
}

export const DEFAULT_PARTICLE_PARAMS: ParticleParams = {
  ecoMode: false,
  bgColor: "#000000",
  minWind: 1.5,
  maxWind: 18,
  minSize: 16,
  maxSize: 57,
  emitterY: 0.4,
  emitterSpread: 0.35,
  gravity: 0.6,
  turbulence: 0.8,
  rotationSpeed: 0,
  tumbleStrength: 0.4,
  staticTilt: 0,
  particleCount: 100,
}

// 3D rotation math simulated in a 2D canvas context
function rotateVector(x: number, y: number, z: number, ax: number, ay: number, az: number): { x: number; y: number; z: number } {
  let cos = Math.cos(az), sin = Math.sin(az)
  let x1 = x * cos - y * sin, y1 = x * sin + y * cos, z1 = z
  cos = Math.cos(ay); sin = Math.sin(ay)
  const x2 = x1 * cos + z1 * sin, y2 = y1, z2 = -x1 * sin + z1 * cos
  cos = Math.cos(ax); sin = Math.sin(ax)
  return { x: x2, y: y2 * cos - z2 * sin, z: y2 * sin + z2 * cos }
}

export function ParticleBackground({ params }: { params: ParticleParams }): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef(params)

  useEffect(() => { paramsRef.current = params }, [params])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let width = 0, height = 0, active = true

    const resize = (): void => {
      const parent = canvas.parentElement
      if (!parent) return
      width = canvas.width = parent.clientWidth
      height = canvas.height = parent.clientHeight
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    // Fallback vector leaf shape
    const createDefaultImage = (): HTMLImageElement => {
      const c = document.createElement("canvas")
      c.width = 128; c.height = 128
      const t = c.getContext("2d")
      if (t) {
        t.scale(2, 2)
        t.beginPath()
        t.moveTo(32, 5)
        t.quadraticCurveTo(5, 32, 32, 59)
        t.quadraticCurveTo(59, 32, 32, 5)
        t.fillStyle = "#e67e22"
        t.fill()
        t.strokeStyle = "#d35400"
        t.lineWidth = 2
        t.stroke()
        t.beginPath()
        t.moveTo(32, 5)
        t.lineTo(32, 59)
        t.stroke()
      }
      const img = new Image()
      img.src = c.toDataURL()
      return img
    }

    const defaultImg = createDefaultImage()

    class Particle {
      x = 0; y = 0; vx = 0; vy = 0
      width = 0; height = 0
      windFactor = 0; waveOffset = 0
      angleZ = 0; spinZ = 0
      angleX = 0; angleY = 0; spinX = 0; spinY = 0
      image: HTMLImageElement = defaultImg

      constructor(onScreen: boolean) { this.reset(onScreen) }

      reset(onScreen: boolean): void {
        const s = paramsRef.current
        this.image = defaultImg
        const minS = Math.min(s.minSize, s.maxSize)
        const maxS = Math.max(s.minSize, s.maxSize)
        this.width = minS + Math.random() * (maxS - minS)
        this.height = this.width

        const centerY = height * s.emitterY
        const spreadH = height * s.emitterSpread
        this.y = centerY - spreadH / 2 + Math.random() * spreadH
        this.x = onScreen ? Math.random() * width : -this.width - Math.random() * 200

        const sizeFactor = (this.width - minS) / (maxS - minS || 1)
        this.windFactor = Math.max(0.1, Math.min(1, 1.0 - (sizeFactor * 0.5 + Math.random() * 0.5)))
        this.vx = 0; this.vy = 0
        this.waveOffset = Math.random() * Math.PI * 2
        this.angleZ = Math.random() * 360
        this.spinZ = (Math.random() - 0.5) * s.rotationSpeed
        this.angleX = 0; this.angleY = 0
        this.spinX = (Math.random() - 0.5) * 0.1
        this.spinY = (Math.random() - 0.5) * 0.1
      }

      update(timeStep: number): void {
        const s = paramsRef.current
        const realMin = Math.min(s.minWind, s.maxWind)
        const realMax = Math.max(s.minWind, s.maxWind)
        const targetSpeed = realMin + (realMax - realMin) * this.windFactor

        this.vx += (targetSpeed - this.vx) * 0.1 * timeStep
        this.x += this.vx * timeStep

        const gravityMod = 1.5 - this.windFactor
        this.vy += s.gravity * 0.05 * gravityMod * timeStep
        const wave = Math.sin(this.x * 0.01 + this.waveOffset)
        this.vy += wave * (s.turbulence * 0.05) * timeStep
        this.vy *= Math.pow(0.98, timeStep)
        this.y += this.vy * timeStep

        this.angleZ += (this.spinZ + this.vx * 0.002) * timeStep
        if (s.tumbleStrength > 0) {
          this.angleX += this.spinX * s.tumbleStrength * timeStep
          this.angleY += this.spinY * s.tumbleStrength * timeStep
        }

        if (this.x > width + 200 || this.y > height + 200 || this.y < -200) this.reset(false)
      }

      draw(): void {
        if (!ctx || !this.image) return
        const s = paramsRef.current
        const tiltRad = (s.staticTilt * Math.PI) / 180
        const vecU = rotateVector(1, 0, 0, this.angleX, this.angleY + tiltRad, this.angleZ)
        const vecV = rotateVector(0, 1, 0, this.angleX, this.angleY + tiltRad, this.angleZ)
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.transform(vecU.x, vecU.y, vecV.x, vecV.y, 0, 0)
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
        ctx.restore()
      }
    }

    const particles: Particle[] = []
    for (let i = 0; i < paramsRef.current.particleCount; i++) {
      particles.push(new Particle(true))
    }

    let lastRenderTime = 0
    const animate = (timestamp?: number): void => {
      if (!active) return
      requestAnimationFrame(animate)

      const s = paramsRef.current
      let timeStep = 1
      if (s.ecoMode) {
        if (!timestamp) timestamp = performance.now()
        if (timestamp - lastRenderTime < 33) return
        lastRenderTime = timestamp
        timeStep = 2
      }

      // Sync particle count
      const diff = s.particleCount - particles.length
      if (diff > 0) for (let i = 0; i < diff; i++) particles.push(new Particle(true))
      else if (diff < 0) particles.splice(0, Math.abs(diff))

      ctx.fillStyle = s.bgColor
      ctx.fillRect(0, 0, width, height)
      particles.forEach(p => { p.update(timeStep); p.draw() })
    }
    animate()

    return () => { active = false; ro.disconnect() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ overflow: "hidden", background: "#000" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  )
}
