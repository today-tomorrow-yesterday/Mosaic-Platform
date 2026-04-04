"use client"

import React, { useRef, useState, useEffect, useMemo } from "react"

// ============================================================================
// RAIN BACKGROUND
// Embeds a vanilla JS rain library via iframe. Sized to parent container.
// ============================================================================

export interface RainParams {
  rainOpacity: number
  rainBgColor: string
}

export const DEFAULT_RAIN_PARAMS: RainParams = {
  rainOpacity: 0.9,
  rainBgColor: "#000000",
}

export function RainBackground({ params }: { params: RainParams }): React.ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [frameKey, setFrameKey] = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const handleResize = (): void => {
      clearTimeout(timeout)
      timeout = setTimeout(() => setFrameKey(prev => prev + 1), 250)
    }
    window.addEventListener("resize", handleResize)
    return () => { clearTimeout(timeout); window.removeEventListener("resize", handleResize) }
  }, [])

  useEffect(() => {
    let pointerRAF = 0
    const handlePointerMove = (e: PointerEvent): void => {
      if (pointerRAF) return
      pointerRAF = requestAnimationFrame(() => {
        pointerRAF = 0
        iframeRef.current?.contentWindow?.postMessage(
          { type: "raindrops-pointer", x: e.clientX, y: e.clientY }, "*"
        )
      })
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    return () => window.removeEventListener("pointermove", handlePointerMove)
  }, [frameKey])

  const srcDoc = useMemo(() => `<!doctype html><html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:transparent}
#bg-canvas{position:fixed;inset:0;width:100%;height:100%;display:block}</style></head><body>
<canvas id="bg-canvas"></canvas>
<script>(function(){var s=["https://fyildiz1974.github.io/web/files/raindrops.js","https://fthyldz.com/bio/js/raindrops.js"];var i=0;function t(){if(i>=s.length)return;var e=document.createElement("script");e.src=s[i++];e.async=true;e.onerror=t;document.body.appendChild(e)}t()})();</script>
<script>window.addEventListener("message",function(e){if(!e.data||e.data.type!=="raindrops-pointer")return;try{var ev=new MouseEvent("mousemove",{clientX:e.data.x,clientY:e.data.y,bubbles:true});window.dispatchEvent(ev);document.dispatchEvent(ev)}catch(err){}});</script>
</body></html>`, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: params.rainBgColor, opacity: params.rainOpacity, mixBlendMode: "screen", overflow: "hidden" }}>
      <iframe key={frameKey} ref={iframeRef} srcDoc={srcDoc}
        style={{ width: "100%", height: "100%", border: 0, display: "block", background: "transparent" }}
        title="Rain Effect" tabIndex={-1} aria-hidden="true" />
    </div>
  )
}
