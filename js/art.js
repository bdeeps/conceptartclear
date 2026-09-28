// Shared parts for ConceptArtClear: canvas boards, colour science helpers, a procedural painter for a
// monsoon street, a robot auto-rickshaw design ("Tikku") that can be drawn as a thumbnail silhouette, a
// rough, a colour sketch or built in 3D from the same numbers, a forest spirit ("Kaavu"), a plain human
// scale figure, and props for the art department.
//
// Everything drawn here is original to this box: the film "Monsoon Circuit", Tikku, Kaavu and the street
// are invented for teaching. No real film's designs are copied.
//
// Units are metres. +x right, +y up, +z towards the default viewer.
import { THREE, M, box, beam, sphere, clamp, lerp } from './kit.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TAU = Math.PI * 2, D2R = Math.PI / 180;
export const COL = {
  c: '#38bdf8', hot: '#ffd166', warm: '#ffb547', red: '#ff5a6e', good: '#7be08c', violet: '#c49bff',
  mint: '#5ce1a9', soft: 'rgba(255,255,255,.66)', dim: 'rgba(255,255,255,.42)', paper: '#efe8da', lead: '#3b3833',
};
export const SANS = 'Geist, system-ui, sans-serif';
export const SERIF = '"Instrument Serif", Georgia, serif';

// ---------------------------------------------------------------- canvas boards
export function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function text(g, s, x, y, { font = `20px ${SANS}`, col = 'rgba(255,255,255,.85)', align = 'left' } = {}) {
  g.font = font; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.textAlign = 'left';
}
export function wrap(g, s, x, y, maxW, lh, opts = {}) {
  g.font = opts.font || `20px ${SANS}`;
  const words = String(s).split(' '); let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { text(g, line, x, yy, opts); line = w; yy += lh; } else line = t;
  }
  if (line) text(g, line, x, yy, opts);
  return yy + lh;
}
export function panelBg(g, w, h, a = 0.92) { g.clearRect(0, 0, w, h); rrect(g, 2, 2, w - 4, h - 4, 18); g.fillStyle = `rgba(10,12,18,${a})`; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.16)'; g.stroke(); }
// A flat canvas board in the scene (w × h metres, pxW × pxH pixels).
export function board(parent, w, h, pxW, pxH, draw, pos, { opaque = false } = {}) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = (...a) => { draw(g, pxW, pxH, ...a); tex.needsUpdate = true; };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: !opaque, toneMapped: false, side: THREE.DoubleSide }));
  if (pos) m.position.set(...pos);
  parent.add(m);
  redraw();
  return { tex, redraw, canvas: c, g, mesh: m, w, h };
}
// Sketch paper: warm off-white with a faint tooth.
export function paper(g, w, h, tint = '#efe8da') {
  g.fillStyle = tint; g.fillRect(0, 0, w, h);
  const r = rng(3); g.fillStyle = 'rgba(90,70,40,.05)';
  for (let i = 0; i < 900; i++) g.fillRect(r() * w, r() * h, 1 + r() * 2, 1);
}
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- stage helpers
export const inReel = () => document.body.classList.contains('gb-reel');
export const narrowStage = (stage) => stage.host.clientWidth < 560;
// Hide minor labels on a phone and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = [], y0 = -0.12) {
  const narrow = narrowStage(stage);
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? y0 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}

