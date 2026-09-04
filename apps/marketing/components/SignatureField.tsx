'use client';

import { useEffect, useRef } from 'react';

/**
 * المشهد الموقّع (جرعة Lusion — 2026-09-04): حقل جزيئات WebGL خام بلا أي
 * مكتبة — آلاف النقاط المتوهجة بعمق وهمي، فيزياء نابضية تتنافر من المؤشر
 * واللمس وتعود لمواقعها، طاقة الحركة تشعل التوهج برتقالياً→أبيض، وانجراف
 * حي في الخمول. عقيدة الأداء: DPR≤2، عدد متكيف للجوال، رسم أول إطار
 * فوراً (لا قماش فارغاً أبداً)، إيقاف عند الإخفاء، وثبات تام مع
 * prefers-reduced-motion. فشل WebGL = لا شيء (التدرج الخلفي يغطي).
 */

const VERT = `
attribute vec2 aHome;
attribute float aDepth;
attribute vec2 aPos;
attribute float aEnergy;
uniform vec2 uRes;
uniform vec2 uParallax;
varying float vEnergy;
varying float vDepth;
void main() {
  vec2 p = aPos + uParallax * (aDepth - 0.5) * 26.0;
  vec2 clip = (p / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = (1.9 + aDepth * 3.4) * (1.0 + aEnergy * 2.2);
  vEnergy = aEnergy;
  vDepth = aDepth;
}`;

