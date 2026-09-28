// Chapter 3: shape, value and colour. A monsoon street is painted live on the easel: first a value pass in
// greys, then colour brushed over it. The sliders drive real models (see art.js):
//  - sun height from solar geometry for Mumbai (19.08° N) on an equinox day, by solar time;
//  - the colour of sunlight from a colour-temperature fit (≈2,000 K at the horizon to ≈5,500 K high up),
//    turned into RGB with a blackbody curve fit;
//  - atmospheric perspective from Koschmieder's law: contrast falls as e^(−3.912·d/V) for visibility V;
//  - values are CIE L* (0 black .. 100 white) from Rec. 709 relative luminance.
// The whole scene's key light follows the painted sun, so the clay blocks on the table match the painting.
import { THREE, M, box, approach, clamp } from '../kit.js';
import {
  board, text, rrect, COL, SANS, paintStreet, paletteFor, revealPaint, drawComposition, makeEasel, makeTikku3D,
  sunElevation, sunKelvin, kelvinRGB, lightName, hazeKeep, luminance, lstar, greyOf, css, DIST, MOODS, BASE,
  paper, fitNarrow, faceTo, TAU,
} from '../art.js';

const hhmm = (h) => { const m = Math.round(h * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const Lof = (rgb) => lstar(luminance(rgb));

export default {
  id: 'value',
  short: 'Value and colour',
  title: 'Shape, value and colour',
  subtitle: 'Paint light and dark first, then colour; let distance fade things; lead the eye.',
  view: { pos: [0.7, 1.9, 5.4], target: [0.8, 1.6, 0] },
  learn: `<p>A concept painting has one job: make the viewer feel the moment and look at the right thing. Painters build it in layers. First big simple <b>shapes</b>. Then <b>value</b>: how light or dark each area is, painted in greys only. If a picture works in black and white, colour can only help it. Artists even <b>squint</b> at their work to blur the details and check the big light and dark masses.</p>
    <p>Then <b>colour</b>. The light's colour depends on the <b>time of day</b>: low sun is orange, about 2,000 to 3,500 kelvin, while high sun is near white, about 5,500 K. Shadows pick up the blue of the sky. Many painters push this into a <b>complementary</b> scheme: warm orange lights against cool teal shadows. A mood can be <b>warm</b> (cosy, nostalgic) or <b>cool</b> (lonely, eerie).</p>
    <p>Air is not perfectly clear. The further away something is, the more haze sits between you and it, so far things look <b>lighter, bluer and lower in contrast</b>. This is <b>atmospheric perspective</b>, and it is the cheapest way to make a flat painting feel deep. Finally, <b>composition</b>: the focal point sits near a <b>rule-of-thirds</b> crossing, and <b>leading lines</b> (roads, wires, balconies) pull the eye to it.</p>
    <p class="tip"><b>Try it:</b> press Repaint and watch the value pass, then switch to Colour. Drag the time from dawn to night, swing the light from left to right, and drop the visibility to see the far towers fade. Turn on the guides.</p>`,
  terms: [
    { t: 'Value', d: 'How light or dark a colour is, ignoring its hue.' },
    { t: 'Value study', d: 'A quick painting in greys only, to plan the lights and darks.' },
    { t: 'Colour temperature', d: 'The colour of light, in kelvin (K): low numbers are orange, high numbers are blue-white.' },
    { t: 'Complementary colours', d: 'Colours opposite each other on the colour wheel, like orange and blue, which make each other pop.' },
    { t: 'Atmospheric perspective', d: 'Far things look paler, bluer and softer because of the air in between.' },
    { t: 'Rule of thirds', d: 'Placing important things near lines that split the frame into thirds.' },
    { t: 'Leading lines', d: 'Lines in a picture, like roads or wires, that guide the eye to the focal point.' },
  ],
  defaults: { pass: 'colour', hour: 17.45, light: 0.55, mood: 'comp', vis: 8, guides: false, squint: false },
  controls: [
    { key: 'pass', type: 'seg', label: 'Pass', options: [{ v: 'value', label: 'Value (greys)' }, { v: 'colour', label: 'Colour' }] },
    { key: 'hour', type: 'range', label: 'Time of day', min: 5.5, max: 21, step: 0.05, ends: ['dawn', 'night'], fmt: (v) => `${hhmm(v)} solar time` },
    { key: 'light', type: 'range', label: 'Light comes from', min: -1, max: 1, step: 0.01, ends: ['left', 'right'], fmt: (v) => (Math.abs(v) < 0.1 ? 'behind the street' : v < 0 ? 'the left' : 'the right') },
    { key: 'mood', type: 'seg', label: 'Colour mood', options: Object.entries(MOODS).map(([v, m]) => ({ v, label: m.name.replace('Complementary', 'Compl.') })), fmt: (v) => MOODS[v]?.name || '' },
    { key: 'vis', type: 'log', label: 'Visibility (haze)', min: 1, max: 40, ends: ['monsoon haze', 'crystal clear'], fmt: (v) => v.toFixed(v < 10 ? 1 : 0) + ' km' },
    { key: 'guides', type: 'toggle', label: 'Composition guides', hint: 'Rule of thirds, focal point and leading lines.' },
    { key: 'squint', type: 'toggle', label: 'Squint', hint: 'Blur the painting to judge the big light and dark shapes.' },
    { key: 'b', type: 'buttons', label: 'Paint', items: [{ label: 'Repaint from blank', act: (s, inst) => inst.repaint?.() }] },
  ],
  quiz: [
    { q: 'Why do many concept artists paint in greys first?', options: ['Grey paint is cheaper', 'To get the lights and darks working before choosing colours', 'Films are shown in black and white', 'Colour is added by the computer'], answer: 1, why: 'Value carries most of the picture’s readability and depth. If it works in grey, colour will only improve it.' },
    { q: 'Mountains far away look pale and bluish. What is this called?', options: ['Rule of thirds', 'Atmospheric perspective', 'Complementary colour', 'Silhouette'], answer: 1, why: 'The air between you and a far object scatters light, adding a pale blue veil and lowering contrast.' },
    { q: 'Low evening sun is about what colour temperature?', options: ['About 2,000 to 3,500 K, orange', 'About 5,500 K, white', 'About 10,000 K, blue', 'Light has no colour'], answer: 0, why: 'Near the horizon sunlight passes through much more air, which scatters away blue, leaving warm orange light.' },
  ],
  reel: [
    { ms: 5400, caption: 'Painters solve light and dark in greys first, then brush colour over the top.', set: { pass: 'value', hour: 17.45, light: 0.55, mood: 'comp', vis: 8, guides: false, squint: false }, anim: { pass: ['value', 'colour'] }, act: (s, inst) => inst.repaint?.(), spin: 0 },
    { ms: 5000, caption: 'Haze makes far things paler and bluer: atmospheric perspective fakes depth.', set: { pass: 'colour', hour: 11, light: -0.4, mood: 'natural', guides: false }, anim: { vis: [40, 1.5, true] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const floor = box(9, 0.04, 5, M.matte(0x2b2f38)); floor.position.set(0, 0.02, 0.4); floor.receiveShadow = true; root.add(floor);
    const easel = makeEasel(3.3, 1.85); easel.position.set(0.9, 0, -0.4); root.add(easel);
    const PW = 1024, PH = 576;
    const mk = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
    const vCan = mk(), cCan = mk(), blank = mk();
    paper(blank.getContext('2d'), PW, PH);
    let info = null, kv = 1, kc = 1, painted = '', drawn = '';
    const main = board(easel, 3.3, 1.85, PW, PH, (g, w, h, s) => {
      if (!s) return;
      g.clearRect(0, 0, w, h);
      g.save(); if (s.squint) g.filter = 'blur(7px)';
      g.drawImage(blank, 0, 0);
      const st1 = revealPaint(g, vCan, w, h, kv);
      const st2 = kv >= 1 ? revealPaint(g, cCan, w, h, kc) : null;
      g.restore();
      const st = kv < 1 ? st1 : kc < 1 && kc > 0 ? st2 : null;
      if (st) { g.fillStyle = 'rgba(255,209,102,.95)'; g.beginPath(); g.arc(st.x * w + st.l * w * 0.3, st.y * h, 12, 0, TAU); g.fill(); }
      if (s.guides) drawComposition(g, w, h);
      // value key: where the main masses sit on the 0..100 value scale
      if (info && !s.guides) {
        const k = info.keys, show = s.pass === 'value' || kc < 0.5;
        const items = [['sky', k.sky], ['far', k.far], ['near', k.near], ['focal', k.focal]];
        rrect(g, w - 300, h - 70, 290, 60, 10); g.fillStyle = 'rgba(10,12,18,.72)'; g.fill();
        items.forEach(([n, c], j) => {
          const x = w - 290 + j * 70; g.fillStyle = css(show ? greyOf(c) : c); g.fillRect(x, h - 62, 26, 26);
          text(g, n, x + 30, h - 44, { font: `14px ${SANS}`, col: 'rgba(255,255,255,.8)' });
          text(g, 'L ' + Math.round(Lof(c)), x + 30, h - 26, { font: `600 14px ${SANS}`, col: '#ffd166' });
        });
      }
    }, [0, easel.boardY, easel.boardZ + 0.03], { opaque: true });
    // clay blocks on a table, lit by the same sun
    const table = box(1.9, 0.06, 1.1, M.matte(0x6b5540)); table.position.set(-2.3, 0.78, 0.9); root.add(table);
    for (const [x, z] of [[-3.1, 0.5], [-1.5, 0.5], [-3.1, 1.3], [-1.5, 1.3]]) { const l = box(0.06, 0.76, 0.06, M.matte(0x4a3b2c)); l.position.set(x, 0.38, z); root.add(l); }
    const clay = M.matte(0xb8b2a8);
    [[-2.9, 0.75, 0.3, 0.8], [-2.65, 0.55, 0.22, 0.5], [-1.75, 0.5, 0.26, 0.95], [-2.05, 0.6, 0.2, 0.35]].forEach(([x, z, s, hgt]) => { const b = box(s, hgt, s, clay); b.position.set(x, 0.81 + hgt / 2, z); root.add(b); });
    const mini = makeTikku3D(BASE); mini.scale.setScalar(0.12); mini.position.set(-2.25, 0.81, 1.15); mini.rotation.y = Math.PI; root.add(mini);
    // the palette: live swatches of the painting's main colours
    const pal = board(root, 0.9, 0.6, 300, 200, (g, w, h, cols = []) => {
      g.clearRect(0, 0, w, h); g.fillStyle = '#b08a5e'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, TAU); g.fill();
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(w * 0.22, h * 0.62, 18, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
      cols.forEach((c, j) => { const a = -2.4 + j * 0.55; g.beginPath(); g.arc(w / 2 + Math.cos(a) * w * 0.3, h / 2 + Math.sin(a) * h * 0.3 + 6, 20, 0, TAU); g.fillStyle = c; g.fill(); });
    }, [-2.6, 0.82, 1.45]);
    pal.mesh.rotation.x = -Math.PI / 2; pal.mesh.scale.setScalar(0.55); pal.mesh.position.set(-1.65, 0.815, 1.15);
    const lEasel = stage.label('', [0.9, 2.95, -0.35], root, 'hot');
    const lClay = stage.label('Clay blocks under the same sun', [-2.3, 0.45, 1.5], root);
    // Drive the stage's key light from the painted sun; restore it afterwards.
    const key = stage.lights.children.find((l) => l.isDirectionalLight && l.castShadow);
    const hemi = stage.lights.children.find((l) => l.isHemisphereLight);
    const saved = { pos: key.position.clone(), col: key.color.clone(), i: key.intensity, hi: hemi.intensity, hc: hemi.color.clone() };

    const state = { s: null };
    const inst = {
      repaint() { kv = 0; kc = 0; },
      update(dt, s) {
        dt = Math.max(0, dt); state.s = s;
        const sig = `${s.hour.toFixed(2)}|${s.light.toFixed(2)}|${s.mood}|${s.vis.toFixed(2)}`;
        if (sig !== painted) {
          const p = { hour: s.hour, light: s.light, mood: s.mood, vis: s.vis };
          info = paintStreet(vCan.getContext('2d'), PW, PH, p, { value: true });
          paintStreet(cCan.getContext('2d'), PW, PH, p);
          painted = sig; drawn = '';
          const P = info.pal, k = info.keys;
          pal.redraw([k.sky, k.far, k.near, k.focal, P.sun, k.around].map((c) => css(s.pass === 'value' ? greyOf(c) : c)));
          // sun in the 3D scene
          const el = Math.max(2, P.el);
          key.position.set(s.light * 9, Math.tan(el * Math.PI / 180) * 9 + 0.5, -5);
          key.color.setRGB(...(P.el > 0 ? kelvinRGB(sunKelvin(P.el)) : [0.55, 0.62, 0.9]));
          key.intensity = P.el > 0 ? 0.6 + 2.2 * P.sunI : 0.35;
          hemi.intensity = 0.5 + 0.6 * clamp(P.el / 20, 0, 1);
          lEasel.element.textContent = `${hhmm(s.hour)} · ${lightName(P.el)}`;
        }
        kv = Math.min(1, kv + dt / 1.6);
        if (s.pass === 'colour') { if (kv >= 1) kc = Math.min(1, kc + dt / 1.6); } else kc = 0;
        const sig2 = `${painted}|${kv.toFixed(3)}|${kc.toFixed(3)}|${s.guides}|${s.squint}|${s.pass}`;
        if (sig2 !== drawn) { main.redraw(s); drawn = sig2; }
        if (pal.pass !== s.pass) { pal.pass = s.pass; painted = ''; }
        fitNarrow(stage, [lClay]);
      },
      readout: (s) => {
        if (!info) return '';
        const P = info.pal, k = info.keys, dL = Math.abs(Lof(k.focal) - Lof(k.around));
        const K = P.el > 0 ? `${Math.round(sunKelvin(P.el) / 100) * 100} K sun` : P.el > -6 ? 'blue sky light, 9,000 K or more' : 'street lamps, about 2,100 K';
        return `<div class="big">${lightName(P.el)}</div>
          <div class="row"><span>Light colour</span><b>${K}</b></div>
          <div class="row"><span>Sun height (Mumbai, equinox)</span><b>${P.el.toFixed(0)}°</b></div>
          <div class="row"><span>Focal point vs its surroundings</span><b ${dL < 10 ? 'class="no"' : ''}>ΔL ${dL.toFixed(0)}</b></div>
          <div class="row"><span>Contrast left at 1.5 km / 4 km</span><b>${Math.round(hazeKeep(DIST.mid, s.vis) * 100)}% / ${Math.round(hazeKeep(DIST.far, s.vis) * 100)}%</b></div>`;
      },
      dispose() {
        key.position.copy(saved.pos); key.color.copy(saved.col); key.intensity = saved.i; hemi.intensity = saved.hi; hemi.color.copy(saved.hc);
        stage.setShift(0, 0);
      },
    };
    faceTo(main.mesh, [0.7, 1.9, 5.4]);
    return inst;
  },
};