// ---------------------------------------------------------------- colour science
// sRGB <-> linear (IEC 61966-2-1), relative luminance Y (Rec. 709 weights) and CIE L* (0 black .. 100 white).
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
export const luminance = ([r, g, b]) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
export const lstar = (Y) => (Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y);
export const greyOf = (rgb) => { const v = toSrgb(luminance(rgb)); return [v, v, v]; };
export const hex3 = (h) => { const n = typeof h === 'number' ? h : parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
export const css = ([r, g, b], a = 1) => `rgba(${Math.round(clamp(r, 0, 1) * 255)},${Math.round(clamp(g, 0, 1) * 255)},${Math.round(clamp(b, 0, 1) * 255)},${a})`;
export const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const mul3 = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scl3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// Colour of a black body at temperature K, as display RGB 0..1. Tanner Helland's curve fit to Mitchell
// Charity's blackbody table (tannerhelland.com, "How to convert temperature (K) to RGB", 2012).
export function kelvinRGB(K) {
  const T = clamp(K, 1000, 40000) / 100;
  const r = T <= 66 ? 255 : 329.698727446 * Math.pow(T - 60, -0.1332047592);
  const g = T <= 66 ? 99.4708025861 * Math.log(T) - 161.1195681661 : 288.1221695283 * Math.pow(T - 60, -0.0755148492);
  const b = T >= 66 ? 255 : T <= 19 ? 0 : 138.5177312231 * Math.log(T - 10) - 305.0447927307;
  return [clamp(r, 0, 255) / 255, clamp(g, 0, 255) / 255, clamp(b, 0, 255) / 255];
}
// Sun height above the horizon in Mumbai (latitude 19.08° N) on an equinox day, by local solar time.
// sin(el) = sin φ sin δ + cos φ cos δ cos H, with declination δ = 0 and hour angle H = 15° per hour from noon.
export const LAT = 19.08;
export const sunElevation = (hour) => Math.asin(Math.cos(LAT * D2R) * Math.cos((hour - 12) * 15 * D2R)) / D2R;
// Colour temperature of direct sunlight by sun height: a smooth fit to typical photographic values, about
// 2,000 K at the horizon, 3,000 to 3,500 K a few degrees up (golden hour) and 5,000 to 5,500 K from mid
// morning (Wikipedia "Color temperature"; CIE D55 ≈ 5,500 K for midday sun). An estimate, not a law.
export const sunKelvin = (el) => (el <= 0 ? 2000 : 2000 + 3500 * (1 - Math.exp(-el / 12)));
export function lightName(el) {
  if (el < -6) return 'night';
  if (el < 0) return 'blue hour';
  if (el < 8) return 'golden hour';
  if (el < 25) return 'morning / late afternoon';
  return 'high sun';
}
// Atmospheric perspective: contrast left after distance d through haze, Koschmieder's law C = C0·e^(−βd),
// with β = 3.912 / V for meteorological visibility V (the 2% contrast threshold; WMO Guide No. 8).
export const hazeKeep = (dKm, visKm) => Math.exp((-3.912 * dKm) / visKm);

// Mood grades a painter might choose. Light and shadow can be pushed apart (complementary).
export const MOODS = {
  natural: { name: 'Natural', light: [1, 1, 1], shadow: [1, 1, 1], sky: [1, 1, 1] },
  warm: { name: 'Warm', light: [1.14, 1.0, 0.8], shadow: [1.1, 0.96, 0.85], sky: [1.12, 0.98, 0.86] },
  cool: { name: 'Cool', light: [0.86, 0.98, 1.14], shadow: [0.8, 0.95, 1.18], sky: [0.84, 0.97, 1.16] },
  comp: { name: 'Complementary', light: [1.2, 0.98, 0.72], shadow: [0.72, 0.98, 1.16], sky: [0.8, 0.98, 1.12] },
};

// ---------------------------------------------------------------- Tikku, the robot auto-rickshaw
// A design is a handful of numbers. Base: an Indian three-wheeler is about 2.6 m long, 1.3 m wide and
// 1.7 m tall with 8-inch wheels (about 0.2 m radius including the tyre) (Bajaj RE specifications).
export const BASE = { len: 2.6, h: 1.75, canopy: 0, over: 0.1, eye: 0.17, loco: 0, wheel: 0.22, antenna: 0, umbrella: 0, cargo: 0, arms: 0, lean: 0 };
export const CANOPIES = ['round', 'boxy', 'peaked'];
export const LOCOS = ['wheels', 'legs', 'tracks'];
export function variant(seed, v) {
  const r = rng(seed * 7919 + 13); r(); r();
  const u = () => r() * 2 - 1, pick = (n, p) => (r() < p ? 1 + Math.floor(r() * (n - 1)) : 0);
  return {
    len: BASE.len * (1 + 0.3 * v * u()), h: BASE.h * (1 + 0.28 * v * u()),
    canopy: pick(3, 0.7 * v), over: clamp(BASE.over + 0.35 * v * u(), -0.1, 0.5), eye: clamp(BASE.eye * (1 + 0.9 * v * u()), 0.07, 0.36),
    loco: pick(3, 0.55 * v), wheel: clamp(BASE.wheel * (1 + 0.8 * v * u()), 0.14, 0.42),
    antenna: r() < 0.25 + 0.5 * v ? 1 + Math.floor(r() * 2) : 0, umbrella: r() < 0.45 * v ? 1 : 0,
    cargo: r() < 0.5 * v ? 1 + Math.floor(r() * 3) : 0, arms: r() < 0.6 * v ? 1 : 0, lean: 0.14 * v * u(),
  };
}
const clearance = (P) => (P.loco === 1 ? 0.62 : P.loco === 2 ? 0.34 : P.wheel * 1.25);
export const TIKKU_COL = { body: '#1d9a95', canopy: '#f0b53c', dark: '#262a31', eye: '#a6f7ff', metal: '#9aa3ae', seat: '#8a3b2e', cargo: '#c9803f', brolly: '#e0453a' };

// Side view, facing right. mode: 'sil' (solid black shape), 'line' (pencil rough), 'color'.
// col(name) maps a part to a CSS colour in colour mode. Returns nothing; draws at ground line gy, sc px per metre.
export function drawTikku(g, cx, gy, sc, P, mode = 'sil', col = (n) => TIKKU_COL[n], lw = 1) {
  const L = P.len, H = P.h, c0 = clearance(P), tubH = 0.5 * (H - c0) * 0.9 + 0.25;
  const X = (x) => cx + x * sc, Y = (y) => gy - y * sc;
  const sil = mode === 'sil', line = mode === 'line';
  const ink = sil ? '#0b0b0d' : COL.lead;
  const fill = (name) => (sil ? ink : line ? 'rgba(59,56,51,0.10)' : col(name));
  const doFill = (name) => { g.fillStyle = fill(name); g.fill(); if (line) { g.strokeStyle = ink; g.lineWidth = 2.2 * lw; g.stroke(); } };
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  // lean: the whole body tips forward or back a little around the rear wheel.
  g.translate(X(0), Y(c0)); g.rotate(-P.lean); g.translate(-X(0), -Y(c0));
  const topT = c0 + tubH, roofY = H, fx = L / 2, rx = -L / 2;
  // canopy (behind the tub)
  const cx0 = rx + 0.05, cx1 = fx * 0.35 + P.over;
  g.beginPath();
  if (P.canopy === 0) { g.moveTo(X(cx0), Y(topT)); g.lineTo(X(cx0), Y(roofY - 0.25)); g.quadraticCurveTo(X(cx0), Y(roofY + 0.05), X(cx0 + 0.45), Y(roofY)); g.lineTo(X(cx1 - 0.3), Y(roofY)); g.quadraticCurveTo(X(cx1 + 0.05), Y(roofY), X(cx1), Y(roofY - 0.35)); g.lineTo(X(cx1 - 0.1), Y(roofY - 0.4)); g.lineTo(X(cx0 + 0.12), Y(roofY - 0.28)); g.lineTo(X(cx0 + 0.12), Y(topT)); }
  else if (P.canopy === 1) { g.moveTo(X(cx0), Y(topT)); g.lineTo(X(cx0), Y(roofY)); g.lineTo(X(cx1), Y(roofY)); g.lineTo(X(cx1), Y(roofY - 0.18)); g.lineTo(X(cx0 + 0.14), Y(roofY - 0.18)); g.lineTo(X(cx0 + 0.14), Y(topT)); }
  else { const mid = (cx0 + cx1) / 2; g.moveTo(X(cx0 - 0.12), Y(roofY - 0.28)); g.lineTo(X(mid), Y(roofY + 0.22)); g.lineTo(X(cx1 + 0.12), Y(roofY - 0.28)); g.lineTo(X(cx0 + 0.14), Y(roofY - 0.28)); g.lineTo(X(cx0 + 0.14), Y(topT)); g.lineTo(X(cx0), Y(topT)); }
  g.closePath(); doFill('canopy');
  // canopy support strut at the front
  g.beginPath(); g.moveTo(X(cx1 - 0.18), Y(roofY - 0.3)); g.lineTo(X(fx - 0.45), Y(topT)); g.lineWidth = (sil ? 7 : 3.5) * lw * sc / 60; g.strokeStyle = sil ? ink : line ? ink : col('dark'); g.stroke();
  // tub: a rounded body with a sloping nose
  g.beginPath(); g.moveTo(X(rx), Y(c0 + 0.08)); g.lineTo(X(rx), Y(topT)); g.lineTo(X(fx - 0.55), Y(topT)); g.quadraticCurveTo(X(fx - 0.05), Y(topT + 0.12), X(fx), Y(c0 + tubH * 0.45)); g.lineTo(X(fx - 0.08), Y(c0)); g.lineTo(X(rx + 0.1), Y(c0)); g.closePath(); doFill('body');
  // seat bump
  if (!sil) { g.beginPath(); rrect(g, X(rx + 0.25), Y(topT + 0.18), 0.7 * sc, 0.18 * sc, 5); doFill('seat'); }
  else { g.beginPath(); rrect(g, X(rx + 0.25), Y(topT + 0.16), 0.7 * sc, 0.18 * sc, 5); g.fill(); }
  // eye: the headlamp is a big round eye on the nose
  const ex = fx - 0.12, ey = c0 + tubH * 0.62;
  g.beginPath(); g.arc(X(ex), Y(ey), P.eye * sc, 0, TAU);
  if (sil) { g.fillStyle = ink; g.fill(); } else { g.fillStyle = line ? '#f7f2e8' : col('eye'); g.fill(); g.lineWidth = 2.2 * lw; g.strokeStyle = line ? ink : col('dark'); g.stroke(); g.beginPath(); g.arc(X(ex + P.eye * 0.25), Y(ey), P.eye * 0.45 * sc, 0, TAU); g.fillStyle = line ? ink : col('dark'); g.fill(); }
  // antenna, cargo, umbrella on the roof
  if (P.antenna) for (let i = 0; i < P.antenna; i++) {
    const ax = cx0 + 0.3 + i * 0.35; g.beginPath(); g.moveTo(X(ax), Y(roofY)); g.lineTo(X(ax - 0.1), Y(roofY + 0.45 + i * 0.1)); g.lineWidth = (sil ? 5 : 2.5) * lw; g.strokeStyle = sil || line ? ink : col('metal'); g.stroke();
    g.beginPath(); g.arc(X(ax - 0.1), Y(roofY + 0.47 + i * 0.1), 0.06 * sc, 0, TAU); g.fillStyle = sil || line ? ink : col('eye'); g.fill();
  }
  for (let i = 0; i < P.cargo; i++) { g.beginPath(); rrect(g, X(cx0 + 0.2 + i * 0.12), Y(roofY + 0.28 * (i + 1) + (P.canopy === 2 ? 0.15 : 0)), (0.62 - i * 0.12) * sc, 0.26 * sc, 3); doFill('cargo'); }
  if (P.umbrella) {
    const ux = cx0 + 0.15; g.beginPath(); g.moveTo(X(ux), Y(roofY)); g.lineTo(X(ux), Y(roofY + 0.6)); g.lineWidth = (sil ? 4 : 2) * lw; g.strokeStyle = sil || line ? ink : col('dark'); g.stroke();
    g.beginPath(); g.moveTo(X(ux - 0.55), Y(roofY + 0.55)); g.quadraticCurveTo(X(ux), Y(roofY + 1.05), X(ux + 0.55), Y(roofY + 0.55)); g.closePath(); doFill('brolly');
  }
  if (P.arms) {
    g.beginPath(); g.moveTo(X(fx - 0.6), Y(topT - 0.1)); g.lineTo(X(fx + 0.15), Y(topT + 0.25)); g.lineTo(X(fx + 0.35), Y(topT + 0.55)); g.lineWidth = (sil ? 9 : 5) * lw * sc / 60; g.strokeStyle = sil || line ? ink : col('metal'); g.stroke();
    g.beginPath(); g.arc(X(fx + 0.37), Y(topT + 0.6), 0.09 * sc, 0, TAU); g.fillStyle = sil || line ? ink : col('dark'); g.fill();
  }
  // locomotion
  const wr = P.wheel, frontX = fx - 0.3, rearX = rx + 0.45;
  const wheelAt = (x) => { g.beginPath(); g.arc(X(x), Y(wr), wr * sc, 0, TAU); g.fillStyle = sil ? ink : line ? 'rgba(59,56,51,.2)' : col('dark'); g.fill(); if (!sil) { g.lineWidth = 2 * lw; g.strokeStyle = ink; if (line) g.stroke(); g.beginPath(); g.arc(X(x), Y(wr), wr * 0.45 * sc, 0, TAU); g.fillStyle = line ? '#f7f2e8' : col('metal'); g.fill(); } };
  if (P.loco === 0) { wheelAt(frontX); wheelAt(rearX); }
  else if (P.loco === 1) {
    for (const [x, k] of [[frontX, 1], [rearX, -1]]) {
      g.beginPath(); g.moveTo(X(x), Y(c0 + 0.05)); g.lineTo(X(x + 0.22 * k), Y(c0 * 0.5)); g.lineTo(X(x), Y(0.06)); g.lineWidth = (sil ? 14 : 8) * lw * sc / 60; g.strokeStyle = sil || line ? ink : col('metal'); g.stroke();
      g.beginPath(); g.ellipse(X(x + 0.05), Y(0.04), 0.2 * sc, 0.06 * sc, 0, 0, TAU); g.fillStyle = sil || line ? ink : col('dark'); g.fill();
    }
  } else { g.beginPath(); rrect(g, X(rearX - 0.35), Y(0.36), (frontX - rearX + 0.7) * sc, 0.36 * sc, 0.17 * sc); doFill('dark'); if (!sil) for (let x = rearX - 0.2; x <= frontX + 0.2; x += 0.3) { g.beginPath(); g.arc(X(x), Y(0.18), 0.1 * sc, 0, TAU); g.fillStyle = line ? '#f7f2e8' : col('metal'); g.fill(); } }
  g.restore();
}
// Front or back view for turnarounds.
export function drawTikkuEnd(g, cx, gy, sc, P, back = false, mode = 'line', col = (n) => TIKKU_COL[n]) {
  const W = 1.3, H = P.h, c0 = clearance(P), tubH = 0.5 * (H - c0) * 0.9 + 0.25, topT = c0 + tubH;
  const X = (x) => cx + x * sc, Y = (y) => gy - y * sc, line = mode === 'line', ink = COL.lead;
  const f = (n) => { g.fillStyle = line ? 'rgba(59,56,51,.1)' : col(n); g.fill(); g.lineWidth = 2.2; g.strokeStyle = ink; g.stroke(); };
  g.save(); g.lineJoin = 'round';
  // canopy
  g.beginPath(); if (P.canopy === 2) { g.moveTo(X(-W / 2 - 0.05), Y(H - 0.28)); g.lineTo(X(0), Y(H + 0.22)); g.lineTo(X(W / 2 + 0.05), Y(H - 0.28)); g.lineTo(X(W / 2), Y(topT)); g.lineTo(X(-W / 2), Y(topT)); }
  else { g.moveTo(X(-W / 2), Y(topT)); g.lineTo(X(-W / 2), Y(H - (P.canopy ? 0 : 0.2))); g.quadraticCurveTo(X(-W / 2), Y(H), X(-W / 2 + (P.canopy ? 0 : 0.2)), Y(H)); g.lineTo(X(W / 2 - (P.canopy ? 0 : 0.2)), Y(H)); g.quadraticCurveTo(X(W / 2), Y(H), X(W / 2), Y(H - (P.canopy ? 0 : 0.2))); g.lineTo(X(W / 2), Y(topT)); }
  g.closePath(); f('canopy');
  if (!back) { g.beginPath(); rrect(g, X(-0.45), Y(H - 0.22), 0.9 * sc, 0.55 * sc, 6); g.fillStyle = line ? '#f7f2e8' : 'rgba(170,220,235,.8)'; g.fill(); g.strokeStyle = ink; g.stroke(); }
  // tub (narrower at the front: a single front wheel)
  const tw = back ? W / 2 : W * 0.3;
  g.beginPath(); rrect(g, X(-tw), Y(topT), tw * 2 * sc, (tubH) * sc, 8); f('body');
  if (!back) { g.beginPath(); g.arc(X(0), Y(c0 + tubH * 0.62), P.eye * sc, 0, TAU); g.fillStyle = line ? '#f7f2e8' : col('eye'); g.fill(); g.stroke(); g.beginPath(); g.arc(X(0), Y(c0 + tubH * 0.62), P.eye * 0.45 * sc, 0, TAU); g.fillStyle = ink; g.fill(); }
  else for (const k of [-1, 1]) { g.beginPath(); rrect(g, X(k * (W / 2 - 0.12) - 0.07), Y(c0 + tubH * 0.7), 0.14 * sc, 0.2 * sc, 3); g.fillStyle = line ? ink : '#e0453a'; g.fill(); }
  // wheels / legs / tracks
  const wr = P.wheel, xs = back ? [-W / 2 + 0.12, W / 2 - 0.12] : [0];
  for (const x of xs) { g.beginPath(); if (P.loco === 2) rrect(g, X(x - 0.12), Y(0.36), 0.24 * sc, 0.36 * sc, 6); else if (P.loco === 1) rrect(g, X(x - 0.06), Y(c0), 0.12 * sc, c0 * sc, 4); else rrect(g, X(x - 0.07), Y(2 * wr), 0.14 * sc, 2 * wr * sc, 5); g.fillStyle = line ? 'rgba(59,56,51,.3)' : col('dark'); g.fill(); g.strokeStyle = ink; g.stroke(); }
  g.restore();
}

// Rasterise a design's silhouette into a small mask (for readability tests). Same scale for every design.
const maskCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
export function silhouetteMask(P, W = 72, H = 54) {
  maskCanvas.width = W; maskCanvas.height = H;
  const g = maskCanvas.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, W, H);
  drawTikku(g, W / 2, H - 3, W / 4.6, P, 'sil');
  const d = g.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
  m.W = W; m.H = H;
  return m;
}
// Intersection over union of two masks: 1 = identical shapes, 0 = no overlap.
export function iou(a, b) { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { i += a[k] & b[k]; u += a[k] | b[k]; } return u ? i / u : 0; }
// Outline interest: perimeter² / (4π·area). A circle scores 1; spiky, gappy, characterful outlines score higher.
export function outline(m) {
  let area = 0, per = 0; const { W, H } = m;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!m[y * W + x]) continue; area++;
    if (x === 0 || !m[y * W + x - 1]) per++; if (x === W - 1 || !m[y * W + x + 1]) per++;
    if (y === 0 || !m[(y - 1) * W + x]) per++; if (y === H - 1 || !m[(y + 1) * W + x]) per++;
  }
  // Pixel edges overcount a smooth perimeter by about 4/π; correct for it.
  const p = per * Math.PI / 4;
  return area ? (p * p) / (4 * Math.PI * area) : 0;
}

