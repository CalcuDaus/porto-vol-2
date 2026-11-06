<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '#lib/api';
  import { getFontStack } from '#lib/fonts';
  import type { SiteContent, ContactFormInput } from '#lib/types';
  import GithubIcon from '#lib/icons/GithubIcon.svelte';
  import LinkedinIcon from '#lib/icons/LinkedinIcon.svelte';
  import InstagramIcon from '#lib/icons/InstagramIcon.svelte';
  import WifiWaveIcon from '#lib/icons/WifiWaveIcon.svelte';
  import MathRain from '#lib/components/MathRain.svelte';
  import ChalkboardDoodle from '#lib/components/ChalkboardDoodle.svelte';
  import {
    initConsoleEasterEgg,
    updateConsoleData
  } from '#lib/easteregg/consoleEasterEgg';
  import {
    playChalkTap,
    playChalkStroke,
    toggleSound,
    isSoundMuted
  } from '#lib/audio/chalkAudio';

  // SvelteKit Page props
  let { data } = $props();

  // Site content state
  let content = $state<SiteContent | null>(null);
  let isLoading = $state<boolean>(true);
  let isSoundActive = $state<boolean>(true);

  $effect(() => {
    if (data?.content) {
      content = data.content;
      isLoading = false;
      updateConsoleData(data.content);
    }
  });

  // Zoom animation & active view
  type SectionType = 'projects' | 'achievements' | 'skills' | 'contact';
  let activeSection = $state<SectionType | null>(null);
  let isZooming = $state<boolean>(false);
  let isInside = $state<boolean>(false);
  let zoomOrigin = $state<string>('50% 50%');

  // Contact form state
  let form = $state<ContactFormInput>({
    name: '',
    email: '',
    message: ''
  });
  let isSubmitting = $state<boolean>(false);
  let formSuccess = $state<string | null>(null);
  let formError = $state<string | null>(null);


  // Derived font stacks
  let titleFontStack = $derived(getFontStack(content?.appearance?.titleFont || 'cabin-sketch'));
  let navFontStack = $derived(getFontStack(content?.appearance?.navFont || 'cabin-sketch'));
  let bodyFontStack = $derived(getFontStack(content?.appearance?.bodyFont || 'kalam'));
  let chalkColor = $derived(content?.appearance?.chalkColor || '#ebebeb');
  let zoomDuration = $derived(content?.appearance?.zoomDuration || 650);

  // Real-time Date and Clock State
  let now = $state<Date>(new Date());
  let isFullscreen = $state<boolean>(false);

  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let currentDateString = $derived.by(() => {
    const day = DAYS[now.getDay()];
    const date = now.getDate();
    const month = MONTHS[now.getMonth()];
    const year = now.getFullYear();
    return `${day}, ${date} ${month} ${year}`;
  });

  let currentTimeString = $derived.by(() => {
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss} WIB`;
  });

  async function loadContent() {
    isLoading = true;
    const res = await api.getContent();
    if (res.success && res.data) {
      content = res.data;
      updateConsoleData(res.data);
    }
    isLoading = false;
  }

  function handleSoundToggle() {
    const muted = toggleSound();
    isSoundActive = !muted;
  }

  function handleNavigate(section: SectionType) {
    if (isZooming || isInside) return;
    playChalkStroke(0.65);

    // Map section to board transform-origin percentage
    switch (section) {
      case 'projects':
        zoomOrigin = '12% 14%';
        break;
      case 'achievements':
        zoomOrigin = '88% 14%';
        break;
      case 'skills':
        zoomOrigin = '12% 86%';
        break;
      case 'contact':
        zoomOrigin = '88% 86%';
        break;
    }

    activeSection = section;
    isZooming = true;

    // After zoom animation completes, display full green chalkboard view
    setTimeout(() => {
      isInside = true;
      isZooming = false;
    }, zoomDuration);
  }

  function handleBack() {
    if (isZooming) return;
    playChalkStroke(0.5);
    isInside = false;
    isZooming = true;

    // Smoothly zoom back out to overview
    setTimeout(() => {
      activeSection = null;
      isZooming = false;
    }, zoomDuration);
  }

  async function handleContactSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      formError = 'Mohon lengkapi semua kolom.';
      return;
    }

    isSubmitting = true;
    formError = null;
    formSuccess = null;

    try {
      const res = await api.sendContact(form);
      if (res.success) {
        formSuccess = res.message || 'Pesan Anda berhasil dikirim!';
        form = { name: '', email: '', message: '' };
      } else {
        formError = res.error || 'Gagal mengirim pesan.';
      }
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Terjadi kendala jaringan.';
    } finally {
      isSubmitting = false;
    }
  }


  async function enterFullscreen() {
    try {
      if (document.fullscreenElement) return;
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };

      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch {
      // Ignored if browser policy restricts fullscreen
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await enterFullscreen();
      } else {
        const doc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
          msExitFullscreen?: () => Promise<void>;
        };
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch {
      // Ignored
    }
  }

  onMount(() => {
    initConsoleEasterEgg(content);
    loadContent();
    isSoundActive = !isSoundMuted();

    const clockTimer = setInterval(() => {
      now = new Date();
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInside) {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Auto-fullscreen on first user click anywhere on the page
    let hasTriggeredFullscreen = false;
    const handleInitialClick = () => {
      if (hasTriggeredFullscreen) return;
      hasTriggeredFullscreen = true;
      window.removeEventListener('click', handleInitialClick, true);
      window.removeEventListener('touchend', handleInitialClick, true);
      enterFullscreen();
    };

    window.addEventListener('click', handleInitialClick, true);
    window.addEventListener('touchend', handleInitialClick, { capture: true, passive: true });

    const handleFullscreenChange = () => {
      isFullscreen = !!document.fullscreenElement;
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleInitialClick, true);
      window.removeEventListener('touchend', handleInitialClick, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  });
</script>

<svelte:head>
  <title>{content?.hero?.name || 'Mhd Firdaus'} — {content?.hero?.role || 'Software Engineer'}</title>
</svelte:head>

<!-- Fullscreen Container without navbar or footer -->
<div 
  class="relative w-screen h-screen overflow-hidden flex items-center justify-center select-none bg-[#070a0e]"
  style="
    background-image: radial-gradient(circle at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%), url('/board/wall.webp');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    --chalk-title-font: {titleFontStack};
    --chalk-nav-font: {navFontStack};
    --chalk-body-font: {bodyFontStack};
    --chalk-color: {chalkColor};
  "
>

  <!-- Background Math Formula Rain (Outside chalkboard, falling & bouncing on floor) -->
  {#if content?.mathRain?.enabled ?? true}
    <MathRain
      enabled={content?.mathRain?.enabled ?? true}
      density={content?.mathRain?.density ?? 50}
      size={content?.mathRain?.size ?? 20}
      opacity={content?.mathRain?.opacity ?? 0.45}
      speed={content?.mathRain?.speed ?? 1}
      color={content?.mathRain?.color ?? '#ffffff'}
      bounce={content?.mathRain?.bounce ?? true}
      fontFamily={titleFontStack}
    />
  {/if}

  <!-- ======================================================================= -->
  <!-- MAIN CHALKBOARD SCENE (Identical to PSD, Independent Elements)           -->
  <!-- ======================================================================= -->
  <div
    class="relative z-10 max-w-[96vw] max-h-[96vh] aspect-[948/615] transition-all"
    style="
      width: min(96vw, calc(96vh * (948 / 615)));
      height: min(96vh, calc(96vw * (615 / 948)));
      transform-origin: {zoomOrigin};
      transform: {isZooming || isInside ? 'scale(3.4)' : 'scale(1)'};
      opacity: {isInside ? '0' : '1'};
      transition: transform {zoomDuration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity {zoomDuration * 0.7}ms ease;
      pointer-events: {isInside ? 'none' : 'auto'};
    "
  >
    <!-- Background Board (Wooden Frame + Green Board + Math Sketches from PSD) -->
    <picture class="w-full h-full block">
      <source srcset="/board/board.webp" type="image/webp" />
      <img
        src="/board/board.png"
        alt="Chalkboard"
        class="w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
      />
    </picture>

    <!-- Interactive Chalkboard Doodle Layer (Chalk drawing, Cursor dust trail, Eraser & Dust explosion) -->
    <ChalkboardDoodle {isInside} {isZooming} />

    <!-- 0A. INDEPENDENT ELEMENT: Realtime Date (Top-Left Corner) -->
    <div
      class="absolute left-[7.2%] top-[5.8%] flex items-center gap-1.5 sm:gap-2 pointer-events-none select-none text-white/90"
      style="
        font-family: var(--chalk-nav-font);
        color: var(--chalk-color);
        text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.3);
      "
      title="Tanggal Hari Ini"
    >
      <!-- Chalk Calendar SVG Icon -->
      <svg
        class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 shrink-0 filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
      <span class="text-xs sm:text-sm md:text-base font-bold tracking-wider capitalize">
        {currentDateString}
      </span>
    </div>

    <!-- 0B. INDEPENDENT ELEMENT: Realtime Clock (Top-Right Corner) -->
    <div
      class="absolute right-[7.2%] top-[5.8%] flex items-center gap-1.5 sm:gap-2 pointer-events-auto select-none text-white/90 text-right justify-end"
      style="
        font-family: var(--chalk-nav-font);
        color: var(--chalk-color);
        text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.3);
      "
      title="Timer Waktu Realtime"
    >
      <span class="text-xs sm:text-sm md:text-base font-bold tracking-wider font-mono">
        {currentTimeString}
      </span>
      <!-- Chalk Clock SVG Icon -->
      <svg
        class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 shrink-0 filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>

      <!-- Chalk Fullscreen Toggle Button -->
      <button
        type="button"
        onclick={toggleFullscreen}
        class="p-0.5 ml-1 text-white/80 hover:text-white hover:scale-125 transition-all duration-200 cursor-pointer drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] focus:outline-none"
        title={isFullscreen ? 'Keluar Mode Fullscreen (Esc)' : 'Beralih ke Layar Penuh (Fullscreen)'}
        aria-label="Toggle Fullscreen"
      >
        {#if isFullscreen}
          <!-- Compress / Exit Fullscreen -->
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        {:else}
          <!-- Expand / Enter Fullscreen -->
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        {/if}
      </button>

      <!-- Chalk Sound Toggle Button -->
      <button
        type="button"
        onclick={handleSoundToggle}
        class="p-0.5 ml-1 text-white/80 hover:text-white hover:scale-125 transition-all duration-200 cursor-pointer drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] focus:outline-none"
        title={isSoundActive ? 'Efek Suara Kapur: Aktif (Klik untuk Membisukan)' : 'Efek Suara Kapur: Bisu (Klik untuk Mengaktifkan)'}
        aria-label="Toggle Sound"
      >
        {#if isSoundActive}
          <!-- Volume2 SVG (Sound ON) -->
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        {:else}
          <!-- VolumeX SVG (Sound OFF) -->
          <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        {/if}
      </button>
    </div>

    <!-- 1. INDEPENDENT ELEMENT: Projects (Top-Left) -->
    <button
      onclick={() => handleNavigate('projects')}
      class="absolute left-[7.2%] top-[10.5%] group cursor-pointer p-2 outline-none text-left"
      aria-label="Navigate to Projects"
    >
      <span
        class="block text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide transition-all duration-200 group-hover:scale-110 group-hover:translate-x-1"
        style="
          font-family: var(--chalk-nav-font);
          color: var(--chalk-color);
          text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.4);
        "
      >
        {content?.nav?.projects || 'Projects'}
      </span>
      <span class="block h-[2px] w-0 group-hover:w-full bg-white/70 transition-all duration-300 mt-0.5 rounded"></span>
    </button>

    <!-- 2. INDEPENDENT ELEMENT: Achivements (Top-Right) -->
    <button
      onclick={() => handleNavigate('achievements')}
      class="absolute right-[7.2%] top-[10.5%] group cursor-pointer p-2 outline-none text-right"
      aria-label="Navigate to Achievements"
    >
      <span
        class="block text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide transition-all duration-200 group-hover:scale-110 group-hover:-translate-x-1"
        style="
          font-family: var(--chalk-nav-font);
          color: var(--chalk-color);
          text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.4);
        "
      >
        {content?.nav?.achievements || 'Achivements'}
      </span>
      <span class="block h-[2px] w-0 group-hover:w-full bg-white/70 transition-all duration-300 ml-auto mt-0.5 rounded"></span>
    </button>

    <!-- 3. INDEPENDENT ELEMENT: Skills (Bottom-Left) -->
    <button
      onclick={() => handleNavigate('skills')}
      class="absolute left-[7.2%] bottom-[12.5%] group cursor-pointer p-2 outline-none text-left"
      aria-label="Navigate to Skills"
    >
      <span
        class="block text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide transition-all duration-200 group-hover:scale-110 group-hover:translate-x-1"
        style="
          font-family: var(--chalk-nav-font);
          color: var(--chalk-color);
          text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.4);
        "
      >
        {content?.nav?.skills || 'Skills'}
      </span>
      <span class="block h-[2px] w-0 group-hover:w-full bg-white/70 transition-all duration-300 mt-0.5 rounded"></span>
    </button>

    <!-- 4. INDEPENDENT ELEMENT: Center Hero (Name, Role & Avatar Hotspot) -->
    <div class="absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none w-full max-w-[500px]">
      
      <!-- Interactive Hotspot over the Avatar in the Center -->
      {#if content?.hero?.showAvatar ?? true}
        <button
          type="button"
          class="aspect-[178/210] min-w-[60px] max-w-[220px] mb-2 pointer-events-auto cursor-pointer border-0 bg-transparent p-0 transition-all duration-300 hover:scale-105 focus:outline-none"
          style="
            width: calc(18% * {(content?.hero?.avatarSize ?? 100) / 100});
            transform: translate({content?.hero?.avatarOffsetX ?? 0}%, {content?.hero?.avatarOffsetY ?? 0}%);
          "
          onclick={() => handleNavigate('projects')}
          aria-label="Lihat Proyek"
          title="Lihat Proyek"
        >
          <picture class="w-full h-full block">
            <source srcset={(content?.hero?.avatarUrl || '/board/avatar.webp').replace(/\.(png|jpe?g)$/i, '.webp')} type="image/webp" />
            <img
              src={content?.hero?.avatarUrl || '/board/avatar.webp'}
              alt={content?.hero?.name || 'Mhd Firdaus'}
              class="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
            />
          </picture>
        </button>
      {/if}

      <!-- Name (Mhd Firdaus) -->
      <h1
        class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wide text-center whitespace-nowrap leading-tight text-white"
        style="
          font-family: var(--chalk-title-font);
          color: var(--chalk-color);
          text-shadow: 0 0 3px rgba(255,255,255,0.95), 0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.25);
        "
      >
        {content?.hero?.name || 'Mhd Firdaus'}
      </h1>

      <!-- Role (Software Engineer) -->
      <p
        class="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold tracking-wider text-center mt-1 sm:mt-2 text-white/90"
        style="
          font-family: var(--chalk-nav-font);
          color: var(--chalk-color);
          text-shadow: 0 0 2px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.3);
        "
      >
        {content?.hero?.role || 'Software Engineer'}
      </p>

      <!-- CV Button / Badge (Right below Role) -->
      {#if content?.hero?.showCv ?? true}
        <div class="mt-2.5 sm:mt-3 pointer-events-auto">
          <a
            href={content?.hero?.cvUrl || '/cv.pdf'}
            target="_blank"
            rel="noreferrer"
            class="group inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-white/60 bg-black/35 hover:bg-white/20 hover:border-white transition-all duration-200 cursor-pointer shadow-[0_0_8px_rgba(255,255,255,0.2)] hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95"
            style="
              font-family: var(--chalk-nav-font);
              color: var(--chalk-color);
              text-shadow: 0 0 2px rgba(255,255,255,0.9);
            "
            title="Lihat / Unduh Curriculum Vitae"
            aria-label="Curriculum Vitae"
          >
            <!-- Chalk document / download icon -->
            <svg
              class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90 group-hover:text-white transition-transform duration-200 group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-xs sm:text-sm font-bold tracking-wider">
              {content?.hero?.cvLabel || 'Curriculum Vitae'}
            </span>
          </a>
        </div>
      {/if}
    </div>

    <!-- 5. INDEPENDENT ELEMENTS: Bottom-Right Icons Cluster (Exact Diagonal Match to Mockup) -->
    <div class="absolute right-[5.5%] bottom-[7.5%] w-[130px] h-[95px] z-20 pointer-events-auto">
      
      <!-- LinkedIn Icon (Top-Right) -->
      <a
        href={content?.socials?.linkedin || 'https://linkedin.com'}
        target="_blank"
        rel="noreferrer"
        class="absolute right-[10px] top-[0px] p-1 text-white/85 hover:text-white hover:scale-125 transition-all duration-200 cursor-pointer drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
        title="LinkedIn Profile"
        aria-label="LinkedIn"
      >
        <LinkedinIcon class="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]" />
      </a>

      <!-- Instagram Icon (Middle) -->
      <a
        href={content?.socials?.instagram || 'https://instagram.com'}
        target="_blank"
        rel="noreferrer"
        class="absolute right-[44px] top-[24px] p-1 text-white/85 hover:text-white hover:scale-125 transition-all duration-200 cursor-pointer drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
        title="Instagram Profile"
        aria-label="Instagram"
      >
        <InstagramIcon class="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]" />
      </a>

      <!-- GitHub Icon (Bottom-Left) -->
      <a
        href={content?.socials?.github || 'https://github.com'}
        target="_blank"
        rel="noreferrer"
        class="absolute right-[76px] bottom-[2px] p-1 text-white/85 hover:text-white hover:scale-125 transition-all duration-200 cursor-pointer drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
        title="GitHub Profile"
        aria-label="GitHub"
      >
        <GithubIcon class="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
      </a>

      <!-- Wifi / Signal Wave Icon (Bottom-Right - Clickable to open Contact) -->
      <button
        type="button"
        onclick={() => handleNavigate('contact')}
        class="absolute right-[0px] bottom-[0px] p-1 text-white/90 hover:text-white hover:scale-125 transition-all duration-200 cursor-pointer drop-shadow-[0_0_4px_rgba(255,255,255,0.9)] focus:outline-none"
        title="Hubungi (Contact)"
        aria-label="Open Contact"
      >
        <WifiWaveIcon class="w-[30px] h-[30px] sm:w-[36px] sm:h-[36px]" />
      </button>
    </div>

  </div>

  <!-- ======================================================================= -->
  <!-- FULLSCREEN GREEN CHALKBOARD VIEW (INSIDE SECTION DETAILS)                -->
  <!-- ======================================================================= -->
  {#if isInside || isZooming}
    <div
      class="fixed inset-0 z-50 chalk-board-texture flex flex-col p-4 sm:p-8 md:p-12 overflow-hidden transition-all duration-500"
      style="
        opacity: {isInside ? '1' : '0'};
        transform: {isInside ? 'scale(1)' : 'scale(0.92)'};
        pointer-events: {isInside ? 'auto' : 'none'};
        box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
      "
    >
      <!-- Wooden Board Frame Border for Full-Screen Immersive Look -->
      <div class="absolute inset-0 border-[10px] sm:border-[16px] md:border-[20px] border-[#8a5229] pointer-events-none rounded-sm shadow-2xl">
        <div class="w-full h-full border-2 border-black/50"></div>
      </div>

      <!-- Top Section Bar -->
      <div class="relative z-10 flex items-center justify-between pb-4 border-b border-white/20 mb-6 shrink-0">
        
        <!-- Back Button ("Kembali ke Papan Utama") -->
        <button
          onclick={handleBack}
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 hover:bg-black/50 border border-white/20 text-white transition-all duration-200 group cursor-pointer"
          style="font-family: var(--chalk-nav-font);"
        >
          <span class="text-xl transition-transform duration-200 group-hover:-translate-x-1">←</span>
          <span class="text-lg sm:text-xl font-bold tracking-wide chalk-shadow">Kembali ke Papan</span>
        </button>

        <!-- Section Title in Center -->
        <div class="text-center">
          <h2
            class="text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-widest chalk-glow"
            style="font-family: var(--chalk-title-font); color: var(--chalk-color);"
          >
            ✦ {activeSection === 'projects' ? (content?.nav?.projects || 'PROJECTS') :
                activeSection === 'achievements' ? (content?.nav?.achievements || 'ACHIEVEMENTS') :
                activeSection === 'skills' ? (content?.nav?.skills || 'SKILLS') :
                'CONTACT'} ✦
          </h2>
        </div>

        <!-- ESC info pill -->
        <div class="hidden sm:block text-xs font-mono text-white/50 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
          Tekan [Esc] untuk kembali
        </div>
      </div>

      <!-- Scrollable Inner Board Content Area -->
      <div class="relative z-10 flex-1 overflow-y-auto chalk-scroll pr-2 max-w-5xl mx-auto w-full">

        <!-- 1. DETAIL VIEW: PROJECTS -->
        {#if activeSection === 'projects'}
          <div class="space-y-6">
            <p class="text-base sm:text-lg text-white/80 italic text-center max-w-2xl mx-auto" style="font-family: var(--chalk-body-font);">
              {content?.intros?.projects || 'Kumpulan karya rekayasa perangkat lunak, sistem, dan aplikasi web.'}
            </p>

            <div class="grid gap-6 md:grid-cols-2 pt-2">
              {#each (content?.projects?.filter(p => !p.isDeleted) || []) as project (project.id)}
                <div class="p-6 rounded-xl bg-black/25 border-2 border-white/20 border-dashed hover:border-white/50 transition-all duration-200 space-y-4">
                  <div class="flex items-start justify-between gap-3">
                    <h3 class="text-2xl font-bold text-white chalk-shadow" style="font-family: var(--chalk-title-font);">
                      {project.title}
                    </h3>
                    {#if project.year}
                      <span class="text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 font-mono shrink-0">
                        {project.year}
                      </span>
                    {/if}
                  </div>

                  <p class="text-base text-white/80 leading-relaxed" style="font-family: var(--chalk-body-font);">
                    {project.description}
                  </p>

                  {#if project.tags && project.tags.length > 0}
                    <div class="flex flex-wrap gap-2 pt-1">
                      {#each project.tags as tag}
                        <span class="text-xs font-mono px-2.5 py-1 rounded bg-black/40 text-emerald-200 border border-emerald-400/30">
                          #{tag}
                        </span>
                      {/each}
                    </div>
                  {/if}

                  <div class="flex items-center gap-4 pt-3 border-t border-white/15 text-sm" style="font-family: var(--chalk-nav-font);">
                    {#if project.repoUrl}
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        class="text-white hover:text-amber-300 underline underline-offset-4 transition-colors"
                      >
                        Source Code →
                      </a>
                    {/if}
                    {#if project.liveUrl}
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        class="text-emerald-300 hover:text-emerald-100 underline underline-offset-4 transition-colors"
                      >
                        Live Demo ↗
                      </a>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>

        <!-- 2. DETAIL VIEW: ACHIEVEMENTS -->
        {:else if activeSection === 'achievements'}
          <div class="space-y-6">
            <p class="text-base sm:text-lg text-white/80 italic text-center max-w-2xl mx-auto" style="font-family: var(--chalk-body-font);">
              {content?.intros?.achievements || 'Tonggak pencapaian, sertifikasi keahlian, dan penghargaan profesional.'}
            </p>

            <div class="space-y-4 max-w-3xl mx-auto pt-2">
              {#each (content?.achievements?.filter(a => !a.isDeleted) || []) as ach (ach.id)}
                <div class="p-6 rounded-xl bg-black/25 border-2 border-white/20 border-dashed space-y-2">
                  <div class="flex items-center justify-between gap-4">
                    <h3 class="text-2xl font-bold text-white chalk-shadow" style="font-family: var(--chalk-title-font);">
                      {ach.title}
                    </h3>
                    <span class="text-xs font-mono px-3 py-1 rounded-full bg-white/15 text-white shrink-0">
                      {ach.year}
                    </span>
                  </div>
                  <p class="text-sm font-semibold text-amber-300 tracking-wide" style="font-family: var(--chalk-nav-font);">
                    {ach.issuer}
                  </p>
                  <p class="text-base text-white/80 leading-relaxed pt-1" style="font-family: var(--chalk-body-font);">
                    {ach.description}
                  </p>
                </div>
              {/each}
            </div>
          </div>

        <!-- 3. DETAIL VIEW: SKILLS -->
        {:else if activeSection === 'skills'}
          <div class="space-y-6">
            <p class="text-base sm:text-lg text-white/80 italic text-center max-w-2xl mx-auto" style="font-family: var(--chalk-body-font);">
              {content?.intros?.skills || 'Teknologi, bahasa pemrograman, dan alat pengembangan yang dikuasai.'}
            </p>

            <div class="grid gap-6 sm:grid-cols-2 pt-2">
              {#each (content?.skills?.filter(s => !s.isDeleted) || []) as skillGroup (skillGroup.id)}
                <div class="p-6 rounded-xl bg-black/25 border-2 border-white/20 border-dashed space-y-4">
                  <h3 class="text-2xl font-bold text-amber-300 chalk-shadow" style="font-family: var(--chalk-title-font);">
                    {skillGroup.category}
                  </h3>
                  <div class="flex flex-wrap gap-2.5">
                    {#each skillGroup.items as item}
                      <span class="px-3.5 py-1.5 rounded-lg bg-black/40 border border-white/30 text-white text-base tracking-wide" style="font-family: var(--chalk-body-font);">
                        ✦ {item}
                      </span>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>

        <!-- 4. DETAIL VIEW: CONTACT -->
        {:else if activeSection === 'contact'}
          <div class="max-w-xl mx-auto space-y-6">
            <div class="text-center space-y-2">
              <h3 class="text-3xl font-bold text-white chalk-shadow" style="font-family: var(--chalk-title-font);">
                {content?.contact?.heading || 'Hubungi Saya'}
              </h3>
              <p class="text-base text-white/80" style="font-family: var(--chalk-body-font);">
                {content?.contact?.description || 'Silakan kirim pesan atau ajukan tawaran proyek melalui formulir di bawah ini.'}
              </p>
              {#if content?.contact?.email}
                <p class="text-sm font-mono text-amber-300 pt-1">
                  Email: <a href="mailto:{content.contact.email}" class="underline">{content.contact.email}</a>
                </p>
              {/if}
            </div>

            <!-- Chalk-Styled Contact Form -->
            <form onsubmit={handleContactSubmit} class="p-6 sm:p-8 rounded-xl bg-black/30 border-2 border-white/20 border-dashed space-y-5">
              {#if formSuccess}
                <div class="p-4 rounded-lg bg-emerald-900/60 border border-emerald-400 text-emerald-200 text-sm">
                  ✓ {formSuccess}
                </div>
              {/if}

              {#if formError}
                <div class="p-4 rounded-lg bg-rose-900/60 border border-rose-400 text-rose-200 text-sm">
                  ✗ {formError}
                </div>
              {/if}

              <div class="space-y-1">
                <label for="contact-name" class="block text-base font-bold text-white/90" style="font-family: var(--chalk-nav-font);">
                  Nama Anda:
                </label>
                <input
                  id="contact-name"
                  type="text"
                  bind:value={form.name}
                  placeholder="Tulis nama Anda..."
                  disabled={isSubmitting}
                  required
                  class="w-full px-3 py-2 bg-transparent border-b-2 border-white/40 focus:border-amber-300 text-white text-lg outline-none transition-colors"
                  style="font-family: var(--chalk-body-font);"
                />
              </div>

              <div class="space-y-1">
                <label for="contact-email" class="block text-base font-bold text-white/90" style="font-family: var(--chalk-nav-font);">
                  Alamat Email:
                </label>
                <input
                  id="contact-email"
                  type="email"
                  bind:value={form.email}
                  placeholder="nama@email.com..."
                  disabled={isSubmitting}
                  required
                  class="w-full px-3 py-2 bg-transparent border-b-2 border-white/40 focus:border-amber-300 text-white text-lg outline-none transition-colors"
                  style="font-family: var(--chalk-body-font);"
                />
              </div>

              <div class="space-y-1">
                <label for="contact-message" class="block text-base font-bold text-white/90" style="font-family: var(--chalk-nav-font);">
                  Pesan:
                </label>
                <textarea
                  id="contact-message"
                  rows="4"
                  bind:value={form.message}
                  placeholder="Tulis pesan Anda di sini..."
                  disabled={isSubmitting}
                  required
                  class="w-full px-3 py-2 bg-transparent border-2 border-white/30 rounded focus:border-amber-300 text-white text-lg outline-none resize-none transition-colors"
                  style="font-family: var(--chalk-body-font);"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                class="w-full py-3 px-6 rounded-lg bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xl font-bold tracking-wide transition-all chalk-shadow disabled:opacity-50 cursor-pointer"
                style="font-family: var(--chalk-nav-font);"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Pesan Kapur ✉'}
              </button>
            </form>
          </div>
        {/if}

      </div>
    </div>
  {/if}

</div>
