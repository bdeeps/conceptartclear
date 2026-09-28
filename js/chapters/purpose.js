// Chapter 1: what concept art is for. One design, Tikku the robot auto-rickshaw for an invented film
// ("Monsoon Circuit"), walks the art department's pipeline: brief → thumbnails → roughs → final painting →
// turnaround → model sheet → 3D build. The big easel repaints itself, stroke by stroke, at each step; the
// 3D model on the plinth stays a see-through wireframe until the design is locked, then is "built".
//
// Timings, counts and "cost to change" are rounded, typical figures from art-department practice, not rules:
// thumbnails are quick sketches of minutes each and come in dozens; a finished keyframe or environment
// painting commonly takes a day or more; physical sets and 3D models take weeks (Wikipedia "Concept art" and
// "Thumbnail sketch"; studio "art of" books). Treat them as estimates.
import { THREE, M, box, approach, clamp } from '../kit.js';
import {
  board, paper, text, wrap, rrect, COL, SANS, SERIF, drawTikku, drawTikkuEnd, variant, BASE, TIKKU_COL,
  paintStreet, revealPaint, makeTikku3D, makeEasel, fitNarrow, inReel,
} from '../art.js';

export const STEPS = [
  { id: 'brief', name: 'Brief', use: 'Script, photos, mood words', by: 'Director, designer', tool: 'Script pages, reference photos, mood words', who: 'Director, production designer', count: '1 page', cost: 'minutes', costK: 0.02 },
  { id: 'thumbs', name: 'Thumbnails', use: 'Pencil or a big brush', by: 'Art director', tool: 'Pencil or a big digital brush, stamp-sized', who: 'Art director picks favourites', count: 'dozens', cost: 'minutes', costK: 0.04 },
  { id: 'roughs', name: 'Roughs', use: 'Pencil or tablet', by: 'Director, art director', tool: 'Pencil or digital sketch, a few picked ideas', who: 'Director, art director', count: '3 to 10', cost: 'about an hour', costK: 0.1 },
  { id: 'paint', name: 'Final painting', use: 'Photoshop, paint-over', by: 'The whole crew', tool: 'Photoshop, Procreate, 3D paint-over, gouache', who: 'Everyone: the look of the film', count: 'a handful', cost: 'a day or so', costK: 0.25 },
  { id: 'turn', name: 'Turnaround', use: 'Clean line drawings', by: 'Modellers, builders', tool: 'Clean line drawings: front, side, back', who: '3D modellers, set builders', count: '1 per design', cost: 'a few days', costK: 0.4 },
  { id: 'sheet', name: 'Model sheet', use: 'Sizes and colour codes', by: 'Modellers, costume, props', tool: 'Sizes, colours and materials called out', who: 'Modellers, texture painters, costume, props', count: '1 per design', cost: 'days', costK: 0.55 },
  { id: 'build', name: '3D build', use: '3D software or workshop', by: 'Animators, lighting', tool: 'Blender, Maya, ZBrush, or wood and paint', who: 'Animators, lighting, the camera', count: 'the real thing', cost: 'weeks', costK: 1 },
];
const DEPTS = {
  sets: { name: 'Sets', reads: [3, 4, 5], note: 'build streets and rooms from environment paintings' },
  costume: { name: 'Costume', reads: [3, 5], note: 'cut and dye cloth to match the colour callouts' },
  props: { name: 'Props', reads: [4, 5], note: 'make the objects actors hold, from turnarounds' },
  creatures: { name: 'Creatures', reads: [2, 4, 5], note: 'sculpt creatures and robots in 3D or latex' },
  vfx: { name: 'VFX', reads: [3, 5, 6], note: 'match lighting and colour to the keyframes' },
};
const BRIEF = 'Scene 12, dusk. Tikku, a small, cheeky robot auto-rickshaw, splashes through a flooded market as the street lamps come on. It must look friendly, hard-working and a little worn.';