// Tikku in 3D, from the same numbers. Faces +x. Returns a group.
export function makeTikku3D(P = BASE, { ghost = false } = {}) {
  const g = new THREE.Group();
  const col = (n) => new THREE.Color(TIKKU_COL[n]);
  const mat = (n, o = {}) => (ghost ? M.ghost(0x9ad7ff, 0.32, { wireframe: true }) : n === 'eye' ? M.glow(TIKKU_COL.eye) : M.plastic(col(n), o));
  const L = P.len, H = P.h, W = 1.3, c0 = clearance(P), tubH = 0.5 * (H - c0) * 0.9 + 0.25, topT = c0 + tubH, fx = L / 2, rx = -L / 2;
  const body = new THREE.Group(); g.add(body);
  const tub = new THREE.Mesh(new RoundedBoxGeometry(L - 0.5, tubH, W, 3, 0.12), mat('body')); tub.position.set(-0.25, c0 + tubH / 2, 0); tub.castShadow = true; body.add(tub);
  const nose = new THREE.Mesh(new RoundedBoxGeometry(0.62, tubH * 0.9, W * 0.62, 3, 0.14), mat('body')); nose.position.set(fx - 0.33, c0 + tubH * 0.48, 0); nose.castShadow = true; body.add(nose);
  const eye = sphere(P.eye, mat('eye'), 24); eye.position.set(fx - 0.02, c0 + tubH * 0.62, 0); eye.scale.x = 0.5; body.add(eye);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(P.eye, 0.025, 8, 28), mat('dark')); rim.rotation.y = Math.PI / 2; rim.position.copy(eye.position); body.add(rim);
  const pupil = sphere(P.eye * 0.45, mat('dark'), 16); pupil.position.set(fx + 0.04, eye.position.y, 0); pupil.scale.x = 0.4; body.add(pupil);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.2, W * 0.9, 2, 0.06), mat('seat')); seat.position.set(rx + 0.6, topT + 0.08, 0); body.add(seat);
  // canopy
  const cx0 = rx + 0.05, cx1 = fx * 0.35 + P.over, cw = cx1 - cx0, cm = (cx0 + cx1) / 2;
  let roof;
  if (P.canopy === 0) { roof = new THREE.Mesh(new THREE.CylinderGeometry(W / 2 + 0.05, W / 2 + 0.05, cw, 24, 1, true, -Math.PI / 2, Math.PI), mat('canopy', { side: THREE.DoubleSide })); roof.rotation.z = Math.PI / 2; roof.scale.set(0.55, 1, 1); roof.rotation.y = 0; roof.position.set(cm, H - 0.35, 0); roof.rotation.set(0, 0, Math.PI / 2); roof.rotateY(0); }
  else if (P.canopy === 1) { roof = new THREE.Mesh(new RoundedBoxGeometry(cw, 0.18, W + 0.1, 2, 0.05), mat('canopy')); roof.position.set(cm, H - 0.09, 0); }
  else { roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, (W + 0.2) / Math.SQRT2 * 1.0, 0.5, 4, 1), mat('canopy')); roof.rotation.y = Math.PI / 4; roof.scale.set(cw / (W + 0.2) * 1.4, 1, 1); roof.position.set(cm, H - 0.03, 0); }
  roof.castShadow = true; body.add(roof);
  if (P.canopy === 0) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(W / 2 + 0.05, W / 2 + 0.05, cw, 24, 1, false, 0, Math.PI), mat('canopy')); cap.rotation.x = Math.PI / 2; cap.rotation.z = Math.PI / 2; cap.scale.set(1, 1, 0.55); cap.position.set(cm, H - 0.35, 0); body.remove(roof); body.add(cap); cap.castShadow = true; }
  const back = box(0.08, H - topT - 0.1, W, mat('canopy')); back.position.set(cx0 + 0.04, (H + topT) / 2 - 0.05, 0); body.add(back);
  for (const z of [-1, 1]) body.add(beam([cx1 - 0.18, H - 0.3, z * (W / 2 - 0.02)], [fx - 0.45, topT, z * (W * 0.3)], 0.03, mat('dark')));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.6, 0.5), ghost ? M.ghost(0x9ad7ff, 0.15) : M.clear(0xbfe6ff, 0.35)); glass.rotation.y = Math.PI / 2; glass.rotation.x = 0; glass.position.set(fx - 0.5, topT + 0.3, 0); glass.rotation.z = 0.35; body.add(glass);
  if (P.antenna) for (let i = 0; i < P.antenna; i++) { const ax = cx0 + 0.3 + i * 0.35; body.add(beam([ax, H, 0.3], [ax - 0.1, H + 0.45 + i * 0.1, 0.3], 0.015, mat('metal'))); const tip = sphere(0.06, mat('eye'), 12); tip.position.set(ax - 0.1, H + 0.47 + i * 0.1, 0.3); body.add(tip); }
  for (let i = 0; i < P.cargo; i++) { const c = new THREE.Mesh(new RoundedBoxGeometry(0.62 - i * 0.12, 0.26, 0.7 - i * 0.1, 2, 0.03), mat('cargo')); c.position.set(cx0 + 0.51 - i * 0.0, H + 0.14 + 0.27 * i + (P.canopy === 2 ? 0.15 : 0), 0); c.castShadow = true; body.add(c); }
  if (P.umbrella) { body.add(beam([cx0 + 0.15, H, -0.3], [cx0 + 0.15, H + 0.6, -0.3], 0.015, mat('dark'))); const u = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 8, 0, TAU, 0, Math.PI / 2.6), mat('brolly', { side: THREE.DoubleSide })); u.position.set(cx0 + 0.15, H + 0.18, -0.3); u.castShadow = true; body.add(u); }
  if (P.arms) for (const z of [-1, 1]) { body.add(beam([fx - 0.6, topT - 0.1, z * 0.5], [fx + 0.15, topT + 0.25, z * 0.62], 0.05, mat('metal'))); body.add(beam([fx + 0.15, topT + 0.25, z * 0.62], [fx + 0.35, topT + 0.55, z * 0.62], 0.045, mat('metal'))); const hnd = sphere(0.09, mat('dark'), 12); hnd.position.set(fx + 0.37, topT + 0.6, z * 0.62); body.add(hnd); }
  // locomotion
  const wr = P.wheel, frontX = fx - 0.3, rearX = rx + 0.45, wheels = [];
  const wheel = (x, z) => { const w = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, 0.14, 24), mat('dark')); t.rotation.x = Math.PI / 2; w.add(t); const hub = new THREE.Mesh(new THREE.CylinderGeometry(wr * 0.45, wr * 0.45, 0.15, 16), mat('metal')); hub.rotation.x = Math.PI / 2; w.add(hub); w.position.set(x, wr, z); g.add(w); wheels.push(w); };
  if (P.loco === 0) { wheel(frontX, 0); wheel(rearX, -W / 2 + 0.1); wheel(rearX, W / 2 - 0.1); }
  else if (P.loco === 1) { for (const [x, k] of [[frontX, 1], [rearX, -1]]) for (const z of [-0.45, 0.45]) { g.add(beam([x, c0 + 0.05, z], [x + 0.22 * k, c0 * 0.5, z], 0.06, mat('metal'))); g.add(beam([x + 0.22 * k, c0 * 0.5, z], [x, 0.06, z], 0.055, mat('metal'))); const foot = sphere(0.14, mat('dark'), 12); foot.scale.set(1.4, 0.4, 1); foot.position.set(x + 0.05, 0.05, z); g.add(foot); } }
  else for (const z of [-0.5, 0.5]) { const t = new THREE.Mesh(new RoundedBoxGeometry(frontX - rearX + 0.7, 0.36, 0.26, 3, 0.16), mat('dark')); t.position.set((frontX + rearX) / 2, 0.18, z); t.castShadow = true; g.add(t); }
  body.position.y = 0; body.rotation.z = -P.lean;
  g.wheels = wheels; g.body = body;
  return g;
}

