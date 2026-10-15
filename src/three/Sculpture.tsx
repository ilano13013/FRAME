import { useMemo, useRef, type ComponentRef, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { SculptureInput } from './input'

type InputRef = MutableRefObject<SculptureInput>
type DistortMaterial = ComponentRef<typeof MeshDistortMaterial>

const damp = THREE.MathUtils.damp

function Core({ input, detail }: { input: InputRef; detail: number }) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const material = useRef<DistortMaterial>(null)
  const spin = useRef({ y: 0, x: 0, vy: 0, vx: 0 })

  useFrame((_, dt) => {
    const i = input.current
    const s = spin.current
    if (!group.current || !mesh.current || !material.current) return

    s.vy += i.dragX * 0.0035
    s.vx += i.dragY * 0.0025
    i.dragX = 0
    i.dragY = 0
    s.vy *= Math.pow(0.04, dt)
    s.vx *= Math.pow(0.04, dt)
    s.y += s.vy + dt * 0.18
    s.x = THREE.MathUtils.clamp(s.x + s.vx, -0.9, 0.9)

    i.pulse = damp(i.pulse, 0, 2.6, dt)
    i.speed = damp(i.speed, 0, 3, dt)

    mesh.current.rotation.y = s.y
    mesh.current.rotation.x = s.x + Math.sin(s.y * 0.5) * 0.15
    group.current.rotation.y = damp(group.current.rotation.y, i.px * 0.55, 3.5, dt)
    group.current.rotation.x = damp(group.current.rotation.x, -i.py * 0.35 + i.scroll * 0.8, 3.5, dt)

    const scale = (0.55 + i.reveal * 0.45) * (1 + i.pulse * 0.14 - i.scroll * 0.18)
    group.current.scale.setScalar(damp(group.current.scale.x, scale, 6, dt))
    group.current.position.y = damp(group.current.position.y, i.scroll * 0.9, 4, dt)

    const distort = 0.42 + Math.min(i.speed, 1) * 0.28 + i.pulse * 0.42
    material.current.distort = damp(material.current.distort, distort, 4, dt)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.15, detail]} />
        <MeshDistortMaterial
          ref={material}
          color="#d9d8d2"
          metalness={1}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.35}
          distort={0.42}
          speed={1.4}
        />
      </mesh>
      <Rings input={input} />
    </group>
  )
}

function Rings({ input }: { input: InputRef }) {
  const a = useRef<THREE.Mesh>(null)
  const b = useRef<THREE.Mesh>(null)
  const acid = useRef<THREE.Mesh>(null)
  const satellites = useRef<THREE.Group>(null)

  const orbit = useMemo(
    () =>
      Array.from({ length: 6 }, (_, k) => ({
        r: 1.75 + (k % 3) * 0.28,
        speed: 0.25 + k * 0.06,
        phase: (k / 6) * Math.PI * 2,
        tilt: (k % 2 ? 1 : -1) * (0.3 + k * 0.07),
        size: 0.035 + (k % 3) * 0.02,
      })),
    [],
  )

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const i = input.current
    if (a.current) {
      a.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.3) * 0.1
      a.current.rotation.z += dt * 0.25
    }
    if (b.current) {
      b.current.rotation.y += dt * (0.32 + i.speed * 0.8)
      b.current.rotation.x = Math.PI / 3 + i.py * 0.2
    }
    if (acid.current) {
      acid.current.rotation.z -= dt * 0.4
      acid.current.rotation.x = Math.PI / 2 + Math.cos(t * 0.2) * 0.3
      const s = 1 + i.pulse * 0.25
      acid.current.scale.setScalar(s)
    }
    satellites.current?.children.forEach((child, k) => {
      const o = orbit[k]
      const ang = o.phase + t * o.speed
      child.position.set(Math.cos(ang) * o.r, Math.sin(ang) * o.r * o.tilt, Math.sin(ang) * o.r)
    })
  })

  return (
    <>
      <mesh ref={a}>
        <torusGeometry args={[1.72, 0.022, 24, 220]} />
        <meshStandardMaterial color="#e8e6df" metalness={1} roughness={0.12} />
      </mesh>
      <mesh ref={b}>
        <torusGeometry args={[2.05, 0.012, 16, 240]} />
        <meshStandardMaterial color="#cfcdc6" metalness={1} roughness={0.2} />
      </mesh>
      <mesh ref={acid}>
        <torusGeometry args={[1.42, 0.006, 8, 200]} />
        <meshBasicMaterial color="#c6ff1a" toneMapped={false} />
      </mesh>
      <group ref={satellites}>
        {orbit.map((o, k) => (
          <mesh key={k}>
            <sphereGeometry args={[o.size, 24, 24]} />
            <meshStandardMaterial color="#f1eee6" metalness={1} roughness={0.08} />
          </mesh>
        ))}
      </group>
    </>
  )
}

