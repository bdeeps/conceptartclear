// Chapter 2: thumbnails and silhouettes. Twelve tiny designs for Tikku, the robot auto-rickshaw, are pinned
// to a board. Each is a handful of numbers (length, height, canopy, eye size, wheels, legs or tracks...)
// scattered around a base design by the Variation slider. Pick one and it grows into a bigger drawing and
// then a 3D model built from the same numbers.
//
// The readability test is measured on the actual pixels. Every silhouette is rasterised at the same scale
// into a 72 × 54 mask. "Distinct" is 1 − IoU (intersection over union) with its most similar neighbour on the
// board, a standard shape-overlap measure. "Outline interest" is the isoperimetric ratio P² / 4πA, which is 1
// for a circle and grows as an outline gets spikier and gappier. They are simple proxies for what an art
// director judges by eye, not an industry standard.
import { THREE, M, box, approach, clamp } from '../kit.js';
import {
  board, paper, text, rrect, COL, SANS, drawTikku, variant, silhouetteMask, iou, outline, makeTikku3D,
  CANOPIES, LOCOS, fitNarrow, setControl, faceTo,
} from '../art.js';

const N = 12;
function designs(seed, v) { return Array.from({ length: N }, (_, i) => (i === 0 ? variant(seed * 100 + 1, v * 0.25) : variant(seed * 100 + i + 1, v))); }
function scores(list) {
  const masks = list.map((P) => silhouetteMask(P));
  return list.map((P, i) => {
    let best = 0, who = 0;
    masks.forEach((m, j) => { if (j !== i) { const o = iou(masks[i], m); if (o > best) { best = o; who = j; } } });
    return { distinct: 1 - best, twin: who, outline: outline(masks[i]) };
  });
}

