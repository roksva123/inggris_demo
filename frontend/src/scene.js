import * as THREE from 'three'
import gsap from 'gsap'

const palette = { cream: 0xf4efe6, forest: 0x1f3d2b, tomato: 0xff5a36, mustard: 0xf2b705, ink: 0x14110f }

const createMaterial = (color) => new THREE.MeshToonMaterial({ color, transparent: true, opacity: 0.9 })

const setAppearance = (object, opacity, scale) => {
  object.traverse((child) => {
    if (child.material) {
      child.material.transparent = true
      child.material.opacity = opacity
    }
  })
  object.scale.setScalar(scale)
}

const makeBook = () => {
  const group = new THREE.Group()
  const cover = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.2), createMaterial(palette.tomato))
  const pages = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.3, 1.06), createMaterial(palette.cream))
  pages.position.y = 0.12
  group.add(cover, pages)
  return group
}

const makePencil = () => {
  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.1, 8), createMaterial(palette.mustard))
  body.rotation.z = Math.PI / 2
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 8), createMaterial(palette.ink))
  tip.rotation.z = -Math.PI / 2
  tip.position.x = 1.2
  group.add(body, tip)
  return group
}

const makeLightbulb = () => {
  const group = new THREE.Group()
  const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), createMaterial(palette.mustard))
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.42, 8), createMaterial(palette.ink))
  base.position.y = -0.62
  group.add(bulb, base)
  return group
}

const makeShape = (kind, color) => {
  if (kind === 'book') return makeBook()
  if (kind === 'pencil') return makePencil()
  if (kind === 'bulb') return makeLightbulb()
  const geometry = kind === 'sphere' ? new THREE.IcosahedronGeometry(0.55, 0) : new THREE.BoxGeometry(0.82, 0.82, 0.82)
  return new THREE.Mesh(geometry, createMaterial(color))
}

export const createScene = () => {
  const canvas = document.querySelector('#scene-canvas')
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { destroy: () => {} }
  const isMobile = innerWidth < 768
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(palette.cream, 14, 30)
  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 100)
  camera.position.set(0, 0.2, 8)
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2))
  renderer.setSize(innerWidth, innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const ambient = new THREE.AmbientLight(0xfff7e8, 1.25)
  const directional = new THREE.DirectionalLight(0xffffff, 2.6)
  directional.position.set(3, 5, 6)
  scene.add(ambient, directional)

  const objects = isMobile ? [
    { mesh: makeBook(), position: [-2.75, 1.35, 0], scale: 0.58 },
    { mesh: makePencil(), position: [2.75, 1.25, -0.4], scale: 0.52 },
  ] : [
    { mesh: makeBook(), position: [-2.4, 1.2, 0], scale: 0.92 },
    { mesh: makePencil(), position: [2.4, 1.2, -0.4], scale: 0.85 },
    { mesh: makeShape('cube', palette.forest), position: [-2.7, -1.5, -0.2], scale: 0.8 },
    { mesh: makeShape('sphere', palette.tomato), position: [2.7, -1.2, -0.4], scale: 0.75 },
    { mesh: makeLightbulb(), position: [0, 1.8, -1], scale: 0.72 },
  ]
  if (!isMobile && innerWidth > 650) {
    objects.push({ mesh: makeShape('cube', palette.mustard), position: [-0.9, -1.6, -0.5], scale: 0.55 })
    objects.push({ mesh: makePencil(), position: [1.2, -1.7, -1], scale: 0.55 })
  }
  objects.forEach(({ mesh, position, scale }, index) => {
    mesh.position.set(...position)
    setAppearance(mesh, 0.9, scale)
    mesh.userData.base = mesh.position.clone()
    mesh.userData.baseScale = scale
    mesh.userData.offset = index * 1.7
    scene.add(mesh)
  })

  const pointer = { x: 0, y: 0 }
  const onPointer = (event) => { pointer.x = (event.clientX / innerWidth - 0.5) * 2; pointer.y = (event.clientY / innerHeight - 0.5) * 2 }
  const onResize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight) }
  addEventListener('pointermove', onPointer)
  addEventListener('resize', onResize)
  let raf = 0
  let paused = false
  const onVisibility = () => { paused = document.hidden }
  addEventListener('visibilitychange', onVisibility)
  const tick = (time) => {
    raf = requestAnimationFrame(tick)
    if (paused) return
    objects.forEach(({ mesh }, index) => {
      const offset = mesh.userData.offset
      mesh.rotation.x += 0.002 + index * 0.0003
      mesh.rotation.y += 0.003
      mesh.position.y = mesh.userData.base.y + Math.sin(time * 0.0007 + offset) * 0.14
      mesh.position.x = mesh.userData.base.x + pointer.x * (0.07 + index * 0.014)
      const inTextSafeZone = Math.abs(mesh.position.x) < 1.55 && mesh.position.y > -1.15 && mesh.position.y < 1.75
      setAppearance(mesh, inTextSafeZone ? 0.35 : 0.9, inTextSafeZone ? mesh.userData.baseScale * 0.6 : mesh.userData.baseScale)
    })
    camera.position.x += ((pointer.x * 0.15) - camera.position.x) * 0.02
    camera.position.y += ((-pointer.y * 0.1 + 0.2) - camera.position.y) * 0.02
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(tick)

  const onScroll = () => {
    if (isMobile) return
    const progress = Math.min(scrollY / innerHeight, 4)
    gsap.to(camera.position, { z: 8 - progress * 0.4, duration: 0.8, overwrite: true })
    objects.forEach(({ mesh }, index) => gsap.to(mesh.rotation, { z: progress * (index % 2 ? -0.7 : 0.7), duration: 0.9, overwrite: true }))
  }
  if (!isMobile) addEventListener('scroll', onScroll, { passive: true })
  return { destroy: () => { cancelAnimationFrame(raf); removeEventListener('pointermove', onPointer); removeEventListener('resize', onResize); removeEventListener('visibilitychange', onVisibility); if (!isMobile) removeEventListener('scroll', onScroll); renderer.dispose() } }
}
