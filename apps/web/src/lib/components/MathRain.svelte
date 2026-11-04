<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    enabled?: boolean;
    density?: number;
    size?: number;
    opacity?: number;
    speed?: number;
    color?: string;
    bounce?: boolean;
    fontFamily?: string;
  }

  let {
    enabled = true,
    density = 50,
    size = 20,
    opacity = 0.45,
    speed = 1,
    color = '#ffffff',
    bounce = true,
    fontFamily = "'Cabin Sketch', 'Kalam', cursive, sans-serif"
  }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);

  const MATH_SYMBOLS = [
    'E = mc²', 'e^{iπ} + 1 = 0', '∫ f(x)dx', '∑ 1/n²', 'a² + b² = c²',
    'lim x→∞', '∂y/∂x', '√(-1) = i', 'sin²θ + cos²θ = 1', '∇ × B',
    'λ = h/p', 'F = ma', 'π ≈ 3.14159', "f'(x)", '∞', '√x', '∑', '∫',
    'Δx → 0', 'θ', 'α + β', 'dx/dt', 'log₂(n)', '∀x ∃y', 'x ∊ ℝ',
    'P(A|B)', 'det(A)', 'σ = √(∑(x-μ)²/N)', 'λ', 'Ω', 'μ', 'φ ≈ 1.618',
    '∮ E·dl', 'ħ', 'ψ(x,t)', 'd/dx', '±√Δ', 'lim h→0', 'tan(θ)',
    'x²', 'y³', 'z⁴', '1/2', '≠', '≤', '≥', '≈', '∝'
  ];

  interface FallingParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    gravity: number;
    symbol: string;
    sizeRatio: number;
    opacityRatio: number;
    rotation: number;
    vRot: number;
    floorY: number;
    bounces: number;
    maxBounces: number;
    swayOffset: number;
    swaySpeed: number;
  }

  interface RestingParticle {
    x: number;
    y: number;
    rotation: number;
    symbol: string;
    sizeRatio: number;
    opacityRatio: number;
    currentFade: number;
    timer: number;
    fadeDuration: number;
  }

  interface CachedSprite {
    canvas: HTMLCanvasElement;
    cssWidth: number;
    cssHeight: number;
    anchorX: number;
    anchorY: number;
  }

  const BASE_FONT_SIZE = 36;
  const spriteCache = new Map<string, CachedSprite>();

  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return { r: 255, g: 255, b: 255 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function getChalkSprite(symbol: string, colorHex: string, font: string): CachedSprite {
    const key = `${symbol}__${colorHex}__${font}`;
    const cached = spriteCache.get(key);
    if (cached) return cached;

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { alpha: true });
    if (!offCtx) {
      return { canvas: offscreen, cssWidth: 1, cssHeight: 1, anchorX: 0, anchorY: 0 };
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fontSpec = `bold ${BASE_FONT_SIZE}px ${font}`;
    offCtx.font = fontSpec;

    const metrics = offCtx.measureText(symbol);
    const textWidth = Math.ceil(metrics.width) || BASE_FONT_SIZE;
    const ascent = Math.ceil(metrics.actualBoundingBoxAscent || BASE_FONT_SIZE * 0.8);
    const descent = Math.ceil(metrics.actualBoundingBoxDescent || BASE_FONT_SIZE * 0.25);
    const textHeight = ascent + descent;

    // Room for chalk dust glow
    const pad = 12;
    const cssWidth = textWidth + pad * 2;
    const cssHeight = textHeight + pad * 2;

    offscreen.width = Math.ceil(cssWidth * dpr);
    offscreen.height = Math.ceil(cssHeight * dpr);

    offCtx.scale(dpr, dpr);
    offCtx.font = fontSpec;
    offCtx.textAlign = 'left';
    offCtx.textBaseline = 'alphabetic';

    const textX = pad;
    const textY = pad + ascent;
    const rgb = hexToRgb(colorHex);

    // Pass 1: Soft chalk dust aura
    offCtx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.75)`;
    offCtx.shadowBlur = 4;
    offCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`;
    offCtx.fillText(symbol, textX, textY);

    // Pass 2: Sharp chalk core
    offCtx.shadowBlur = 0;
    offCtx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    offCtx.fillText(symbol, textX, textY);

    const sprite: CachedSprite = {
      canvas: offscreen,
      cssWidth,
      cssHeight,
      anchorX: pad + textWidth / 2,
      anchorY: pad + textHeight / 2
    };

    spriteCache.set(key, sprite);
    return sprite;
  }

  onMount(() => {
    if (!canvasEl) return;
    const canvas = canvasEl;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastTime = 0;
    let fallingParticles: FallingParticle[] = [];
    let restingParticles: RestingParticle[] = [];
    let lastCacheKey = `${color}__${fontFamily}`;

    const MAX_RESTING = 40;

    if (document.fonts) {
      document.fonts.ready.then(() => {
        spriteCache.clear();
      }).catch(() => {});
    }

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx?.scale(dpr, dpr);
    }

    function resetFallingParticle(p: FallingParticle, initialSpawn = false) {
      const baseVy = (speed * 0.85 + Math.random() * speed * 0.85) + 0.5;
      const floorY = height - 12 - Math.random() * 22;

      p.x = Math.random() * width;
      // Stagger initial spawn evenly across the entire screen height so there is NO initial clump
      p.y = initialSpawn ? Math.random() * (height + 100) - 80 : -25 - Math.random() * 90;
      p.vx = (Math.random() - 0.5) * 0.4;
      p.vy = baseVy;
      p.gravity = 0.035 * Math.max(0.5, speed);
      p.symbol = MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)];
      p.sizeRatio = 0.8 + Math.random() * 0.45;
      p.opacityRatio = 0.7 + Math.random() * 0.4;
      p.rotation = (Math.random() - 0.5) * 0.4;
      p.vRot = (Math.random() - 0.5) * 0.015;
      p.floorY = floorY;
      p.bounces = 0;
      p.maxBounces = Math.random() < 0.6 ? 2 : 1;
      p.swayOffset = Math.random() * Math.PI * 2;
      p.swaySpeed = 0.0012 + Math.random() * 0.0018;
    }

    function createFallingParticle(initialSpawn = false): FallingParticle {
      const p = {} as FallingParticle;
      resetFallingParticle(p, initialSpawn);
      return p;
    }

    function addRestingParticle(
      x: number,
      y: number,
      rotation: number,
      symbol: string,
      sizeRatio: number,
      opacityRatio: number
    ) {
      if (restingParticles.length >= MAX_RESTING) {
        restingParticles.shift(); // Remove oldest to maintain memory cap
      }
      restingParticles.push({
        x,
        y,
        rotation,
        symbol,
        sizeRatio,
        opacityRatio,
        currentFade: 1.0,
        timer: 1800 + Math.random() * 1400, // Rest for ~1.8 - 3.2 seconds
        fadeDuration: 1100 // Fade smoothly over 1.1s
      });
    }

    function initParticles() {
      fallingParticles = [];
      restingParticles = [];
      const count = Math.max(5, Math.min(density, 200));
      for (let i = 0; i < count; i++) {
        fallingParticles.push(createFallingParticle(true));
      }
    }

    resize();
    initParticles();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);

    function loop(time: number) {
      if (!ctx || !canvas) return;

      if (lastTime === 0) {
        lastTime = time;
      }
      const rawDt = time - lastTime;
      lastTime = time;

      const dt = Math.max(1, Math.min(rawDt, 64));
      const delta = dt / 16.667;

      const currentKey = `${color}__${fontFamily}`;
      if (currentKey !== lastCacheKey) {
        spriteCache.clear();
        lastCacheKey = currentKey;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (enabled && width > 0 && height > 0) {
        // Keep the falling rain stream constant and continuous at target density
        const targetCount = Math.max(5, Math.min(density, 200));
        while (fallingParticles.length < targetCount) {
          // Stagger newly added particles above the viewport to avoid clumping
          const newP = createFallingParticle(false);
          newP.y = -20 - Math.random() * height * 0.4;
          fallingParticles.push(newP);
        }
        if (fallingParticles.length > targetCount) {
          fallingParticles.length = targetCount;
        }

        // 1. UPDATE & DRAW RESTING PARTICLES (Floor settled formulas)
        for (let j = restingParticles.length - 1; j >= 0; j--) {
          const rp = restingParticles[j];
          rp.timer -= dt;
          if (rp.timer <= 0) {
            rp.currentFade -= dt / rp.fadeDuration;
            if (rp.currentFade <= 0) {
              restingParticles.splice(j, 1);
              continue;
            }
          }

          const sprite = getChalkSprite(rp.symbol, color, fontFamily);
          const pSize = Math.max(8, size * rp.sizeRatio);
          const pOpacity = Math.min(1, Math.max(0.04, opacity * rp.opacityRatio)) * rp.currentFade;
          const scale = pSize / BASE_FONT_SIZE;
          const drawW = sprite.cssWidth * scale;
          const drawH = sprite.cssHeight * scale;
          const ox = -sprite.anchorX * scale;
          const oy = -sprite.anchorY * scale;

          ctx.save();
          ctx.translate(rp.x, rp.y);
          if (rp.rotation !== 0) ctx.rotate(rp.rotation);
          ctx.globalAlpha = Math.max(0, pOpacity);
          ctx.drawImage(sprite.canvas, ox, oy, drawW, drawH);
          ctx.restore();
        }

        // 2. UPDATE & DRAW FALLING PARTICLES (Continuous unbroken rain stream)
        for (let i = 0; i < fallingParticles.length; i++) {
          const p = fallingParticles[i];

          // Motion updates with normalized delta
          p.y += p.vy * delta;
          p.vy += p.gravity * delta;
          p.x += (p.vx + Math.sin(time * p.swaySpeed + p.swayOffset) * 0.35) * delta;
          p.rotation += p.vRot * delta;

          // Floor interaction
          if (bounce) {
            if (p.y >= p.floorY) {
              if (p.bounces < p.maxBounces && Math.abs(p.vy) > 0.8) {
                // Elastic floor bounce
                p.y = p.floorY;
                p.vy = -Math.abs(p.vy) * (0.32 + Math.random() * 0.1);
                p.vx *= 0.6;
                p.vRot *= 0.5;
                p.bounces++;
              } else {
                // Settle on the floor: transfer to resting pool
                addRestingParticle(p.x, p.floorY, p.rotation, p.symbol, p.sizeRatio, p.opacityRatio);
                // IMMEDIATELY respawn falling particle at top -> 100% continuous rain with NO pause!
                resetFallingParticle(p, false);
              }
            }
          } else {
            // Bounce disabled: fall smoothly past the bottom edge, then respawn
            if (p.y > height + 40) {
              resetFallingParticle(p, false);
            }
          }

          // Horizontal bounds wrapping
          if (p.x < -50) p.x = width + 50;
          if (p.x > width + 50) p.x = -50;

          // Render falling particle
          const sprite = getChalkSprite(p.symbol, color, fontFamily);
          const pSize = Math.max(8, size * p.sizeRatio);
          const pOpacity = Math.min(1, Math.max(0.05, opacity * p.opacityRatio));
          const scale = pSize / BASE_FONT_SIZE;
          const drawW = sprite.cssWidth * scale;
          const drawH = sprite.cssHeight * scale;
          const ox = -sprite.anchorX * scale;
          const oy = -sprite.anchorY * scale;

          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation !== 0) ctx.rotate(p.rotation);
          ctx.globalAlpha = pOpacity;
          ctx.drawImage(sprite.canvas, ox, oy, drawW, drawH);
          ctx.restore();
        }
      } else {
        // If disabled, clear resting particles so they don't linger
        if (restingParticles.length > 0) restingParticles = [];
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  });
</script>

<canvas
  bind:this={canvasEl}
  class="absolute inset-0 w-full h-full pointer-events-none z-0"
  aria-hidden="true"
></canvas>
