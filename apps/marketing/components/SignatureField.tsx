'use client';

import { useEffect, useRef } from 'react';

/**
 * المشهد الموقّع v3 — «الحرير المضيء» (2026-09-04).
 * v1 غبار، v2 نقاط على خط: الدرس الجذري أن النقاط لا تصنع ضوءاً متصلاً —
 * الضوء قماش. هنا شريط مثلثات متصل بشيدر ضجيج متدفق: خيوط لهب تجري داخل
 * حرير برتقالي، نواة بيضاء ساخنة تذوب نحو الحواف، وشرر خفيف يطفو فوقه.
 * اليد تحني الحرير وتشعل موضع اللمس. WebGL خام — صفر مكتبات.
 * عقيدة الأداء: DPR≤2، أول إطار فوري، إيقاف خارج الشاشة/الإخفاء،
 * سكون كامل مع reduced-motion، وفشل WebGL يختفي بأدب.
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
  /* خيوط لهب تجري على طول الشريط */
  vec2 flow = vec2(vUV.x * 6.0 - uTime * 0.55, vUV.y * 2.2);
  float n = fbm(flow);
  float n2 = fbm(flow * 1.7 + vec2(uTime * 0.13, 4.2));
  float filaments = pow(n * 0.65 + n2 * 0.55, 2.4);

  /* نواة ساخنة تذوب نحو الحواف (vUV.y ∈ [0,1]، النصف = القلب) */
  float across = 1.0 - abs(vUV.y * 2.0 - 1.0);
  float core = pow(smoothstep(0.0, 1.0, across), 1.6);

  /* أطراف الشريط تتلاشى بنعومة */
  float ends = smoothstep(0.0, 0.06, vUV.x) * smoothstep(1.0, 0.94, vUV.x);

  float intensity = filaments * core * ends * (0.85 + vGlow * 1.6);

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
varying float vA;
void main() {
  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = aSize;
  vA = 0.55 + 0.45 * sin(uTime * 2.0 + aTw);
}`;

const SPARK_FRAG = `
precision mediump float;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float glow = pow(smoothstep(0.5, 0.0, d), 2.0);
  vec3 col = mix(vec3(0.957, 0.302, 0.169), vec3(1.0, 0.93, 0.84), glow);
  float a = glow * vA * 0.8;
  gl_FragColor = vec4(col * a, a);
}`;

const SEGS = 140;
const RIBBONS = 2; /* رئيسي + رفيق أرفع خلفه */

export default function SignatureField() {
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
    const SPARKS = isCoarse ? 220 : 420;

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
    if (!ribbonMaybe || !sparkMaybe) return;
    const ribbonProg: WebGLProgram = ribbonMaybe;
    const sparkProg: WebGLProgram = sparkMaybe;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* لكل شريط: إزاحات نابضية لكل مقطع (تفاعل اليد) وتوهج موضعي */
    const dispX = new Float32Array(RIBBONS * (SEGS + 1));
    const dispY = new Float32Array(RIBBONS * (SEGS + 1));
    const dvX = new Float32Array(RIBBONS * (SEGS + 1));
    const dvY = new Float32Array(RIBBONS * (SEGS + 1));
    const segGlow = new Float32Array(RIBBONS * (SEGS + 1));

    /* هندسة الشريط: strip بمثلثات — (SEGS+1)*2 رأس لكل شريط */
    const VERTS = (SEGS + 1) * 2;
    const rPos = new Float32Array(RIBBONS * VERTS * 2);
    const rUV = new Float32Array(RIBBONS * VERTS * 2);
    const rGlow = new Float32Array(RIBBONS * VERTS);
    const idx = new Uint16Array(SEGS * 6);
    for (let s2 = 0; s2 < SEGS; s2++) {
      const a = s2 * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.set([a, b, c, b, d, c], s2 * 6);
    }

    /* الشرر */
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

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    /* مسار الحرير: قوس ناعم أسفل العنوان يتموج بالزمن */
    function path(pu: number, tt: number, ribbon: number): [number, number, number, number] {
      const span = W + 260;
      const x = pu * span - 130;
      const lift = ribbon === 0 ? 0 : H * 0.045;
      const y = H * 0.64 - lift
        + Math.sin(pu * Math.PI * 1.7 + tt * 0.30 + ribbon * 1.7) * H * 0.050
        + Math.sin(pu * Math.PI * 3.9 - tt * 0.19 + ribbon * 0.8) * H * 0.022;
      const dy = Math.cos(pu * Math.PI * 1.7 + tt * 0.30 + ribbon * 1.7) * Math.PI * 1.7 * H * 0.050 / span
        + Math.cos(pu * Math.PI * 3.9 - tt * 0.19 + ribbon * 0.8) * Math.PI * 3.9 * H * 0.022 / span;
      const len = Math.hypot(1, dy);
      return [x, y, -dy / len, 1 / len];
    }

    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0, active: false };
    function setPointer(cx: number, cy: number) {
      const rect = canvas!.getBoundingClientRect();
      pointer.px = pointer.x; pointer.py = pointer.y;
      pointer.x = cx - rect.left; pointer.y = cy - rect.top;
      pointer.speed = Math.min(Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py), 70);
      pointer.active = true;
    }
    const onMove = (e: MouseEvent) => setPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const tp = e.touches[0]; if (tp) setPointer(tp.clientX, tp.clientY); };
    const onLeave = () => { pointer.active = false; pointer.x = -9999; };
    const host = canvas.parentElement ?? canvas;
    host.addEventListener('mousemove', onMove, { passive: true });
    host.addEventListener('touchmove', onTouch, { passive: true });
    host.addEventListener('touchstart', onTouch, { passive: true });
    host.addEventListener('mouseleave', onLeave);
    host.addEventListener('touchend', onLeave);

    const R = isCoarse ? 130 : 170;
    let t = 0;

    function step() {
      t += 0.016;
      const push = 1.4 + pointer.speed * 0.16;
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
        spU[i] += spSpeed[i] * 0.016;
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

    function draw() {
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);

      gl!.useProgram(ribbonProg);
      gl!.uniform2f(gl!.getUniformLocation(ribbonProg, 'uRes'), W, H);
      gl!.uniform1f(gl!.getUniformLocation(ribbonProg, 'uTime'), t);
      for (let r = RIBBONS - 1; r >= 0; r--) {
        const start = r * VERTS;
        attrib(ribbonProg, 'aPos', bufs.rPos, rPos.subarray(start * 2, (start + VERTS) * 2), 2, true);
        attrib(ribbonProg, 'aUV', bufs.rUV, rUV.subarray(start * 2, (start + VERTS) * 2), 2, true);
        attrib(ribbonProg, 'aGlow', bufs.rGlow, rGlow.subarray(start, start + VERTS), 1, true);
        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, bufs.idx);
        gl!.drawElements(gl!.TRIANGLES, SEGS * 6, gl!.UNSIGNED_SHORT, 0);
      }

      gl!.useProgram(sparkProg);
      gl!.uniform2f(gl!.getUniformLocation(sparkProg, 'uRes'), W, H);
      gl!.uniform1f(gl!.getUniformLocation(sparkProg, 'uTime'), t);
      attrib(sparkProg, 'aPos', bufs.sPos, spPos, 2, true);
      attrib(sparkProg, 'aSize', bufs.sSize, spSize, 1);
      attrib(sparkProg, 'aTw', bufs.sTw, spTw, 1);
      gl!.drawArrays(gl!.POINTS, 0, SPARKS);
    }

    resize();
    step(); draw();

    let rafId = 0;
    let running = !reduced;
    function loop() {
      if (!running) return;
      step(); draw();
      rafId = requestAnimationFrame(loop);
    }
    if (running) rafId = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([entry]) => {
      const ok = entry.isIntersecting && !document.hidden && !reduced;
      if (ok && !running) { running = true; rafId = requestAnimationFrame(loop); }
      else if (!ok) { running = false; cancelAnimationFrame(rafId); }
    });
    io.observe(canvas);
    const onVis = () => {
      const ok = !document.hidden && !reduced;
      if (ok && !running) { running = true; rafId = requestAnimationFrame(loop); }
      else if (!ok) { running = false; cancelAnimationFrame(rafId); }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', resize);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('touchmove', onTouch);
      host.removeEventListener('touchstart', onTouch);
      host.removeEventListener('mouseleave', onLeave);
      host.removeEventListener('touchend', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
