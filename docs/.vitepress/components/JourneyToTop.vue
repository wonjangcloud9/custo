<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { withBase } from 'vitepress'
import { members } from '../data/members'
import { milestones } from '../data/journey'
import ShareButton from './ShareButton.vue'

const N = milestones.length
const SUMMIT = 3776
const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const progress = ref(0) // 0..1 along the road
const fIndex = ref(0) // fractional section index (0 = intro)
const noGL = ref(false)
const alt = computed(() => Math.round(progress.value * SUMMIT))
const active = computed(() => Math.min(N - 1, Math.max(-1, Math.round(fIndex.value) - 1)))

let cleanup: (() => void) | null = null

function altOf(i: number) { return Math.round((i / (N - 1)) * SUMMIT).toLocaleString() }

onMounted(async () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = window.innerWidth < 640

  // ── scroll → fractional section index ──
  let centers: number[] = []
  const measure = () => {
    const secs = root.value?.querySelectorAll<HTMLElement>('.step') ?? []
    centers = [...secs].map((s) => s.getBoundingClientRect().top + window.scrollY + s.offsetHeight / 2)
  }
  const onScroll = () => {
    const vc = window.scrollY + window.innerHeight / 2
    let f = 0
    if (centers.length) {
      if (vc <= centers[0]) f = 0
      else if (vc >= centers[centers.length - 1]) f = centers.length - 1
      else {
        for (let k = 0; k < centers.length - 1; k++) {
          if (vc >= centers[k] && vc < centers[k + 1]) { f = k + (vc - centers[k]) / (centers[k + 1] - centers[k]); break }
        }
      }
    }
    fIndex.value = f
    progress.value = Math.min(1, Math.max(0, (f - 1) / (N - 1)))
  }
  measure(); onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', measure)

  // ── three.js scene ──
  let THREE: typeof import('three')
  try {
    THREE = await import('three')
  } catch { noGL.value = true; return }
  const cvs = canvas.value!
  let renderer: import('three').WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch { noGL.value = true; return }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2))
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xfff3f8, 60, 260)
  const camera = new THREE.PerspectiveCamera(small ? 62 : 52, 1, 0.1, 500)
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o)

  const colors = members.map((m) => new THREE.Color(m.color))

  // soft round sprite texture
  const dotCanvas = document.createElement('canvas'); dotCanvas.width = dotCanvas.height = 64
  const g = dotCanvas.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,0.65)'); grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64)
  const dotTex = track(new THREE.CanvasTexture(dotCanvas))

  // road curve: spiral around "Fuji"
  const pts: import('three').Vector3[] = []
  for (let k = 0; k <= 80; k++) {
    const t = k / 80
    const a = t * Math.PI * 5.2 + Math.PI * 0.15
    const r = 27 * (1 - t) + 5
    pts.push(new THREE.Vector3(Math.cos(a) * r, t * 80, Math.sin(a) * r))
  }
  const curve = new THREE.CatmullRomCurve3(pts)

  // mountain
  // Fuji-like concave profile: wide foot, steep shoulders, flat crater at 88
  const profile: import('three').Vector2[] = []
  for (let k = 0; k <= 48; k++) {
    const y = (k / 48) * 88
    profile.push(new THREE.Vector2(3 + 21 * Math.pow(1 - y / 88, 1.7), y))
  }
  const mountainGeo = track(new THREE.LatheGeometry(profile, 160))
  {
    // vertex colors: pink foot → lavender → snow cap, with soft fake lighting
    const pos = mountainGeo.attributes.position, nor = mountainGeo.attributes.normal
    const cols = new Float32Array(pos.count * 3)
    const foot = new THREE.Color(0xffcfe3), mid = new THREE.Color(0xc9b8fb), snow = new THREE.Color(0xffffff)
    const L = new THREE.Vector3(0.45, 0.55, 0.7).normalize(), n = new THREE.Vector3(), c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 88
      const a = Math.atan2(pos.getZ(i), pos.getX(i))
      c.copy(foot).lerp(mid, Math.min(1, y / 0.72))
      const cap = THREE.MathUtils.smoothstep(y + 0.035 * Math.sin(a * 7), 0.69, 0.75)
      c.lerp(snow, cap)
      n.set(nor.getX(i), nor.getY(i), nor.getZ(i))
      const light = 0.8 + 0.2 * Math.max(0, n.dot(L))
      cols[i * 3] = c.r * light; cols[i * 3 + 1] = c.g * light; cols[i * 3 + 2] = c.b * light
    }
    mountainGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3))
  }
  const mountainMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, fog: true, side: THREE.DoubleSide }))
  const mountain = new THREE.Mesh(mountainGeo, mountainMat)
  mountain.position.y = -4
  scene.add(mountain)

  // glowing road
  const roadMat = track(new THREE.ShaderMaterial({
    uniforms: { uProgress: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uProgress; uniform float uTime; varying vec2 vUv;
      void main(){
        float x = vUv.x;
        vec3 base = vec3(0.95, 0.91, 1.0);
        vec3 rainbow = 0.5 + 0.5 * cos(6.2831 * (x * 4.0 + vec3(0.0, 0.33, 0.67)));
        rainbow = mix(rainbow, vec3(1.0, 0.75, 0.88), 0.35);
        float f = fract(x * 220.0 - uTime * 0.7);
        float dash = smoothstep(0.0, 0.1, f) * (1.0 - smoothstep(0.18, 0.3, f));
        vec3 litCol = mix(rainbow, vec3(1.0), dash * 0.55);
        float lit = 1.0 - smoothstep(uProgress - 0.002, uProgress + 0.004, x);
        vec3 col = mix(base, litCol, lit);
        float head = exp(-pow((x - uProgress) * 120.0, 2.0));
        col += head * vec3(1.0, 0.7, 0.85);
        float shade = 0.82 + 0.18 * sin(vUv.y * 6.2831);
        gl_FragColor = vec4(col * shade, 1.0);
      }`,
  }))
  const road = new THREE.Mesh(track(new THREE.TubeGeometry(curve, small ? 500 : 900, 0.55, 10, false)), roadMat)
  scene.add(road)

  // milestone flags
  const flagGroups: { g: import('three').Group; halo: import('three').Sprite; u: number }[] = []
  const poleGeo = track(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6))
  const ballGeo = track(new THREE.SphereGeometry(0.55, 20, 16))
  const flagShape = new THREE.Shape(); flagShape.moveTo(0, 0); flagShape.lineTo(1.6, -0.5); flagShape.lineTo(0, -1.0); flagShape.lineTo(0, 0)
  const flagGeo = track(new THREE.ShapeGeometry(flagShape))
  milestones.forEach((_, i) => {
    const u = i / (N - 1)
    const p = curve.getPointAt(Math.min(u, 0.999))
    const out = new THREE.Vector3(p.x, 0, p.z).normalize()
    const grp = new THREE.Group()
    grp.position.copy(p).addScaledVector(out, 1.4)
    const col = colors[i % 8]
    const pole = new THREE.Mesh(poleGeo, track(new THREE.MeshBasicMaterial({ color: 0xffffff })))
    pole.position.y = 1.6
    const flag = new THREE.Mesh(flagGeo, track(new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })))
    flag.position.set(0.05, 3.15, 0)
    const ball = new THREE.Mesh(ballGeo, track(new THREE.MeshBasicMaterial({ color: col })))
    ball.position.y = 3.4
    const halo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: dotTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.0 })))
    halo.position.y = 3.4; halo.scale.setScalar(4)
    grp.add(pole, flag, ball, halo)
    grp.lookAt(0, grp.position.y, 0)
    scene.add(grp)
    flagGroups.push({ g: grp, halo, u })
  })

  // summit: red & white stars (紅白)
  const star = (outer: number, inner: number) => {
    const s = new THREE.Shape()
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? inner : outer
      const a = (k / 10) * Math.PI * 2 + Math.PI / 2
      k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    return track(new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelSize: 0.18, bevelThickness: 0.18, bevelSegments: 2 }))
  }
  const summit = new THREE.Group()
  const redStar = new THREE.Mesh(star(3, 1.3), track(new THREE.MeshBasicMaterial({ color: 0xff4d6d })))
  const whiteStar = new THREE.Mesh(star(3.8, 1.65), track(new THREE.MeshBasicMaterial({ color: 0xffffff })))
  whiteStar.position.z = -0.5; whiteStar.rotation.z = Math.PI / 5
  const summitHalo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: dotTex, color: 0xffd1e0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 })))
  summitHalo.scale.setScalar(22)
  summit.add(summitHalo, whiteStar, redStar)
  summit.position.set(0, 92, 0)
  scene.add(summit)

  // the 8 members walking together
  const walkers = members.map((m, k) => {
    const grp = new THREE.Group()
    const body = new THREE.Mesh(track(new THREE.SphereGeometry(0.42, 20, 16)), track(new THREE.MeshBasicMaterial({ color: colors[k] })))
    const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: dotTex, color: colors[k], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85 })))
    glow.scale.setScalar(2.2)
    grp.add(glow, body)
    scene.add(grp)
    return grp
  })

  // sky sparkles
  const COUNT = small ? 700 : 1600
  const sp = new Float32Array(COUNT * 3), sc = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 90
    sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = Math.random() * 140 - 10; sp[i * 3 + 2] = Math.sin(a) * r
    const c = Math.random() < 0.35 ? new THREE.Color(0xffffff) : colors[i % 8]
    sc[i * 3] = c.r; sc[i * 3 + 1] = c.g; sc[i * 3 + 2] = c.b
  }
  const skyGeo = track(new THREE.BufferGeometry())
  skyGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  skyGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3))
  const sky = new THREE.Points(skyGeo, track(new THREE.PointsMaterial({ size: 1.1, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, opacity: 0.85, blending: THREE.AdditiveBlending })))
  scene.add(sky)

  // clouds
  const clouds: import('three').Sprite[] = []
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: dotTex, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0.75 })))
    const a = (i / 14) * Math.PI * 2, r = 26 + Math.random() * 18
    c.position.set(Math.cos(a) * r, 10 + Math.random() * 50, Math.sin(a) * r)
    c.scale.set(22 + Math.random() * 16, 9 + Math.random() * 5, 1)
    c.userData = { a, r, s: 0.02 + Math.random() * 0.03, y: c.position.y }
    clouds.push(c); scene.add(c)
  }

  // fireworks at the summit
  const FW = small ? 320 : 640
  const fwPos = new Float32Array(FW * 3), fwCol = new Float32Array(FW * 3)
  const fwVel: number[] = [], fwStart: number[] = [], fwOrigin: number[] = []
  const resetSpark = (i: number, t: number) => {
    const burst = Math.floor(i / (FW / 8))
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp2 = 7 + Math.random() * 4
    fwVel[i * 3] = Math.sin(ph) * Math.cos(th) * sp2; fwVel[i * 3 + 1] = Math.cos(ph) * sp2; fwVel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp2
    fwStart[i] = t + burst * 0.35
    const seed = burst * 1.7 + Math.floor(t)
    fwOrigin[i * 3] = Math.sin(seed * 12.9) * 14; fwOrigin[i * 3 + 1] = 100 + Math.cos(seed * 7.3) * 6; fwOrigin[i * 3 + 2] = Math.cos(seed * 4.1) * 14
    const c = colors[burst % 8]
    fwCol[i * 3] = c.r; fwCol[i * 3 + 1] = c.g; fwCol[i * 3 + 2] = c.b
  }
  for (let i = 0; i < FW; i++) resetSpark(i, 0)
  const fwGeo = track(new THREE.BufferGeometry())
  fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3))
  fwGeo.setAttribute('color', new THREE.BufferAttribute(fwCol, 3))
  const fwMat = track(new THREE.PointsMaterial({ size: 2.4, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }))
  const fireworks = new THREE.Points(fwGeo, fwMat)
  scene.add(fireworks)

  // sizing
  const resize = () => {
    const w = cvs.clientWidth, h = cvs.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    measure()
  }
  const ro = new ResizeObserver(resize); ro.observe(cvs); resize()

  // animate
  let uC = 0, fC = 0, raf = 0, visible = true, lastSig = '', settle = 0
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3()
  const overviewPos = new THREE.Vector3(18, 52, small ? 190 : 150), overviewLook = new THREE.Vector3(0, 44, 0)
  const summitPos = new THREE.Vector3(0, 99, small ? 78 : 60), summitLook = new THREE.Vector3(0, 80, 0)
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
  io.observe(root.value!)
  const clock = new THREE.Clock()

  const frame = () => {
    raf = requestAnimationFrame(frame)
    if (!visible || document.hidden) return
    // reduced motion: the scene only changes with scroll progress, step or size, so after a change draw
    // ~1s more (halos fade in) and then stop redrawing a still picture every frame
    if (reduce) {
      const sig = `${progress.value}|${fIndex.value}|${cvs.clientWidth}x${cvs.clientHeight}`
      if (sig !== lastSig) { lastSig = sig; settle = 60 }
      else if (settle <= 0) return
      settle--
    }
    const t = clock.getElapsedTime()
    const k = reduce ? 1 : 0.07
    uC += (progress.value - uC) * k
    fC += (fIndex.value - fC) * k

    // camera on the road, outward + above
    const u = Math.min(0.995, Math.max(0.0001, uC))
    const p = curve.getPointAt(Math.max(0, u - 0.03))
    const out = tmp.set(p.x, 0, p.z).normalize()
    camPos.copy(p).addScaledVector(out, small ? 17 : 14).add(new THREE.Vector3(0, 7, 0))
    look.copy(curve.getPointAt(Math.min(1, u + 0.012))).add(new THREE.Vector3(0, 1.2, 0))
    // intro overview → road, road → summit view
    const intro = 1 - Math.min(1, Math.max(0, fC))
    const outro = Math.min(1, Math.max(0, fC - N))
    const ei = intro * intro * (3 - 2 * intro), eo = outro * outro * (3 - 2 * outro)
    camPos.lerp(overviewPos, ei).lerp(summitPos, eo)
    look.lerp(overviewLook, ei).lerp(summitLook, eo)
    camera.position.copy(camPos)
    camera.lookAt(look)

    roadMat.uniforms.uProgress.value = uC
    roadMat.uniforms.uTime.value = reduce ? 0 : t

    walkers.forEach((w, i) => {
      const wu = Math.min(0.999, Math.max(0, u - 0.002 - i * 0.0016))
      const wp = curve.getPointAt(wu)
      const o = new THREE.Vector3(wp.x, 0, wp.z).normalize()
      w.position.copy(wp).addScaledVector(o, i % 2 ? 0.55 : -0.55)
      w.position.y += 0.75 + (reduce ? 0 : Math.abs(Math.sin(t * 6 + i)) * 0.35)
    })

    flagGroups.forEach((f, i) => {
      const passed = uC >= f.u - 0.004
      const target = passed ? 0.9 : 0.0
      f.halo.material.opacity += (target - f.halo.material.opacity) * 0.1
      const pulse = passed && !reduce ? 4 + Math.sin(t * 3 + i) * 0.6 : 4
      f.halo.scale.setScalar(pulse)
    })

    if (!reduce) {
      summit.rotation.y = t * 0.6
      sky.rotation.y = t * 0.012
      clouds.forEach((c) => {
        const d = c.userData as { a: number; r: number; s: number; y: number }
        d.a += d.s * 0.01
        c.position.set(Math.cos(d.a) * d.r, d.y + Math.sin(t * 0.3 + d.a) * 1.5, Math.sin(d.a) * d.r)
      })
    }

    // fireworks only near the top
    const fwOn = uC > 0.96 || fC > N - 0.3
    fwMat.opacity += ((fwOn && !reduce ? 1 : 0) - fwMat.opacity) * 0.08
    if (fwMat.opacity > 0.01) {
      for (let i = 0; i < FW; i++) {
        let dt = t - fwStart[i]
        if (dt > 2.2) { resetSpark(i, t); dt = t - fwStart[i] }
        if (dt < 0) { fwPos[i * 3 + 1] = -999; continue }
        fwPos[i * 3] = fwOrigin[i * 3] + fwVel[i * 3] * dt
        fwPos[i * 3 + 1] = fwOrigin[i * 3 + 1] + fwVel[i * 3 + 1] * dt - 4.5 * dt * dt
        fwPos[i * 3 + 2] = fwOrigin[i * 3 + 2] + fwVel[i * 3 + 2] * dt
      }
      fwGeo.attributes.position.needsUpdate = true
    }

    renderer.render(scene, camera)
  }
  frame()

  cleanup = () => {
    cancelAnimationFrame(raf)
    ro.disconnect(); io.disconnect()
    disposables.forEach((d) => d.dispose())
    renderer.dispose()
  }
  // scroll listeners are removed below as well
  const prevCleanup = cleanup
  cleanup = () => { prevCleanup?.(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure) }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="root" class="jr" :class="{ nogl: noGL }">
    <div class="stage" aria-hidden="true">
      <canvas ref="canvas" class="gl" />
      <div class="vignette" />
      <div class="alt">
        <div class="alt-track"><div class="alt-fill" :style="{ height: progress * 100 + '%' }" />
          <span v-for="(m, i) in milestones" :key="i" class="alt-tick" :class="{ on: i <= active }"
            :style="{ bottom: (i / (milestones.length - 1)) * 100 + '%', '--tc': members[i % 8].color }" />
        </div>
        <div class="alt-label"><small>ALT.</small><b>{{ alt.toLocaleString() }}</b><small>m</small></div>
      </div>
    </div>

    <div class="steps">
      <section class="step intro">
        <p class="eyebrow">STREET TO THE TOP · 2024 → 2026</p>
        <h1 class="title"><span>정상까지의</span><span class="grad">여정</span></h1>
        <p class="lead">큐티스트리트의 2년 반을 <b>후지산 3,776m</b> 등반에 빗대 봤어요.<br />스크롤하면 8명이 함께 길을 올라갑니다 — 정상은 <b>紅白</b>.</p>
        <p class="hint"><span class="mouse" /> 스크롤해서 등반 시작</p>
      </section>

      <section v-for="(m, i) in milestones" :key="m.date" class="step" :class="[i % 2 ? 'right' : 'left', { now: i === active }]">
        <article class="card" :style="{ '--mc': members[i % 8].color }">
          <div class="card-top">
            <span class="alt-chip">▲ {{ altOf(i) }}m</span>
            <span class="date">{{ m.date }}</span>
            <span class="no">{{ String(i + 1).padStart(2, '0') }} / {{ milestones.length }}</span>
          </div>
          <h2 class="ja">{{ m.ja }}</h2>
          <p class="ko">{{ m.ko }}</p>
          <p class="desc">{{ m.desc }}</p>
          <a v-if="m.video" class="vid" :href="`https://www.youtube.com/watch?v=${m.video}`" target="_blank" rel="noopener">
            <img :src="`https://i.ytimg.com/vi/${m.video}/mqdefault.jpg`" alt="" loading="lazy" width="160" height="90" />
            <span><b>▶&nbsp;{{ m.videoLabel }}</b><small>YouTube</small></span>
          </a>
        </article>
      </section>

      <section class="step outro">
        <p class="eyebrow">3,776m · TOP OF THE TOP</p>
        <h2 class="title small"><span>그리고 다음 산은,</span><span><span class="grad">세계</span> <span class="emoji">🌏</span></span></h2>
        <p class="lead">かわいいで、世界へ。 우리의 큐티즈도 함께 올라가요.</p>
        <div class="cta">
          <a class="btn primary" href="https://www.youtube.com/watch?v=KGFOrSUL-uc" target="_blank" rel="noopener">▶ 「Top of the top」 부도칸 LIVE</a>
          <a class="btn" :href="withBase('/members/')">멤버 만나기</a>
          <a class="btn" :href="withBase('/videos/')">영상 아카이브</a>
          <ShareButton title="정상까지의 여정 — CUTIE STREET 3D 스토리" text="데뷔부터 紅白까지, 후지산 3,776m 등반으로 그린 큐티스트리트의 여정 🗻" label="여정 공유하기" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.jr {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340;
  position: relative; color: var(--ink);
  background: linear-gradient(180deg, #fff6fb 0%, #fde7f2 40%, #efe6ff 75%, #fff 100%);
}
.stage { position: sticky; top: 0; height: 100vh; height: 100dvh; overflow: hidden; }
.gl { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.nogl .stage { background: radial-gradient(60% 50% at 50% 70%, #ffd6e8, transparent), radial-gradient(40% 40% at 50% 20%, #fff, transparent); }
.vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(255, 240, 247, 0.85)); }

.alt { position: absolute; left: 22px; top: 50%; translate: 0 -50%; display: flex; align-items: center; gap: 10px; z-index: 2; }
.alt-track { position: relative; width: 6px; height: 46vh; border-radius: 999px; background: rgba(255, 255, 255, 0.7); box-shadow: inset 0 0 0 1px rgba(196, 156, 255, 0.35); }
.alt-fill { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 999px; background: linear-gradient(0deg, #ffc93c, #ff4757, #3ccfa8, #4a90d9, #ff9f43, #5dc8f5, #a06cd5, #ff6b9d); transition: height 0.2s linear; }
.alt-tick { position: absolute; left: 50%; width: 12px; height: 12px; margin: 0 0 -6px -6px; border-radius: 50%; background: #fff; border: 2px solid #e7d8f0; transition: transform 0.5s var(--spring), background 0.3s, border-color 0.3s; }
.alt-tick.on { background: var(--tc); border-color: #fff; transform: scale(1.25); }
.alt-label { display: flex; flex-direction: column; font-family: 'Zen Maru Gothic', sans-serif; line-height: 1; }
.alt-label b { font-size: 22px; font-variant-numeric: tabular-nums; color: #c2457a; }
.alt-label small { font-size: 10px; letter-spacing: 0.2em; color: #7d6083; font-weight: 700; }

.steps { position: relative; z-index: 1; margin-top: -100vh; margin-top: -100dvh; }
.step { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; padding: 80px 8vw; }
.step.left { justify-content: flex-start; padding-left: max(110px, 10vw); }
.step.right { justify-content: flex-end; }
.intro, .outro { flex-direction: column; justify-content: center; text-align: center; }
.outro { justify-content: flex-end; padding-bottom: 9vh; }
.eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 0.28em; color: #c2457a; margin: 0 0 12px; background: rgba(255, 255, 255, 0.8); padding: 6px 14px; border-radius: 999px; }
.title { margin: 0; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: clamp(56px, 11vw, 140px); line-height: 0.98; letter-spacing: -0.03em; border: 0; padding: 0; }
.title > span { display: block; text-shadow: 0 4px 0 #fff, 0 18px 40px rgba(255, 107, 157, 0.35); }
.title .emoji { display: inline-block; text-shadow: none; animation: spinE 8s linear infinite; }
@keyframes spinE { to { transform: rotate(360deg); } }
.title .grad { background: linear-gradient(90deg, #ff6b9d, #a06cd5, #4a90d9); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; filter: drop-shadow(0 6px 0 #fff); }
.title.small { font-size: clamp(40px, 7vw, 88px); }
.lead { margin: 22px auto 0; max-width: 560px; font-size: 17px; line-height: 1.8; background: rgba(255, 255, 255, 0.72); backdrop-filter: blur(8px); padding: 14px 20px; border-radius: 20px; }
.lead b { color: #c2457a; }
.hint { margin-top: 28px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #735779; }
.mouse { width: 20px; height: 32px; border-radius: 12px; border: 2px solid #c49cff; position: relative; }
.mouse::after { content: ''; position: absolute; left: 50%; top: 6px; width: 4px; height: 6px; margin-left: -2px; border-radius: 2px; background: #ff6b9d; animation: wheel 1.6s ease-in-out infinite; }
@keyframes wheel { 60% { transform: translateY(10px); opacity: 0; } }

.card {
  width: min(440px, 100%); padding: 22px 22px 20px; border-radius: 28px;
  background: rgba(255, 255, 255, 0.82); backdrop-filter: blur(14px) saturate(1.3); -webkit-backdrop-filter: blur(14px) saturate(1.3);
  border: 1.5px solid color-mix(in srgb, var(--mc) 35%, white);
  box-shadow: 0 30px 60px -30px color-mix(in srgb, var(--mc) 70%, #3a2340);
  transform: translateY(30px) scale(0.96); opacity: 0.35; filter: saturate(0.6);
  transition: transform 0.8s var(--spring), opacity 0.5s, filter 0.5s;
}
.step.now .card { transform: none; opacity: 1; filter: none; }
.card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.alt-chip { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); color: #fff; font-variant-numeric: tabular-nums; }
.date { font-size: 13px; font-weight: 700; color: #735779; font-variant-numeric: tabular-nums; }
.no { margin-left: auto; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #7d6083; }
.ja { margin: 14px 0 2px; border: 0; padding: 0; font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-size: clamp(24px, 3.2vw, 32px); line-height: 1.25; color: color-mix(in srgb, var(--mc) 60%, #3a2340); }
.ko { margin: 0; font-weight: 700; font-size: 15px; }
.desc { margin: 10px 0 0; font-size: 14.5px; line-height: 1.75; color: #5a4060; }
.vid { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 8px; border-radius: 16px; background: color-mix(in srgb, var(--mc) 12%, white); text-decoration: none !important; color: var(--ink) !important; transition: transform 0.5s var(--spring); }
.vid:hover { transform: translateY(-3px) rotate(-1deg); }
.vid img { width: 112px; height: 63px; object-fit: cover; border-radius: 10px; flex: none; }
.vid > span { min-width: 0; }
/* very narrow phones: thumbnail on top, title underneath, instead of a 3-line squeeze beside it */
@media (max-width: 360px) { .vid { flex-direction: column; align-items: stretch; gap: 8px; } .vid img { width: 100%; height: auto; aspect-ratio: 16 / 9; } .vid > span { padding: 0 4px 2px; } }
.vid b { display: block; font-size: 13.5px; overflow-wrap: anywhere; } /* Japanese titles have no spaces; under keep-all they never wrapped (23px overflow at 320, #198) */
.vid small { font-size: 11px; color: #735779; }

.cta { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 26px; }
.btn { padding: 13px 20px; border-radius: 999px; font-weight: 700; font-size: 14px; background: #fff; color: var(--ink) !important; text-decoration: none !important; border: 1.5px solid #f3cfe0; transition: transform 0.5s var(--spring); }
.btn:hover { transform: translateY(-3px); }
.btn.primary { background: linear-gradient(135deg, #d81b4f, #c2185b); color: #fff !important; border-color: transparent; box-shadow: 0 14px 30px -14px #ff4d6d; }

@media (max-width: 640px) {
  .step, .step.left, .step.right { padding: 72px 16px 72px 64px; justify-content: center; align-items: flex-end; }
  .intro, .outro { padding: 72px 16px; align-items: center; }
  .alt { left: 12px; }
  .alt-track { height: 38vh; }
  .alt-label b { font-size: 16px; }
  .lead { font-size: 15px; }
  .card { padding: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; transform: none; }
  .mouse::after, .title .emoji { animation: none; }
}
</style>
