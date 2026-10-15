import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

type Props = {
  shader: string
  className?: string
  /** Max device pixel ratio; thumbnails stay cheap, the viewing room goes sharper. */
  maxDpr?: number
  /** Starting offset so works sharing a shader never look identical. */
  seed?: number
  label: string
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * Renders one fragment shader full-bleed. The pointer and hover state come from
 * the canvas' parent element so the whole card is the interactive surface.
 * Rendering pauses whenever the canvas leaves the viewport or the tab hides.
 */
export function ShaderCanvas({ shader, className = '', maxDpr = 1.5, seed = 0, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance', premultipliedAlpha: false })
    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fs = compile(gl, gl.FRAGMENT_SHADER, shader)
    const program = gl.createProgram()
    if (!vs || !fs || !program) {
      setFailed(true)
      return
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true)
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRes = gl.getUniformLocation(program, 'u_res')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uHover = gl.getUniformLocation(program, 'u_hover')

    const reduced = prefersReducedMotion()
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }
    let hover = 0
    let hoverTarget = 0
    let visible = false
    let raf = 0
    let last = performance.now()
    let time = seed * 37.0 + 4.0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!reduced) time += dt
      mouse.x += (mouse.tx - mouse.x) * 0.08
      mouse.y += (mouse.ty - mouse.y) * 0.08
      hover += (hoverTarget - hover) * 0.06
      gl.uniform1f(uTime, time)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform1f(uHover, hover)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = (now: number) => {
      draw(now)
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0
    }
    const wake = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      mouse.tx = (e.clientX - r.left) / r.width
      mouse.ty = 1 - (e.clientY - r.top) / r.height
      hoverTarget = 1
      wake()
    }
    const onLeave = () => {
      hoverTarget = 0
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      wake()
    }, { rootMargin: '120px' })
    io.observe(canvas)
    const ro = new ResizeObserver(() => {
      resize()
      draw(performance.now())
    })
    ro.observe(canvas)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerdown', onMove)
    host.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', wake)
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      setFailed(true)
    })

    resize()
    draw(performance.now())

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onMove)
      host.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', wake)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [shader, maxDpr, seed])

  return (
    <>
      <canvas ref={canvasRef} role="img" aria-label={label} className={`block h-full w-full ${className}`} />
      {failed && (
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_20%,#2a2a27_0%,#0e0e0d_45%,#050505_100%)]"
        >
          <div className="absolute inset-[18%] border border-acid/60" />
        </div>
      )}
    </>
  )
}
