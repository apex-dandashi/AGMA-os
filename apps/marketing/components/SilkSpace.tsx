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
  float filaments = pow(n * 0.65 + n2 * 0.55, 2.4);

  float across = 1.0 - abs(vUV.y * 2.0 - 1.0);
  float core = pow(smoothstep(0.0, 1.0, across), 1.6);
  float ends = smoothstep(0.0, 0.06, vUV.x) * smoothstep(1.0, 0.94, vUV.x);

  float intensity = filaments * core * ends * (0.85 + vGlow * 1.6) * uInt;

  vec3 deep  = vec3(0.48, 0.10, 0.05);
  vec3 ember = vec3(0.957, 0.302, 0.169);
  vec3 hot   = vec3(1.0, 0.92, 0.80);
  vec3 col = mix(deep, ember, clamp(intensity * 2.2, 0.0, 1.0));
  col = mix(col, hot, clamp(pow(intensity, 2.0) * 2.6 * core, 0.0, 1.0));

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
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float glow = pow(smoothstep(0.5, 0.0, d), 2.0);
  vec3 col = mix(vec3(0.957, 0.302, 0.169), vec3(1.0, 0.93, 0.84), glow);
  float a = glow * vA * 0.8 * uInt;
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

const SEGS = 140;
const RIBBONS = 2;
const MID_INT = 0.22;   /* خلف كروت البيع */
const END_INT = 0.85;   /* عند القرار */

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
      const y = ribbonY - lift
        + Math.sin(pu * Math.PI * 1.7 + tt * 0.30 + ribbon * 1.7) * H * 0.050
        + Math.sin(pu * Math.PI * 3.9 - tt * 0.19 + ribbon * 0.8) * H * 0.022;
      const dy = Math.cos(pu * Math.PI * 1.7 + tt * 0.30 + ribbon * 1.7) * Math.PI * 1.7 * H * 0.050 / span
        + Math.cos(pu * Math.PI * 3.9 - tt * 0.19 + ribbon * 0.8) * Math.PI * 3.9 * H * 0.022 / span;
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
    const onMove = (e: MouseEvent) => setPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const tp = e.touches[0]; if (tp) setPointer(tp.clientX, tp.clientY); };
    const onLeave = () => { pointer.active = false; pointer.x = -9999; };
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
    function scanSilk() {
      ratios.clear();
      io.disconnect();
      document.querySelectorAll<HTMLElement>('[data-silk]').forEach((el) => io.observe(el));
    }
    scanSilk();
    let scanTimer = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scanSilk, 300);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const R = isCoarse ? 130 : 170;
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
      t += 0.016 * flow;

      /* موضع الحرير: يغوص ويطفو مع عمق الصفحة، وينجذب لمركز القسم الذي
         يحمل data-silk (لوح القرار) كي يمرّ خلف زجاجه لا فوقه */
      let yTarget = H * (0.5 + 0.14 * Math.cos(sy / (H * 1.35)));
      if (silkEl) {
        const rc = silkEl.getBoundingClientRect();
        const c = rc.top + rc.height * 0.5;
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
      const target = silkOverride ?? curve;
      intensity += (target - intensity) * 0.05;

      pointer.sx += ((pointer.active ? pointer.x / W : 0.5) - pointer.sx) * 0.05;
      pointer.sy += ((pointer.active ? pointer.y / H : 0.5) - pointer.sy) * 0.05;

      const push = 1.4 + pointer.speed * 0.16;
      const drag = -vel * 0.03;                          /* التمرير يسحب النسيج */
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
              const f = ((R - d) / R) * push;
              dvX[k] += (dx / d) * f;
              dvY[k] += (dy2 / d) * f;
              segGlow[k] = Math.min(segGlow[k] + f * 0.10, 1.4);
            }
          }
          dvY[k] += drag * (0.35 + 0.65 * Math.sin(pu * Math.PI));
          dvX[k] += -dispX[k] * 0.016; dvY[k] += -dispY[k] * 0.016;
          dvX[k] *= 0.90; dvY[k] *= 0.90;
          dispX[k] += dvX[k]; dispY[k] += dvY[k];
          segGlow[k] *= 0.955;

          const px2 = cx + dispX[k], py2 = cy + dispY[k];
          const vi = (r * VERTS + s2 * 2) * 2;
          const wHere = halfW * (0.5 + Math.sin(pu * Math.PI) * 0.8);
          rPos[vi] = px2 + nx * wHere;     rPos[vi + 1] = py2 + ny * wHere;
          rPos[vi + 2] = px2 - nx * wHere; rPos[vi + 3] = py2 - ny * wHere;
          rUV[vi] = pu; rUV[vi + 1] = 0;
          rUV[vi + 2] = pu; rUV[vi + 3] = 1;
          const gi = r * VERTS + s2 * 2;
          rGlow[gi] = segGlow[k]; rGlow[gi + 1] = segGlow[k];
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
