'use client';

import { useEffect, useRef } from 'react';

/**
 * المشهد الموقّع v2 (2026-09-04): «نهر ضوئي» — بعد أن طلعت v1 غباراً منثوراً
 * (ملاحظة المالك المحقة). الدرس: الجمال في البنية لا في الجزيئات — تيار
 * متموج له نواة كثيفة وهالات بوكيه، يجري خلف العنوان باستمرار، يتنفس،
 * ويتشوش بمرور اليد ثم يلتئم. WebGL خام بلا مكتبات، وبنفس عقيدة الأداء:
 * DPR≤2، أول إطار فوري، إيقاف خارج الشاشة، سكون مع reduced-motion.
 */

const VERT = `
attribute vec2 aPos;
attribute float aSize;
attribute float aHue;
attribute float aEnergy;
uniform vec2 uRes;
varying float vEnergy;
varying float vHue;
void main() {
  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = aSize * (1.0 + aEnergy * 1.6);
  vEnergy = aEnergy;
  vHue = aHue;
}`;

const FRAG = `
precision mediump float;
varying float vEnergy;
varying float vHue;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  /* توهج ناعم أسي — بوكيه لا أقراص صلبة */
  float glow = pow(smoothstep(0.5, 0.0, d), 1.8);
  vec3 deep  = vec3(0.62, 0.14, 0.07);    /* جمر عميق */
  vec3 ember = vec3(0.957, 0.302, 0.169); /* برتقالة AGMA */
  vec3 hot   = vec3(1.0, 0.94, 0.86);
  vec3 col = mix(deep, ember, vHue);
  col = mix(col, hot, min(vEnergy * 1.3, 1.0));
  float alpha = glow * (0.10 + vHue * 0.22 + vEnergy * 0.5);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

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
    const COUNT = isCoarse ? 2600 : 5200;

    function compile(type: number, src: string) {
      const sh = gl!.createShader(type)!;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      return sh;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); /* إضافي صرف — الأنهار الضوئية تتراكم */

    /* حالة النهر: تقدّم على المجرى، انحراف عرضي، سرعة، حجم، ودرجة لونية */
    const u = new Float32Array(COUNT);
    const lane = new Float32Array(COUNT);
    const speed = new Float32Array(COUNT);
    const size = new Float32Array(COUNT);
    const hue = new Float32Array(COUNT);
    const offX = new Float32Array(COUNT);
    const offY = new Float32Array(COUNT);
    const velX = new Float32Array(COUNT);
    const velY = new Float32Array(COUNT);
    const energy = new Float32Array(COUNT);
    const pos = new Float32Array(COUNT * 2);

    for (let i = 0; i < COUNT; i++) {
      u[i] = Math.random();
      /* توزيع غاوسي حول النواة — كثيف بالمنتصف، أهداب رقيقة */
      lane[i] = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      speed[i] = 0.012 + Math.random() * 0.02;
      const bokeh = Math.random() < 0.06;
      size[i] = bokeh ? 9 + Math.random() * 13 : 1.6 + Math.random() * 2.6;
      hue[i] = bokeh ? 0.35 + Math.random() * 0.3 : 0.45 + Math.random() * 0.55;
    }

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(gl!.getUniformLocation(prog, 'uRes'), W, H);
    }

    /* مسار النهر: قوس يعبر أسفل العنوان بميل خفيف ويتموج بالزمن.
       يعيد النقطة + متجه العمودي لتوزيع عرض المجرى. */
    function riverPoint(pu: number, tt: number): [number, number, number, number] {
      const span = W + 300;
      const x = pu * span - 150;
      const y = H * 0.66
        + Math.sin(pu * Math.PI * 2.0 + tt * 0.35) * H * 0.055
        + Math.sin(pu * Math.PI * 4.7 - tt * 0.22) * H * 0.028
        + (pu - 0.5) * H * -0.10;
      const dy = Math.cos(pu * Math.PI * 2.0 + tt * 0.35) * Math.PI * 2.0 * H * 0.055 / span
        + Math.cos(pu * Math.PI * 4.7 - tt * 0.22) * Math.PI * 4.7 * H * 0.028 / span
        - 0.10 * H / span;
      const len = Math.hypot(1, dy);
      return [x, y, -dy / len, 1 / len];
    }

    const buf = { pos: gl.createBuffer(), size: gl.createBuffer(), hue: gl.createBuffer(), energy: gl.createBuffer() };
    function attrib(name: string, buffer: WebGLBuffer | null, data: Float32Array, sz: number, dynamic = false) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, data, dynamic ? gl!.DYNAMIC_DRAW : gl!.STATIC_DRAW);
      const loc = gl!.getAttribLocation(prog, name);
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, sz, gl!.FLOAT, false, 0, 0);
    }

    /* التفاعل */
    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0, active: false };
    function setPointer(cx: number, cy: number) {
      const rect = canvas!.getBoundingClientRect();
      pointer.px = pointer.x; pointer.py = pointer.y;
      pointer.x = cx - rect.left; pointer.y = cy - rect.top;
      pointer.speed = Math.min(Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py), 60);
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

    const R = isCoarse ? 100 : 140;
    const R2 = R * R;
    let t = 0;

    function step() {
      t += 0.016;
      const push = 1.1 + pointer.speed * 0.14;
      for (let i = 0; i < COUNT; i++) {
        u[i] += speed[i] * 0.05;
        if (u[i] > 1) u[i] -= 1;
        const [rx, ry, nx, ny] = riverPoint(u[i], t);
        /* عرض النهر يتنفس ويضيق عند الأطراف */
        const width = H * 0.075 * (0.55 + Math.sin(u[i] * Math.PI) * 0.65);
        const tx = rx + nx * lane[i] * width;
        const ty = ry + ny * lane[i] * width;
        if (pointer.active) {
          const dx = tx + offX[i] - pointer.x;
          const dy2 = ty + offY[i] - pointer.y;
          const d2 = dx * dx + dy2 * dy2;
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = ((R - d) / R) * push;
            velX[i] += (dx / d) * f;
            velY[i] += (dy2 / d) * f;
          }
        }
        velX[i] += -offX[i] * 0.02; velY[i] += -offY[i] * 0.02;
        velX[i] *= 0.88; velY[i] *= 0.88;
        offX[i] += velX[i]; offY[i] += velY[i];
        pos[i * 2] = tx + offX[i];
        pos[i * 2 + 1] = ty + offY[i];
        const sp = Math.hypot(velX[i], velY[i]);
        energy[i] = Math.max(energy[i] * 0.93, Math.min(sp * 0.2, 1));
      }
    }

    function draw() {
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      attrib('aPos', buf.pos, pos, 2, true);
      attrib('aSize', buf.size, size, 1);
      attrib('aHue', buf.hue, hue, 1);
      attrib('aEnergy', buf.energy, energy, 1, true);
      gl!.drawArrays(gl!.POINTS, 0, COUNT);
    }

    resize();
    step(); draw(); /* أول إطار فوري بشكل النهر — لا فراغ ولا غبار */

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
