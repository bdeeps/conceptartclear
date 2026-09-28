// Chapter 6: tools and careers. The same design, Tikku in the monsoon street, is re-made in six media on the
// artist's desk: pencil, gouache, Photoshop, Procreate, a 3D paint-over and a photobash. Each version is built
// live from the painter in art.js: pencil hatching whose density follows the value pass, gouache as a few flat
// opaque colours, a 3D clay render half painted over, and photo-like textures cut in and painted together.
//
// Dates: graphite pencils from the 1560s, modern fired leads patented by Nicolas-Jacques Conté in 1795
// (Britannica, "pencil"); Photoshop 1.0 shipped in February 1990 with a single undo, gained layers in 3.0 (1994)
// and the multi-step History palette in 5.0 (1998) (Adobe; Wikipedia "Adobe Photoshop version history");
// Procreate launched on the iPad in 2011 (Savage Interactive); Blender became free and open source in 2002
// (Blender Foundation). Photobashing grew in the 2000s with digital photography.
import { THREE, M, box, beam, sphere, clamp } from '../kit.js';
import {
  board, text, wrap, rrect, COL, SANS, SERIF, paintStreet, revealPaint, paper, rng, fitNarrow, faceTo, TAU,
} from '../art.js';

export const TOOLS = [
  { id: 'pencil', name: 'Pencil and paper', year: '1560s graphite; 1795 modern leads', undo: 'an eraser', layers: 'tracing paper', good: 'fast thumbnails, drawing from life' },
  { id: 'gouache', name: 'Gouache', year: 'centuries old; Disney’s colour artists, 1930s to 1950s', undo: 'paint over it: it is opaque', layers: 'none', good: 'bold flat colour, quick mood studies' },
  { id: 'ps', name: 'Photoshop and a pen tablet', year: '1990 (Photoshop 1.0)', undo: 'one step until 1998, then many', layers: 'since 1994', good: 'final paintings, fixes, colour changes' },
  { id: 'procreate', name: 'Procreate on a tablet', year: '2011 (iPad)', undo: 'many steps', layers: 'yes', good: 'sketching anywhere, painterly brushes' },
  { id: 'paintover', name: '3D paint-over (e.g. Blender)', year: '2000s; Blender free since 2002', undo: 'move the camera and re-render', layers: 'yes', good: 'accurate perspective, many angles' },
  { id: 'photobash', name: 'Photobash', year: '2000s onward', undo: 'many steps', layers: 'lots', good: 'realistic texture, fast, for photoreal films' },
];
const BOARDS = {
  path: { name: 'Career path', rows: ['Draw every day: people, streets, animals, from life', 'Learn: art or design school, or self-taught with online courses', 'Build a portfolio aimed at one job', 'Junior or visual development artist', 'Concept artist', 'Senior and lead artist', 'Art director or production designer'] },
  studios: { name: 'Where in India', rows: ['Film VFX: Makuta VFX (Hyderabad, Baahubali), Red Chillies VFX and DNEG (Mumbai)', 'Animation: Green Gold Animation (Hyderabad), Toonz (Thiruvananthapuram)', 'Games also hire concept artists: e.g. Ubisoft (Pune), Rockstar India (Bengaluru)', 'Film art departments under production designers such as Sabu Cyril', 'Many artists freelance for studios abroad'] },
  folio: { name: 'The portfolio', rows: ['10 to 20 of your strongest pieces, not everything', 'Show the process: thumbnails, roughs, then finals', 'Aim it: environments, or characters, or vehicles', 'Design first: clear shapes and ideas beat shiny rendering', 'Your own ideas, not fan art copies of famous films', 'Draw from life to keep your eye sharp'] },
};