// ---------------------------------------------------------------- the painter: a monsoon street at any hour
// Fixed layout on a 16:9 canvas (fractions of width and height). The street runs into the distance to a
// vanishing point; the rickshaw sits near the lower-right thirds point, the focal point.
export const COMP = { vx: 0.56, hy: 0.5, fx: 0.645, fy: 0.715 };
export const DIST = { far: 4, mid: 1.5, near: 0.12, focal: 0.03 };    // km from the painter
const BUILD = ['#cdb89a', '#a9bfb1', '#d99f7f', '#93a4bf', '#c9c1b0', '#b59ab8'].map(hex3);
// Build every colour the painting uses from the scene settings. p: { hour, light (−1 left .. 1 right), mood, vis (km) }.
export function paletteFor(p) {
  const el = sunElevation(p.hour), mood = MOODS[p.mood] || MOODS.natural;
  const sunUp = clamp(el / 6 + 0.25, 0, 1);                                  // fades in through golden hour
  const sunI = clamp(0.25 + Math.sin(Math.max(0, el) * D2R) * 2.2, 0, 1.15) * sunUp;
  const sun = kelvinRGB(sunKelvin(el));
  const stops = [
    [-14, '#070a18', '#141a33'], [-6, '#141d45', '#3b3f72'], [-2, '#27366e', '#8a6c93'], [1, '#3d4f8c', '#ff9a5c'],
    [6, '#5a7cbc', '#ffc38a'], [15, '#5d8ccc', '#e8d6b8'], [35, '#4b86d0', '#c3d7ea'], [90, '#3f7fd0', '#bcd6ef'],
  ];
  let i = 0; while (i < stops.length - 2 && el > stops[i + 1][0]) i++;
  const k = clamp((el - stops[i][0]) / (stops[i + 1][0] - stops[i][0]), 0, 1);
  // Monsoon skies are veiled: pull the sky a little towards grey cloud.
  const cloud = [0.62, 0.64, 0.68];
  let top = mix3(mix3(hex3(stops[i][1]), hex3(stops[i + 1][1]), k), scl3(cloud, sunUp * 0.6 + 0.1), 0.25);
  let hor = mix3(mix3(hex3(stops[i][2]), hex3(stops[i + 1][2]), k), scl3(cloud, sunUp * 0.7 + 0.12), 0.2);
  top = mul3(top, mood.sky); hor = mul3(hor, mood.sky);
  const amb = mix3(scl3(hor, 0.55), scl3(top, 0.5), 0.5);
  const night = el < -4;
  return { el, sun, sunI, top, hor, amb, mood, night, lamp: kelvinRGB(2100), vis: p.vis, light: p.light };
}
// Shade a surface: albedo × (ambient + sun × facing), graded by mood, then hazed with distance.
export function shade(pal, albedo, facing, dKm, emissive = null) {
  const lit = Math.max(0, facing) * pal.sunI;
  let c = mul3(albedo, add3(scl3(pal.amb, 1.1), scl3(pal.sun, lit * 1.05)));
  c = mul3(c, lit > 0.25 ? pal.mood.light : pal.mood.shadow);
  if (emissive) c = add3(c, emissive);
  const keep = hazeKeep(dKm, pal.vis);
  return mix3(pal.hor, c, keep);
}
// Paint the scene. opts: { value: greyscale pass, overlay: composition guides }. Returns key values for readouts.
export function paintStreet(g, w, h, p, opts = {}) {
  const pal = paletteFor(p), val = !!opts.value;
  const C = (rgb, a = 1) => css(val ? greyOf(rgb) : rgb, a);
  const r = rng(11);
  const vx = COMP.vx * w, hy = COMP.hy * h, vy = hy + 4;
  const keys = {};
  // sky
  const sky = g.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, C(pal.top)); sky.addColorStop(1, C(pal.hor));
  g.fillStyle = sky; g.fillRect(0, 0, w, hy + 2);
  keys.sky = mix3(pal.top, pal.hor, 0.6);
  // sun or moon
  const sx = w * (0.5 + 0.42 * p.light), sy = hy - clamp(pal.el / 70, -0.1, 1) * hy * 0.92;
  if (pal.el > -3) {
    const glow = g.createRadialGradient(sx, sy, 2, sx, sy, 160);
    glow.addColorStop(0, C(add3(pal.sun, [0.2, 0.2, 0.2]), 0.9)); glow.addColorStop(0.15, C(pal.sun, 0.35)); glow.addColorStop(1, C(pal.sun, 0));
    g.fillStyle = glow; g.fillRect(0, 0, w, hy + 2);
    if (pal.el > 0) { g.beginPath(); g.arc(sx, sy, 18, 0, TAU); g.fillStyle = C(add3(pal.sun, [0.3, 0.3, 0.3])); g.fill(); }
  } else { g.beginPath(); g.arc(w * 0.82, h * 0.12, 13, 0, TAU); g.fillStyle = C([0.85, 0.87, 0.9], 0.9); g.fill(); }
  // monsoon cloud bands
  for (let i = 0; i < 7; i++) { const cy = r() * hy * 0.55, cw = 180 + r() * 320; g.fillStyle = C(mix3(pal.top, pal.hor, 0.5), 0.35); g.beginPath(); g.ellipse(r() * w, cy, cw, 16 + r() * 18, 0, 0, TAU); g.fill(); }
  // far skyline, 4 km
  const farC = shade(pal, [0.55, 0.58, 0.64], 0.4, DIST.far);
  g.fillStyle = C(farC); g.beginPath(); g.moveTo(0, hy + 6);
  for (let x = 0; x < w; x += 14 + r() * 26) { const hh = 14 + r() * 50; g.lineTo(x, hy - hh); g.lineTo(x + 12 + r() * 18, hy - hh); }
  g.lineTo(w, hy + 6); g.closePath(); g.fill();
  keys.far = farC;
  // mid towers, 1.5 km, with a lit face on the sun's side
  const lr = p.light >= 0 ? 1 : -1;
  const towers = [[0.3, 90, 150], [0.4, 60, 215], [0.47, 70, 120], [0.62, 55, 190], [0.7, 80, 140], [0.8, 60, 175]];
  towers.forEach(([fx, tw, th], i) => {
    const x = fx * w, base = hy + 6, top = hy - th * (h / 576), side = 16;
    const front = shade(pal, BUILD[i % BUILD.length], 0.35 * (1 - Math.abs(p.light)) + 0.2, DIST.mid);
    const sideC = shade(pal, BUILD[i % BUILD.length], Math.abs(p.light), DIST.mid);
    const dark = shade(pal, BUILD[i % BUILD.length], 0, DIST.mid);
    g.fillStyle = C(front); g.fillRect(x, top, tw, base - top);
    g.fillStyle = C(lr > 0 ? sideC : dark); g.fillRect(x + tw, top + 4, side, base - top - 4);
    if (lr < 0) { g.fillStyle = C(sideC); g.fillRect(x - side, top + 4, side, base - top - 4); }
    // windows: lit at night
    for (let yy = top + 10; yy < base - 8; yy += 12) for (let xx = x + 6; xx < x + tw - 6; xx += 11) {
      const on = pal.night ? r() < 0.55 : r() < 0.06;
      g.fillStyle = on ? C(mix3(pal.hor, [1, 0.8, 0.45], hazeKeep(DIST.mid, p.vis)), 0.9) : C(scl3(front, 0.82)); g.fillRect(xx, yy, 5, 6);
    }
    if (i === 3) keys.mid = front;
  });
  // haze band on the horizon
  const hz = g.createLinearGradient(0, hy - 70, 0, hy + 10); hz.addColorStop(0, C(pal.hor, 0)); hz.addColorStop(1, C(pal.hor, 0.55 * (1 - hazeKeep(2, p.vis))));
  g.fillStyle = hz; g.fillRect(0, hy - 70, w, 80);
  // pavements under everything at street level
  g.fillStyle = C(shade(pal, [0.42, 0.41, 0.39], 0.3, DIST.near)); g.fillRect(0, hy + 2, w, h - hy);
  // road, wet, running to the vanishing point
  const roadC = shade(pal, [0.24, 0.25, 0.28], 0.25, DIST.near);
  const road = g.createLinearGradient(0, vy, 0, h); road.addColorStop(0, C(mix3(pal.hor, roadC, 0.5))); road.addColorStop(1, C(roadC));
  g.fillStyle = road; g.beginPath(); g.moveTo(vx, vy); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
  // reflection of the sun or lamps in the wet road
  const refl = g.createLinearGradient(0, vy, 0, h);
  const rc = pal.el > -3 ? pal.sun : pal.lamp;
  refl.addColorStop(0, C(rc, 0.5)); refl.addColorStop(1, C(rc, 0));
  g.fillStyle = refl; g.beginPath(); const rx = pal.el > -3 ? sx : vx; g.moveTo(rx - 4, vy); g.lineTo(rx + 4, vy); g.lineTo(rx + 70 + (rx - vx) * 1.2, h); g.lineTo(rx - 70 + (rx - vx) * 1.2, h); g.closePath(); g.fill();
  // lane markings: leading lines
  g.strokeStyle = C(shade(pal, [0.8, 0.78, 0.7], 0.4, DIST.near), 0.8); g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const t0 = 0.15 + i * 0.14, t1 = t0 + 0.07; const a = (t) => [vx + (w * 0.5 - vx) * t * t, vy + (h - vy) * t * t]; const A = a(t0), B = a(t1); g.lineWidth = 1 + 5 * t0; g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke(); }
  // near buildings, left and right, with balcony lines converging on the vanishing point
  const yL = (x, y0) => y0 + (vy - y0) * (x / vx), yR = (x, y0) => y0 + (vy - y0) * ((w - x) / (w - vx));
  const facadeL = shade(pal, BUILD[2], Math.max(0, p.light), DIST.near), facadeR = shade(pal, BUILD[1], Math.max(0, -p.light), DIST.near);
  const drawFacade = (side) => {
    const L = side < 0, xa = L ? 0 : w, xb = L ? 0.33 * w : 0.74 * w, yy = L ? yL : yR, col = L ? facadeL : facadeR;
    const top0 = L ? -10 : 30, bot0 = h * 0.93;
    g.fillStyle = C(col); g.beginPath(); g.moveTo(xa, top0); g.lineTo(xb, yy(xb, top0)); g.lineTo(xb, yy(xb, bot0)); g.lineTo(xa, bot0); g.closePath(); g.fill();
    // the building's front end (facing us) in shadow or light
    const endC = shade(pal, L ? BUILD[2] : BUILD[1], 0.25, DIST.near);
    g.fillStyle = C(scl3(endC, 0.9)); g.fillRect(L ? xb : xb - 16, yy(xb, top0), 16, yy(xb, bot0) - yy(xb, top0));
    // balconies and window rows
    g.strokeStyle = C(scl3(col, 0.6)); g.lineWidth = 3;
    for (let f = 0; f < 9; f++) { const y0 = top0 + (bot0 - top0) * (f + 0.6) / 9; g.beginPath(); g.moveTo(xa, y0); g.lineTo(xb, yy(xb, y0)); g.stroke(); }
    for (let k = 0; k < 7; k++) { const x = xa + (xb - xa) * (k + 0.5) / 7; for (let f = 0; f < 8; f++) { const y0 = top0 + (bot0 - top0) * (f + 0.8) / 9, y1 = top0 + (bot0 - top0) * (f + 1.35) / 9; const Y0 = yy(x, y0), Y1 = yy(x, y1), ww = Math.abs(xb - xa) / 7 * 0.45; const on = pal.night && ((k * 7 + f * 3) % 5 < 2); g.fillStyle = on ? C([1, 0.78, 0.42], 0.9) : C(scl3(col, 0.55)); g.fillRect(x - ww / 2, Y0, ww, Y1 - Y0); } }
    // shop signs at street level: colour accents
    const signs = L ? ['#d64545', '#2b8a6e', '#e3a72f'] : ['#3b6fd8', '#c2410c'];
    signs.forEach((sc, j) => { const x0 = xa + (xb - xa) * (0.1 + j * 0.3), x1 = x0 + (xb - xa) * 0.22; const y0 = bot0 - (bot0 - top0) * 0.2; g.fillStyle = C(shade(pal, hex3(sc), 0.5, DIST.near, pal.night ? scl3(hex3(sc), 0.35) : null)); g.beginPath(); g.moveTo(x0, yy(x0, y0)); g.lineTo(x1, yy(x1, y0)); g.lineTo(x1, yy(x1, y0 + 40)); g.lineTo(x0, yy(x0, y0 + 40)); g.closePath(); g.fill(); });
  };
  drawFacade(-1); drawFacade(1);
  keys.near = p.light >= 0 ? facadeL : facadeR;
  // cast shadows across the road: longer when the sun is low (length ∝ 1 / tan(elevation))
  if (pal.el > 0.5) {
    const len = clamp(1 / Math.tan(pal.el * D2R), 0, 6) * 60, sh = scl3(roadC, 0.55);
    g.fillStyle = C(sh, 0.55 * clamp(pal.sunI * 1.4, 0, 1)); g.beginPath();
    if (p.light > 0) { g.moveTo(w * 0.74, yR(w * 0.74, h * 0.93)); g.lineTo(w, h * 0.93); g.lineTo(w, h); g.lineTo(w - Math.abs(p.light) * len * 2.2 - 60, h); g.lineTo(vx + 20, vy + 4); g.closePath(); }
    else { g.moveTo(w * 0.33, yL(w * 0.33, h * 0.93)); g.lineTo(0, h * 0.93); g.lineTo(0, h); g.lineTo(Math.abs(p.light) * len * 2.2 + 60, h); g.lineTo(vx - 20, vy + 4); g.closePath(); }
    g.fill();
  }
  // electric wires sagging across the street: more leading lines
  g.strokeStyle = C(shade(pal, [0.1, 0.1, 0.12], 0, DIST.near), 0.85); g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const y0 = h * (0.2 + i * 0.07); g.beginPath(); g.moveTo(w * 0.25, yL(w * 0.25, y0)); g.quadraticCurveTo(w * 0.52, h * (0.36 + i * 0.07), w * 0.82, yR(w * 0.82, y0 - 20)); g.stroke(); }
  // street lamps at night
  if (pal.el < 2) for (const [lx, ly] of [[0.37, 0.4], [0.45, 0.46], [0.71, 0.42]]) { const x = lx * w, y = ly * h; const gl = g.createRadialGradient(x, y, 1, x, y, 60); gl.addColorStop(0, C(pal.lamp, 0.9)); gl.addColorStop(1, C(pal.lamp, 0)); g.fillStyle = gl; g.fillRect(x - 60, y - 60, 120, 120); }
  // the focal point: Tikku, lit on the sun side
  const fx = COMP.fx * w, fy = COMP.fy * h, sc = h / 576 * 62;
  // the hero gets a little extra light, as painters do: warm lamp light when the sun is low
  const lampK = clamp((6 - pal.el) / 10, 0, 1) * 0.22;
  const bodyC = shade(pal, hex3(TIKKU_COL.body), 0.6 + 0.4 * Math.abs(p.light), DIST.focal, scl3(mul3(pal.lamp, hex3(TIKKU_COL.body)), lampK * 1.6));
  const canC = shade(pal, hex3(TIKKU_COL.canopy), 0.8, DIST.focal, scl3(mul3(pal.lamp, hex3(TIKKU_COL.canopy)), lampK * 1.6));
  const colFn = (n) => ({ body: C(bodyC), canopy: C(canC), dark: C(shade(pal, [0.13, 0.14, 0.16], 0.3, DIST.focal)), metal: C(shade(pal, [0.6, 0.63, 0.68], 0.5, DIST.focal)), seat: C(shade(pal, hex3(TIKKU_COL.seat), 0.4, DIST.focal)), cargo: C(shade(pal, hex3(TIKKU_COL.cargo), 0.5, DIST.focal)), brolly: C(shade(pal, hex3(TIKKU_COL.brolly), 0.5, DIST.focal)), eye: C([0.75, 0.97, 1]) }[n]);
  // headlamp beam when it is dim
  if (pal.el < 8) { const bx = fx - 1.1 * sc, by = fy - 0.85 * sc; const bm = g.createLinearGradient(bx, by, bx - 260, by + 40); bm.addColorStop(0, C([0.75, 0.97, 1], 0.55)); bm.addColorStop(1, C([0.75, 0.97, 1], 0)); g.fillStyle = bm; g.beginPath(); g.moveTo(bx, by - 6); g.lineTo(bx - 280, by - 40); g.lineTo(bx - 280, by + 90); g.closePath(); g.fill(); }
  g.save(); g.translate(fx, 0); g.scale(-1, 1); g.translate(-fx, 0);                  // facing left, towards the street
  drawTikku(g, fx, fy + 0.1 * sc, sc, { ...BASE, umbrella: 1 }, 'color', colFn, 1);
  g.restore();
  // its reflection in the puddle
  g.save(); g.globalAlpha = 0.28; g.translate(fx, fy + 0.1 * sc); g.scale(-1, -0.5); g.translate(-fx, -(fy + 0.1 * sc));
  drawTikku(g, fx, fy + 0.1 * sc, sc, { ...BASE, umbrella: 1 }, 'color', colFn, 1); g.restore();
  keys.focal = bodyC; keys.around = roadC;
  // rain
  g.strokeStyle = C(mix3(pal.hor, [1, 1, 1], 0.4), 0.28); g.lineWidth = 1.2;
  const rr = rng(5); g.beginPath();
  for (let i = 0; i < 260; i++) { const x = rr() * w, y = rr() * h, l = 10 + rr() * 16; g.moveTo(x, y); g.lineTo(x - l * 0.18, y + l); }
  g.stroke();
  if (opts.overlay) drawComposition(g, w, h);
  return { pal, keys };
}
// Composition guides: rule of thirds, the focal point and leading lines to it.
export function drawComposition(g, w, h) {
  g.save();
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.setLineDash([10, 8]);
  for (const f of [1 / 3, 2 / 3]) { g.beginPath(); g.moveTo(w * f, 0); g.lineTo(w * f, h); g.stroke(); g.beginPath(); g.moveTo(0, h * f); g.lineTo(w, h * f); g.stroke(); }
  g.setLineDash([]);
  const vx = COMP.vx * w, vy = COMP.hy * h + 4, fx = COMP.fx * w, fy = COMP.fy * h - 40;
  g.strokeStyle = '#ffd166'; g.fillStyle = '#ffd166'; g.lineWidth = 4;
  const arrow = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 20 * Math.cos(a - 0.4), y1 - 20 * Math.sin(a - 0.4)); g.lineTo(x1 - 20 * Math.cos(a + 0.4), y1 - 20 * Math.sin(a + 0.4)); g.closePath(); g.fill(); };
  arrow(40, h - 20, vx - 30, vy + 18); arrow(w - 40, h - 20, vx + 34, vy + 16); arrow(20, 60, vx - 40, vy - 18); arrow(w - 20, 90, vx + 40, vy - 16);
  g.lineWidth = 5; g.strokeStyle = '#ff5a6e'; g.beginPath(); g.arc(fx, fy, 58, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w * 2 / 3, h * 2 / 3, 6, 0, TAU); g.fill();
  g.font = `600 22px ${SANS}`; g.fillStyle = '#ffd166'; g.fillText('leading lines', 26, h - 34);
  g.fillStyle = '#ff5a6e'; g.fillText('focal point', fx - 50, fy - 70);
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('rule of thirds', w * 2 / 3 + 10, 30);
  g.restore();
}
// Brush-stroke reveal: draw src onto g through the first k (0..1) of a fixed set of broad strokes.
const STROKES = (() => { const r = rng(21), out = []; for (let row = 0; row < 7; row++) for (let col = 0; col < 6; col++) out.push({ x: (col + r() * 0.6) / 6, y: (row + 0.5) / 7, a: -0.25 + r() * 0.2, l: 0.3 + r() * 0.15, t: 0.2 + r() * 0.08, o: r() }); return out.sort((a, b) => a.y + a.o * 0.3 - (b.y + b.o * 0.3)); })();
export function revealPaint(g, src, w, h, k) {
  if (k >= 0.999) { g.drawImage(src, 0, 0, w, h); return; }
  if (k <= 0.001) return;
  const n = k * STROKES.length;
  g.save(); g.beginPath();
  for (let i = 0; i < Math.ceil(n); i++) {
    const s = STROKES[i], part = Math.min(1, n - i), L = s.l * w * part, T = s.t * h;
    const cx = s.x * w - s.l * w * 0.3, cy = s.y * h, ca = Math.cos(s.a), sa = Math.sin(s.a);
    g.moveTo(cx - T / 2 * -sa, cy - T / 2 * ca);
    g.lineTo(cx + L * ca - T / 2 * -sa, cy + L * sa - T / 2 * ca);
    g.lineTo(cx + L * ca + T / 2 * -sa, cy + L * sa + T / 2 * ca);
    g.lineTo(cx + T / 2 * -sa, cy + T / 2 * ca); g.closePath();
  }
  g.clip(); g.drawImage(src, 0, 0, w, h); g.restore();
  return STROKES[Math.min(STROKES.length - 1, Math.floor(n))];
}

