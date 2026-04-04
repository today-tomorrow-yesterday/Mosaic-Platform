"use client"

import React, { useRef, useEffect } from "react"
import { loadThree } from "./loadThree"

export interface FluidParams {
  fluidSpeed: number
  fluidZoom: number
  fluidComplexity: number
  fluidMorphSpeed: number
  fluidMorphIntensity: number
  fluidTheme: string
  ecoMode: boolean
}

export const DEFAULT_FLUID_PARAMS: FluidParams = {
  fluidSpeed: 0.6,
  fluidZoom: 0.9193,
  fluidComplexity: 0.7007,
  fluidMorphSpeed: 0.834,
  fluidMorphIntensity: 0.7005,
  fluidTheme: "Original Holographic",
  ecoMode: false,
}

export function FluidBackground({ params }: { params: FluidParams }): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const paramsRef = useRef(params)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glRef = useRef<{ material: any; renderer: any; rafId: number; ro: ResizeObserver | null }>({
    material: null, renderer: null, rafId: 0, ro: null,
  })

  useEffect(() => { paramsRef.current = params }, [params])

  useEffect(() => {
    let active = true

    loadThree().then(() => {
      if (!active || !containerRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as any).THREE
      const el = containerRef.current
      const w = el.clientWidth || 100
      const h = el.clientHeight || 100

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
      camera.position.z = 1

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      el.appendChild(renderer.domElement)
      glRef.current.renderer = renderer

      const material = new THREE.ShaderMaterial({
        vertexShader: `void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
          uniform vec3 uRes; uniform float uTime, uSpeed, uZoom, uComplexity, uMorphSpeed, uMorphInt;
          void main(){
            float mr=min(uRes.x,uRes.y);
            vec2 uv=(gl_FragCoord.xy*2.0-uRes.xy)/mr*uZoom;
            float t=uTime*uSpeed*0.3, mt=uTime*uMorphSpeed*0.5, d=-t*0.5, a=0.0;
            for(float i=0.0;i<8.0;++i){
              vec2 mo=vec2(sin(mt+i*1.3),cos(mt-i*1.1))*uMorphInt;
              a+=cos(i-d-(uv.x+mo.x)*uComplexity);
              d+=sin((uv.y+mo.y)*uComplexity+a);
            }
            d+=t*0.5;
            vec3 c=vec3(cos(uv*vec2(d,a))*0.6+0.4,cos(a+d)*0.5+0.5);
            c=cos(c*cos(vec3(d,a,2.5))*0.5+0.5);
            gl_FragColor=vec4(c,1.0);
          }
        `,
        uniforms: {
          uRes: { value: new THREE.Vector3(w, h, 1) },
          uTime: { value: 0 },
          uSpeed: { value: paramsRef.current.fluidSpeed },
          uZoom: { value: paramsRef.current.fluidZoom },
          uComplexity: { value: paramsRef.current.fluidComplexity },
          uMorphSpeed: { value: paramsRef.current.fluidMorphSpeed },
          uMorphInt: { value: paramsRef.current.fluidMorphIntensity },
        },
      })
      glRef.current.material = material

      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))
      const clock = new THREE.Clock()

      const animate = (): void => {
        if (!active) return
        glRef.current.rafId = requestAnimationFrame(animate)
        const m = glRef.current.material
        if (m) {
          m.uniforms.uTime.value = clock.getElapsedTime()
          m.uniforms.uSpeed.value = paramsRef.current.fluidSpeed
          m.uniforms.uZoom.value = paramsRef.current.fluidZoom
          m.uniforms.uComplexity.value = paramsRef.current.fluidComplexity
          m.uniforms.uMorphSpeed.value = paramsRef.current.fluidMorphSpeed
          m.uniforms.uMorphInt.value = paramsRef.current.fluidMorphIntensity
        }
        renderer.render(scene, camera)
      }
      animate()

      const ro = new ResizeObserver(() => {
        if (!el || !active) return
        const nw = el.clientWidth, nh = el.clientHeight
        renderer.setSize(nw, nh)
        material.uniforms.uRes.value.set(nw, nh, 1)
      })
      ro.observe(el)
      glRef.current.ro = ro
    })

    return () => {
      active = false
      if (glRef.current.rafId) cancelAnimationFrame(glRef.current.rafId)
      glRef.current.ro?.disconnect()
      if (glRef.current.renderer && containerRef.current) {
        try { containerRef.current.removeChild(glRef.current.renderer.domElement) } catch {}
        glRef.current.renderer.dispose()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" style={{ overflow: "hidden" }} />
}
