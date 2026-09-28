// Chapter 5: turnarounds and model sheets. Kaavu, a forest spirit designed for this box, stands on a
// turntable next to a plain 1.7 m adult for scale. Behind them, a model sheet shows Kaavu front, side and
// back, rendered live with orthographic cameras (no perspective, so every part is measurable), with
// head-height lines and colour callouts. This is the page a 3D modeller works from (see Anim3DClear).
//
// Proportions: figure-drawing books measure height in head-heights. An average adult is about 7 to 7.5
// heads, an idealised or heroic figure 8 or more (Andrew Loomis, "Figure Drawing for All It's Worth", 1943),
// and cartoon and "chibi" characters use big heads, about 2 to 5, to look young and friendly. A typical adult
// head is about 22 to 24 cm from chin to crown (NASA-STD-3000 anthropometry; ANSUR II), so 1.7 m / 7.5 ≈ 23 cm.
import { THREE, M, box, clamp, approach } from '../kit.js';
import { board, text, rrect, COL, SANS, makeKaavu, makeHuman, KAAVU_COL, fitNarrow, inReel, TAU } from '../art.js';

const HUMAN = 1.7, HUMAN_HEADS = 7.5;
const styleOf = (n) => (n < 3 ? 'chibi, baby-like' : n < 5 ? 'cartoony and friendly' : n < 6.5 ? 'stylised, teen-like' : n < 7.9 ? 'realistic adult' : 'heroic, idealised');
const VIEWS = [{ v: 0, label: 'Front' }, { v: 45, label: '¾' }, { v: 90, label: 'Side' }, { v: 180, label: 'Back' }];
const SLOTS = ['FRONT', 'SIDE', 'BACK', 'WITH A 1.7 m ADULT'];
const SPOT_OF = { 'Moss cloak': 'moss', 'Bark skin': 'bark', 'Leaf crown': 'leaf', 'Eye glow': 'eye', 'Lantern flame': 'flame', 'Mushroom caps': 'cap' };