export default {
  id: 'thumbnails',
  short: 'Thumbnails',
  title: 'Thumbnails and silhouettes',
  subtitle: 'Dozens of tiny black shapes, because a good design reads even as a shadow.',
  view: { pos: [0.3, 2.1, 7.4], target: [0.3, 1.5, 0] },
  learn: `<p>Concept artists rarely start big. They fill a page with <b>thumbnails</b>: tiny sketches, often just solid black shapes called <b>silhouettes</b>, each made in a minute or two. Small and fast means no fussing over details, so you can try twenty ideas instead of polishing one.</p>
    <p>Why black shapes? Because the audience often sees a character or vehicle for a split second, far away, in the dark or in a crowd. If you can tell what it is and <b>which one</b> it is from its outline alone, the design <b>reads</b>. Artists call this the <b>silhouette test</b>. Designers of games and animated films use it all the time: every character in a team should be recognisable as a shadow.</p>
    <p>Readable shapes usually have a clear big idea, like a huge eye or an umbrella, plus <b>negative space</b>, the gaps between legs, arms and wheels. A blob with no gaps reads badly.</p>
    <p class="tip"><b>Try it:</b> slide Variation from same-ish to wild and watch the batch change. Click a thumbnail (or use the slider) to pick one: it grows into a drawing and then a 3D model. Switch detail on and off. Which designs are still easy to tell apart as black shapes?</p>`,
  terms: [
    { t: 'Thumbnail', d: 'A tiny, quick sketch used to explore many ideas fast.' },
    { t: 'Silhouette', d: 'A shape filled in solid black, showing only its outline.' },
    { t: 'Readability', d: 'How quickly and clearly a design can be recognised, even small or far away.' },
    { t: 'Negative space', d: 'The empty gaps around and between parts of a shape.' },
    { t: 'Iteration', d: 'Making version after version, keeping what works and changing what does not.' },
  ],
  defaults: { vary: 0.7, sel: 5, detail: false, batch: 1 },
  controls: [
    { key: 'vary', type: 'range', label: 'Variation', min: 0, max: 1, step: 0.01, ends: ['same-ish', 'wild'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'sel', type: 'range', label: 'Pick a design', min: 1, max: 12, step: 1, fmt: (v) => '#' + Math.round(v) },
    { key: 'detail', type: 'toggle', label: 'Show detail and colour', hint: 'Off: the silhouette test. On: the same designs, drawn in.' },
    { key: 'b', type: 'buttons', label: 'Batch', items: [{ label: 'New batch of ideas', act: (s) => { s.batch = (s.batch % 97) + 1; } }] },
  ],
  quiz: [
    { q: 'What is the silhouette test?', options: ['Checking a design still reads as a solid black shape', 'Drawing in the dark', 'Colouring the background black', 'Printing the design very large'], answer: 0, why: 'If you can tell what a design is from its outline alone, it will read on screen, even far away or in a crowd.' },
    { q: 'Why make many tiny thumbnails before one big drawing?', options: ['They are required by law', 'Each takes minutes, so you can explore lots of ideas cheaply', 'Big drawings are not allowed', 'They are used as the final film'], answer: 1, why: 'Speed lets you compare many ideas and pick the strongest before investing hours.' },
    { q: 'Which usually makes a silhouette easier to read?', options: ['A smooth blob with no gaps', 'Clear negative space and one big, distinctive feature', 'Lots of tiny details inside', 'Making it all one colour inside'], answer: 1, why: 'Gaps and a strong idea (a giant eye, an umbrella, legs) survive when the detail disappears.' },
  ],
  reel: [
    { ms: 5000, caption: 'Artists start with dozens of tiny black silhouettes, each made in a minute or two.', set: { detail: false, sel: 1, batch: 3 }, anim: { vary: [0.1, 0.95] }, spin: 0 },
    { ms: 5200, caption: 'Pick the shape that reads best, and it grows into a drawing, then a 3D model.', set: { detail: true, vary: 0.95, batch: 3 }, anim: { sel: [2, 9] }, view: { pos: [2.4, 2.0, 6.2], target: [1.6, 1.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const floor = box(10, 0.04, 5, M.matte(0x2b2f38)); floor.position.set(0.3, 0.02, 0.4); floor.receiveShadow = true; root.add(floor);
    // pinboard
    const cork = box(4.5, 2.35, 0.08, M.matte(0x7a5b3c)); cork.position.set(-1.35, 1.9, -1.05); root.add(cork);
    const legs = [-3.3, 0.6].map((x) => { const l = box(0.08, 1.0, 0.08, M.matte(0x3a3f4a)); l.position.set(x, 0.5, -1.05); root.add(l); return l; });
    let list = [], sc = [];
    const cards = [];
    for (let i = 0; i < N; i++) {
      const c = board(root, 1.0, 0.68, 240, 164, (g, w, h, P, on = false, detail = false) => {
        g.clearRect(0, 0, w, h); paper(g, w, h);
        if (P) drawTikku(g, w / 2, h - 16, 34, P, detail ? 'color' : 'sil');
        text(g, String(i + 1), 10, 24, { font: `600 18px ${SANS}`, col: '#8a8378' });
        if (on) { g.lineWidth = 10; g.strokeStyle = COL.c; g.strokeRect(5, 5, w - 10, h - 10); }
      }, [-2.9 + (i % 4) * 1.04, 2.65 - Math.floor(i / 4) * 0.74, -0.99], { opaque: true });
      c.mesh.userData.i = i; cards.push(c);
    }
    stage.pickables = cards.map((c) => c.mesh);
    // the grown drawing
    const bigState = { k: 1 };
    const big = board(root, 2.5, 1.7, 750, 510, (g, w, h, P, detail = false, k = 1, info = '') => {
      g.clearRect(0, 0, w, h); paper(g, w, h);
      if (!P) return;
      g.strokeStyle = 'rgba(59,56,51,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, h - 60); g.lineTo(w - 20, h - 60); g.stroke();
      const s = 34 + (100 - 34) * k;
      drawTikku(g, w / 2, h - 60, s, P, detail ? 'color' : k < 1 ? 'sil' : 'line');
      text(g, info, 20, 36, { font: `600 26px ${SANS}`, col: '#3b3833' });
    }, [2.75, 2.2, -0.7], { opaque: true });
    faceTo(big.mesh, [0.3, 2.1, 7.4]);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.16, 40), M.matte(0x3a3f4a)); plinth.position.set(1.9, 0.08, 1.4); root.add(plinth);
    const holder = new THREE.Group(); holder.position.set(1.9, 0.16, 1.4); holder.scale.setScalar(0.001); root.add(holder);
    let model = null, grow = 0;
    const lWall = stage.label('Twelve thumbnails', [-1.35, 0.55, -0.95], root);
    const lBig = stage.label('Picked: drawn bigger', [2.75, 3.2, -0.7], root);
    const l3d = stage.label('…then built in 3D', [1.9, 0.35, 2.5], root, 'hot');

    const key = { batch: -1, vary: -1, sel: -1, detail: null };
    const rebuildModel = (P) => {
      if (model) { holder.remove(model); model.traverse((o) => { o.geometry?.dispose(); }); }
      model = makeTikku3D(P); model.rotation.y = 0.5; holder.add(model); grow = 0;
    };
    return {
      pick(o) { const i = o.userData.i; if (i === undefined) return; if (!setControl('Pick a design', i + 1)) this._s.sel = i + 1; },
      _s: null,
      update(dt, s) {
        dt = Math.max(0, dt); this._s = s;
        const vq = Math.round(s.vary * 50) / 50, sel = clamp(Math.round(s.sel), 1, N) - 1;
        if (key.batch !== s.batch || key.vary !== vq) { list = designs(s.batch, vq); sc = scores(list); key.batch = s.batch; key.vary = vq; key.sel = -1; key.detail = null; }
        if (key.sel !== sel || key.detail !== s.detail) {
          if (key.sel !== sel) { bigState.k = 0; rebuildModel(list[sel]); }
          cards.forEach((c, i) => c.redraw(list[i], i === sel, s.detail));
          key.sel = sel; key.detail = s.detail;
        }
        if (bigState.k < 1 || big.last !== `${sel}|${s.detail}|${key.batch}|${vq}`) {
          bigState.k = Math.min(1, bigState.k + dt / 0.8);
          big.redraw(list[sel], s.detail, bigState.k, `Design #${sel + 1}`); big.last = `${sel}|${s.detail}|${key.batch}|${vq}`;
        }
        grow = approach(grow, bigState.k >= 1 ? 1 : 0, 3, dt);
        holder.scale.setScalar(Math.max(0.001, grow * 0.62));
        if (model) model.rotation.y += dt * 0.35;
        fitNarrow(stage, [lWall, lBig]);
      },
      readout: (s) => {
        const i = clamp(Math.round(s.sel), 1, N) - 1, r = sc[i], P = list[i];
        if (!r) return '';
        const d = Math.round(r.distinct * 100), verdict = d >= 35 ? '<b class="ok">reads well</b>' : d >= 20 ? '<b>could be clearer</b>' : '<b class="no">easily confused</b>';
        return `<div class="big">Design #${i + 1}: ${verdict}</div>
          <div class="row"><span>Different from its closest look-alike (#${r.twin + 1})</span><b>${d}%</b></div>
          <div class="row"><span>Outline interest (circle = 1)</span><b>${r.outline.toFixed(1)}×</b></div>
          <div class="row"><span>Canopy · moves on</span><b>${CANOPIES[P.canopy]} · ${LOCOS[P.loco]}</b></div>`;
      },
    };
  },
};
