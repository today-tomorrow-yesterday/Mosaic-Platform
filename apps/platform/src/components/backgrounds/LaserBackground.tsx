"use client"

import React, { useRef, useEffect } from "react"
import { loadThree } from "./loadThree"

// ============================================================================
// LASER PROJECTOR BACKGROUND (Three.js)
// Ported 1:1 from specimen diagnostics V10.0
// Volumetric beam shader with additive blending, auto-cycling movement modes,
// and rainbow color cycling. Container-sized via ResizeObserver.
// ============================================================================

export interface LaserParams { ecoMode: boolean }
export const DEFAULT_LASER_PARAMS: LaserParams = { ecoMode: false }

export function LaserBackground({ params }: { params: LaserParams }): React.ReactElement {
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
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000)
      camera.position.set(0, 0, 80)
      camera.lookAt(new THREE.Vector3(0, 15, 0))

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.ReinhardToneMapping
      el.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 0.1))

      // Volumetric beam shader — fades at edges and distance, over-brightens core
      const beamMaterial = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0xffffff) } },
        vertexShader: `
          varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewPosition;
          void main(){
            vUv=uv; vNormal=normalize(normalMatrix*normal);
            vec4 mv=modelViewMatrix*vec4(position,1.0); vViewPosition=-mv.xyz;
            gl_Position=projectionMatrix*mv;
          }
        `,
        fragmentShader: `
          uniform vec3 color; varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewPosition;
          void main(){
            vec3 n=normalize(vNormal); vec3 v=normalize(vViewPosition);
            float vd=abs(dot(n,v)); float edge=pow(vd,2.0)+0.05;
            float fade=pow(1.0-vUv.y,1.5); float a=edge*fade;
            vec3 core=color*(1.0+pow(vd,4.0)*3.0);
            gl_FragColor=vec4(core,a*0.95);
          }
        `,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide,
      })

      const beamGeo = new THREE.CylinderGeometry(2.0, 0.05, 300, 32, 1, true)
      beamGeo.translate(0, 150, 0)

      // Physical projector base
      const headGeo = new THREE.CylinderGeometry(1.5, 1.2, 4, 16)
      headGeo.translate(0, 2, 0)
      const headMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.8 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type Projector = { group: any; beams: any[]; targetRot: { x: number; y: number; z: number } }
      const projectors: Projector[] = []

      const createProjector = (pos: [number, number, number], numBeams: number, spread: number): Projector => {
        const group = new THREE.Group()
        group.position.set(...pos)
        scene.add(group)
        group.add(new THREE.Mesh(headGeo, headMat))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const beams: any[] = []
        for (let i = 0; i < numBeams; i++) {
          const beam = new THREE.Mesh(beamGeo, beamMaterial.clone())
          beam.rotation.z = numBeams > 1 ? -spread / 2 + (spread / (numBeams - 1)) * i : 0
          group.add(beam)
          beams.push(beam)
        }
        return { group, beams, targetRot: { x: 0, y: 0, z: 0 } }
      }

      projectors.push(createProjector([0, -25, 0], 15, Math.PI / 1.2))
      projectors.push(createProjector([-45, -25, 0], 11, Math.PI / 1.5))
      projectors.push(createProjector([45, -25, 0], 11, Math.PI / 1.5))

      const modes = ["Wave", "Crossfire", "Vortex", "Scanner", "Focus", "Fan", "Chaos"]
      const clock = new THREE.Clock()

      const animate = (): void => {
        if (!active) return
        stateRef.current.rafId = requestAnimationFrame(animate)
        const time = clock.getElapsedTime()
        const modeIdx = Math.floor(time / 8.0) % modes.length
        const mode = modes[modeIdx] ?? "Wave"

        projectors.forEach((proj, index) => {
          const t = time * 1.0
          const sym = index === 1 ? -1 : index === 2 ? 1 : 0
          let tX = 0, tY = 0, tZ = 0

          switch (mode) {
            case "Wave": tZ = Math.sin(t * 0.8); tX = Math.cos(t * 0.4) * 0.8 + 0.8; tY = Math.sin(t * 0.2) * 0.2; break
            case "Crossfire": tZ = index === 0 ? Math.cos(t * 1.5) * 0.8 : Math.sin(t * 1.2) * 1.2 * sym; tX = Math.sin(t * 2) * 0.7 + 0.9; break
            case "Vortex": tZ = Math.sin(t * 1.5) * 1.2; tX = Math.cos(t * 1.5) * 0.6 + 0.8; tY = Math.sin(t * 0.5) * 0.4 * sym; break
            case "Scanner": tZ = sym * 0.4 + Math.sin(t * 4) * 0.1; tX = Math.sin(t * 3.5) * 0.9 + 0.9; break
            case "Focus": tZ = -sym * 0.7 + Math.sin(t * 0.8) * 0.4; tX = Math.sin(t * 1.2) * 0.4 + 0.6; break
            case "Fan": tZ = Math.sin(t * 0.8) * 0.8 * sym; tX = Math.cos(t * 1.2) * 0.5 + 0.9; tY = Math.sin(t * 1.5) * 0.6 * sym; break
            case "Chaos": { const st = Math.floor(t * 3); tZ = Math.sin(st * 14.3) * 1.2; tX = Math.cos(st * 27.1) * 0.5 + 0.8; tY = Math.sin(st * 11.5) * 0.5 * sym; break }
          }

          proj.targetRot = { x: tX, y: tY, z: tZ }
          proj.group.rotation.x += (tX - proj.group.rotation.x) * 0.05
          proj.group.rotation.y += (tY - proj.group.rotation.y) * 0.05
          proj.group.rotation.z += (tZ - proj.group.rotation.z) * 0.05

          // Rainbow color cycling
          const baseHue = (time * 0.2) % 1
          const hueOffset = (index * 0.18) % 1
          const color = new THREE.Color().setHSL((baseHue + hueOffset) % 1, 1, 0.6)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          proj.beams.forEach((beam: any) => beam.material.uniforms.color.value.copy(color))
        })

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