/**
 * Studio light rig, baked once into an environment map. The map then turns with
 * the pointer through scene.environmentRotation, so reflections follow the
 * visitor without re-rendering the cube every frame.
 */
function Studio({ input }: { input: InputRef }) {
  useFrame((state, dt) => {
    const i = input.current
    const rot = state.scene.environmentRotation
    rot.y = damp(rot.y, i.px * 1.2 + state.clock.elapsedTime * 0.06, 2.5, dt)
    rot.x = damp(rot.x, i.py * 0.45, 2.5, dt)
  })
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#161615']} />
      <Lightformer form="rect" intensity={6} color="#f1eee6" scale={[16, 16, 1]} position={[0, 7, 0]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={0.9} color="#6e6e69" scale={[30, 30, 1]} position={[0, -7, 0]} rotation-x={-Math.PI / 2} />
      <Lightformer form="rect" intensity={3} color="#f1eee6" scale={[1.6, 12, 1]} position={[0.0, 0, 7.0]} rotation-y={3.142} />
      <Lightformer form="rect" intensity={1.6} color="#f1eee6" scale={[0.9, 12, 1]} position={[4.95, 0, 4.95]} rotation-y={3.927} />
      <Lightformer form="rect" intensity={4} color="#c6ff1a" scale={[1.6, 12, 1]} position={[7.0, 0, 0.0]} rotation-y={4.712} />
      <Lightformer form="rect" intensity={1.6} color="#f1eee6" scale={[0.9, 12, 1]} position={[4.95, 0, -4.95]} rotation-y={5.498} />
      <Lightformer form="rect" intensity={3} color="#f1eee6" scale={[1.6, 12, 1]} position={[0.0, 0, -7.0]} rotation-y={6.283} />
      <Lightformer form="rect" intensity={4} color="#c6ff1a" scale={[0.9, 12, 1]} position={[-4.95, 0, -4.95]} rotation-y={7.069} />
      <Lightformer form="rect" intensity={3} color="#f1eee6" scale={[1.6, 12, 1]} position={[-7.0, 0, -0.0]} rotation-y={7.854} />
      <Lightformer form="rect" intensity={1.6} color="#f1eee6" scale={[0.9, 12, 1]} position={[-4.95, 0, 4.95]} rotation-y={8.639} />
      <Lightformer form="ring" intensity={4} color="#f1eee6" scale={2.4} position={[2.5, 2, 6]} />
    </Environment>
  )
}

export default function Sculpture({ input, active, compact }: { input: InputRef; active: boolean; compact: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={compact ? [1, 1.5] : [1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, compact ? 7 : 5], fov: 35 }}
      aria-hidden
    >
      <Studio input={input} />
      <Core input={input} detail={compact ? 28 : 56} />
      <Sparkles count={compact ? 30 : 60} scale={[7, 5, 3]} size={2.2} speed={0.35} color="#c6ff1a" opacity={0.7} />
    </Canvas>
  )
}