const W = 800, H = 450;
function medium(g, id, cache) {
  const p = { hour: 17.6, light: 0.5, mood: 'comp', vis: 9 };
  const col = cache.col ||= (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; paintStreet(c.getContext('2d'), W, H, p); return c; })();
  const val = cache.val ||= (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; paintStreet(c.getContext('2d'), W, H, p, { value: true }); return c; })();
  g.clearRect(0, 0, W, H);
  if (id === 'pencil') {
    paper(g, W, H);
    const d = val.getContext('2d').getImageData(0, 0, W, H).data, L = (x, y) => d[(Math.min(H - 1, y) * W + Math.min(W - 1, x)) * 4] / 255;
    g.strokeStyle = 'rgba(55,52,48,.55)'; g.lineWidth = 1.1; g.beginPath();
    // three layers of hatching: each direction switches on below a darker threshold
    for (const [ang, th] of [[0.6, 0.72], [-0.6, 0.5], [1.4, 0.3]]) {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let y = 0; y < H; y += 5) for (let x = 0; x < W; x += 5) {
        if (L(x, y) < th) { g.moveTo(x - ca * 3, y - sa * 3); g.lineTo(x + ca * 3, y + sa * 3); }
      }
    }
    g.stroke();
    // edges: where value jumps, a firmer outline
    g.fillStyle = 'rgba(40,38,35,.7)';
    for (let y = 1; y < H - 1; y += 2) for (let x = 1; x < W - 1; x += 2) { const e = Math.abs(L(x + 1, y) - L(x - 1, y)) + Math.abs(L(x, y + 1) - L(x, y - 1)); if (e > 0.12) g.fillRect(x, y, 1.6, 1.6); }
    return;
  }
  if (id === 'gouache') {
    paper(g, W, H, '#f3ecdc');
    const src = col.getContext('2d').getImageData(0, 0, W, H).data, r = rng(9);
    // a few opaque, flat colours: quantise each channel, then lay them down as brush dabs
    const q = (v) => Math.round(v / 255 * 4) / 4 * 255;
    for (let y = 0; y < H; y += 5) for (let x = 0; x < W; x += 6) {
      const i = (y * W + x) * 4; g.fillStyle = `rgb(${q(src[i])},${q(src[i + 1])},${q(src[i + 2])})`;
      g.save(); g.translate(x + r() * 2, y + r() * 2); g.rotate(-0.3 + r() * 0.2); g.fillRect(-5, -3, 11, 7); g.restore();
    }
    return;
  }
  if (id === 'paintover') {
    // left: the grey clay render; right: painted over it
    g.drawImage(val, 0, 0); g.fillStyle = 'rgba(200,200,205,.45)'; g.fillRect(0, 0, W, H);
    revealPaint(g, col, W, H, 0.62);
    rrect(g, 12, 12, 220, 36, 8); g.fillStyle = 'rgba(10,12,18,.8)'; g.fill();
    text(g, '3D render → paint-over', 24, 37, { font: `600 18px ${SANS}`, col: '#9ad7ff' });
    return;
  }
  if (id === 'photobash') {
    g.drawImage(col, 0, 0);
    // photo-like textures cut in with hard edges: concrete, wet asphalt, cloud
    const r = rng(4);
    const patch = (x, y, w, h, base, grain, mode) => {
      g.save(); g.globalCompositeOperation = mode; g.globalAlpha = 0.55;
      for (let k = 0; k < w * h / 40; k++) { const v = base + (r() - 0.5) * grain; g.fillStyle = `rgb(${v},${v * 0.98},${v * 0.95})`; g.fillRect(x + r() * w, y + r() * h, 2 + r() * 5, 1 + r() * 3); }
      g.restore(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([6, 5]); g.strokeRect(x, y, w, h); g.setLineDash([]);
    };
    patch(0, 0, W, 120, 170, 90, 'overlay'); patch(0, 150, 250, 260, 140, 120, 'multiply'); patch(600, 160, 200, 240, 150, 120, 'multiply'); patch(180, 360, 460, 90, 60, 60, 'overlay');
    text(g, 'photo layers cut in, then painted together', 16, H - 14, { font: `600 18px ${SANS}`, col: '#fff' });
    return;
  }
  g.drawImage(col, 0, 0);
  if (id === 'ps') {
    // a simple layers panel, as painters stack sky, buildings, hero and rain
    rrect(g, W - 200, 20, 186, 196, 8); g.fillStyle = 'rgba(40,42,48,.92)'; g.fill();
    text(g, 'Layers', W - 188, 44, { font: `600 18px ${SANS}`, col: '#ddd' });
    ['Rain', 'Tikku', 'Near buildings', 'Far city', 'Sky'].forEach((n, k) => { rrect(g, W - 192, 56 + k * 31, 170, 26, 4); g.fillStyle = k === 1 ? 'rgba(56,189,248,.45)' : 'rgba(255,255,255,.08)'; g.fill(); text(g, n, W - 182, 75 + k * 31, { font: `16px ${SANS}`, col: '#eee' }); });
  } else if (id === 'procreate') {
    // tablet UI: soft grain and a brush cursor
    const r = rng(8); g.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 4000; k++) g.fillRect(r() * W, r() * H, 2, 2);
    rrect(g, 0, 0, W, 34, 0); g.fillStyle = 'rgba(20,20,24,.85)'; g.fill();
    ['Gallery', 'Brush', 'Smudge', 'Erase', 'Layers', 'Colour'].forEach((n, k) => text(g, n, 16 + k * 120, 23, { font: `15px ${SANS}`, col: '#ddd' }));
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(520, 250, 22, 0, TAU); g.stroke();
  }
}