// Draw the artefact for one step on a 16:9 canvas.
function artefact(g, w, h, i) {
  const s = STEPS[i];
  if (i === 3) { paintStreet(g, w, h, { hour: 18.2, light: 0.55, mood: 'comp', vis: 8 }); return; }
  if (i === 6) {
    g.fillStyle = '#0d2a4a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(140,200,255,.18)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.save(); g.globalCompositeOperation = 'screen'; g.filter = 'invert(1) hue-rotate(180deg)';
    drawTikku(g, w * 0.5, h * 0.8, 150, BASE, 'line'); g.restore();
    text(g, 'Locked design → built in 3D', 30, 54, { font: `600 34px ${SANS}`, col: '#9ad7ff' });
    text(g, 'polygons, rig, textures', 30, 96, { font: `24px ${SANS}`, col: 'rgba(154,215,255,.7)' });
    return;
  }
  paper(g, w, h);
  if (i === 0) {
    text(g, 'MONSOON CIRCUIT', 40, 70, { font: `700 40px ${SANS}`, col: COL.lead });
    text(g, 'Art brief · design #1: the hero vehicle', 40, 110, { font: `26px ${SANS}`, col: '#6a6258' });
    wrap(g, BRIEF, 40, 170, w * 0.55, 38, { font: `28px ${SERIF}`, col: COL.lead });
    ['wet', 'warm', 'cheeky', 'hopeful'].forEach((m, k) => { rrect(g, 40 + k * 140, h - 90, 124, 46, 23); g.fillStyle = ['#8fb3d9', '#f0b53c', '#1d9a95', '#e0453a'][k]; g.fill(); text(g, m, 102 + k * 140, h - 58, { font: `600 24px ${SANS}`, col: '#fff', align: 'center' }); });
    // reference photo placeholders
    [[0.66, 0.12, '#6f7f8f', 'ref: rain on tin'], [0.66, 0.46, '#c9803f', 'ref: old autos'], [0.83, 0.29, '#3f5a6b', 'ref: market lamps']].forEach(([x, y, c, t]) => {
      g.save(); g.translate(x * w, y * h); g.rotate((x - 0.75) * 0.3); g.fillStyle = '#fff'; g.fillRect(-8, -8, 196, 150); g.fillStyle = c; g.fillRect(0, 0, 180, 110);
      text(g, t, 0, 134, { font: `18px ${SANS}`, col: '#555' }); g.restore();
    });
    return;
  }
  if (i === 1) {
    for (let k = 0; k < 12; k++) { const cx = (k % 4 + 0.5) * w / 4, cy = (Math.floor(k / 4) + 0.5) * h / 3; drawTikku(g, cx, cy + 50, 38, variant(k + 1, 0.85), 'sil'); text(g, String(k + 1), cx - w / 8 + 12, cy - h / 6 + 26, { font: `18px ${SANS}`, col: '#8a8378' }); }
    return;
  }
  if (i === 2) {
    [3, 7, 10].forEach((k, j) => { drawTikku(g, (j + 0.5) * w / 3, h * 0.72, 70, variant(k, 0.85), 'line'); });
    text(g, 'Roughs: three picks, drawn bigger', 30, 50, { font: `600 28px ${SANS}`, col: COL.lead });
    return;
  }
  if (i === 4) {
    const gy = h * 0.82, sc = 120;
    g.strokeStyle = 'rgba(59,56,51,.25)'; g.lineWidth = 1.5; g.setLineDash([8, 6]);
    for (const y of [0, BASE.h, BASE.h / 2]) { g.beginPath(); g.moveTo(20, gy - y * sc); g.lineTo(w - 20, gy - y * sc); g.stroke(); }
    g.setLineDash([]);
    drawTikkuEnd(g, w * 0.14, gy, sc, BASE, false, 'line');
    drawTikku(g, w * 0.5, gy, sc, BASE, 'line');
    drawTikkuEnd(g, w * 0.86, gy, sc, BASE, true, 'line');
    ['FRONT', 'SIDE', 'BACK'].forEach((t, k) => text(g, t, [0.14, 0.5, 0.86][k] * w, h - 30, { font: `600 24px ${SANS}`, col: COL.lead, align: 'center' }));
    return;
  }
  if (i === 5) {
    const gy = h * 0.8, sc = 130;
    drawTikku(g, w * 0.4, gy, sc, BASE, 'color');
    g.strokeStyle = COL.lead; g.lineWidth = 2;
    g.beginPath(); g.moveTo(w * 0.4 - BASE.len / 2 * sc, gy + 28); g.lineTo(w * 0.4 + BASE.len / 2 * sc, gy + 28); g.stroke();
    text(g, '2.6 m', w * 0.4, gy + 58, { font: `600 24px ${SANS}`, col: COL.lead, align: 'center' });
    g.beginPath(); g.moveTo(w * 0.4 - BASE.len / 2 * sc - 30, gy); g.lineTo(w * 0.4 - BASE.len / 2 * sc - 30, gy - BASE.h * sc); g.stroke();
    text(g, '1.75 m', w * 0.4 - BASE.len / 2 * sc - 40, gy - BASE.h * sc / 2, { font: `600 24px ${SANS}`, col: COL.lead, align: 'right' });
    Object.entries({ body: 'Body: teal enamel', canopy: 'Canopy: mustard canvas', eye: 'Eye: cool LED', seat: 'Seat: rexine red', dark: 'Tyres: black rubber' }).forEach(([k, t], j) => {
      const y = 70 + j * 62; rrect(g, w * 0.72, y, 44, 44, 8); g.fillStyle = TIKKU_COL[k]; g.fill(); g.strokeStyle = COL.lead; g.stroke();
      text(g, t, w * 0.72 + 58, y + 30, { font: `22px ${SANS}`, col: COL.lead }); text(g, TIKKU_COL[k], w * 0.72 + 58, y + 52, { font: `16px ${SANS}`, col: '#7a7266' });
    });
    text(g, 'MODEL SHEET · TIKKU v7', 30, 50, { font: `700 28px ${SANS}`, col: COL.lead });
  }
}

