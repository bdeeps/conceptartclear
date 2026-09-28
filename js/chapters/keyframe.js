// Chapter 4: keyframe and environment. A 3D blockout of a monsoon market street, built from plain boxes as
// environment artists do, with a virtual camera. Its view is rendered twice: once as grey clay, once with
// colour, dusk light and haze. A painterly shader "paints over" the clay (a Kuwahara-style filter that
// flattens detail into brush-like patches, plus rain and paper grain), wiping across like an artist's
// brush. Move the camera and the painting re-renders.
//
// Perspective is computed, not drawn by hand: each main direction of the set (across the street, up, down
// the street) is transformed into camera space and projected. A direction parallel to the picture plane
// never converges (no vanishing point); every other one converges to a point. So a camera looking straight
// down the street gives one-point perspective, a turned camera two-point, and a tilted camera three-point.
// Lens: a Super 35 sensor used at 16:9, about 24.9 × 14.0 mm, so vertical FOV = 2·atan(7.0 / f).
import { THREE, M, box, beam, clamp } from '../kit.js';
import { board, text, rrect, COL, SANS, makeTikku3D, makeCineCam, BASE, fitNarrow, setControl, inReel } from '../art.js';

const SENSOR = { w: 24.9, h: 14.0 };
const D2R = Math.PI / 180;
const vfovOf = (f) => 2 * Math.atan(SENSOR.h / 2 / f);
const hfovOf = (f) => 2 * Math.atan(SENSOR.w / 2 / f);
const PRESETS = { 1: { yaw: 0, pitch: 0, h: 1.6 }, 2: { yaw: 20, pitch: 0, h: 1.6 }, 3: { yaw: 14, pitch: 30, h: 1.0 } };
const AX = [{ id: 'x', v: new THREE.Vector3(1, 0, 0), col: '#ff6b7a', name: 'across the street' }, { id: 'z', v: new THREE.Vector3(0, 0, -1), col: '#38bdf8', name: 'down the street' }, { id: 'y', v: new THREE.Vector3(0, 1, 0), col: '#7be08c', name: 'up the towers' }];

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const FS = `
precision highp float;
uniform sampler2D tClay; uniform sampler2D tPaint; uniform vec2 uRes; uniform float uPaint;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
vec3 tone(vec3 x){ x = max(x, 0.0); x = (x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14); return pow(clamp(x,0.0,1.0), vec3(1.0/2.2)); }
// Kuwahara-style filter: of four square windows around the pixel, keep the mean of the least varied one.
vec3 kuwa(vec2 uv){
  vec2 px = 1.0 / uRes; float r = 3.0;
  vec3 best = vec3(0.0); float bv = 1e9;
  for (int q = 0; q < 4; q++) {
    vec2 o = vec2(q == 1 || q == 3 ? 0.0 : -r, q >= 2 ? 0.0 : -r);
    vec3 m = vec3(0.0), m2 = vec3(0.0);
    for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
      vec3 c = tone(texture2D(tPaint, uv + (o + vec2(float(i), float(j))) * px * 1.4).rgb);
      m += c; m2 += c * c;
    }
    m /= 16.0; m2 = m2 / 16.0 - m * m;
    float v = m2.r + m2.g + m2.b;
    if (v < bv) { bv = v; best = m; }
  }
  return best;
}
void main(){
  vec3 clay = tone(texture2D(tClay, vUv).rgb);
  vec3 p = kuwa(vUv);
  // canvas grain and a gentle vignette
  float grain = noise(vUv * uRes * 0.5) * 0.06 - 0.03;
  p += grain; p *= 1.0 - 0.35 * pow(length(vUv - 0.5) * 1.3, 2.5);
  // monsoon rain streaks
  vec2 rp = vec2(vUv.x * 90.0 + vUv.y * 14.0, vUv.y * 5.0);
  float rain = step(0.93, hash(floor(rp))) * smoothstep(0.2, 0.8, fract(rp.y + hash(floor(rp)) * 3.0));
  p = mix(p, vec3(0.85, 0.9, 1.0), rain * 0.18);
  // the brush wipe, with a ragged edge
  float edge = uPaint * 1.12 - 0.06 + (noise(vec2(vUv.y * 22.0, 1.0)) - 0.5) * 0.08;
  float m = smoothstep(edge + 0.01, edge - 0.01, vUv.x);
  vec3 col = mix(clay, p, m);
  // a faint pencil line at the wipe
  col = mix(col, vec3(1.0, 0.82, 0.4), smoothstep(0.008, 0.0, abs(vUv.x - edge)) * step(0.01, uPaint) * step(uPaint, 0.99) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}`;