export default {
  id: 'turnaround',
  short: 'Turnarounds',
  title: 'Turnarounds and model sheets',
  subtitle: 'One design, drawn from every side at the same scale, so it can be built.',
  view: { pos: [0.2, 2.1, 8.0], target: [0.2, 1.45, -0.6] },
  learn: `<p>A painting shows a design from one angle, but a 3D modeller, a sculptor or a costume maker needs <b>every</b> side. So once a design is approved, the artist draws a <b>turnaround</b>: the same character from the <b>front</b>, <b>side</b> and <b>back</b>, often the three-quarter view too, lined up at exactly the same size.</p>
    <p>These views are <b>orthographic</b>: drawn without perspective, so a line that is 20 cm long measures 20 cm wherever it sits. Horizontal guide lines run across all the views, so the eyes, shoulders and hem sit at the same height in each one. The modeller drops the drawings into their 3D program as backgrounds and builds on top of them (see <b>Anim3DClear</b>).</p>
    <p>A <b>model sheet</b> adds everything else the builders need: the <b>height</b> next to a human, the proportions measured in <b>head-heights</b>, and <b>colour callouts</b> with exact colour codes for each material. Head size does a lot of the storytelling. A real adult is about <b>7.5 heads</b> tall; cute and friendly characters use big heads, only 2 to 4 heads tall.</p>
    <p class="tip"><b>Try it:</b> turn Kaavu with the view buttons and compare with the sheet on the wall. Slide the heads-tall control from 2.5 to 7.5 and watch the character go from cute to serious. Change the height to see it next to the adult.</p>`,
  terms: [
    { t: 'Turnaround', d: 'Drawings of one design from the front, side and back (and often ¾), at the same scale.' },
    { t: 'Orthographic view', d: 'A view with no perspective, so sizes can be measured anywhere in the drawing.' },
    { t: 'Model sheet', d: 'A reference page with views, proportions, sizes and colours for the people who build a design.' },
    { t: 'Heads tall', d: 'A figure’s height measured in head-heights, a quick way to describe proportions.' },
    { t: 'Colour callout', d: 'A swatch with a name and code, pointing to the part of the design it belongs to.' },
    { t: 'Scale figure', d: 'A plain human drawn next to a design so everyone knows how big it is.' },
  ],
  defaults: { turn: 0, spin: false, H: 2.2, heads: 3.6, callouts: true },
  controls: [
    { key: 'turn', type: 'seg', label: 'Turntable view', options: VIEWS },
    { key: 'spin', type: 'toggle', label: 'Spin the turntable' },
    { key: 'heads', type: 'range', label: 'Heads tall', min: 2.2, max: 8, step: 0.1, ends: ['cute', 'heroic'], fmt: (v) => v.toFixed(1) + ' heads' },
    { key: 'H', type: 'range', label: 'Height (to the top of the head)', min: 0.6, max: 3.4, step: 0.05, fmt: (v) => v.toFixed(2) + ' m' },
    { key: 'callouts', type: 'toggle', label: 'Colour callouts' },
  ],
  onChange(s, key) { if (key === 'turn') s.spin = false; },
  quiz: [
    { q: 'Why are turnaround views drawn without perspective (orthographic)?', options: ['It is faster to draw', 'So sizes can be measured the same everywhere in the drawing', 'Perspective is only for backgrounds', 'Computers cannot read perspective'], answer: 1, why: 'Without perspective, nothing shrinks with distance, so a modeller can measure every part straight off the page.' },
    { q: 'A character is drawn 3 heads tall. How will it probably feel?', options: ['Realistic and serious', 'Cute, young or friendly', 'Heroic', 'Scary and huge'], answer: 1, why: 'Big heads on small bodies read as young and friendly. Real adults are about 7 to 7.5 heads tall.' },
    { q: 'Why put a plain human next to a creature on a model sheet?', options: ['For decoration', 'To show how big the creature is', 'To show the human costume', 'To fill empty space'], answer: 1, why: 'A scale figure tells everyone, from set builders to animators, the creature’s real size.' },
  ],
  reel: [
    { ms: 5200, caption: 'A turnaround shows one design from the front, side and back, all at the same scale.', set: { spin: false, heads: 3.6, H: 2.2, callouts: false }, anim: { turn: [0, 180] }, spin: 0 },
    { ms: 5000, caption: 'Big heads read as cute; a real adult is about seven and a half heads tall.', set: { turn: 45, spin: false, H: 2.2, callouts: false }, anim: { heads: [2.4, 7.5] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const floor = box(9, 0.04, 5.5, M.matte(0x2b2f38)); floor.position.set(0.4, 0.02, 0.2); floor.receiveShadow = true; root.add(floor);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 0.12, 48), M.matte(0x444b57)); table.position.y = 0.06; table.receiveShadow = true; root.add(table);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.015, 8, 64), M.glow(0x38bdf8)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.125; root.add(ring);
    const turn = new THREE.Group(); turn.position.y = 0.12; root.add(turn);
    const kaavu = makeKaavu(); turn.add(kaavu);
    const human = makeHuman(HUMAN); human.position.set(2.1, 0.04, 0.3); root.add(human);
    const lHuman = stage.label('Adult, 1.7 m', [2.1, HUMAN + 0.3, 0.3], root);
    // measuring pole with half-metre marks
    const pole = box(0.04, 3.5, 0.04, M.matte(0xe8e2d6)); pole.position.set(3.2, 1.75, 0.4); root.add(pole);
    for (let y = 0.5; y <= 3.5; y += 0.5) { const t = box(0.18, 0.02, 0.02, M.glow(y % 1 ? 0x9aa3b2 : 0xffd166)); t.position.set(3.12, y, 0.4); root.add(t); if (!(y % 1)) stage.label(`${y} m`, [3.55, y, 0.4], root); }

    // the model sheet on the wall
    const WW = 7.6, WH = 3.7, SW = 1.62, SH = 2.5, SY = 0.15;
    const wall = new THREE.Group(); wall.position.set(0.3, 1.95, -2.5); root.add(wall);
    const slotX = (i) => -WW / 2 + 0.35 + SW / 2 + i * (SW + 0.2);
    const sheet = board(wall, WW, WH, 1520, 740, (g, w, h, info = {}) => {
      g.clearRect(0, 0, w, h); rrect(g, 2, 2, w - 4, h - 4, 18); g.fillStyle = '#e9e2d3'; g.fill();
      text(g, 'KAAVU · forest spirit · model sheet v3', 30, 50, { font: `700 34px ${SANS}`, col: '#3b3833' });
      text(g, info.sub || '', w - 30, 50, { font: `24px ${SANS}`, col: '#6a6258', align: 'right' });
      const k = w / WW;
      SLOTS.forEach((t, i) => text(g, t, (slotX(i) + WW / 2) * k, h - 150 + 6, { font: `600 20px ${SANS}`, col: '#3b3833', align: 'center' }));
      KAAVU_COL.forEach((c, i) => {
        const x = 30 + i * 248, y = h - 100;
        rrect(g, x, y, 56, 56, 10); g.fillStyle = c.hex; g.fill(); g.lineWidth = 2; g.strokeStyle = '#3b3833'; g.stroke();
        text(g, c.part, x + 68, y + 24, { font: `600 20px ${SANS}`, col: '#3b3833' });
        text(g, c.hex.toUpperCase(), x + 68, y + 50, { font: `18px ${SANS}`, col: '#6a6258' });
      });
    }, [0, 0, 0], { opaque: true });
    // four orthographic renders
    const RT = [260, 400];
    const slots = SLOTS.map((_, i) => {
      const rt = new THREE.WebGLRenderTarget(RT[0], RT[1], { samples: 4 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false }));
      m.position.set(slotX(i), SY, 0.01); wall.add(m);
      return { rt, m, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50) };
    });
    const lines = board(wall, WW, WH, 1520, 740, () => {}, [0, 0, 0.02]);
    const hide = [wall, human, lHuman, pole, floor, table, ring];

    // colour callouts on the 3D figure
    const callouts = KAAVU_COL.map((c) => {
      const l = stage.label(`<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c.hex};margin-right:6px;vertical-align:-1px"></span>${c.part} <span style="opacity:.6">${c.hex.toUpperCase()}</span>`, [0, 0, 0], kaavu);
      l.key = SPOT_OF[c.part]; return l;
    });

    let built = '', ang = 0, narrow = false;
    const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
    const shoot = () => {
      const r = stage.renderer, sc = stage.scene;
      const H = kaavu.H, top = Math.max(H + kaavu.hh * 0.85, HUMAN) * 1.1, wid = top * SW / SH;
      const vis = hide.map((o) => o.visible), fl = stage.floor.visible, bg = sc.background, rot = turn.rotation.y, hp = human.position.clone(), hv = human.visible;
      hide.forEach((o) => { o.visible = false; }); stage.floor.visible = false; callouts.forEach((c) => { c.visible = false; });
      turn.rotation.y = 0; sc.background = new THREE.Color(0xf1ebde);
      slots.forEach((sl, i) => {
        const c = sl.cam, cy = top / 2 - 0.05;
        c.left = -wid / 2; c.right = wid / 2; c.top = top / 2; c.bottom = -top / 2; c.updateProjectionMatrix();
        human.visible = i === 3; human.position.set(kaavu.R * 1.5 + 0.35, 0.12, 0);
        if (i === 3) { c.left = -wid * 0.42; c.right = wid * 0.58; c.updateProjectionMatrix(); }
        const P = [[0, cy, 10], [10, cy, 0], [0, cy, -10], [0, cy, 10]][i];
        c.position.set(P[0], P[1] + 0.12, P[2]); c.lookAt(0, cy + 0.12, 0);
        r.setRenderTarget(sl.rt); r.clear(); r.render(sc, c);
      });
      r.setRenderTarget(null);
      hide.forEach((o, i) => { o.visible = vis[i]; }); stage.floor.visible = fl; sc.background = bg; turn.rotation.y = rot; human.position.copy(hp); human.visible = hv;
      // head lines across the slots
      // world height y → pixel row on the sheet: the camera sees y from 0.07 to top + 0.07
      const g = lines.g, k = 1520 / WW;
      g.clearRect(0, 0, 1520, 740);
      const yToPx = (y) => (WH / 2 - (SY - SH / 2 + ((y - 0.07) / top) * SH)) * k;
      const x0 = (slotX(0) - SW / 2 + WW / 2) * k, x1 = (slotX(3) + SW / 2 + WW / 2) * k;
      g.lineWidth = 1.5;
      for (let n = 0; n <= Math.ceil(kaavu.H / kaavu.hh - 0.01); n++) {
        const y = kaavu.H - n * kaavu.hh; if (y < -0.01) break;
        const py = yToPx(y + 0.12); g.strokeStyle = n === 0 ? 'rgba(200,60,50,.8)' : 'rgba(40,90,160,.5)'; g.setLineDash(n === 0 ? [] : [8, 6]);
        g.beginPath(); g.moveTo(x0, py); g.lineTo(x1, py); g.stroke();
        if (n > 0) text(g, String(n), x0 - 22, py + 6, { font: `600 18px ${SANS}`, col: 'rgba(40,90,160,.9)' });
      }
      g.setLineDash([]);
      const gy = yToPx(0.12); g.strokeStyle = '#3b3833'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0, gy); g.lineTo(x1, gy); g.stroke();
      lines.tex.needsUpdate = true;
    };

    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const b = `${s.H.toFixed(2)}|${s.heads.toFixed(2)}`;
        if (b !== built) {
          kaavu.build(s.H, s.heads); built = b;
          callouts.forEach((c) => { const p = kaavu.spots[c.key]; if (p) c.position.set(p[0] * 1.35, p[1], p[2] * 1.35); });
          shoot();
          sheet.redraw({ sub: `${s.H.toFixed(2)} m to the top of the head · ${s.heads.toFixed(1)} heads tall` });
          lHuman.position.set(2.1, HUMAN + 0.25, 0.3);
        }
        const target = (s.turn * Math.PI) / 180;
        if (s.spin && !inReel()) ang += dt * 0.6; else ang = approach(ang, target + Math.round((ang - target) / TAU) * TAU, 5, dt);
        turn.rotation.y = ang;
        // show a callout only when its part faces the viewer
        camDir.copy(stage.camera.position).sub(turn.position).setY(0).normalize();
        callouts.forEach((c) => {
          c.getWorldPosition(tmp); tmp.sub(turn.position).setY(0);
          const facing = tmp.lengthSq() < 0.02 || tmp.normalize().dot(camDir) > -0.15;
          c.visible = s.callouts && facing && !narrow;
        });
        narrow = fitNarrow(stage, [lHuman]);
      },
      readout: (s) => {
        const hh = s.H / s.heads;
        return `<div class="big">${s.heads.toFixed(1)} heads: ${styleOf(s.heads)}</div>
          <div class="row"><span>Height to top of head</span><b>${s.H.toFixed(2)} m</b></div>
          <div class="row"><span>One head-height</span><b>${Math.round(hh * 100)} cm</b></div>
          <div class="row"><span>Compared with a 1.7 m adult</span><b>${(s.H / HUMAN).toFixed(2)}×</b></div>
          <div class="row"><span>The adult's head</span><b>${Math.round((HUMAN / HUMAN_HEADS) * 100)} cm, ${HUMAN_HEADS} heads</b></div>`;
      },
      dispose() { slots.forEach((sl) => sl.rt.dispose()); stage.setShift(0, 0); },
    };
  },
};
