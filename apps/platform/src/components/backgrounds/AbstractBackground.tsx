"use client"

import React, { useRef, useEffect } from "react"
import { loadThree } from "./loadThree"

export interface AbstractParams {
  abstractSpeed: number
  abstractTheme: string
  ecoMode: boolean
}

export const DEFAULT_ABSTRACT_PARAMS: AbstractParams = {
  abstractSpeed: 0.72,
  abstractTheme: "blue",
  ecoMode: false,
}

const THEMES: Record<string, { main: number[]; low: number[]; mid: number[]; high: number[] }> = {
  orange: { main: [1.0, 0.95, 0.7], low: [0.95, 0.75, 0.4], mid: [0.98, 0.7, 0.6], high: [1.0, 1.0, 1.0] },
  blue: { main: [0.7, 0.85, 1.0], low: [0.4, 0.6, 0.9], mid: [0.5, 0.7, 1.0], high: [0.9, 0.95, 1.0] },
  purple: { main: [0.9, 0.75, 1.0], low: [0.6, 0.45, 0.9], mid: [0.7, 0.55, 1.0], high: [0.95, 0.9, 1.0] },
  green: { main: [0.75, 1.0, 0.85], low: [0.4, 0.8, 0.6], mid: [0.5, 0.9, 0.7], high: [0.9, 1.0, 0.95] },
  crimson: { main: [1.0, 0.75, 0.75], low: [0.9, 0.5, 0.5], mid: [1.0, 0.6, 0.6], high: [1.0, 0.9, 0.9] },
}

export function AbstractBackground({ params }: { params: AbstractParams }): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const paramsRef = useRef(params)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glRef = useRef<{ material: any; renderer: any; rafId: number; time: number; ro: ResizeObserver | null }>({
    material: null, renderer: null, rafId: 0, time: 0, ro: null,
  })

  useEffect(() => { paramsRef.current = params }, [params])

  useEffect(() => {
    let active = true

    loadThree().then(() => {
      if (!active || !containerRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as any).THREE
      const el = containerRef.current
      const w = el.clientWidth || 100, h = el.clientHeight || 100
      const t = THEMES[paramsRef.current.abstractTheme] ?? { main: [0.7,0.85,1], low: [0.4,0.6,0.9], mid: [0.5,0.7,1], high: [0.9,0.95,1] }

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h)
      el.appendChild(renderer.domElement)
      glRef.current.renderer = renderer

      const material = new THREE.ShaderMaterial({
        vertexShader: `void main(){gl_Position=vec4(position,1.0);}`,
        fragmentShader: `
          precision highp float;
          uniform float u_time; uniform vec2 u_vp;
          uniform vec3 cM,cL,cMd,cH;
          float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}
          float noise(vec2 p){vec2 ip=floor(p);vec2 u=fract(p);u=u*u*(3.0-2.0*u);return mix(mix(rand(ip),rand(ip+vec2(1,0)),u.x),mix(rand(ip+vec2(0,1)),rand(ip+vec2(1,1)),u.x),u.y);}
          float fbm(vec2 x){float v=0.0,a=0.5;mat2 r=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5));for(int i=0;i<5;++i){v+=a*noise(x);x=r*x*2.0+100.0;a*=0.5;}return v;}
          void main(){
            vec2 uv=gl_FragCoord.xy/u_vp;uv.x*=u_vp.x/u_vp.y;
            vec2 st=uv*3.0;float t=u_time*0.3;
            vec2 q=vec2(fbm(st+t*0.4),fbm(st+vec2(5.2,1.3)+t*0.3));
            vec2 r=vec2(fbm(st+q+vec2(1.7,9.2)+t*0.15),fbm(st+q+vec2(8.3,2.8)+t*0.12));
            float f=fbm(st+r);float v=(f*f*0.6+f*0.7+0.5)*0.5;
            vec3 col=mix(cM,cL,clamp(v,0.0,1.0));
            col=mix(col,cMd,clamp(q.x*1.5,0.0,1.0));
            col=mix(col,cH,clamp(pow(r.y*1.2,2.0),0.0,1.0));
            gl_FragColor=vec4(col,1.0);
          }
        `,
        uniforms: {
          u_time: { value: 0 },
          u_vp: { value: new THREE.Vector2(w, h) },
          cM: { value: new THREE.Vector3(...t.main) },
          cL: { value: new THREE.Vector3(...t.low) },
          cMd: { value: new THREE.Vector3(...t.mid) },
          cH: { value: new THREE.Vector3(...t.high) },
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
          glRef.current.time += clock.getDelta() * paramsRef.current.abstractSpeed
          m.uniforms.u_time.value = glRef.current.time
          const th = THEMES[paramsRef.current.abstractTheme] ?? { main: [0.7,0.85,1], low: [0.4,0.6,0.9], mid: [0.5,0.7,1], high: [0.9,0.95,1] }
          m.uniforms.cM.value.set(...th.main)
          m.uniforms.cL.value.set(...th.low)
          m.uniforms.cMd.value.set(...th.mid)
          m.uniforms.cH.value.set(...th.high)
        }
        renderer.render(scene, camera)
      }
      animate()

      const ro = new ResizeObserver(() => {
        if (!el || !active) return
        renderer.setSize(el.clientWidth, el.clientHeight)
        material.uniforms.u_vp.value.set(el.clientWidth, el.clientHeight)
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