const VIEW = { pos: [3, 21, 27], target: [0, 2, -11] };

export default {
  id: 'keyframe',
  short: 'Keyframe and set',
  title: 'Keyframes, environments and perspective',
  subtitle: 'Block out the set in simple 3D shapes, pick a camera, and paint over it.',
  view: VIEW,
  learn: `<p>A <b>keyframe</b> painting shows one important moment of the film, from the camera's point of view, with the real lighting and mood. An <b>environment</b> design shows a place: a street, a palace, a spaceship. Together they tell the crew what the film will look like before a single set is built.</p>
    <p>Many environment artists now start in 3D. They build a quick <b>blockout</b>: plain grey boxes for buildings, a slab for the road, a cylinder for a water tank. Then they choose a <b>camera</b>, render the view, and <b>paint over</b> it, adding colour, light, rain and detail by hand. If the director wants a different angle, they move the camera, re-render and paint again, instead of redrawing all the perspective.</p>
    <p>Perspective is why this helps. Parallel lines in the world, like balcony edges, meet at a <b>vanishing point</b>. Look straight down a street and only the lines running away from you meet: <b>one-point perspective</b>. Turn the camera and the lines across the street meet too: <b>two-point</b>. Tilt up at the towers and the vertical lines meet in the sky: <b>three-point</b>, which makes buildings feel huge.</p>
    <p class="tip"><b>Try it:</b> drag the paint-over slider to wipe paint across the clay. Switch between 1, 2 and 3-point, or grab a coloured vanishing point on the panel and drag it: the camera turns to follow. Try a wide 18 mm lens, then a long 85 mm one.</p>`,
  terms: [
    { t: 'Keyframe (painting)', d: 'A finished painting of a key story moment from the camera’s view, showing the film’s light and mood.' },
    { t: 'Environment design', d: 'Designing the places of a film: streets, buildings, landscapes, rooms.' },
    { t: 'Blockout', d: 'A quick 3D model made of simple shapes, used to test layout, scale and camera angles.' },
    { t: 'Paint-over', d: 'Painting on top of a rendered 3D view to add colour, light and detail.' },
    { t: 'Vanishing point', d: 'The point where parallel lines seem to meet in a picture.' },
    { t: 'Horizon line', d: 'The line at the camera’s eye level where all the horizontal vanishing points sit.' },
  ],
  defaults: { persp: 2, yaw: 20, pitch: 0, h: 1.6, lens: 24, paint: 0.7, grid: true },
  onChange(s, key) {
    if (key === 'persp') { const p = PRESETS[Math.round(s.persp)] || PRESETS[2]; Object.assign(s, p); }
  },
  controls: [
    { key: 'persp', type: 'seg', label: 'Perspective', options: [{ v: 1, label: '1-point' }, { v: 2, label: '2-point' }, { v: 3, label: '3-point' }], fmt: (v) => ({ 1: 'look straight down the street', 2: 'turn the camera', 3: 'tilt up at the towers' })[Math.round(v)] || '' },
    { key: 'paint', type: 'range', label: 'Paint-over', min: 0, max: 1, step: 0.01, ends: ['clay render', 'painted'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'yaw', type: 'range', label: 'Turn camera (pan)', min: -60, max: 60, step: 0.5, fmt: (v) => v.toFixed(0) + '°' },
    { key: 'pitch', type: 'range', label: 'Tilt camera', min: -25, max: 45, step: 0.5, fmt: (v) => v.toFixed(0) + '°' },
    { key: 'h', type: 'range', label: 'Camera height', min: 0.3, max: 14, step: 0.1, fmt: (v) => v.toFixed(1) + ' m' },
    { key: 'lens', type: 'log', label: 'Lens', min: 14, max: 100, ends: ['wide', 'long'], fmt: (v) => Math.round(v) + ' mm' },
    { key: 'grid', type: 'toggle', label: 'Perspective lines', hint: 'Drag a coloured dot on the panel to aim the camera.' },
  ],
  quiz: [
    { q: 'Looking straight down a long, straight street gives which perspective?', options: ['One-point', 'Two-point', 'Three-point', 'None'], answer: 0, why: 'Only the lines running away from you converge. Lines across the street and vertical lines stay parallel to the picture, so they never meet.' },
    { q: 'What makes three-point perspective appear?', options: ['Using colour', 'Tilting the camera up or down', 'Adding more buildings', 'A longer lens'], answer: 1, why: 'Once the camera tilts, vertical lines are no longer parallel to the picture, so they too converge, above or below.' },
    { q: 'Why do environment artists paint over a 3D blockout?', options: ['It is required by law', 'The perspective and scale come free, and the camera can be changed quickly', 'Paint looks bad on paper', '3D replaces painting completely'], answer: 1, why: 'The 3D blockout gives accurate perspective and lets the director try other angles; the paint adds the mood and detail.' },
  ],
  reel: [
    { ms: 5200, caption: 'Environment artists block out a set in grey 3D shapes, then paint over the camera view.', set: { persp: 2, yaw: 20, pitch: 0, h: 1.6, lens: 24, grid: false }, anim: { paint: [0, 1] }, spin: 0 },
    { ms: 5000, caption: 'Tilt the camera up and vertical lines meet too: three-point perspective.', set: { persp: 3, yaw: 14, h: 1.0, lens: 24, paint: 1, grid: true }, anim: { pitch: [0, 32] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const clayMat = M.matte(0x8e939c);
    const paintables = [];
    // painted materials get a window texture
    // A facade of 4 × 4 windows; some are lit (emissive) at dusk.
    const facade = (lit) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), r = (() => { let q = 7; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })(); g.fillStyle = lit ? '#000' : '#fff'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const on = r() < 0.35; g.fillStyle = lit ? (on ? '#ffb347' : '#000') : '#4d535e'; g.fillRect(x * 64 + 14, y * 64 + 12, 36, 34); if (!lit) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x * 64, y * 64 + 56, 64, 8); } } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const win = facade(false), glow = facade(true);
    const block = (w, h, d, x, y, z, color, windows = true) => {
      const m = box(w, h, d, clayMat); m.position.set(x, y, z); root.add(m);
      let paint;
      if (windows) {
        const map = win.clone(), em = glow.clone(); map.needsUpdate = em.needsUpdate = true;
        map.repeat.set(Math.max(0.5, Math.max(w, d) / 10), Math.max(0.5, h / 12)); em.repeat.copy(map.repeat);
        paint = new THREE.MeshStandardMaterial({ color, map, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: 0.7, roughness: 0.8 });
      } else paint = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      m.userData.paint = paint; paintables.push(m);
      return m;
    };
    const cols = [0xd9a27f, 0xa9c2b3, 0xcdb89a, 0x93a4bf, 0xc98f9e, 0xe0c27a];
    // ground and road
    const road = block(8, 0.1, 60, 0, -0.05, -20, 0x2c3036, false); road.userData.paint.roughness = 0.15; road.userData.paint.metalness = 0.2;
    for (const x of [-7.5, 7.5]) block(7, 0.3, 60, x, 0.1, -20, 0x6c6a66, false);
    // buildings: two rows of blocks
    let z = 5, i = 0;
    for (const side of [-1, 1]) {
      z = 5;
      while (z > -46) {
        const d = 5 + ((i * 7) % 4), w = 6, h = z > -6 ? 6 + (i % 2) : 6 + ((i * 13) % 17);
        block(w, h, d - 0.3, side * (4 + w / 2), h / 2 + 0.25, z - d / 2, cols[i % cols.length]);
        // balconies: thin slabs sticking out towards the street
        for (let f = 3; f < h - 1; f += 3) block(0.6, 0.12, d - 1, side * 4.1, f, z - d / 2, 0xe8e2d6, false);
        z -= d; i++;
      }
    }
    // a flyover across the street, a tall tower, a water tank, a tea stall, poles and wires
    block(22, 1.1, 3, 0, 7.5, -18, 0x9a958c, false);
    for (const x of [-3.2, 3.2]) block(0.9, 7, 0.9, x, 3.5, -18, 0x8d887f, false);
    block(8, 42, 8, 9, 21, -38, 0x8fa3c4);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2, 20), clayMat); tank.position.set(-7, 15.5, -8); tank.userData.paint = new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.4 }); root.add(tank); paintables.push(tank);
    block(2.4, 2.2, 1.6, -3.1, 1.35, -10, 0x2b8a6e, false);
    const awning = block(3, 0.08, 2.2, -3.1, 2.6, -9.6, 0xe0453a, false); awning.rotation.x = -0.2;
    for (let zz = 2; zz > -40; zz -= 9) for (const x of [-3.7, 3.7]) {
      const p = block(0.18, 7, 0.18, x, 3.6, zz, 0x4a4d52, false);
      if (x < 0) root.add(beam([-3.7, 6.8, zz], [3.7, 6.2, zz - 4], 0.03, M.matte(0x222222)));
    }
    // Tikku, the hero, parked in the street
    const tik = makeTikku3D({ ...BASE, umbrella: 1 }); tik.position.set(0.2, 0, -4); tik.rotation.y = Math.PI / 2 - 0.5; root.add(tik);
    // the virtual camera and its view
    const vcam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 400); vcam.rotation.order = 'YXZ';
    const camModel = makeCineCam(); camModel.scale.setScalar(4); root.add(camModel);
    const fr = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Array(48).fill(0), 3)), new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
    fr.frustumCulled = false; root.add(fr);
    const PX = [768, 432];
    const rtClay = new THREE.WebGLRenderTarget(PX[0], PX[1], { samples: 4, type: THREE.HalfFloatType });
    const rtPaint = new THREE.WebGLRenderTarget(PX[0], PX[1], { samples: 4, type: THREE.HalfFloatType });
    const shMat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { tClay: { value: rtClay.texture }, tPaint: { value: rtPaint.texture }, uRes: { value: new THREE.Vector2(...PX) }, uPaint: { value: 0.7 } }, toneMapped: false });
    // the panel sits between the viewer and the set, up and to the right
    const PW = 11, PH = PW * 9 / 16;
    const panel = new THREE.Group(); root.add(panel);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), shMat); panel.add(screen);
    const frame = board(panel, PW + 0.6, PH + 1.6, 820, Math.round(820 * (PH + 1.6) / (PW + 0.6)), (g, w, h, t = '') => {
      g.clearRect(0, 0, w, h); rrect(g, 2, 2, w - 4, h - 4, 14); g.fillStyle = 'rgba(10,12,18,.95)'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.2)'; g.stroke();
      text(g, t, 18, 38, { font: `600 26px ${SANS}`, col: '#e8eef8' });
    }, [0, 0.5, -0.02]);
    const over = board(panel, PW, PH, 960, 540, () => {}, [0, 0, 0.02]);
    const hide = [panel, camModel, fr];

    let vps = [], sig = '', drag = null;
    const aim = (s) => {
      vcam.fov = vfovOf(s.lens) / D2R; vcam.aspect = 16 / 9; vcam.updateProjectionMatrix();
      vcam.position.set(1.8, s.h, 7); vcam.rotation.set(s.pitch * D2R, s.yaw * D2R, 0); vcam.updateMatrixWorld(true);
    };
    const tanH = () => Math.tan(hfovOf(stateLens) / 2), tanV = () => Math.tan(vfovOf(stateLens) / 2);
    let stateLens = 24;
    const q = new THREE.Quaternion();
    const vpOf = (dir) => {
      q.copy(vcam.quaternion).invert();
      const d = dir.clone().applyQuaternion(q);
      if (Math.abs(d.z) < 0.012) return { inf: true, dx: d.x / tanH(), dy: d.y / tanV() };
      return { inf: false, x: (d.x / -d.z) / tanH(), y: (d.y / -d.z) / tanV() };
    };
    const drawOver = (s) => {
      const g = over.g, W = 960, H = 540; g.clearRect(0, 0, W, H);
      const P = (x, y) => [(x + 1) / 2 * W, (1 - y) / 2 * H];
      vps = AX.map((a) => ({ ...a, ...vpOf(a.v) }));
      if (s.grid) {
        // horizon: the vanishing line of every horizontal direction
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(vcam.quaternion); fwd.y = 0; fwd.normalize();
        const hz = vpOf(fwd);
        if (!hz.inf) { const [, hy] = P(0, hz.y); g.strokeStyle = 'rgba(255,209,102,.9)'; g.lineWidth = 3; g.setLineDash([14, 8]); g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.stroke(); g.setLineDash([]); text(g, 'horizon (eye level)', 12, hy - 8, { font: `600 18px ${SANS}`, col: '#ffd166' }); }
        vps.forEach((v) => {
          g.strokeStyle = v.col; g.globalAlpha = 0.55; g.lineWidth = 2;
          if (v.inf) {
            const n = Math.hypot(v.dx * W, v.dy * H) || 1, ux = v.dx * W / n, uy = -v.dy * H / n;
            for (let k = -6; k <= 6; k++) { const cx = W / 2 - uy * k * 70, cy = H / 2 + ux * k * 70; g.beginPath(); g.moveTo(cx - ux * 1200, cy - uy * 1200); g.lineTo(cx + ux * 1200, cy + uy * 1200); g.stroke(); }
          } else {
            const [vx, vy] = P(v.x, v.y);
            for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2 + 0.1; g.beginPath(); g.moveTo(vx, vy); g.lineTo(vx + Math.cos(a) * 3000, vy + Math.sin(a) * 3000); g.stroke(); }
          }
          g.globalAlpha = 1;
          if (!v.inf) {
            const [vx, vy] = P(clamp(v.x, -0.97, 0.97), clamp(v.y, -0.95, 0.95));
            const off = Math.abs(v.x) > 0.97 || Math.abs(v.y) > 0.95;
            g.beginPath(); g.arc(vx, vy, off ? 12 : 16, 0, Math.PI * 2); g.fillStyle = v.col; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
            text(g, off ? 'VP off frame →' : 'VP', vx + (vx > W - 200 ? -150 : 22), vy + 6, { font: `600 18px ${SANS}`, col: v.col });
          }
        });
      }
      over.tex.needsUpdate = true;
    };
    const place = () => {
      camModel.position.copy(vcam.position); camModel.quaternion.copy(vcam.quaternion);
      const d = 14, hh = Math.tan(vcam.fov * D2R / 2) * d, hw = hh * vcam.aspect, p = fr.geometry.attributes.position;
      const c = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => new THREE.Vector3(x, y, -d).applyMatrix4(vcam.matrixWorld));
      let i = 0; const put = (v) => p.setXYZ(i++, v.x, v.y, v.z);
      for (let k = 0; k < 4; k++) { put(vcam.position); put(c[k]); }
      for (let k = 0; k < 4; k++) { put(c[k]); put(c[(k + 1) % 4]); }
      p.needsUpdate = true;
    };
    const shoot = () => {
      const r = stage.renderer, sc = stage.scene;
      const vis = hide.map((o) => o.visible), fl = stage.floor.visible, bg = sc.background, fog = sc.fog;
      hide.forEach((o) => { o.visible = false; }); stage.floor.visible = false;
      // clay pass: everything grey, plain sky
      sc.background = new THREE.Color(0xc9ccd2); sc.overrideMaterial = clayMat;
      r.setRenderTarget(rtClay); r.clear(); r.render(sc, vcam);
      sc.overrideMaterial = null;
      // paint pass: dusk colours, lit windows, haze
      paintables.forEach((m) => { m.userData.clay = m.material; m.material = m.userData.paint; });
      const key = stage.lights.children.find((l) => l.isDirectionalLight && l.castShadow), kc = key.color.clone(), ki = key.intensity;
      key.color.set(0xffa860); key.intensity = 1.6;
      sc.background = new THREE.Color(0x6f6f9c); sc.fog = new THREE.FogExp2(0x7c7aa0, 0.022);
      r.setRenderTarget(rtPaint); r.clear(); r.render(sc, vcam);
      r.setRenderTarget(null);
      key.color.copy(kc); key.intensity = ki;
      paintables.forEach((m) => { m.material = m.userData.clay; });
      hide.forEach((o, k) => { o.visible = vis[k]; }); stage.floor.visible = fl; sc.background = bg; sc.fog = fog;
    };
    // place the panel relative to the chapter's view
    const V = new THREE.Vector3(...VIEW.pos), T = new THREE.Vector3(...VIEW.target);
    const fwd = T.clone().sub(V).normalize(), right = fwd.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), up = right.clone().cross(fwd);
    panel.position.copy(V).addScaledVector(fwd, 21).addScaledVector(right, 5.2).addScaledVector(up, 2.6);
    panel.lookAt(V);
    const lSet = stage.label('Blockout: plain grey boxes', [-7, 1, 2], root);
    const lCam = stage.label('Virtual camera', [0, 4.5, 7], root, 'hot');

    // dragging a vanishing point turns (and tilts) the camera
    const el = stage.renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane();
    const uvAt = (e, clampToMesh) => {
      const b = el.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, stage.camera);
      if (clampToMesh) { const h = ray.intersectObject(over.mesh)[0]; if (!h) return null; }
      over.mesh.updateMatrixWorld(true);
      plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1).transformDirection(over.mesh.matrixWorld), over.mesh.getWorldPosition(new THREE.Vector3()));
      const p = ray.ray.intersectPlane(plane, new THREE.Vector3()); if (!p) return null;
      over.mesh.worldToLocal(p); return { x: (p.x / PW) * 2, y: (p.y / PH) * 2 };
    };
    const st = { s: null };
    const solve = (target) => {
      const s = st.s; if (!s) return;
      const test = (yaw, pitch) => { s.yaw = yaw; s.pitch = pitch; aim(s); const v = vpOf(AX.find((a) => a.id === drag).v); return v; };
      if (drag === 'y') {
        let best = s.pitch, be = 1e9; for (let p = -25; p <= 45; p += 0.5) { const v = test(s.yaw, p); if (v.inf) continue; const e = Math.abs(v.y - target.y); if (e < be) { be = e; best = p; } }
        s.pitch = best;
      } else {
        let best = [s.yaw, s.pitch], be = 1e9;
        for (let p = -25; p <= 45; p += 2.5) for (let y = -60; y <= 60; y += 1) { const v = test(y, p); if (v.inf) continue; const e = Math.abs(v.x - target.x) + Math.abs(v.y - target.y); if (e < be) { be = e; best = [y, p]; } }
        [s.yaw, s.pitch] = best;
      }
      aim(s);
      setControl('Turn camera (pan)', s.yaw); setControl('Tilt camera', s.pitch);
    };
    const down = (e) => {
      if (!st.s?.grid) return;
      const u = uvAt(e, true); if (!u) return;
      let best = null, bd = 0.09;
      vps.forEach((v) => { if (v.inf) return; const d = Math.hypot((clamp(v.x, -0.97, 0.97) - u.x) * 16 / 9, clamp(v.y, -0.95, 0.95) - u.y); if (d < bd) { bd = d; best = v.id; } });
      if (best) { drag = best; stage.controls.enabled = false; el.setPointerCapture?.(e.pointerId); e.preventDefault(); e.stopPropagation(); }
    };
    const move = (e) => { if (!drag) return; const u = uvAt(e, false); if (u) solve(u); };
    const release = () => { if (drag) { drag = null; stage.controls.enabled = true; } };
    el.addEventListener('pointerdown', down, true); window.addEventListener('pointermove', move); window.addEventListener('pointerup', release);

    return {
      update(dt, s) {
        dt = Math.max(0, dt); st.s = s; stateLens = s.lens;
        const k = `${s.yaw.toFixed(2)}|${s.pitch.toFixed(2)}|${s.h.toFixed(2)}|${s.lens.toFixed(2)}|${s.grid}`;
        if (k !== sig) { aim(s); place(); shoot(); drawOver(s); sig = k; frame.redraw(`PAINT-OVER · ${Math.round(s.lens)} mm lens · ${['no', 'one', 'two', 'three'][vps.filter((v) => !v.inf).length]}-point perspective`); }
        shMat.uniforms.uPaint.value = s.paint;
        fitNarrow(stage, [lSet]);
      },
      readout: (s) => {
        if (!vps.length) return '';
        const n = vps.filter((v) => !v.inf).length, z = vps.find((v) => v.id === 'z');
        const inFrame = (v) => !v.inf && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
        return `<div class="big">${['No', 'One', 'Two', 'Three'][n]}-point perspective</div>
          <div class="row"><span>Lens · horizontal view</span><b>${Math.round(s.lens)} mm · ${(hfovOf(s.lens) / D2R).toFixed(0)}°</b></div>
          <div class="row"><span>Vanishing points in the frame</span><b>${vps.filter(inFrame).length} of ${n}</b></div>
          <div class="row"><span>Street lines meet</span><b>${z.inf ? 'never (parallel)' : inFrame(z) ? 'inside the frame' : 'outside the frame'}</b></div>
          <div class="row"><span>Painted over</span><b>${Math.round(s.paint * 100)}%</b></div>`;
      },
      dispose() {
        el.removeEventListener('pointerdown', down, true); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', release);
        stage.controls.enabled = true; rtClay.dispose(); rtPaint.dispose(); win.dispose(); glow.dispose();
        paintables.forEach((m) => m.userData.paint?.dispose()); stage.setShift(0, 0);
      },
    };
  },
};
