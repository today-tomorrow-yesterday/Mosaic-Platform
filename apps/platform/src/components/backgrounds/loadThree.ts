// Shared Three.js CDN loader — ensures the script is loaded exactly once
// and returns a promise that resolves when THREE is available on window.

let loadPromise: Promise<void> | null = null

export function loadThree(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).THREE) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Three.js"))
    document.head.appendChild(script)
  })

  return loadPromise
}
