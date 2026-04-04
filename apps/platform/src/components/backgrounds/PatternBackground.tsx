"use client"

import React, { useRef, useEffect } from "react"
import { loadThree } from "./loadThree"

export interface PatternParams { ecoMode: boolean }
export const DEFAULT_PATTERN_PARAMS: PatternParams = { ecoMode: false }

export function PatternBackground({ params }: { params: PatternParams }): React.ReactElement {
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
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      const renderer = new THREE.WebGLRenderer({ antialias: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      el.appendChild(renderer.domElement)

      const material = new THREE.ShaderMaterial({
        vertexShader: `void main(){gl_Position=vec4(position,1.0);}`,
        fragmentShader: `
          precision highp float;
          uniform float uTime;uniform vec2 uRes;
          vec3 perm(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
          float snoise(vec2 v){
            const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
            vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
            vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);
            vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
            vec3 p=perm(perm(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
            vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;
            vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
            m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
            vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
            return 130.0*dot(m,g);
          }
          void main(){
            vec2 uv=gl_FragCoord.xy/uRes-0.5;uv.x*=uRes.x/uRes.y;
            uv=abs(uv);uv*=2.0;float t=uTime*0.03;
            uv.x+=sin(uv.y*2.0+t)*0.35;uv.y+=cos(uv.x*2.0-t)*0.35;
            float n1=snoise(uv+t)*0.5+0.5;float n2=snoise(uv*1.5-vec2(0,t*0.3))*0.5+0.5;float n3=snoise(uv*2.5+vec2(t*0.2))*0.5+0.5;
            vec3 bg=vec3(0.106,0.114,0.314);vec3 c1=vec3(0.008,0.027,0.071);vec3 c2=vec3(0.345,0.561,1.0);vec3 acc=vec3(0.0,0.259,0.502);
            vec3 col=bg;col=mix(col,c1,smoothstep(0.3,0.7,n1));col=mix(col,c2,smoothstep(0.3,0.7,n2));col+=acc*smoothstep(0.3,0.7,n3)*0.6;
            col+=(fract(sin(dot(uv+t,vec2(12.9898,78.233)))*43758.5453)-0.5)*0.03;
            gl_FragColor=vec4(col,1.0);
          }
        `,
        uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(w, h) } },
      })
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))
      const clock = new THREE.Clock()

      const animate = (): void => {
        if (!active) return
        stateRef.current.rafId = requestAnimationFrame(animate)
        material.uniforms.uTime.value += clock.getDelta()
        renderer.render(scene, camera)
      }
      animate()

      const ro = new ResizeObserver(() => {
        if (!el || !active) return
        renderer.setSize(el.clientWidth, el.clientHeight)
        material.uniforms.uRes.value.set(el.clientWidth, el.clientHeight)
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

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" style={{ overflow: "hidden" }} />
}
