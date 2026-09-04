'use client';

import { useEffect, useRef } from 'react';

/**
 * فضاء الحرير (2026-09-04) — روح الموقع: «ضوء حيّ واحد يسكن خلف الزجاج».
 * تطوير SignatureField v3 من مشهد هيرو إلى طبقة موقع ثابتة خلف الصفحة كلها:
 *  - الحرير يعيش في الفضاء: يغوص ويطفو مع التمرير ولا يغادر الشاشة،
 *    وسرعة التمرير تدفع تياره وتسحب نسيجه (نوابض المقاطع نفسها).
 *  - شدّته تتبع القسم: مشتعل في الهيرو، خافت خلف كروت البيع، يعود
 *    مشتعلاً عند القرار. أي قسم يحدد شدّته بـ data-silk="0.2".
 *  - عمق فضائي: نجوم على ثلاث طبقات بُعد تتحرك بالبارالاكس مع التمرير
 *    واليد، وحجاب حواف يعمّق الظلمة حول الضوء.
 * عقيدة الأداء كما هي: DPR≤1.5 (طبقة دائمة)، أول إطار فوري، إيقاف مع
 * الإخفاء، سكون مع reduced-motion، وفشل WebGL يختفي بأدب.
 */

const RIBBON_VERT = `
attribute vec2 aPos;
attribute vec2 aUV;
attribute float aGlow;
uniform vec2 uRes;
varying vec2 vUV;
varying float vGlow;
void main() {
  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vUV = aUV;
  vGlow = aGlow;
}`;

const RIBBON_FRAG = `
precision mediump float;
varying vec2 vUV;
varying float vGlow;
uniform float uTime;
uniform float uInt;
uniform float uHot;   /* حرارة القلب: 0.6 عنبري هادئ … 1.6 أبيض ساخن */
uniform float uFil;   /* تباين خيوط اللهب */

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  v += 0.5   * noise(p);
  v += 0.25  * noise(p * 2.13 + 7.7);
  v += 0.125 * noise(p * 4.31 - 3.1);
  return v / 0.875;
}

void main() {
  vec2 flow = vec2(vUV.x * 6.0 - uTime * 0.55, vUV.y * 2.2);
  float n = fbm(flow);
  float n2 = fbm(flow * 1.7 + vec2(uTime * 0.13, 4.2));
  float filaments = pow(n * 0.65 + n2 * 0.55, 2.4 * uFil);

  float across = 1.0 - abs(vUV.y * 2.0 - 1.0);
  float core = pow(smoothstep(0.0, 1.0, across), 1.6);
  float ends = smoothstep(0.0, 0.06, vUV.x) * smoothstep(1.0, 0.94, vUV.x);

  float intensity = filaments * core * ends * (0.85 + vGlow * 1.6) * pow(uInt, 0.7);

  vec3 deep  = vec3(0.48, 0.10, 0.05);
  vec3 ember = vec3(0.957, 0.302, 0.169);
  vec3 hot   = vec3(1.0, 0.92, 0.80);
  vec3 col = mix(deep, ember, clamp(intensity * 2.2, 0.0, 1.0));
  col = mix(col, hot, clamp(pow(intensity, 2.0) * 2.6 * core * uHot, 0.0, 1.0));

  gl_FragColor = vec4(col * intensity, intensity);
}`;

const SPARK_VERT = `
attribute vec2 aPos;
attribute float aSize;
attribute float aTw;
uniform vec2 uRes;
uniform float uTime;
uniform float uDpr;
varying float vA;
void main() {
  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = aSize * uDpr;
  vA = 0.55 + 0.45 * sin(uTime * 2.0 + aTw);
}`;

const SPARK_FRAG = `
precision mediump float;
varying float vA;
uniform float uInt;
uniform float uSpark;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float glow = pow(smoothstep(0.5, 0.0, d), 2.0);
  vec3 col = mix(vec3(0.957, 0.302, 0.169), vec3(1.0, 0.93, 0.84), glow);
  float a = glow * vA * 0.8 * pow(uInt, 0.7) * uSpark;
  gl_FragColor = vec4(col * a, a);
}`;