export default {
  id: 'purpose',
  short: 'What it is for',
  title: 'A design document for the whole crew',
  subtitle: 'Concept art decides what everything looks like before anyone builds it.',
  view: { pos: [-0.3, 2.2, 7.0], target: [-0.3, 1.35, 0] },
  learn: `<p>Before a film builds a set, sews a costume or models a robot, somebody has to decide <b>what it looks like</b>. That is the job of <b>concept art</b>: drawings and paintings that design the world of a film, from the streets and rooms (<b>sets</b>) to the clothes (<b>costumes</b>), the things people hold (<b>props</b>), the <b>creatures</b> and the big <b>keyframe</b> moments.</p>
    <p>Concept art is not the poster and it is not the finished film. It is a <b>tool</b>. Hundreds of people read it: carpenters, tailors, 3D modellers, lighting artists and the director all point at the same painting and say "that". It is how a crew agrees before spending money.</p>
    <p>It follows a path from rough to exact. A written <b>brief</b> becomes dozens of tiny <b>thumbnails</b>, then a few <b>roughs</b>, then a <b>final painting</b>. Once a design is chosen, a <b>turnaround</b> and a <b>model sheet</b> pin down every side, size and colour, so the builders can make it. Changing a drawing takes minutes; changing a built set takes weeks. That is why the thinking happens on paper first. <b>StoryboardClear</b> plans the shots, and <b>FilmClear</b> shows where all this sits in the whole film pipeline.</p>
    <p class="tip"><b>Try it:</b> step through the pipeline and watch the easel repaint itself. See how the model on the plinth stays a see-through wireframe until the design is locked. Pick a department to see which pages it reads.</p>`,
  terms: [
    { t: 'Concept art', d: 'Drawings and paintings that design how a film’s world, characters and objects look, before they are built.' },
    { t: 'Brief', d: 'The written request: what is needed, for which scene, and the mood it should have.' },
    { t: 'Thumbnail', d: 'A tiny, fast sketch for trying out many ideas at once.' },
    { t: 'Keyframe painting', d: 'A finished painting of an important moment, showing the film’s light and colour.' },
    { t: 'Turnaround', d: 'The same design drawn from the front, side and back, so it can be built.' },
    { t: 'Model sheet', d: 'A reference page with sizes, colours and materials called out for the builders.' },
    { t: 'Production designer', d: 'The head of the art department, responsible for the look of the whole film.' },
  ],
  defaults: { step: 0, tour: true, dept: 'sets' },
  onChange(s, key) { if (key === 'step') s.tour = false; },
  controls: [
    { key: 'step', type: 'seg', label: 'Pipeline step', options: STEPS.map((x, i) => ({ v: i, label: String(i + 1) })), fmt: (v) => STEPS[Math.round(v)]?.name || '' },
    { key: 'tour', type: 'toggle', label: 'Play the pipeline', hint: 'Steps through every stage on its own.' },
    { key: 'dept', type: 'seg', label: 'Which department is reading?', options: Object.entries(DEPTS).map(([v, d]) => ({ v, label: d.name })), fmt: (v) => DEPTS[v]?.note || '' },
  ],
  quiz: [
    { q: 'What is concept art mainly for?', options: ['Advertising the film', 'Deciding what things look like before they are built', 'Replacing the actors', 'Colouring the finished film'], answer: 1, why: 'It is a design tool: the crew builds sets, costumes, props and 3D models from it.' },
    { q: 'Why do artists start with many tiny thumbnails?', options: ['Paper is expensive', 'Small sketches are quick, so you can try lots of ideas before choosing', 'Directors like small pictures', 'They are printed on tickets'], answer: 1, why: 'A thumbnail takes minutes, so dozens of ideas can be compared before anyone commits to one.' },
    { q: 'Who mostly uses a turnaround and model sheet?', options: ['The audience', 'The builders: 3D modellers, set and prop makers', 'The film critics', 'The sound team'], answer: 1, why: 'They show every side, size and colour, so a modeller or carpenter can make it exactly.' },
  ],
  reel: [
    { ms: 5600, caption: 'Before a film builds anything, concept artists design it on paper.', set: { tour: false, dept: 'sets' }, anim: { step: [0, 3] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // studio floor
    const floor = box(9, 0.04, 5, M.matte(0x2b2f38)); floor.position.set(-0.4, 0.02, 0.5); floor.receiveShadow = true; root.add(floor);
    // the big easel
    const easel = makeEasel(3.3, 1.8); easel.position.set(0.7, 0, -0.3); root.add(easel);
    const BW = 3.2, BH = 1.8, PW = 1024, PH = 576;
    const off = document.createElement('canvas'); off.width = PW; off.height = PH; const og = off.getContext('2d');
    const prev = document.createElement('canvas'); prev.width = PW; prev.height = PH; const pg = prev.getContext('2d'); paper(pg, PW, PH);
    const main = board(easel, BW, BH, PW, PH, (g, w, h, k = 1) => {
      g.clearRect(0, 0, w, h); g.drawImage(prev, 0, 0);
      const st = revealPaint(g, off, w, h, k);
      if (st && k < 1) { g.fillStyle = 'rgba(255,209,102,.9)'; g.beginPath(); g.arc(st.x * w + st.l * w * 0.3, st.y * h, 10, 0, Math.PI * 2); g.fill(); }
    }, [0, easel.boardY, easel.boardZ + 0.03], { opaque: true });
    // the pipeline strip: one cell per step, tool underneath, departments' dots
    const strip = board(root, 6.4, 0.95, 1400, 208, (g, w, h, i = 0, dept = 'sets') => {
      g.clearRect(0, 0, w, h); rrect(g, 2, 2, w - 4, h - 4, 16); g.fillStyle = 'rgba(10,12,18,.92)'; g.fill();
      const cw = w / STEPS.length, reads = DEPTS[dept].reads;
      STEPS.forEach((s, k) => {
        const x = k * cw, on = k === i, done = k < i;
        rrect(g, x + 8, 12, cw - 16, h - 24, 12); g.fillStyle = on ? 'rgba(56,189,248,.28)' : done ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.03)'; g.fill();
        if (on) { g.lineWidth = 3; g.strokeStyle = COL.c; g.stroke(); }
        text(g, String(k + 1), x + 22, 48, { font: `600 26px ${SANS}`, col: on ? COL.c : 'rgba(255,255,255,.5)' });
        text(g, s.name, x + 50, 48, { font: `600 26px ${SANS}`, col: on ? '#fff' : 'rgba(255,255,255,.78)' });
        wrap(g, s.tool, x + 22, 86, cw - 44, 26, { font: `19px ${SANS}`, col: 'rgba(255,255,255,.6)' });
        if (reads.includes(k)) { g.beginPath(); g.arc(x + cw - 30, 38, 9, 0, Math.PI * 2); g.fillStyle = COL.hot; g.fill(); }
        if (k < STEPS.length - 1) text(g, '→', x + cw - 6, h / 2 + 8, { font: `26px ${SANS}`, col: 'rgba(255,255,255,.45)', align: 'center' });
      });
      text(g, `● ${DEPTS[dept].name} reads these`, w - 20, h - 18, { font: `600 18px ${SANS}`, col: COL.hot, align: 'right' });
    }, [-0.2, 0.3, 2.4]);
    strip.mesh.rotation.x = -1.05; strip.mesh.scale.setScalar(0.78);
    // the plinth and the design, first as a see-through wireframe, then built
    const plinth = box(1.9, 0.5, 1.1, M.matte(0x3a3f4a)); plinth.position.set(-2.5, 0.25, 0.6); root.add(plinth);
    const holder = new THREE.Group(); holder.position.set(-2.5, 0.5, 0.6); holder.scale.setScalar(0.62); holder.rotation.y = 0.6; root.add(holder);
    const ghost = makeTikku3D(BASE, { ghost: true }); holder.add(ghost);
    const solid = makeTikku3D(BASE); holder.add(solid);
    const lTitle = stage.label('', [0.7, 3.05, -0.2], root, 'hot');
    const lPl = stage.label('Not built yet: only an outline', [-2.5, 1.85, 0.6], root);

    let shown = -1, k = 1, tourT = 0, build = 0;
    const setStep = (i) => {
      pg.drawImage(main.canvas, 0, 0);
      og.clearRect(0, 0, PW, PH); artefact(og, PW, PH, i);
      shown = i; k = 0;
    };
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        if (s.tour && !inReel()) { tourT += dt; if (tourT > 3.6) { tourT = 0; s.step = (Math.round(s.step) + 1) % STEPS.length; } }
        const i = clamp(Math.round(s.step), 0, STEPS.length - 1);
        if (i !== shown) { setStep(i); strip.redraw(i, s.dept); lTitle.element.textContent = `Step ${i + 1}: ${STEPS[i].name}`; }
        if (strip.dept !== s.dept) { strip.dept = s.dept; strip.redraw(i, s.dept); }
        if (k < 1) { k = Math.min(1, k + dt / 1.3); main.redraw(k); }
        build = approach(build, i === 6 ? 1 : 0, 3, dt);
        solid.visible = build > 0.02; solid.scale.set(1, Math.max(0.001, build), 1);
        ghost.visible = build < 0.98; ghost.traverse((o) => { if (o.material) o.material.opacity = 0.12 + 0.05 * i; });
        holder.rotation.y -= dt * 0.25;
        lPl.element.textContent = i === 6 ? 'Built: now it can be animated' : i >= 4 ? 'Design locked: ready to build' : 'Not built yet: only an outline';
        fitNarrow(stage, [lPl]);
      },
      readout: (s) => {
        const st = STEPS[clamp(Math.round(s.step), 0, 6)];
        return `<div class="big">${st.name}</div>
          <div class="row"><span>Made with</span><b>${st.use}</b></div>
          <div class="row"><span>Read by</span><b>${st.by}</b></div>
          <div class="row"><span>How many</span><b>${st.count}</b></div>
          <div class="row"><span>Cost to change it here</span><b ${st.costK > 0.5 ? 'class="no"' : ''}>${st.cost}</b></div>`;
      },
    };
  },
};