// ---------------------------------------------------------------- Kaavu, the forest spirit
// A moss-and-bark guardian of a sacred grove, designed for this box. H = height to the top of the head
// (the antlers are extra), heads = how many head-heights tall it is. Faces +z.
export const KAAVU_COL = [
  { part: 'Moss cloak', hex: '#4f7a3a' }, { part: 'Bark skin', hex: '#6b4a2f' }, { part: 'Leaf crown', hex: '#8fbf4a' },
  { part: 'Eye glow', hex: '#7ff5e8' }, { part: 'Lantern flame', hex: '#ffc766' }, { part: 'Mushroom caps', hex: '#d9603b' },
];
export function makeKaavu() {
  const g = new THREE.Group(), parts = new THREE.Group(); g.add(parts);
  const mats = {
    moss: M.matte(KAAVU_COL[0].hex), bark: M.matte(KAAVU_COL[1].hex, { roughness: 0.95 }), leaf: M.matte(KAAVU_COL[2].hex, { side: THREE.DoubleSide }),
    eye: M.glow(KAAVU_COL[3].hex), flame: M.glow(KAAVU_COL[4].hex), cap: M.matte(KAAVU_COL[5].hex), stem: M.matte('#efe3c8'), iron: M.metal(0x3a3a3a, { roughness: 0.5 }),
  };
  const spots = {};
  g.build = (H = 2.2, heads = 4) => {
    parts.children.slice().forEach((c) => { parts.remove(c); c.traverse((o) => o.geometry?.dispose()); });
    const hh = H / heads, bodyTop = H - hh, R = clamp(0.14 * H + 0.05, 0.12, 0.6);
    // cloak: lathe from the ground up to the neck, flaring at the hem
    const prof = [[0, R * 1.25], [0.08 * bodyTop, R * 1.2], [0.45 * bodyTop, R * 0.95], [0.8 * bodyTop, R * 0.78], [0.97 * bodyTop, R * 0.45], [bodyTop, 0.02]];
    const cloak = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([y, r]) => new THREE.Vector2(r, y)), 28), mats.moss); cloak.castShadow = true; parts.add(cloak);
    // leaf fringe at the hem
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, l = new THREE.Mesh(new THREE.ConeGeometry(0.06 * R / 0.35, 0.22 * R / 0.35, 4), mats.leaf); l.position.set(Math.sin(a) * R * 1.24, 0.06, Math.cos(a) * R * 1.24); l.rotation.set(Math.PI, 0, 0); l.scale.z = 0.4; l.lookAt(0, 0.06, 0); l.rotateX(Math.PI / 2); parts.add(l); }
    // roots for feet
    for (const x of [-0.35, 0.35]) parts.add(beam([x * R, 0.15, 0.6 * R], [x * R * 1.6, 0.02, 1.3 * R], 0.05 * R / 0.35 + 0.01, mats.bark));
    // head: a bark mask with glowing eyes
    const head = sphere(hh * 0.5, mats.bark, 24); head.scale.set(0.82, 1, 0.8); head.position.y = bodyTop + hh * 0.5; parts.add(head);
    for (const x of [-1, 1]) { const e = sphere(hh * 0.075, mats.eye, 12); e.position.set(x * hh * 0.16, bodyTop + hh * 0.56, hh * 0.38); e.scale.z = 0.5; parts.add(e); }
    const seed = sphere(0.05 * R / 0.35 + 0.02, mats.eye, 12); seed.position.set(0, bodyTop * 0.72, R * 0.78 * 0.98); parts.add(seed);
    // leaf crown and two branch antlers
    for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3, l = new THREE.Mesh(new THREE.ConeGeometry(hh * 0.09, hh * 0.35, 4), mats.leaf); l.position.set(Math.sin(a) * hh * 0.3, bodyTop + hh * 1.0, Math.cos(a) * hh * 0.1 - hh * 0.05); l.rotation.z = -a * 0.8; l.scale.z = 0.35; parts.add(l); }
    for (const x of [-1, 1]) {
      const b0 = [x * hh * 0.25, bodyTop + hh * 0.85, 0], b1 = [x * hh * 0.6, bodyTop + hh * 1.35, -hh * 0.05], b2 = [x * hh * 0.95, bodyTop + hh * 1.55, -hh * 0.1], b3 = [x * hh * 0.55, bodyTop + hh * 1.75, 0];
      parts.add(beam(b0, b1, hh * 0.05, mats.bark), beam(b1, b2, hh * 0.035, mats.bark), beam(b1, b3, hh * 0.035, mats.bark));
    }
    // arms: thin branches; the right hand (−x from the front) holds a lantern
    const sh = bodyTop * 0.9;
    const armL = [[R * 0.7, sh, 0], [R * 1.05, sh * 0.62, R * 0.2], [R * 1.0, sh * 0.42, R * 0.35]];
    parts.add(beam(armL[0], armL[1], 0.04 * R / 0.35 + 0.012, mats.bark), beam(armL[1], armL[2], 0.035 * R / 0.35 + 0.01, mats.bark));
    const armR = [[-R * 0.7, sh, 0], [-R * 1.2, sh * 0.7, R * 0.25], [-R * 1.45, sh * 0.62, R * 0.55]];
    parts.add(beam(armR[0], armR[1], 0.04 * R / 0.35 + 0.012, mats.bark), beam(armR[1], armR[2], 0.035 * R / 0.35 + 0.01, mats.bark));
    const lan = new THREE.Group(); lan.position.set(...armR[2]); parts.add(lan);
    const ls = clamp(H / 2.2, 0.4, 1.4);
    lan.add(beam([0, 0, 0], [0, -0.14 * ls, 0], 0.008, mats.iron));
    const cage = box(0.14 * ls, 0.2 * ls, 0.14 * ls, M.clear(0xffe7b0, 0.35)); cage.position.y = -0.25 * ls; lan.add(cage);
    const fl = sphere(0.045 * ls, mats.flame, 12); fl.position.y = -0.25 * ls; lan.add(fl);
    const lid = new THREE.Mesh(new THREE.ConeGeometry(0.1 * ls, 0.07 * ls, 4), mats.iron); lid.rotation.y = Math.PI / 4; lid.position.y = -0.12 * ls; lan.add(lid);
    // back: a moss hump with mushrooms, and a leaf tail
    const hump = sphere(R * 0.7, mats.moss, 20); hump.scale.set(1, 0.8, 0.6); hump.position.set(0, bodyTop * 0.72, -R * 0.55); parts.add(hump);
    [[-0.3, 0.86, 0.9], [0.25, 0.8, 1], [0.05, 0.93, 0.7], [0.4, 0.66, 0.8]].forEach(([x, y, s]) => {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * s, 0.025 * s, 0.08 * s, 8), mats.stem); st.position.set(x * R, bodyTop * y, -R * 1.1); st.rotation.x = -0.9; parts.add(st);
      const cp = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s * R / 0.35 + 0.02, 12, 6, 0, TAU, 0, Math.PI / 2), mats.cap); cp.position.set(x * R, bodyTop * y + 0.03, -R * 1.14 - 0.04 * s); cp.rotation.x = -0.9; parts.add(cp);
    });
    const tail = new THREE.Mesh(new THREE.ConeGeometry(R * 0.35, R * 1.2, 4), mats.leaf); tail.position.set(0, R * 0.5, -R * 1.45); tail.rotation.x = -1.1; tail.scale.x = 0.35; parts.add(tail);
    parts.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    spots.moss = [-R * 0.5, bodyTop * 0.2, R * 1.1]; spots.bark = [armL[1][0], armL[1][1], armL[1][2]]; spots.leaf = [0, bodyTop + hh * 1.1, 0];
    spots.eye = [hh * 0.16, bodyTop + hh * 0.56, hh * 0.4]; spots.flame = [armR[2][0], armR[2][1] - 0.25 * ls, armR[2][2]]; spots.cap = [0.25 * R, bodyTop * 0.8, -R * 1.15];
    g.H = H; g.hh = hh; g.R = R;
  };
  g.spots = spots;
  g.build();
  return g;
}