/* النجوم: موضعها الأساسي ثابت في المخزن، والبارالاكس كله على الـGPU */
const STAR_VERT = `
attribute vec2 aBase;
attribute float aDepth;
attribute float aTw;
uniform float uScroll;
uniform vec2 uPointer;
uniform float uTime;
uniform float uDpr;
uniform float uH;
varying float vA;
void main() {
  float par = 0.03 + 0.22 * aDepth;
  float y = fract(aBase.y - (uScroll * par) / uH);
  float x = aBase.x + (uPointer.x - 0.5) * 0.018 * aDepth;
  y += (uPointer.y - 0.5) * 0.018 * aDepth;
  vec2 clip = vec2(x, y) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = (0.9 + 1.9 * aDepth) * uDpr;
  vA = (0.22 + 0.78 * aDepth) * (0.72 + 0.28 * sin(uTime * 0.9 + aTw));
}`;

const STAR_FRAG = `
precision mediump float;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float glow = pow(smoothstep(0.5, 0.0, d), 1.6);
  vec3 col = vec3(0.80, 0.85, 1.0);
  float a = glow * vA * 0.42;
  gl_FragColor = vec4(col * a, a);
}`;

/* مزاجات الحرير (2026-09-05): الحرير واحد، ومزاجه يتبدل بحسب موضوع الصفحة.
   الصفحة تعلنه بـ data-silk-mood على غلافها؛ الانتقال بين المزاجات ناعم. */
type Mood = { int: number; flow: number; width: number; hot: number; fil: number; sway: number; spark: number; slope: number; breathe: number };
const MOODS: Record<string, Mood> = {
  /* الاستقبال (الرئيسية) */
  home:    { int: 1,    flow: 1,    width: 1,    hot: 1,    fil: 1,    sway: 1,    spark: 1,   slope: 0,    breathe: 0 },
  /* الدقة: أسرع وأنحف وقلب أبيض ساخن */
  ai:      { int: 1,    flow: 1.6,  width: 0.72, hot: 1.5,  fil: 1.25, sway: 0.8,  spark: 1.2, slope: 0,    breathe: 0 },
  /* النمو: يصعد عبر الشاشة كمنحنى */
  growth:  { int: 1.05, flow: 1.1,  width: 1,    hot: 1.1,  fil: 1,    sway: 0.9,  spark: 1.1, slope: 0.22, breathe: 0 },
  /* الهدوء: عريض بطيء خافت، لا يزاحم القراءة */
  calm:    { int: 0.6,  flow: 0.55, width: 1.35, hot: 0.7,  fil: 0.8,  sway: 0.7,  spark: 0.5, slope: 0,    breathe: 0 },
  /* الحيوية: شرر أكثر وتمايل أسرع */
  social:  { int: 1.05, flow: 1.35, width: 1,    hot: 1.15, fil: 1,    sway: 1.4,  spark: 1.8, slope: 0,    breathe: 0 },
  /* الحِرفة: عرضه يتنفس */
  craft:   { int: 1,    flow: 0.9,  width: 1.2,  hot: 1,    fil: 0.9,  sway: 1,    spark: 0.9, slope: 0,    breathe: 0.25 },
  /* الانضباط: أكثر استقامة وحدّة */
  web:     { int: 1,    flow: 1,    width: 0.85, hot: 1.2,  fil: 1.1,  sway: 0.35, spark: 0.8, slope: 0,    breathe: 0 },
  /* القرار (التسعير): هادئ حتى يرسو خلف الختام */
  pricing: { int: 0.75, flow: 0.8,  width: 1,    hot: 1,    fil: 1,    sway: 0.8,  spark: 0.8, slope: 0,    breathe: 0 },
  /* الإنسان: أعرض وأنعم بخيوط أقل */
  human:   { int: 0.9,  flow: 0.7,  width: 1.4,  hot: 0.75, fil: 0.6,  sway: 0.9,  spark: 0.7, slope: 0,    breathe: 0 },
  /* الاستعداد (تواصل): ساطع وثابت */
  ready:   { int: 1,    flow: 0.8,  width: 1,    hot: 1.2,  fil: 1,    sway: 0.6,  spark: 0.9, slope: 0,    breathe: 0 },
  /* الصمت (المدونة والقانوني): يكاد يختفي وتبقى النجوم */
  silence: { int: 0.15, flow: 0.6,  width: 1,    hot: 0.7,  fil: 0.8,  sway: 0.6,  spark: 0.2, slope: 0,    breathe: 0 },
};

