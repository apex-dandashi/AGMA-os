'use client';

/**
 * ToolsCloud — كرة أدوات ثلاثية الأبعاد على Canvas (مستوحاة من Icon Cloud في Magic UI، مكتوبة من جديد لتناسب الموقع):
 * - الأيقونات من lib/tools (٥٢ أداة): الأحادية تُرسم بلون الثلج وتسخن إلى لون علامتها عند مرور المؤشر أو اختيار مجموعة،
 *   والشعارات الملوّنة تبقى كما هي. لا طلب خارجي: كل الملفات من /tools (سياسة CSP).
 * - تدور وحدها ببطء، تتبع المؤشر، وتُسحب بالإصبع أو الفأرة (Pointer Events). النقر على أداة يديرها إلى الأمام ويومض الحرير تحتها.
 * - تتوقف خارج الشاشة وعند تفضيل تقليل الحركة (يبقى السحب).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { TOOLS, TOOL_GROUPS, type Tool, type ToolGroup } from '../lib/tools';

type Props = { groups?: ToolGroup[]; activeGroup?: ToolGroup | null; className?: string; onPick?: (t: Tool | null) => void };
type Sprite = { base: HTMLCanvasElement; hot: HTMLCanvasElement; ready: boolean };
type Node = { x: number; y: number; z: number; heat: number; dim: number };

const SNOW = '#F5F5F7';
const SPRITE = 96; // بكسل الرسم المسبق لكل أيقونة (يُصغَّر عند الرسم فيبقى حاداً على شاشات 2x)

function makeSprite(t: Tool): Sprite {
  const mk = () => { const c = document.createElement('canvas'); c.width = SPRITE; c.height = SPRITE; return c; };
  const s: Sprite = { base: mk(), hot: mk(), ready: false };
  const draw = (img: HTMLImageElement, c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d'); if (!ctx) return;
    // احتواء الشعار في مربع مع هامش ١٢٪ مهما كانت نسبته (شعارات عريضة مثل زد وفاتورة)
    const pad = SPRITE * 0.12, box = SPRITE - pad * 2;
    const r = Math.min(box / (img.naturalWidth || 1), box / (img.naturalHeight || 1));
    const w = (img.naturalWidth || 1) * r, h = (img.naturalHeight || 1) * r;
    ctx.clearRect(0, 0, SPRITE, SPRITE);
    ctx.drawImage(img, (SPRITE - w) / 2, (SPRITE - h) / 2, w, h);
  };
  const load = (src: string, onto: HTMLCanvasElement[]) => {
    const img = new Image();
    img.onload = () => { onto.forEach((c) => draw(img, c)); s.ready = true; };
    img.src = src;
  };
  if (t.mono) {
    // ملف SVG بـcurrentColor: نجلبه ونلوّنه مرتين (ثلج / لون العلامة)
    fetch(t.src).then((r) => r.text()).then((svg) => {
      const tint = (hex: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/currentColor/g, hex));
      load(tint(SNOW), [s.base]);
      load(tint(t.hex || SNOW), [s.hot]);
    }).catch(() => {});
  } else {
    load(t.src, [s.base, s.hot]);
  }
  return s;
}

export default function ToolsCloud({ groups, activeGroup = null, className = '', onPick }: Props) {
  const tools = useMemo(() => (groups ? TOOLS.filter((t) => groups.includes(t.group)) : TOOLS), [groups]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(360);
  const [picked, setPicked] = useState<Tool | null>(null);
  const [hovered, setHovered] = useState<Tool | null>(null);
  const activeRef = useRef<ToolGroup | null>(activeGroup);
  activeRef.current = activeGroup;

  // حجم مربع يتبع عرض الحاوية
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize(Math.max(240, Math.min(560, Math.floor(e.contentRect.width)))));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr; canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sprites = tools.map(makeSprite);
    const R = size * 0.36, ICON = size * 0.092;
    // كرة فيبوناتشي
    const n = tools.length, inc = Math.PI * (3 - Math.sqrt(5));
    const nodes: Node[] = tools.map((_, i) => {
      const y = 1 - (i + 0.5) * (2 / n), r = Math.sqrt(1 - y * y), phi = i * inc;
      return { x: Math.cos(phi) * r * R, y: y * R, z: Math.sin(phi) * r * R, heat: 0, dim: 1 };
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rot = { x: -0.35, y: 0.6 };
    const vel = { x: 0, y: reduced ? 0 : 0.0035 };
    const mouse = { x: 0, y: 0, in: false };
    let target: { x: number; y: number; t0: number; dur: number; fx: number; fy: number } | null = null;
    let drag: { id: number; lx: number; ly: number; moved: boolean } | null = null;
    let visible = true, raf = 0, hoverIdx = -1, pickedIdx = -1, born = performance.now();
    const screen = new Array<{ x: number; y: number; s: number; z: number }>(n);

    const project = () => {
      const cx = Math.cos(rot.x), sx = Math.sin(rot.x), cy = Math.cos(rot.y), sy = Math.sin(rot.y);
      for (let i = 0; i < n; i++) {
        const p = nodes[i];
        const rx = p.x * cy - p.z * sy, rz0 = p.x * sy + p.z * cy;
        const ry = p.y * cx - rz0 * sx, rz = p.y * sx + rz0 * cx;
        const depth = (rz / R + 1) / 2; // 0 خلف .. 1 أمام
        screen[i] = { x: size / 2 + rx, y: size / 2 + ry, s: 0.5 + 0.6 * depth, z: rz };
      }
    };
    const hitTest = (px: number, py: number) => {
      let best = -1, bd = Infinity;
      for (let i = 0; i < n; i++) {
        const s = screen[i]; if (!s || s.z < 0) continue;
        const d = Math.hypot(px - s.x, py - s.y);
        if (d < ICON * s.s * 0.75 && d < bd) { bd = d; best = i; }
      }
      return best;
    };
    const rotateTo = (i: number) => {
      // زاوية تجعل العقدة i أمام الكاميرا
      const p = nodes[i];
      const ty = Math.atan2(p.x, p.z);
      const tx = Math.atan2(p.y, Math.hypot(p.x, p.z));
      // أقصر طريق دوراني
      const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
      target = { fx: rot.x, fy: rot.y, x: rot.x + wrap(tx - rot.x), y: rot.y + wrap(ty - rot.y), t0: performance.now(), dur: 900 };
    };

    const frame = () => {
      raf = 0;
      const now = performance.now();
      if (target) {
        const k = Math.min(1, (now - target.t0) / target.dur), e = 1 - Math.pow(1 - k, 3);
        rot.x = target.fx + (target.x - target.fx) * e; rot.y = target.fy + (target.y - target.fy) * e;
        if (k >= 1) target = null;
      } else if (!drag) {
        // المؤشر يوجّه الدوران بلطف؛ بلا مؤشر يدور وحده حول محوره
        if (mouse.in && !reduced) {
          const dx = (mouse.x - size / 2) / size, dy = (mouse.y - size / 2) / size;
          vel.y += (dx * 0.012 - vel.y) * 0.06; vel.x += (dy * 0.008 - vel.x) * 0.06;
        } else {
          vel.y += ((reduced ? 0 : 0.0035) - vel.y) * 0.03; vel.x += (0 - vel.x) * 0.05;
        }
        rot.x += vel.x; rot.y += vel.y;
        rot.x = Math.max(-1.2, Math.min(1.2, rot.x));
      }
      project();

      // سخونة وخفوت لكل عقدة
      const act = activeRef.current;
      for (let i = 0; i < n; i++) {
        const p = nodes[i], t = tools[i];
        const wantHeat = i === hoverIdx || i === pickedIdx || (act && t.group === act) ? 1 : 0;
        const wantDim = act && t.group !== act && i !== hoverIdx && i !== pickedIdx ? 0.28 : 1;
        p.heat += (wantHeat - p.heat) * 0.12; p.dim += (wantDim - p.dim) * 0.1;
      }

      ctx.clearRect(0, 0, size, size);
      const birth = Math.min(1, (now - born) / 900), be = 1 - Math.pow(1 - birth, 3);
      const order = [...Array(n).keys()].sort((a, b) => screen[a].z - screen[b].z);
      for (const i of order) {
        const sp = sprites[i]; if (!sp.ready) continue;
        const s = screen[i], p = nodes[i];
        const depth = (s.z / R + 1) / 2;
        const alpha = (0.22 + 0.78 * depth) * p.dim * be;
        const sz = ICON * s.s * (1 + 0.28 * p.heat) * (0.6 + 0.4 * be);
        ctx.globalAlpha = alpha;
        if (p.heat < 0.999) ctx.drawImage(sp.base, s.x - sz / 2, s.y - sz / 2, sz, sz);
        if (p.heat > 0.001) { ctx.globalAlpha = alpha * p.heat; ctx.drawImage(sp.hot, s.x - sz / 2, s.y - sz / 2, sz, sz); }
      }
      ctx.globalAlpha = 1;

      const pending = sprites.some((s) => !s.ready);
      if (visible && (!reduced || drag || target || pending || birth < 1 || hoverIdx >= 0)) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onDown = (e: PointerEvent) => { const p = pos(e); drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY, moved: false }; canvas.setPointerCapture(e.pointerId); mouse.x = p.x; mouse.y = p.y; kick(); };
    const onMove = (e: PointerEvent) => {
      const p = pos(e); mouse.x = p.x; mouse.y = p.y; mouse.in = true;
      if (drag) {
        const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        rot.y += dx * 0.006; rot.x += dy * 0.006; rot.x = Math.max(-1.2, Math.min(1.2, rot.x));
        vel.y = dx * 0.0015; vel.x = dy * 0.001; drag.lx = e.clientX; drag.ly = e.clientY; target = null;
      } else if (e.pointerType === 'mouse') {
        const h = hitTest(p.x, p.y);
        if (h !== hoverIdx) { hoverIdx = h; setHovered(h >= 0 ? tools[h] : null); canvas.style.cursor = h >= 0 ? 'pointer' : 'grab'; }
      }
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag) return;
      const wasTap = !drag.moved; drag = null;
      if (wasTap) {
        const p = pos(e), h = hitTest(p.x, p.y);
        if (h >= 0) {
          pickedIdx = h; setPicked(tools[h]); onPick?.(tools[h]); rotateTo(h);
          window.dispatchEvent(new CustomEvent('agma:silk-pulse', { detail: { x: e.clientX, y: e.clientY, amp: 22 } }));
        } else { pickedIdx = -1; setPicked(null); onPick?.(null); }
      }
      kick();
    };
    const onLeave = () => { mouse.in = false; if (hoverIdx >= 0) { hoverIdx = -1; setHovered(null); } canvas.style.cursor = 'grab'; kick(); };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0.05 });
    io.observe(canvas);
    // الأيقونات تجهز تدريجياً: نعيد التحريك كل قليل حتى تكتمل
    const poll = window.setInterval(() => { if (sprites.every((s) => s.ready)) window.clearInterval(poll); kick(); }, 120);
    kick();
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); window.clearInterval(poll);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [tools, size, onPick]);

  const shown = hovered ?? picked;
  return (
    <div ref={wrapRef} className={`relative mx-auto w-full max-w-[560px] ${className}`}>
      <canvas ref={canvasRef} style={{ width: size, height: size, touchAction: 'none', cursor: 'grab' }} className="mx-auto block select-none" role="img"
        aria-label={`كرة ${tools.length} أداة نستخدمها في خدماتنا`} />
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center" aria-live="polite">
        <span className={`material-card rounded-full px-4 py-1.5 text-sm transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}>
          {shown ? (<><span className="font-bold text-snow">{shown.name}</span><span className="text-gray-medium"> · {TOOL_GROUPS[shown.group]}</span></>) : ' '}
        </span>
      </div>
    </div>
  );
}