// A plain grey human for scale, feet at the origin, facing +z. Adult proportions: about 7.5 heads tall
// (Andrew Loomis, "Figure Drawing for All It's Worth", 1943, uses 8 for an idealised figure; 7 to 7.5 is average).
export function makeHuman(H = 1.7, color = 0x9aa3b2) {
  const g = new THREE.Group(), m = M.matte(color), hh = H / 7.5;
  const cap = (r, len, y, x = 0) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 4, 10), m); c.position.set(x, y, 0); c.castShadow = true; g.add(c); return c; };
  for (const x of [-0.09, 0.09]) cap(0.065 * H / 1.7, H * 0.47, H * 0.24, x * H / 1.7);
  const torso = cap(0.15 * H / 1.7, H * 0.36, H * 0.64); torso.scale.z = 0.62;
  for (const x of [-0.2, 0.2]) { const a = cap(0.045 * H / 1.7, H * 0.4, H * 0.62, x * H / 1.7); a.rotation.z = x > 0 ? 0.08 : -0.08; }
  const head = sphere(hh * 0.5, m, 20); head.scale.set(0.8, 1, 0.9); head.position.y = H - hh * 0.5; g.add(head);
  return g;
}

// ---------------------------------------------------------------- props
export function makeEasel(w = 1.6, h = 1.0, color = 0x8a6a48, y0 = 1.0) {
  const g = new THREE.Group(), wood = M.matte(color);
  const top = y0 + h + 0.2;
  g.add(beam([-w * 0.35, 0, 0.25], [-w * 0.12, top, 0], 0.025, wood), beam([w * 0.35, 0, 0.25], [w * 0.12, top, 0], 0.025, wood), beam([0, 0, -0.55], [0, top - 0.1, -0.02], 0.025, wood));
  const ledge = box(w * 0.9, 0.04, 0.1, wood); ledge.position.set(0, y0 - 0.02, 0.3); g.add(ledge);
  g.boardY = y0 + h / 2; g.boardZ = 0.3;
  return g;
}
// A cine camera (lens along −z, like a three.js camera) for the blockout set.
export function makeCineCam() {
  const g = new THREE.Group(), dark = M.matte(0x2a2d34), metal = M.metal(0x9aa3b2, { roughness: 0.35 });
  const b = box(0.2, 0.2, 0.36, dark); g.add(b);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.2, 20), M.matte(0x16181d)); lens.rotation.x = Math.PI / 2; lens.position.z = -0.27; g.add(lens);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20), metal); ring.rotation.x = Math.PI / 2; ring.position.z = -0.24; g.add(ring);
  const tally = sphere(0.018, M.glow(0xff3344), 8); tally.position.set(0.06, 0.11, -0.1); g.add(tally);
  return g;
}

// Set a range/seg/toggle control in the side panel as if the viewer moved it, so the readout and UI stay in step.
export function setControl(label, value) {
  const inp = [...document.querySelectorAll('#panel input[type=range]')].find((x) => x.getAttribute('aria-label') === label);
  if (inp) { inp.value = value; inp.dispatchEvent(new Event('input')); return true; }
  const b = [...document.querySelectorAll('#panel .seg')].find((x) => x.getAttribute('aria-label') === label)?.querySelector(`button[data-v="${value}"]`);
  if (b) { b.click(); return true; }
  return false;
}
// Turn a flat board to face a point (usually the chapter's camera position), keeping it upright.
export function faceTo(mesh, pos) { const p = new THREE.Vector3(...pos); p.y = mesh.position.y; mesh.lookAt(p); }