const SEGS = 140;
const RIBBONS = 2;
const MID_INT = 0.38;   /* خلف كروت البيع (كان 0.22: بدا خافتاً) */
const END_INT = 0.95;   /* عند القرار */

export default function SilkSpace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: true, antialias: false, depth: false, stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const SPARKS = isCoarse ? 160 : 320;
    const STARS = isCoarse ? 220 : 520;

    function program(vs: string, fs: string) {
      const compile = (type: number, src: string) => {
        const sh = gl!.createShader(type)!;
        gl!.shaderSource(sh, src);
        gl!.compileShader(sh);
        return sh;
      };
      const p = gl!.createProgram()!;
      gl!.attachShader(p, compile(gl!.VERTEX_SHADER, vs));
      gl!.attachShader(p, compile(gl!.FRAGMENT_SHADER, fs));
      gl!.linkProgram(p);
      return gl!.getProgramParameter(p, gl!.LINK_STATUS) ? p : null;
    }
    const ribbonMaybe = program(RIBBON_VERT, RIBBON_FRAG);
    const sparkMaybe = program(SPARK_VERT, SPARK_FRAG);
    const starMaybe = program(STAR_VERT, STAR_FRAG);
    if (!ribbonMaybe || !sparkMaybe || !starMaybe) return;
    const ribbonProg: WebGLProgram = ribbonMaybe;
    const sparkProg: WebGLProgram = sparkMaybe;
    const starProg: WebGLProgram = starMaybe;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const dispX = new Float32Array(RIBBONS * (SEGS + 1));
    const dispY = new Float32Array(RIBBONS * (SEGS + 1));
    const dvX = new Float32Array(RIBBONS * (SEGS + 1));
    const dvY = new Float32Array(RIBBONS * (SEGS + 1));
    const segGlow = new Float32Array(RIBBONS * (SEGS + 1));
    /* خط المنتصف النهائي (مسار + إزاحة + موجة) — تُحسب منه العموديات بعد
       تنعيمه، فلا تتقاطع حافتا الشريط أبداً (سبب الطيّات الحادة) */
    const cX = new Float32Array(RIBBONS * (SEGS + 1));
    const cY = new Float32Array(RIBBONS * (SEGS + 1));

    const VERTS = (SEGS + 1) * 2;
    const rPos = new Float32Array(RIBBONS * VERTS * 2);
    const rUV = new Float32Array(RIBBONS * VERTS * 2);
    const rGlow = new Float32Array(RIBBONS * VERTS);
    const idx = new Uint16Array(SEGS * 6);
    for (let s2 = 0; s2 < SEGS; s2++) {
      const a = s2 * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.set([a, b, c, b, d, c], s2 * 6);
    }

    const spU = new Float32Array(SPARKS);
    const spLane = new Float32Array(SPARKS);
    const spSpeed = new Float32Array(SPARKS);
    const spSize = new Float32Array(SPARKS);
    const spTw = new Float32Array(SPARKS);
    const spPos = new Float32Array(SPARKS * 2);
    for (let i = 0; i < SPARKS; i++) {
      spU[i] = Math.random();
      spLane[i] = (Math.random() * 2 - 1);
      spSpeed[i] = 0.02 + Math.random() * 0.035;
      spSize[i] = 1.5 + Math.random() * 3.5;
      spTw[i] = Math.random() * Math.PI * 2;
    }

    /* النجوم: ثلاث طبقات بُعد (0 بعيد … 1 قريب) والقريبة أقل عدداً */
    const stBase = new Float32Array(STARS * 2);
    const stDepth = new Float32Array(STARS);
    const stTw = new Float32Array(STARS);
    for (let i = 0; i < STARS; i++) {
      stBase[i * 2] = Math.random();
      stBase[i * 2 + 1] = Math.random();
      const r = Math.random();
      stDepth[i] = r < 0.55 ? Math.random() * 0.3 : r < 0.85 ? 0.3 + Math.random() * 0.35 : 0.65 + Math.random() * 0.35;
      stTw[i] = Math.random() * Math.PI * 2;
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    /* الحرير يغوص ويطفو مع التمرير ضمن الشاشة: 0.64H في الهيرو */
    let ribbonY = 0;
    function path(pu: number, tt: number, ribbon: number): [number, number, number, number] {
      const span = W + 260;
      const x = pu * span - 130;
      const lift = ribbon === 0 ? 0 : H * 0.045;
      const a1 = H * 0.050 * P.sway, a2 = H * 0.022 * P.sway;
      const y = ribbonY - lift
        + (pu - 0.5) * P.slope * H                         /* منحنى النمو */
        + Math.sin(pu * Math.PI * 1.7 + tt * 0.30 + ribbon * 1.7) * a1
        + Math.sin(pu * Math.PI * 3.9 - tt * 0.19 + ribbon * 0.8) * a2;
      const dy = P.slope * H / span
        + Math.cos(pu * Math.PI * 1.7 + tt * 0.30 + ribbon * 1.7) * Math.PI * 1.7 * a1 / span
        + Math.cos(pu * Math.PI * 3.9 - tt * 0.19 + ribbon * 0.8) * Math.PI * 3.9 * a2 / span;
      const len = Math.hypot(1, dy);
      return [x, y, -dy / len, 1 / len];
    }

    /* اليد على النافذة كلها — الطبقة خلف المحتوى فلا تستقبل أحداثاً بنفسها */
    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0, active: false, sx: 0.5, sy: 0.5 };
    function setPointer(cx: number, cy: number) {
      pointer.px = pointer.x; pointer.py = pointer.y;
      pointer.x = cx; pointer.y = cy;
      pointer.speed = Math.min(Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py), 70);
      pointer.active = true;
    }
    /* بقعة الانعكاس على الزجاج + هدف الاشتعال (زر القرار) */
    let igniteEl: HTMLElement | null = null;
    let spotEl: HTMLElement | null = null;
    const onMove = (e: MouseEvent) => {
      setPointer(e.clientX, e.clientY);
      const target = e.target as Element | null;
      const glass = target?.closest?.('.material-panel, .material-card') as HTMLElement | null;
      if (glass) {
        const r = glass.getBoundingClientRect();
        glass.style.setProperty('--mx', `${e.clientX - r.left}px`);
        glass.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      spotEl = glass;
      igniteEl = (target?.closest?.('[data-silk-ignite]') as HTMLElement | null) ?? null;
    };
    const onTouch = (e: TouchEvent) => { const tp = e.touches[0]; if (tp) setPointer(tp.clientX, tp.clientY); };
    const onLeave = () => { pointer.active = false; pointer.x = -9999; igniteEl = null; spotEl = null; };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchend', onLeave);

    /* شدّة القسم: data-silk يغلب، وإلا منحنى التمرير (هيرو → خافت → قرار) */
    let silkOverride: number | null = null;
    let silkEl: HTMLElement | null = null;   /* الحرير ينجذب لمركز هذا القسم */
    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) ratios.set(en.target, en.isIntersecting ? en.intersectionRatio : 0);
      let best = null as HTMLElement | null;
      let bestR = 0.3;
      ratios.forEach((r, el) => { if (r > bestR) { bestR = r; best = el as HTMLElement; } });
      const v = best ? parseFloat(best.dataset.silk ?? '') : NaN;
      silkOverride = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : null;
      silkEl = silkOverride !== null ? best : null;
    }, { threshold: [0, 0.3, 0.5, 0.7, 1] });
    const P: Mood = { ...MOODS.home };       /* المزاج الحالي (يُلاحق الهدف) */
    let moodTarget: Mood = MOODS.home;
    function scanSilk() {
      ratios.clear();
      io.disconnect();
      document.querySelectorAll<HTMLElement>('[data-silk]').forEach((el) => io.observe(el));
      const m = document.querySelector<HTMLElement>('[data-silk-mood]')?.dataset.silkMood ?? 'home';
      moodTarget = MOODS[m] ?? MOODS.home;
    }
    scanSilk();
    let scanTimer = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scanSilk, 300);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const R = isCoarse ? 150 : 260;
    /* تموّج الماء: اليد لا تدفع الحرير بل تُطلق موجة تسافر في الاتجاهين
       وتتلاشى؛ سرعة اليد تحدد ارتفاعها، والنقرة تُطلق موجة أعمق. */
    type Wave = { u: number; t0: number; amp: number };
    const waves: Wave[] = [];
    let wt = 0;                 /* ساعة الموجات (لا تتأثر بتيار التمرير) */
    let lastEmit = -1;
    function nearestU(px: number, py: number): [number, number] {
      let bestU = 0.5, bestD = 1e9;
      for (let s2 = 0; s2 <= SEGS; s2 += 2) {
        const pu = s2 / SEGS;
        const [cx, cy] = path(pu, t, 0);
        const k = s2;
        const dx = cx + dispX[k] - px, dy = cy + dispY[k] - py;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; bestU = pu; }
      }
      return [bestU, Math.sqrt(bestD)];
    }
    function emit(u: number, amp: number) {
      if (waves.length > 10) waves.shift();
      waves.push({ u, t0: wt, amp });
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const [u, d] = nearestU(e.clientX, e.clientY);
      const near = Math.max(0.25, 1 - d / (H * 0.5));
      emit(u, 30 * near);
      const k = Math.round(u * SEGS);
      for (let j = -4; j <= 4; j++) { const kk = k + j; if (kk >= 0 && kk <= SEGS) segGlow[kk] = Math.min(segGlow[kk] + 0.9 * near, 2.0); }
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    const BOOST = isCoarse ? 1.35 : 1.0; /* الجوال بدا خافتاً */
    let t = 0;
    let intensity = 1;
    let lastScroll = window.scrollY;
    let vel = 0;

    function smoothstep(a: number, b: number, x: number) {
      const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    }

    function step() {
      const sy = window.scrollY;
      /* سقف للقفزات (روابط المراسي) كي لا يُقذف النسيج خارج الشاشة */
      const raw = Math.max(-80, Math.min(80, sy - lastScroll));
      lastScroll = sy;
      vel += (raw - vel) * 0.18;                       /* تيار ممهّد */
      const flow = 1 + Math.min(Math.abs(vel), 60) * 0.02;
      t += 0.016 * flow * P.flow;

      /* موضع الحرير: يغوص ويطفو مع عمق الصفحة، وينجذب لمركز القسم الذي
         يحمل data-silk (لوح القرار) كي يمرّ خلف زجاجه لا فوقه */
      let yTarget = H * (0.5 + 0.14 * Math.cos(sy / (H * 1.35)));
      let inSilk = false;            /* اليد داخل قسم data-silk: الضوء يأتي إليها */
      let igniteX = -9999, igniteY = -9999;
      if (silkEl) {
        const rc = silkEl.getBoundingClientRect();
        let c = rc.top + rc.height * 0.5;
        inSilk = pointer.active && pointer.x >= rc.left && pointer.x <= rc.right
          && pointer.y >= rc.top && pointer.y <= rc.bottom;
        if (inSilk) c = c * 0.35 + pointer.y * 0.65;
        if (igniteEl) {
          const rb = igniteEl.getBoundingClientRect();
          igniteX = rb.left + rb.width * 0.5; igniteY = rb.top + rb.height * 0.5;
          c = igniteY;
        }
        yTarget = Math.max(H * 0.22, Math.min(H * 0.78, c));
      }
      if (ribbonY === 0) ribbonY = yTarget;
      ribbonY += (yTarget - ribbonY) * 0.06;

      /* الشدّة المستهدفة */
      const s = sy / H;
      const docH = document.documentElement.scrollHeight;
      const remain = (docH - H - sy) / H;
      const hero = 1 - smoothstep(0.55, 1.6, s);
      const endRise = 1 - smoothstep(0.2, 1.4, remain);
      const curve = Math.max(MID_INT + (1 - MID_INT) * hero, MID_INT + (END_INT - MID_INT) * endRise);
      const target = Math.min(1, (silkOverride ?? curve * P.int) * BOOST);
      intensity += (target - intensity) * 0.05;

      pointer.sx += ((pointer.active ? pointer.x / W : 0.5) - pointer.sx) * 0.05;
      pointer.sy += ((pointer.active ? pointer.y / H : 0.5) - pointer.sy) * 0.05;

      wt += 0.016;
      /* ملاحقة المزاج المستهدف بنعومة (انتقال بين الصفحات ≈ ثانيتان) */
      for (const key of Object.keys(P) as (keyof Mood)[]) P[key] += (moodTarget[key] - P[key]) * 0.03;
      const push = 1.4 + pointer.speed * 0.16;
      const drag = -vel * 0.03;                          /* التمرير يسحب النسيج */
      /* إطلاق موجة من حركة اليد قرب الحرير (خارج أقسام القرار) */
      if (pointer.active && !inSilk && pointer.speed > 2 && wt - lastEmit > 0.22) {
        const [u, d] = nearestU(pointer.x, pointer.y);
        if (d < R * 1.3) {
          const near = 1 - d / (R * 1.3);
          emit(u, Math.min(18, 3 + pointer.speed * 0.3) * near);
          lastEmit = wt;
        }
      }
      pointer.speed *= 0.82;
      /* تنظيف الموجات المنتهية */
      while (waves.length && wt - waves[0].t0 > 2.8) waves.shift();
      for (let r = 0; r < RIBBONS; r++) {
        const base = r * (SEGS + 1);
        const halfW = (r === 0 ? H * 0.052 : H * 0.026);
        for (let s2 = 0; s2 <= SEGS; s2++) {
          const pu = s2 / SEGS;
          const [cx, cy, nx, ny] = path(pu, t, r);
          const k = base + s2;
          if (pointer.active) {
            const dx = cx + dispX[k] - pointer.x;
            const dy2 = cy + dispY[k] - pointer.y;
            const d2 = dx * dx + dy2 * dy2;
            if (d2 < R * R && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const fall = 1 - d / R;
              const f = fall * fall * push;   /* هبوط ناعم بدل الخطي */
              if (inSilk) {
                /* داخل قسم القرار: الحرير ينجذب لليد (ويتوقف قبل أن يلتصق) */
                const pull = d > 36 ? f * 0.55 : 0;
                dvX[k] -= (dx / d) * pull;
                dvY[k] -= (dy2 / d) * pull;
                segGlow[k] = Math.min(segGlow[k] + f * 0.14, 1.6);
              } else {
                /* خارج أقسام القرار: لا دفع — دفء خفيف فقط، والموجة تتكفل بالحركة */
                segGlow[k] = Math.min(segGlow[k] + f * 0.03, 1.2);
              }
            }
          }
          /* موجات الماء: نبضة ريكر تسافر في الاتجاهين وتتسع وتخبو */
          let wave = 0;
          for (let w = 0; w < waves.length; w++) {
            const age = wt - waves[w].t0;
            const sig = 0.085 + 0.05 * age;
            const x = (Math.abs(pu - waves[w].u) - 0.42 * age) / sig;
            if (x > 3 || x < -3) continue;
            wave += waves[w].amp * Math.exp(-age * 1.15) * (1 - x * x) * Math.exp(-x * x * 0.5);
          }
          if (wave !== 0) {
            const wr = r === 0 ? 1 : 0.55;
            segGlow[k] = Math.min(segGlow[k] + Math.abs(wave) * 0.004, 1.6);
            wave *= wr;
          }
          if (igniteX > -9000) {
            /* اشتعال تحت زر القرار: نواة ساخنة تتجمع تحته */
            const dx = cx + dispX[k] - igniteX;
            const dy2 = cy + dispY[k] - igniteY;
            const RI = 220;
            const d2 = dx * dx + dy2 * dy2;
            if (d2 < RI * RI && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const f = (RI - d) / RI;
              const pull = d > 30 ? f * 0.9 : 0;
              dvX[k] -= (dx / d) * pull;
              dvY[k] -= (dy2 / d) * pull;
              segGlow[k] = Math.min(segGlow[k] + f * 0.22, 2.0);
            }
          }
          dvY[k] += drag * (0.35 + 0.65 * Math.sin(pu * Math.PI));
          dvX[k] += -dispX[k] * 0.016; dvY[k] += -dispY[k] * 0.016;
          dvX[k] *= 0.90; dvY[k] *= 0.90;
          dispX[k] += dvX[k]; dispY[k] += dvY[k];
          segGlow[k] *= 0.955;

          cX[k] = cx + dispX[k] + nx * wave; cY[k] = cy + dispY[k] + ny * wave;
          const vi = (r * VERTS + s2 * 2) * 2;
          rUV[vi] = pu; rUV[vi + 1] = 0;
          rUV[vi + 2] = pu; rUV[vi + 3] = 1;
          const gi = r * VERTS + s2 * 2;
          rGlow[gi] = segGlow[k]; rGlow[gi + 1] = segGlow[k];
        }
      }
      /* الهندسة من خط المنتصف النهائي: تنعيم مرتين ثم عموديات من الجيران */
      for (let r = 0; r < RIBBONS; r++) {
        const base = r * (SEGS + 1);
        const breathe = 1 + P.breathe * Math.sin(wt * 0.9);
        const halfW = (r === 0 ? H * 0.052 : H * 0.026) * P.width * breathe;
        for (let pass = 0; pass < 2; pass++) {
          let pX = cX[base], pY = cY[base];
          for (let s2 = 1; s2 < SEGS; s2++) {
            const k = base + s2;
            const mx = (pX + cX[k + 1]) * 0.5, my = (pY + cY[k + 1]) * 0.5;
            pX = cX[k]; pY = cY[k];
            cX[k] += (mx - cX[k]) * 0.5; cY[k] += (my - cY[k]) * 0.5;
          }
        }
        for (let s2 = 0; s2 <= SEGS; s2++) {
          const k = base + s2;
          const ka = base + Math.max(0, s2 - 1), kb = base + Math.min(SEGS, s2 + 1);
          let tx = cX[kb] - cX[ka], ty = cY[kb] - cY[ka];
          const tl = Math.hypot(tx, ty) || 1;
          tx /= tl; ty /= tl;
          const nx = -ty, ny = tx;
          const pu = s2 / SEGS;
          const wHere = halfW * (0.5 + Math.sin(pu * Math.PI) * 0.8);
          const vi = (r * VERTS + s2 * 2) * 2;
          rPos[vi] = cX[k] + nx * wHere;     rPos[vi + 1] = cY[k] + ny * wHere;
          rPos[vi + 2] = cX[k] - nx * wHere; rPos[vi + 3] = cY[k] - ny * wHere;
        }
      }
      /* تنعيم الجيران: الإزاحات تنساب على طول الشريط فلا تتكون شوكة */
      for (let r = 0; r < RIBBONS; r++) {
        const base = r * (SEGS + 1);
        let prevX = dispX[base], prevY = dispY[base];
        for (let s2 = 1; s2 < SEGS; s2++) {
          const k = base + s2;
          const nx2 = (prevX + dispX[k + 1]) * 0.5, ny2 = (prevY + dispY[k + 1]) * 0.5;
          prevX = dispX[k]; prevY = dispY[k];
          dispX[k] += (nx2 - dispX[k]) * 0.35;
          dispY[k] += (ny2 - dispY[k]) * 0.35;
        }
      }
      for (let i = 0; i < SPARKS; i++) {
        spU[i] += spSpeed[i] * 0.016 * flow;
        if (spU[i] > 1) spU[i] -= 1;
        const [cx, cy, nx, ny] = path(spU[i], t, 0);
        const k = Math.round(spU[i] * SEGS);
        const off = spLane[i] * H * 0.05;
        spPos[i * 2] = cx + nx * off + dispX[k];
        spPos[i * 2 + 1] = cy + ny * off + dispY[k] - H * 0.01;
      }
    }

    const bufs = {
      rPos: gl.createBuffer(), rUV: gl.createBuffer(), rGlow: gl.createBuffer(),
      idx: gl.createBuffer(),
      sPos: gl.createBuffer(), sSize: gl.createBuffer(), sTw: gl.createBuffer(),
      stBase: gl.createBuffer(), stDepth: gl.createBuffer(), stTw: gl.createBuffer(),
    };
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    function attrib(prog: WebGLProgram, name: string, buffer: WebGLBuffer | null, data: Float32Array, sz: number, dynamic = false) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, data, dynamic ? gl!.DYNAMIC_DRAW : gl!.STATIC_DRAW);
      const loc = gl!.getAttribLocation(prog, name);
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, sz, gl!.FLOAT, false, 0, 0);
    }
    const u = (p: WebGLProgram, n: string) => gl!.getUniformLocation(p, n);

    function draw() {
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);

      /* الأبعد أولاً: النجوم */
      gl!.useProgram(starProg);
      gl!.uniform1f(u(starProg, 'uScroll'), lastScroll);
      gl!.uniform2f(u(starProg, 'uPointer'), pointer.sx, pointer.sy);
      gl!.uniform1f(u(starProg, 'uTime'), t);
      gl!.uniform1f(u(starProg, 'uDpr'), dpr);
      gl!.uniform1f(u(starProg, 'uH'), H);
      attrib(starProg, 'aBase', bufs.stBase, stBase, 2);
      attrib(starProg, 'aDepth', bufs.stDepth, stDepth, 1);
      attrib(starProg, 'aTw', bufs.stTw, stTw, 1);
      gl!.drawArrays(gl!.POINTS, 0, STARS);

      gl!.useProgram(ribbonProg);
      gl!.uniform2f(u(ribbonProg, 'uRes'), W, H);
      gl!.uniform1f(u(ribbonProg, 'uTime'), t);
      gl!.uniform1f(u(ribbonProg, 'uInt'), intensity);
      gl!.uniform1f(u(ribbonProg, 'uHot'), P.hot);
      gl!.uniform1f(u(ribbonProg, 'uFil'), P.fil);
      for (let r = RIBBONS - 1; r >= 0; r--) {
        const start = r * VERTS;
        attrib(ribbonProg, 'aPos', bufs.rPos, rPos.subarray(start * 2, (start + VERTS) * 2), 2, true);
        attrib(ribbonProg, 'aUV', bufs.rUV, rUV.subarray(start * 2, (start + VERTS) * 2), 2, true);
        attrib(ribbonProg, 'aGlow', bufs.rGlow, rGlow.subarray(start, start + VERTS), 1, true);
        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, bufs.idx);
        gl!.drawElements(gl!.TRIANGLES, SEGS * 6, gl!.UNSIGNED_SHORT, 0);
      }

      gl!.useProgram(sparkProg);
      gl!.uniform2f(u(sparkProg, 'uRes'), W, H);
      gl!.uniform1f(u(sparkProg, 'uTime'), t);
      gl!.uniform1f(u(sparkProg, 'uDpr'), dpr);
      gl!.uniform1f(u(sparkProg, 'uInt'), intensity);
      gl!.uniform1f(u(sparkProg, 'uSpark'), P.spark);
      attrib(sparkProg, 'aPos', bufs.sPos, spPos, 2, true);
      attrib(sparkProg, 'aSize', bufs.sSize, spSize, 1);
      attrib(sparkProg, 'aTw', bufs.sTw, spTw, 1);
      gl!.drawArrays(gl!.POINTS, 0, SPARKS);
    }

    resize();
    if (reduced) intensity = 0.4;
    step(); draw();

    let rafId = 0;
    let running = !reduced;
    function loop() {
      if (!running) return;
      step(); draw();
      rafId = requestAnimationFrame(loop);
    }
    if (running) rafId = requestAnimationFrame(loop);

    const onVis = () => {
      const ok = !document.hidden && !reduced;
      if (ok && !running) { running = true; lastScroll = window.scrollY; rafId = requestAnimationFrame(loop); }
      else if (!ok) { running = false; cancelAnimationFrame(rafId); }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', resize);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(scanTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchend', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* حجاب الحواف: يعمّق الظلمة حول الضوء فيُحسّ الفضاء */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 42%, transparent 46%, rgba(10,10,10,0.72) 100%)' }}
      />
    </div>
  );
}