export default {
  id: 'tools',
  short: 'Tools and careers',
  title: 'Tools, careers and your portfolio',
  subtitle: 'From pencil and gouache to tablets and 3D: the tools changed, the thinking did not.',
  view: { pos: [0.5, 2.0, 5.3], target: [0.5, 1.3, 0] },
  learn: `<p>For most of film history, concept art was made with <b>pencil</b>, <b>watercolour</b> and <b>gouache</b>, an opaque paint that dries flat and bold. Disney's colour stylists painted this way, and so did the great Indian film art directors.</p>
    <p>Then painting went digital. <b>Photoshop 1.0</b> arrived in 1990 with just one undo; <b>layers</b> came in 1994, so a painter could keep sky, buildings and hero separate and change one without ruining the others. Pressure-sensitive <b>pen tablets</b> made a stylus feel like a brush. <b>Procreate</b> (2011) put a studio in a tablet. Today many artists block out a scene in 3D (in free tools like <b>Blender</b>) and <b>paint over</b> it, or <b>photobash</b>: cut photos they are allowed to use into the painting for real texture, then paint it all together.</p>
    <p>Concept artists work in films, animation, VFX, games and theme parks. In India that means VFX and animation studios in Hyderabad, Mumbai, Bengaluru, Pune and Thiruvananthapuram, film art departments, game studios and freelancing for studios abroad. What gets you hired is a <b>portfolio</b>: a small set of your best, original designs that shows how you think, not just how you render. <b>AI image generators</b> are a live debate: many artists object that they were trained on artists' work without permission or pay, and studios are still deciding if and how to use them.</p>
    <p class="tip"><b>Try it:</b> switch between the six tools and watch the same street and rickshaw re-made in each one. Then flip the board between the career path, where to work in India, and portfolio tips.</p>`,
  terms: [
    { t: 'Gouache', d: 'An opaque water-based paint that dries flat and matt, popular with animation colour artists.' },
    { t: 'Layers', d: 'Stacked, separate sheets in a digital painting that can each be changed on their own.' },
    { t: 'Pen tablet', d: 'A drawing surface and stylus that sense pressure, so a digital brush feels like a real one.' },
    { t: 'Photobash', d: 'Building a painting from cut-up photos (your own or licensed) blended and painted over.' },
    { t: 'Visual development', d: 'The early design work that sets the look of an animated film.' },
    { t: 'Portfolio', d: 'A short collection of your best work, chosen for the job you want.' },
  ],
  defaults: { tool: 0, board: 'path' },
  controls: [
    { key: 'tool', type: 'seg', label: 'Tool', options: TOOLS.map((t, i) => ({ v: i, label: ['Pencil', 'Gouache', 'Photoshop', 'Procreate', '3D paint-over', 'Photobash'][i] })), fmt: (v) => TOOLS[Math.round(v)]?.name || '' },
    { key: 'board', type: 'seg', label: 'Career board', options: Object.entries(BOARDS).map(([v, b]) => ({ v, label: b.name })) },
  ],
  quiz: [
    { q: 'What did layers (Photoshop 3.0, 1994) let digital painters do?', options: ['Print bigger', 'Keep parts of a painting separate and change one without spoiling the rest', 'Paint in 3D', 'Draw without a tablet'], answer: 1, why: 'With the sky, buildings and hero on separate layers, each can be moved, recoloured or repainted on its own.' },
    { q: 'What is a photobash?', options: ['A painting made partly from cut-in photos, blended and painted over', 'A party for photographers', 'A pencil drawing', 'A 3D model'], answer: 0, why: 'Artists cut photos (their own or licensed ones) into a painting for realistic texture, then paint everything together.' },
    { q: 'What matters most in a concept art portfolio?', options: ['As many pictures as possible', 'A few strong, original designs that show your process', 'Copies of famous film posters', 'Only very detailed final renders'], answer: 1, why: 'Studios hire designers: they want clear ideas and the thinking behind them, aimed at the job you want.' },
  ],
  reel: [
    { ms: 5400, caption: 'Pencil and gouache, Photoshop, tablets and 3D: the tools changed, the design thinking did not.', set: { board: 'path' }, anim: { tool: [0, 5] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const floor = box(9, 0.04, 5, M.matte(0x2b2f38)); floor.position.set(0.5, 0.02, 0.2); floor.receiveShadow = true; root.add(floor);
    const wood = M.matte(0x7a5a3c);
    const desk = box(3.0, 0.06, 1.3, wood); desk.position.set(-0.5, 0.78, 0.3); root.add(desk);
    for (const [x, z] of [[-1.9, -0.25], [0.9, -0.25], [-1.9, 0.85], [0.9, 0.85]]) { const l = box(0.06, 0.76, 0.06, M.matte(0x3a3f4a)); l.position.set(x, 0.38, z); root.add(l); }
    // the artwork, on a drafting board or a screen
    const stand = box(1.9, 1.1, 0.05, M.matte(0x1b1d22)); stand.position.set(-0.5, 1.45, -0.05); stand.rotation.x = -0.18; root.add(stand);
    const cache = {};
    const art = board(root, 1.78, 1.0, W, H, (g, w, h, id) => { if (id) medium(g, id, cache); }, [-0.5, 1.45, -0.01], { opaque: true });
    art.mesh.rotation.x = -0.18;
    // props for each medium
    const props = TOOLS.map(() => { const g = new THREE.Group(); g.visible = false; root.add(g); return g; });
    const at = (g, o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
    { const g = props[0]; const pen = beam([-0.1, 0.83, 0.6], [0.3, 0.83, 0.75], 0.012, M.matte(0xe7b23a)); g.add(pen); const tip = sphere(0.012, M.matte(0x333333), 8); tip.position.set(0.3, 0.83, 0.75); g.add(tip); at(g, box(0.1, 0.03, 0.05, M.matte(0xe9a0a8)), 0.5, 0.825, 0.6); }
    { const g = props[1]; [[0xd64545, -0.1], [0x2b8a6e, 0.05], [0xe3a72f, 0.2], [0x3b6fd8, 0.35]].forEach(([c, x]) => { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 16), M.clear(0xffffff, 0.5)); at(g, j, x, 0.845, 0.72); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.04, 16), M.matte(c)); at(g, p, x, 0.83, 0.72); }); g.add(beam([0.45, 0.82, 0.55], [0.8, 0.84, 0.75], 0.008, M.matte(0x8a5a3a))); }
    { const g = props[2]; at(g, box(0.5, 0.015, 0.35, M.plastic(0x222428)), 0.2, 0.82, 0.65); g.add(beam([0.1, 0.84, 0.6], [0.35, 0.95, 0.75], 0.01, M.plastic(0x444444))); }
    { const g = props[3]; const t = box(0.34, 0.012, 0.25, M.plastic(0x2a2c30)); at(g, t, 0.35, 0.83, 0.65, 0.3); g.add(beam([0.3, 0.845, 0.62], [0.5, 0.9, 0.78], 0.006, M.plastic(0xf2f2f2))); }
    { const g = props[4]; at(g, box(0.6, 0.02, 0.2, M.plastic(0x2a2c30)), 0.2, 0.82, 0.7); [[0.62, 0.12, 0.1], [0.7, 0.2, 0.08], [0.78, 0.08, 0.12]].forEach(([x, h, s]) => at(g, box(s, h, s, M.matte(0xb8b2a8)), x, 0.81 + h / 2, 0.55)); }
    { const g = props[5]; const cam = box(0.16, 0.1, 0.08, M.plastic(0x222222)); at(g, cam, 0.5, 0.86, 0.65); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), M.plastic(0x111111)); lens.rotation.x = Math.PI / 2; at(g, lens, 0.5, 0.86, 0.72); [0, 1, 2].forEach((k) => { const ph = box(0.15, 0.004, 0.1, M.matte([0x9fb4c8, 0x7a6a5a, 0x5b6b4a][k])); at(g, ph, 0.05 + k * 0.08, 0.815 + k * 0.004, 0.65, k * 0.3); }); }
    // the career board
    const cb = board(root, 2.1, 1.9, 640, 580, (g, w, h, key = 'path') => {
      g.clearRect(0, 0, w, h); rrect(g, 2, 2, w - 4, h - 4, 18); g.fillStyle = 'rgba(10,12,18,.94)'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.18)'; g.stroke();
      const b = BOARDS[key]; text(g, b.name, 24, 48, { font: `400 40px ${SERIF}`, col: '#fff' });
      let y = 96;
      b.rows.forEach((row, i) => {
        if (key === 'path') { g.beginPath(); g.arc(40, y - 7, 11, 0, TAU); g.fillStyle = i === b.rows.length - 1 ? COL.hot : COL.c; g.fill(); if (i < b.rows.length - 1) { g.fillStyle = 'rgba(56,189,248,.4)'; g.fillRect(38, y + 6, 4, 40); } }
        else { g.fillStyle = COL.c; g.fillRect(34, y - 14, 10, 10); }
        y = wrap(g, row, 62, y, w - 90, 28, { font: `21px ${SANS}`, col: 'rgba(255,255,255,.86)' }) + 16;
      });
    }, [1.95, 1.5, -0.2]);
    faceTo(cb.mesh, [0.5, 2.0, 5.3]);
    const lTool = stage.label('', [-0.5, 0.55, 1.1], root, 'hot');

    let shown = -1, shownB = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const i = clamp(Math.round(s.tool), 0, TOOLS.length - 1);
        if (i !== shown) { art.redraw(TOOLS[i].id); props.forEach((p, k) => { p.visible = k === i; }); lTool.element.textContent = TOOLS[i].name; shown = i; }
        if (s.board !== shownB) { cb.redraw(s.board); shownB = s.board; }
        fitNarrow(stage, []);
      },
      readout: (s) => {
        const t = TOOLS[clamp(Math.round(s.tool), 0, TOOLS.length - 1)];
        return `<div class="big">${t.name}</div>
          <div class="row"><span>Arrived</span><b>${t.year}</b></div>
          <div class="row"><span>Undo</span><b>${t.undo}</b></div>
          <div class="row"><span>Layers</span><b>${t.layers}</b></div>
          <div class="row"><span>Good for</span><b>${t.good}</b></div>`;
      },
      dispose() { stage.setShift(0, 0); },
    };
  },
};