const FRAG = `
precision mediump float;
varying float vEnergy;
varying float vDepth;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float glow = smoothstep(0.5, 0.0, d);
  vec3 ember = vec3(0.957, 0.302, 0.169);      /* برتقالة AGMA */
  vec3 hot = vec3(1.0, 0.93, 0.85);
  vec3 col = mix(ember, hot, min(vEnergy * 1.4, 1.0));
  float alpha = glow * (0.30 + vDepth * 0.38 + vEnergy * 0.55);
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
    const COUNT = isCoarse ? 3200 : 7800;

    /* ------------------------------------------------ shaders + program */
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
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); /* توهج جمعي ناعم */

    /* ------------------------------------------------ state buffers */
    const home = new Float32Array(COUNT * 2);
    const pos = new Float32Array(COUNT * 2);
    const vel = new Float32Array(COUNT * 2);
    const depth = new Float32Array(COUNT);
    const energy = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);

    let W = 0, H = 0;
    function seed() {
      /* عنقود عضوي: كثافة نحو المركز الأفقي مع تناثر حر — لا شبكة صماء */
      for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.62);
        const ellipseX = W * 0.5 + Math.cos(a) * r * W * 0.55;
        const ellipseY = H * 0.48 + Math.sin(a) * r * H * 0.52;
        home[i * 2] = ellipseX;
        home[i * 2 + 1] = ellipseY;
        pos[i * 2] = ellipseX;
        pos[i * 2 + 1] = ellipseY;
        depth[i] = Math.random();
        phase[i] = Math.random() * Math.PI * 2;
      }
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(gl!.getUniformLocation(prog, 'uRes'), W, H);
      seed();
    }

    const buf = {
      home: gl.createBuffer(), pos: gl.createBuffer(),
      depth: gl.createBuffer(), energy: gl.createBuffer(),
    };
    function attrib(name: string, buffer: WebGLBuffer | null, data: Float32Array, size: number, dynamic = false) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, data, dynamic ? gl!.DYNAMIC_DRAW : gl!.STATIC_DRAW);
      const loc = gl!.getAttribLocation(prog, name);
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, 0, 0);
    }

    /* ------------------------------------------------ interaction */
    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0, active: false };
    function setPointer(cx: number, cy: number) {
      const rect = canvas!.getBoundingClientRect();
      pointer.px = pointer.x; pointer.py = pointer.y;
      pointer.x = cx - rect.left; pointer.y = cy - rect.top;
      const dx = pointer.x - pointer.px, dy = pointer.y - pointer.py;
      pointer.speed = Math.min(Math.hypot(dx, dy), 60);
      pointer.active = true;
    }
    const onMove = (e: MouseEvent) => setPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
    };
    const onLeave = () => { pointer.active = false; pointer.x = -9999; pointer.y = -9999; };
    /* الاستماع على الأب (الهيرو) — القماش خلف المحتوى بلا pointer-events */
    const host = canvas.parentElement ?? canvas;
    host.addEventListener('mousemove', onMove, { passive: true });
    host.addEventListener('touchmove', onTouch, { passive: true });
    host.addEventListener('touchstart', onTouch, { passive: true });
    host.addEventListener('mouseleave', onLeave);
    host.addEventListener('touchend', onLeave);

    /* ------------------------------------------------ simulation */
    const R = isCoarse ? 110 : 150;        /* نصف قطر التأثير */
    const R2 = R * R;
    let t = 0;
    function step() {
      t += 0.016;
      const fx = pointer.x, fy = pointer.y;
      const push = 0.9 + pointer.speed * 0.12; /* سرعة يدك = قوة الدفع */
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 2, iy = ix + 1;
        let vx = vel[ix], vy = vel[iy];
        /* نابض العودة للموطن */
        vx += (home[ix] - pos[ix]) * 0.012;
        vy += (home[iy] - pos[iy]) * 0.012;
        /* انجراف حي (خمول يتنفس) */
        const ph = phase[i];
        vx += Math.sin(t * 0.6 + ph) * 0.012 * (0.3 + depth[i]);
        vy += Math.cos(t * 0.5 + ph * 1.3) * 0.012 * (0.3 + depth[i]);
        /* تنافر المؤشر */
        if (pointer.active) {
          const dx = pos[ix] - fx, dy = pos[iy] - fy;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = ((R - d) / R) * push * (0.4 + depth[i]);
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
        }
        vx *= 0.9; vy *= 0.9; /* تخميد */
        pos[ix] += vx; pos[iy] += vy;
        vel[ix] = vx; vel[iy] = vy;
        /* الطاقة = سرعة → توهج، تبرد تدريجياً */
        const sp = Math.hypot(vx, vy);
        energy[i] = Math.max(energy[i] * 0.94, Math.min(sp * 0.22, 1));
      }
    }

    /* ------------------------------------------------ render loop */
    const uParallax = gl.getUniformLocation(prog, 'uParallax');
    function draw() {
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      /* بارالاكس ناعم من موضع المؤشر النسبي */
      const paraX = pointer.active ? (pointer.x / Math.max(W, 1) - 0.5) : 0;
      const paraY = pointer.active ? (pointer.y / Math.max(H, 1) - 0.5) : 0;
      gl!.uniform2f(uParallax, paraX, paraY);
      attrib('aHome', buf.home, home, 2);
      attrib('aDepth', buf.depth, depth, 1);
      attrib('aPos', buf.pos, pos, 2, true);
      attrib('aEnergy', buf.energy, energy, 1, true);
      gl!.drawArrays(gl!.POINTS, 0, COUNT);
    }

    resize();
    draw(); /* أول إطار فوراً — لا قماش فارغاً حتى لو توقف كل شيء بعده */

    let rafId = 0;
    let running = !reduced;
    function loop() {
      if (!running) return;
      step();
      draw();
      rafId = requestAnimationFrame(loop);
    }
    if (running) rafId = requestAnimationFrame(loop);

    /* أدب الأداء: توقف خارج الشاشة وعند إخفاء التبويب */
    const io = new IntersectionObserver(([entry]) => {
      const shouldRun = entry.isIntersecting && !document.hidden && !reduced;
      if (shouldRun && !running) { running = true; rafId = requestAnimationFrame(loop); }
      else if (!shouldRun) { running = false; cancelAnimationFrame(rafId); }
    });
    io.observe(canvas);
    const onVis = () => {
      const shouldRun = !document.hidden && !reduced;
      if (shouldRun && !running) { running = true; rafId = requestAnimationFrame(loop); }
      else if (!shouldRun) { running = false; cancelAnimationFrame(rafId); }
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
