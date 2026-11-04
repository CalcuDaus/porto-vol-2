<script lang="ts">
  import { onMount } from 'svelte';
  import {
    playChalkTap,
    playChalkStroke,
    playChalkDoodleScratch,
    playEraserWipe,
    playDustExplosion
  } from '#lib/audio/chalkAudio';

  interface Props {
    isInside?: boolean;
    isZooming?: boolean;
  }

  let { isInside = false, isZooming = false }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let containerEl = $state<HTMLDivElement | null>(null);

  // Active Tool State
  let activeTool = $state<'none' | 'chalk' | 'eraser'>('none');
  let chalkColor = $state<string>('#ffffff');
  let hasDrawings = $state<boolean>(false);
  let showDustNotification = $state<string | null>(null);

  const CHALK_COLORS = [
    { label: 'Putih', hex: '#ffffff', bg: 'bg-white' },
    { label: 'Kuning', hex: '#fef08a', bg: 'bg-yellow-200' },
    { label: 'Cyan', hex: '#67e8f9', bg: 'bg-cyan-300' },
    { label: 'Hijau', hex: '#86efac', bg: 'bg-emerald-300' }
  ];

  interface TrailParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: string;
  }

  interface ExplosionParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: string;
  }

  let trailParticles: TrailParticle[] = [];
  let explosionParticles: ExplosionParticle[] = [];

  // Drawing state
  let isPointerDown = false;
  let lastX = 0;
  let lastY = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;

  // Offscreen persistent drawing canvas (stores user's strokes)
  let drawCanvas: HTMLCanvasElement | null = null;
  let drawCtx: CanvasRenderingContext2D | null = null;

  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  export function triggerDustExplosion(originX?: number, originY?: number) {
    playDustExplosion();

    const ox = originX ?? width / 2;
    const oy = originY ?? height / 2;

    const count = 90;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8.5;
      const colors = ['#ffffff', '#ebebeb', '#e2e8f0', '#cbd5e1'];
      explosionParticles.push({
        x: ox + (Math.random() - 0.5) * 60,
        y: oy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2, // slight upward billow
        size: 1.5 + Math.random() * 4.5,
        alpha: 0.75 + Math.random() * 0.25,
        decay: 0.012 + Math.random() * 0.016,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Fade out and clear drawing buffer
    if (drawCtx && drawCanvas) {
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      hasDrawings = false;
    }

    showDustNotification = 'Papan tulis dibersihkan!';
    setTimeout(() => {
      showDustNotification = null;
    }, 1800);
  }

  function handleChalkSelect(colorHex: string) {
    chalkColor = colorHex;
    activeTool = 'chalk';
    playChalkTap(0.7);
  }

  function handleEraserClick() {
    playEraserWipe();
    triggerDustExplosion(width * 0.92, height * 0.96);
  }

  function handleExitDoodle() {
    activeTool = 'none';
    playChalkTap(0.5);
  }

  // Chalk cursor dynamic SVG
  let chalkCursor = $derived(
    activeTool === 'chalk'
      ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 3 L21 5 L7 19 L3 21 L5 17 Z" fill="${encodeURIComponent(chalkColor)}" stroke="%23334155" stroke-width="1.2" stroke-linejoin="round"/><path d="M3 21 L7 19 L5 17 Z" fill="%23ffffff" stroke="%23334155" stroke-width="0.8"/></svg>') 3 21, crosshair`
      : activeTool === 'eraser'
        ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="26" height="22" viewBox="0 0 26 22" fill="none"><rect x="2" y="2" width="22" height="7" rx="1.5" fill="%23a16207" stroke="%23451a03" stroke-width="1"/><rect x="2" y="9" width="22" height="9" rx="1" fill="%231e293b" stroke="%230f172a" stroke-width="1"/></svg>') 13 10, cell`
        : 'default'
  );

  onMount(() => {
    if (!canvasEl || !containerEl) return;
    const canvas = canvasEl;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Create offscreen persistent canvas for user's drawing
    drawCanvas = document.createElement('canvas');
    drawCtx = drawCanvas.getContext('2d', { alpha: true });

    let animId: number;

    function resize() {
      if (!canvas || !drawCanvas || !drawCtx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const prevWidth = width;
      const prevHeight = height;
      width = rect.width;
      height = rect.height;

      // Save previous drawing before resize
      let tempCanvas: HTMLCanvasElement | null = null;
      if (prevWidth > 0 && prevHeight > 0 && drawCanvas.width > 0) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawCanvas.width;
        tempCanvas.height = drawCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx?.drawImage(drawCanvas, 0, 0);
      }

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      drawCanvas.width = Math.floor(width * dpr);
      drawCanvas.height = Math.floor(height * dpr);
      drawCtx.scale(dpr, dpr);

      // Restore drawing scaled to new dimensions
      if (tempCanvas && tempCanvas.width > 0) {
        drawCtx.drawImage(tempCanvas, 0, 0, drawCanvas.width / dpr, drawCanvas.height / dpr);
      }
    }

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    // Chalk stroke renderer with realistic porous texture
    function renderChalkLine(x1: number, y1: number, x2: number, y2: number) {
      if (!drawCtx) return;

      const dist = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const rgb = hexToRgb(chalkColor);

      // Audio feedback proportional to movement speed
      playChalkDoodleScratch(Math.min(dist / 12, 3));

      // 1. Base chalk body stroke
      drawCtx.save();
      drawCtx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.72)`;
      drawCtx.lineWidth = 3.2 + Math.random() * 1.5;
      drawCtx.lineCap = 'round';
      drawCtx.lineJoin = 'round';
      drawCtx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
      drawCtx.shadowBlur = 3;

      drawCtx.beginPath();
      drawCtx.moveTo(x1, y1);
      drawCtx.lineTo(x2, y2);
      drawCtx.stroke();
      drawCtx.restore();

      // 2. Grainy chalk speckle spray along the segment
      const steps = Math.max(1, Math.floor(dist / 3));
      drawCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;

        // Random jitter perpendicular to the stroke
        const jitterDist = (Math.random() - 0.5) * 3.8;
        const perpAngle = angle + Math.PI / 2;
        const sx = cx + Math.cos(perpAngle) * jitterDist;
        const sy = cy + Math.sin(perpAngle) * jitterDist;
        const speckleRadius = 0.6 + Math.random() * 1.1;

        drawCtx.beginPath();
        drawCtx.arc(sx, sy, speckleRadius, 0, Math.PI * 2);
        drawCtx.fill();

        // Also spawn 1 floating dust particle on the live canvas occasionally
        if (Math.random() < 0.25) {
          trailParticles.push({
            x: sx,
            y: sy,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.3 + Math.random() * 0.8, // subtle fall
            size: 1 + Math.random() * 2,
            alpha: 0.7,
            decay: 0.025,
            color: chalkColor
          });
        }
      }

      hasDrawings = true;
    }

    let wasOutside = false;

    // Pointer events on canvas
    function onPointerDown(e: PointerEvent) {
      if (activeTool !== 'chalk' && activeTool !== 'eraser') return;
      isPointerDown = true;
      wasOutside = false;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;

      if (activeTool === 'chalk') {
        renderChalkLine(lastX, lastY, lastX + 0.1, lastY + 0.1);
      }
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const currX = e.clientX - rect.left;
      const currY = e.clientY - rect.top;

      const isInside = currX >= 0 && currX <= width && currY >= 0 && currY <= height;

      // Always emit subtle chalk cursor trail particles if inside the chalkboard
      if (isInside) {
        if (Math.random() < 0.45 && trailParticles.length < 45) {
          const dx = currX - lastX;
          const dy = currY - lastY;
          trailParticles.push({
            x: currX + (Math.random() - 0.5) * 4,
            y: currY + (Math.random() - 0.5) * 4,
            vx: -dx * 0.05 + (Math.random() - 0.5) * 0.4,
            vy: -dy * 0.05 + 0.2 + (Math.random() - 0.5) * 0.3,
            size: 1.2 + Math.random() * 2.2,
            alpha: 0.65,
            decay: 0.035,
            color: activeTool === 'chalk' ? chalkColor : '#ebebeb'
          });
        }
      }

      // Drawing action
      if (isPointerDown) {
        if (isInside) {
          const startX = wasOutside ? currX : lastX;
          const startY = wasOutside ? currY : lastY;
          wasOutside = false;

          if (activeTool === 'chalk') {
            renderChalkLine(startX, startY, currX, currY);
          } else if (activeTool === 'eraser' && drawCtx) {
            // Selective eraser tool
            drawCtx.save();
            drawCtx.globalCompositeOperation = 'destination-out';
            drawCtx.beginPath();
            drawCtx.arc(currX, currY, 20, 0, Math.PI * 2);
            drawCtx.fill();
            drawCtx.restore();

            // Spawn eraser friction dust
            if (Math.random() < 0.35) {
              trailParticles.push({
                x: currX + (Math.random() - 0.5) * 20,
                y: currY + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 0.5 + Math.random() * 1.5,
                size: 2 + Math.random() * 3,
                alpha: 0.5,
                decay: 0.03,
                color: '#ebebeb'
              });
            }
            playChalkDoodleScratch(1.2);
          }
        } else {
          wasOutside = true;
        }
      }

      lastX = currX;
      lastY = currY;
    }

    function onPointerUp() {
      isPointerDown = false;
      wasOutside = false;
    }

    const targetEl = canvas;
    targetEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Main animation loop: composites persistent drawing + live dust particles
    function loop() {
      if (!ctx || !canvas) return;

      // Clear the overlay frame
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw persistent chalk artwork
      if (drawCanvas && hasDrawings) {
        ctx.drawImage(drawCanvas, 0, 0, width, height);
      }

      // 2. Draw live cursor trail particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          trailParticles.splice(i, 1);
          continue;
        }

        const rgb = hexToRgb(p.color);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw explosion dust particles
      for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const ep = explosionParticles[i];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.vx *= 0.95; // air drag
        ep.vy = ep.vy * 0.95 + 0.15; // gentle gravity
        ep.alpha -= ep.decay;

        if (ep.alpha <= 0) {
          explosionParticles.splice(i, 1);
          continue;
        }

        const rgb = hexToRgb(ep.color);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ep.alpha})`;
        ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ep.alpha * 0.5})`;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    }

    const handleClearEvent = () => {
      triggerDustExplosion(width * 0.92, height * 0.96);
    };

    const handleActivateEvent = () => {
      handleChalkSelect('#ffffff');
    };

    window.addEventListener('chalk:clear', handleClearEvent);
    window.addEventListener('chalk:activate', handleActivateEvent);

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('chalk:clear', handleClearEvent);
      window.removeEventListener('chalk:activate', handleActivateEvent);
      targetEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  });
</script>

<!-- Container overlay directly over the chalkboard surface -->
<div
  bind:this={containerEl}
  class="absolute inset-0 w-full h-full z-15 pointer-events-none select-none overflow-hidden"
>
  <!-- Green Chalkboard Drawing Surface (Strictly bounded to green board, excluding wooden frame) -->
  <div
    class="absolute left-[2.7%] right-[2.7%] top-[4.4%] bottom-[4.8%] overflow-hidden pointer-events-none rounded-[1px]"
    style="cursor: {chalkCursor};"
  >
    <canvas
      bind:this={canvasEl}
      class="w-full h-full pointer-events-auto block"
      style="pointer-events: {activeTool !== 'none' ? 'auto' : 'none'}; cursor: {chalkCursor};"
      aria-label="Chalkboard interactive canvas"
    ></canvas>
  </div>

  <!-- Dust Explosion Notification Toast -->
  {#if showDustNotification}
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 px-5 py-2.5 rounded-full bg-slate-900/90 border border-white/40 text-white font-bold text-sm tracking-wider shadow-2xl backdrop-blur animate-bounce"
      style="font-family: var(--chalk-nav-font); text-shadow: 0 0 3px rgba(255,255,255,0.8);"
    >
      {showDustNotification}
    </div>
  {/if}

  <!-- Active Chalk Toolbar Pill (Appears at top-center when in Doodle Mode) -->
  {#if activeTool !== 'none'}
    <div
      class="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a1118]/90 border border-white/30 shadow-2xl backdrop-blur-md text-xs select-none"
    >
      <div class="flex items-center gap-1.5 text-white/90 font-medium font-mono text-[11px] pr-2 border-r border-white/20">
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: {chalkColor}; box-shadow: 0 0 6px {chalkColor};"></span>
        <span>{activeTool === 'chalk' ? 'Mode Kapur' : 'Penghapus'}</span>
      </div>

      <!-- Color Pickers -->
      <div class="flex items-center gap-1.5 px-1">
        {#each CHALK_COLORS as c}
          <button
            type="button"
            onclick={() => handleChalkSelect(c.hex)}
            class="w-4 h-4 rounded-full border transition-transform cursor-pointer {c.bg} {chalkColor === c.hex && activeTool === 'chalk' ? 'scale-125 border-emerald-400 ring-2 ring-emerald-400/50' : 'border-white/40 opacity-70 hover:opacity-100'}"
            title="Warna Kapur: {c.label}"
            aria-label="Pilih warna kapur {c.label}"
          ></button>
        {/each}
      </div>

      <!-- Wipe All with Dust Explosion -->
      {#if hasDrawings}
        <button
          type="button"
          onclick={handleEraserClick}
          class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/90 text-[11px] font-medium transition cursor-pointer border border-white/20"
          title="Bersihkan semua coretan papan tulis"
        >
          <span>Bersihkan</span>
        </button>
      {/if}

      <!-- Exit Button -->
      <button
        type="button"
        onclick={handleExitDoodle}
        class="ml-1 p-1 rounded-md text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer"
        title="Tutup Mode Corat-Coret"
        aria-label="Tutup Mode Corat-Coret"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  {/if}

  <!-- ===================================================================== -->
  <!-- WOODEN TRAY ACCESSORIES: REALISTIC CHALK PIECES & ERASER ON LEDGE    -->
  <!-- ===================================================================== -->
  {#if !isInside && !isZooming}
    <!-- Interactive Chalk Piece on Tray (Positioned precisely over ledge chalk at Left 82.6%) -->
    <button
      type="button"
      onclick={() => handleChalkSelect('#ffffff')}
      class="absolute left-[82.6%] bottom-[1.8%] w-[6.8%] h-[2.2%] group cursor-pointer outline-none transition-all duration-200 hover:-translate-y-1 focus:outline-none flex items-center justify-center pointer-events-auto z-25 select-none"
      title="Klik kapur ini untuk menulis / corat-coret bebas di papan!"
      aria-label="Ambil Kapur"
    >
      <!-- Interactive 3D Chalk body matching painted position -->
      <div
        class="w-full h-full rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-200 border border-white/50 {activeTool === 'chalk' ? 'ring-2 ring-cyan-300 -translate-y-1 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'group-hover:border-white group-hover:shadow-[0_0_6px_rgba(255,255,255,0.6)]'}"
        style="
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 45%, #cbd5e1 100%);
        "
      >
        <!-- Chalk tip bevel -->
        <div class="absolute -left-0.5 top-0 bottom-0 w-1 rounded-l-full bg-white/95"></div>
      </div>

      <!-- Subtle Tooltip Hint on hover -->
      <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none px-2 py-0.5 rounded bg-black/90 text-[10px] text-white font-mono border border-white/20 shadow-xl z-30">
        Tulis Kapur
      </div>
    </button>

    <!-- Interactive Wooden Blackboard Eraser on Tray (Positioned precisely over ledge eraser at Left 90.0%) -->
    <button
      type="button"
      onclick={handleEraserClick}
      class="absolute left-[90.0%] bottom-[1.8%] w-[5.6%] h-[2.2%] group cursor-pointer outline-none transition-all duration-200 hover:-translate-y-1 focus:outline-none flex items-center justify-center pointer-events-auto z-25 select-none"
      title="Klik penghapus untuk membersihkan papan (Chalk Dust Explosion)!"
      aria-label="Penghapus Papan Tulis"
    >
      <!-- Eraser Body (Wooden block top + Black felt wool bottom) -->
      <div class="w-full h-full rounded-[2px] shadow-[0_3px_5px_rgba(0,0,0,0.6)] overflow-hidden border border-[#5c4028] flex flex-col group-hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]">
        <!-- Wooden handle top layer -->
        <div
          class="h-1/2 w-full border-b border-[#3b2716]"
          style="background: linear-gradient(180deg, #a26e47 0%, #784c2a 100%);"
        ></div>
        <!-- Black felt wool bottom layer -->
        <div
          class="h-1/2 w-full bg-[#1e2329]"
          style="background: repeating-linear-gradient(90deg, #1e2329, #1e2329 2px, #2a313a 2px, #2a313a 4px);"
        ></div>
      </div>

      <!-- Eraser Tooltip -->
      <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none px-2 py-0.5 rounded bg-black/90 text-[10px] text-white font-mono border border-white/20 shadow-xl z-30">
        Bersihkan Papan
      </div>
    </button>
  {/if}
</div>
