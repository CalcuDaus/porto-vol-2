<script lang="ts">
  import { onMount } from 'svelte';
  import { api, setToken, clearToken, getToken } from '#lib/api';
  import { FONT_OPTIONS, getFontStack } from '#lib/fonts';
  import type { SiteContent, Project, Achievement, SkillGroup, AuthUser } from '#lib/types';
  import GithubIcon from '#lib/icons/GithubIcon.svelte';
  import LinkedinIcon from '#lib/icons/LinkedinIcon.svelte';
  import InstagramIcon from '#lib/icons/InstagramIcon.svelte';
  import WifiWaveIcon from '#lib/icons/WifiWaveIcon.svelte';
  import MathRain from '#lib/components/MathRain.svelte';
  import {
    Save,
    ExternalLink,
    RefreshCw,
    Plus,
    Trash2,
    Sliders,
    User,
    FolderKanban,
    Award,
    Cpu,
    Mail,
    Share2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Eye,
    EyeOff,
    Palette,
    Lock,
    KeyRound,
    ShieldCheck,
    LogOut,
    RotateCcw,
    Move,
    ZoomIn,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    FileText,
    Upload,
    CloudRain,
    Binary,
    GripVertical
  } from '@lucide/svelte';

  // Authentication State
  let isCheckingAuth = $state(true);
  let isAuthenticated = $state(false);
  let currentUser = $state<AuthUser | null>(null);

  // Login form state
  let username = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let isLoggingIn = $state(false);
  let loginError = $state<string | null>(null);
  let lockoutRemaining = $state<number | null>(null);
  let lockoutInterval: ReturnType<typeof setInterval> | null = null;

  // Navigation tab state
  type TabId =
    | 'appearance'
    | 'hero'
    | 'mathRain'
    | 'nav'
    | 'projects'
    | 'achievements'
    | 'skills'
    | 'contact'
    | 'socials'
    | 'security';

  let activeTab = $state<TabId>('appearance');

  // Loading & notification states
  let isLoading = $state(true);
  let isSaving = $state(false);
  let toast = $state<{ type: 'success' | 'error'; message: string } | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function showToast(type: 'success' | 'error', message: string) {
    if (toastTimer) clearTimeout(toastTimer);
    toast = { type, message };
    toastTimer = setTimeout(() => {
      toast = null;
    }, 4500);
  }

  // Site content state
  let content = $state<SiteContent>({
    appearance: {
      titleFont: 'cabin-sketch',
      navFont: 'cabin-sketch',
      bodyFont: 'kalam',
      chalkColor: '#ebebeb',
      zoomDuration: 700
    },
    hero: {
      name: 'MHD FIRDAUS',
      role: 'FULLSTACK DEVELOPER & UI DESIGNER',
      avatarUrl: '/board/avatar.webp',
      showAvatar: true,
      avatarSize: 100,
      avatarOffsetX: 0,
      avatarOffsetY: 0,
      cvUrl: '/cv.pdf',
      cvLabel: 'Curriculum Vitae',
      showCv: true
    },
    nav: {
      projects: 'Projects',
      achievements: 'Achivements',
      skills: 'Skills',
      contact: 'Contact'
    },
    socials: {
      github: 'https://github.com/mhdfi',
      linkedin: 'https://linkedin.com/in/mhdfirdaus',
      instagram: 'https://instagram.com/mhdfirdaus'
    },
    mathRain: {
      enabled: true,
      density: 50,
      size: 20,
      opacity: 0.45,
      speed: 1,
      color: '#ffffff',
      bounce: true
    },
    intros: {
      projects: 'Koleksi karya web aplikasi, API performa tinggi, dan platform digital yang saya kembangkan.',
      achievements: 'Pengakuan, sertifikasi profesional, dan pencapaian kompetisi sepanjang perjalanan karier.',
      skills: 'Teknologi modern, framework, bahasa pemrograman, dan alat kerja yang saya kuasai.'
    },
    projects: [],
    achievements: [],
    skills: [],
    contact: {
      heading: 'Mari Berdiskusi & Berkolaborasi',
      description: 'Saya selalu terbuka untuk proyek baru, freelance, kolaborasi teknis, atau sekadar bertukar pikiran seputar software engineering.',
      email: 'mhd.firdaus@example.com',
      formEnabled: true
    },
    updatedAt: new Date().toISOString()
  });

  // Verify active session on load
  async function checkInitialAuth() {
    isCheckingAuth = true;
    const existingToken = getToken();

    if (!existingToken) {
      isAuthenticated = false;
      isCheckingAuth = false;
      return;
    }

    try {
      const res = await api.verifySession();
      if (res.success && res.data) {
        currentUser = res.data;
        isAuthenticated = true;
        await loadData();
      } else {
        clearToken();
        isAuthenticated = false;
      }
    } catch {
      clearToken();
      isAuthenticated = false;
    } finally {
      isCheckingAuth = false;
    }
  }

  // Handle Login submission
  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    if (isLoggingIn) return;

    if (!username.trim() || !password) {
      loginError = 'Harap isi username dan password.';
      return;
    }

    isLoggingIn = true;
    loginError = null;

    try {
      const res = await api.login(username.trim(), password);

      if (res.success && res.data) {
        setToken(res.data.token);
        currentUser = res.data.user;
        isAuthenticated = true;
        loginError = null;
        if (lockoutInterval) {
          clearInterval(lockoutInterval);
          lockoutInterval = null;
          lockoutRemaining = null;
        }
        await loadData();
        showToast('success', `Selamat datang kembali, ${res.data.user.username}! Sesi terenkripsi aktif.`);
      } else {
        loginError = res.error || res.message || 'Login gagal. Periksa kredensial Anda.';

        // Handle rate limiting / lockout timer
        if (res.error === 'ACCOUNT_LOCKED' && res.message) {
          const match = res.message.match(/(\d+)\s*detik/);
          if (match && match[1]) {
            lockoutRemaining = parseInt(match[1], 10);
            if (lockoutInterval) clearInterval(lockoutInterval);
            lockoutInterval = setInterval(() => {
              if (lockoutRemaining && lockoutRemaining > 1) {
                lockoutRemaining -= 1;
              } else {
                if (lockoutInterval) clearInterval(lockoutInterval);
                lockoutInterval = null;
                lockoutRemaining = null;
                loginError = null;
              }
            }, 1000);
          }
        }
      }
    } catch (err) {
      loginError = err instanceof Error ? err.message : 'Koneksi ke server gagal.';
    } finally {
      isLoggingIn = false;
    }
  }

  // Handle Logout
  async function handleLogout() {
    await api.logout();
    clearToken();
    isAuthenticated = false;
    currentUser = null;
    password = '';
    showToast('success', 'Anda telah berhasil keluar dari dashboard.');
  }

  // Security / Credentials Form State
  let secCurrentPassword = $state('');
  let secNewUsername = $state('');
  let secNewPassword = $state('');
  let secConfirmPassword = $state('');
  let secShowCurrentPassword = $state(false);
  let secShowNewPassword = $state(false);
  let secShowConfirmPassword = $state(false);
  let isUpdatingCredentials = $state(false);
  let secError = $state<string | null>(null);
  let secSuccess = $state<string | null>(null);

  // Handle Update Credentials
  async function handleUpdateCredentials(e: SubmitEvent) {
    e.preventDefault();
    if (isUpdatingCredentials) return;

    secError = null;
    secSuccess = null;

    if (!secCurrentPassword) {
      secError = 'Password saat ini wajib diisi untuk verifikasi keamanan.';
      return;
    }

    if (!secNewUsername.trim() && !secNewPassword) {
      secError = 'Harap masukkan username baru atau password baru yang ingin diubah.';
      return;
    }

    if (secNewUsername.trim() && secNewUsername.trim().length < 3) {
      secError = 'Username baru minimal harus terdiri dari 3 karakter.';
      return;
    }

    if (secNewPassword) {
      if (secNewPassword.length < 8) {
        secError = 'Password baru minimal harus 8 karakter.';
        return;
      }
      if (secNewPassword !== secConfirmPassword) {
        secError = 'Konfirmasi password baru tidak cocok.';
        return;
      }
    }

    isUpdatingCredentials = true;

    try {
      const res = await api.updateCredentials({
        currentPassword: secCurrentPassword,
        newUsername: secNewUsername.trim() || undefined,
        newPassword: secNewPassword || undefined
      });

      if (res.success && res.data) {
        setToken(res.data.token);
        if (currentUser) {
          currentUser.username = res.data.username;
        }
        secSuccess = `Kredensial berhasil diperbarui! Username Anda saat ini: "${res.data.username}". Sesi aman telah diperbarui.`;
        showToast('success', 'Username & Password berhasil diperbarui!');
        secCurrentPassword = '';
        secNewPassword = '';
        secConfirmPassword = '';
        secNewUsername = res.data.username;
      } else {
        secError = res.error || res.message || 'Gagal mengubah kredensial.';
        showToast('error', secError);
      }
    } catch (err) {
      secError = err instanceof Error ? err.message : 'Terjadi kendala saat menghubungi server.';
      showToast('error', secError);
    } finally {
      isUpdatingCredentials = false;
    }
  }

  // Load content
  async function loadData() {
    isLoading = true;
    const res = await api.getContent();
    if (res.success && res.data) {
      content = {
        ...res.data,
        hero: {
          ...res.data.hero,
          avatarSize: res.data.hero.avatarSize ?? 100,
          avatarOffsetX: res.data.hero.avatarOffsetX ?? 0,
          avatarOffsetY: res.data.hero.avatarOffsetY ?? 0,
          cvUrl: res.data.hero.cvUrl || '/cv.pdf',
          cvLabel: res.data.hero.cvLabel || 'Curriculum Vitae',
          showCv: res.data.hero.showCv ?? true
        },
        mathRain: res.data.mathRain || {
          enabled: true,
          density: 50,
          size: 20,
          opacity: 0.45,
          speed: 1,
          color: '#ffffff',
          bounce: true
        }
      };
    } else {
      showToast('error', res.error || 'Gagal memuat data dari server Elysia.');
    }
    isLoading = false;
  }

  // Save all content
  async function saveAll() {
    isSaving = true;
    content.updatedAt = new Date().toISOString();
    const res = await api.updateContent(content);
    if (res.success && res.data) {
      content = {
        ...res.data,
        hero: {
          ...res.data.hero,
          avatarSize: res.data.hero.avatarSize ?? 100,
          avatarOffsetX: res.data.hero.avatarOffsetX ?? 0,
          avatarOffsetY: res.data.hero.avatarOffsetY ?? 0,
          cvUrl: res.data.hero.cvUrl || '/cv.pdf',
          cvLabel: res.data.hero.cvLabel || 'Curriculum Vitae',
          showCv: res.data.hero.showCv ?? true
        },
        mathRain: res.data.mathRain || {
          enabled: true,
          density: 50,
          size: 20,
          opacity: 0.45,
          speed: 1,
          color: '#ffffff',
          bounce: true
        }
      };
      showToast('success', 'Semua perubahan berhasil disimpan ke database!');
    } else {
      showToast('error', res.error || 'Gagal menyimpan perubahan.');
    }
    isSaving = false;
  }

  // Save specific section
  async function saveSection(section: string, data: unknown) {
    isSaving = true;
    const res = await api.updateSection(section, data);
    if (res.success) {
      showToast('success', `Bagian ${section} berhasil diperbarui!`);
    } else {
      showToast('error', res.error || `Gagal menyimpan bagian ${section}.`);
    }
    isSaving = false;
  }

  // Live preview mode state
  let previewMode = $state<'board' | 'section'>('board');
  let isUploadingCv = $state(false);

  function resetAvatarTransform() {
    content.hero.avatarSize = 100;
    content.hero.avatarOffsetX = 0;
    content.hero.avatarOffsetY = 0;
  }

  function nudgeAvatar(dx: number, dy: number) {
    content.hero.avatarOffsetX = Math.max(-80, Math.min(80, (content.hero.avatarOffsetX ?? 0) + dx));
    content.hero.avatarOffsetY = Math.max(-80, Math.min(80, (content.hero.avatarOffsetY ?? 0) + dy));
  }

  async function handleCvFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('error', 'Hanya file dokumen PDF yang dapat diunggah.');
      input.value = '';
      return;
    }

    isUploadingCv = true;
    try {
      const res = await api.uploadCv(file);
      if (res.success && res.data) {
        content.hero.cvUrl = res.data.url;
        showToast('success', 'File CV PDF berhasil diunggah!');
      } else {
        showToast('error', res.error || 'Gagal mengunggah file CV.');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Terjadi kendala saat upload CV.');
    } finally {
      isUploadingCv = false;
      input.value = '';
    }
  }

  let isUploadingAvatar = $state(false);

  async function handleAvatarUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      showToast('error', 'Hanya file gambar (.png, .jpg, .jpeg, .webp) yang diperbolehkan.');
      input.value = '';
      return;
    }

    isUploadingAvatar = true;
    try {
      const res = await api.uploadImage(file, 'avatar');
      if (res.success && res.data) {
        content.hero.avatarUrl = res.data.url;
        showToast('success', `Foto berhasil diunggah & dikonversi ke WebP! Hemat ${res.data.saving}`);
      } else {
        showToast('error', res.error || 'Gagal mengunggah foto avatar.');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Terjadi kendala saat upload foto avatar.');
    } finally {
      isUploadingAvatar = false;
      input.value = '';
    }
  }

  // --- Project Helpers ---
  function addProject() {
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      title: 'Proyek Baru',
      description: 'Deskripsi proyek baru...',
      tags: ['TypeScript', 'Svelte'],
      year: new Date().getFullYear().toString(),
      repoUrl: '',
      liveUrl: '',
      isDeleted: false
    };
    content.projects = [newProj, ...content.projects];
  }

  function removeProject(id: string) {
    content.projects = content.projects.filter((p) => p.id !== id);
  }

  function updateProjectTags(proj: Project, tagsString: string) {
    proj.tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  // --- Achievement Helpers ---
  function addAchievement() {
    const newAch: Achievement = {
      id: 'ach-' + Date.now(),
      title: 'Pencapaian Baru',
      issuer: 'Penyelenggara / Institusi',
      year: new Date().getFullYear().toString(),
      description: 'Keterangan pencapaian...',
      isDeleted: false
    };
    content.achievements = [newAch, ...content.achievements];
  }

  function removeAchievement(id: string) {
    content.achievements = content.achievements.filter((a) => a.id !== id);
  }

  // --- Achievement Drag & Drop & Reordering Helpers ---
  let draggedAchIndex = $state<number | null>(null);
  let dragOverAchIndex = $state<number | null>(null);

  function handleAchDragStart(e: DragEvent, index: number) {
    draggedAchIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  function handleAchDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverAchIndex !== index) {
      dragOverAchIndex = index;
    }
  }

  function handleAchDragLeave() {
    // leave callback
  }

  function handleAchDrop(e: DragEvent, targetIndex: number) {
    e.preventDefault();
    if (draggedAchIndex === null || draggedAchIndex === targetIndex) {
      handleAchDragEnd();
      return;
    }

    const items = [...content.achievements];
    const [movedItem] = items.splice(draggedAchIndex, 1);
    items.splice(targetIndex, 0, movedItem);
    content.achievements = items;

    const fromPos = draggedAchIndex + 1;
    const toPos = targetIndex + 1;
    handleAchDragEnd();
    showToast('success', `Urutan prestasi dipindah dari #${fromPos} ke #${toPos}`);
  }

  function handleAchDragEnd() {
    draggedAchIndex = null;
    dragOverAchIndex = null;
  }

  function moveAchievement(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= content.achievements.length) return;
    const items = [...content.achievements];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    content.achievements = items;
    showToast('success', `Urutan prestasi dipindah ke posisi #${toIndex + 1}`);
  }

  // --- Skill Helpers ---
  function addSkillGroup() {
    const newGroup: SkillGroup = {
      id: 'skill-' + Date.now(),
      category: 'Kategori Baru',
      items: ['Teknologi 1', 'Teknologi 2'],
      isDeleted: false
    };
    content.skills = [...content.skills, newGroup];
  }

  function removeSkillGroup(id: string) {
    content.skills = content.skills.filter((s) => s.id !== id);
  }

  function updateSkillItems(group: SkillGroup, itemsString: string) {
    group.items = itemsString
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
  }

  // --- Skill Drag & Drop & Reordering Helpers ---
  let draggedSkillIndex = $state<number | null>(null);
  let dragOverSkillIndex = $state<number | null>(null);

  function handleSkillDragStart(e: DragEvent, index: number) {
    draggedSkillIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  function handleSkillDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverSkillIndex !== index) {
      dragOverSkillIndex = index;
    }
  }

  function handleSkillDragLeave() {
    // leave callback
  }

  function handleSkillDrop(e: DragEvent, targetIndex: number) {
    e.preventDefault();
    if (draggedSkillIndex === null || draggedSkillIndex === targetIndex) {
      handleSkillDragEnd();
      return;
    }

    const items = [...content.skills];
    const [movedItem] = items.splice(draggedSkillIndex, 1);
    items.splice(targetIndex, 0, movedItem);
    content.skills = items;

    const fromPos = draggedSkillIndex + 1;
    const toPos = targetIndex + 1;
    handleSkillDragEnd();
    showToast('success', `Urutan kategori keahlian dipindah dari #${fromPos} ke #${toPos}`);
  }

  function handleSkillDragEnd() {
    draggedSkillIndex = null;
    dragOverSkillIndex = null;
  }

  function moveSkillGroup(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= content.skills.length) return;
    const items = [...content.skills];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    content.skills = items;
    showToast('success', `Urutan kategori keahlian dipindah ke posisi #${toIndex + 1}`);
  }

  // Computed styles for live preview
  const previewTitleStack = $derived(getFontStack(content.appearance.titleFont));
  const previewNavStack = $derived(getFontStack(content.appearance.navFont));
  const previewBodyStack = $derived(getFontStack(content.appearance.bodyFont));
  const chalkColor = $derived(content.appearance.chalkColor || '#ebebeb');

  // Real-time Date and Clock State
  let now = $state<Date>(new Date());

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

  onMount(() => {
    checkInitialAuth();

    const clockTimer = setInterval(() => {
      now = new Date();
    }, 1000);

    // Listen for auto-logout when token expires
    const handleAuthExpired = () => {
      isAuthenticated = false;
      currentUser = null;
      showToast('error', 'Sesi Anda telah berakhir. Silakan login kembali.');
    };
    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('auth-expired', handleAuthExpired);
      if (lockoutInterval) clearInterval(lockoutInterval);
    };
  });
</script>

<!-- ========================================================================= -->
<!-- AUTHENTICATION CHECKING SPINNER                                           -->
<!-- ========================================================================= -->
{#if isCheckingAuth}
  <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4 font-sans">
    <div class="relative w-12 h-12">
      <div class="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
      <Lock class="w-5 h-5 text-emerald-400 absolute inset-0 m-auto" />
    </div>
    <p class="text-xs tracking-wider uppercase font-medium text-slate-300">Memverifikasi Sesi Keamanan...</p>
  </div>

<!-- ========================================================================= -->
<!-- LOGIN SCREEN (If Not Authenticated)                                       -->
<!-- ========================================================================= -->
{:else if !isAuthenticated}
  <div class="min-h-screen bg-[#070b0e] flex items-center justify-center p-4 relative overflow-hidden font-sans">
    <!-- Ambient Chalkboard Glow -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10">
      <!-- Wooden / Slate Frame Card -->
      <div class="rounded-2xl border-2 border-[#543d2b]/80 bg-[#0f171d]/95 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        <!-- Chalkboard texture background overlay -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06)_0%,_transparent_70%)] pointer-events-none"></div>

        <!-- Header -->
        <div class="text-center relative space-y-2 mb-6">
          <div class="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner mb-1">
            <Lock class="w-7 h-7" />
          </div>

          <h1
            class="text-2xl font-bold tracking-wider text-slate-100 uppercase"
            style="font-family: 'Cabin Sketch', cursive; text-shadow: 0 0 3px rgba(255,255,255,0.7);"
          >
            Chalkboard Admin
          </h1>

          <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Portal autentikasi administrator untuk mengelola konten dan tipografi papan tulis portofolio
          </p>
        </div>

        <!-- Security Badges -->
        <div class="flex items-center justify-center gap-2 mb-6 text-[10px] text-emerald-300 font-mono">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30">
            <ShieldCheck class="w-3 h-3 text-emerald-400" />
            Argon2 & HMAC-SHA256
          </span>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <KeyRound class="w-3 h-3 text-sky-400" />
            Brute-Force Guard
          </span>
        </div>

        <!-- Lockout Banner -->
        {#if lockoutRemaining}
          <div class="mb-5 p-3.5 rounded-xl bg-amber-950/60 border border-amber-600/50 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold">Akses Terkunci Sementara</p>
              <p class="text-[11px] text-amber-300/80 mt-0.5">
                Terlalu banyak percobaan gagal. Silakan tunggu <span class="font-bold text-amber-200">{lockoutRemaining} detik</span> sebelum mencoba lagi.
              </p>
            </div>
          </div>
        {:else if loginError}
          <div class="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle class="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div class="leading-relaxed">
              {loginError}
            </div>
          </div>
        {/if}

        <!-- Login Form -->
        <form onsubmit={handleLogin} class="space-y-4">
          <!-- Username -->
          <div>
            <label for="admin-login-username" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Username Admin
            </label>
            <div class="relative">
              <input
                id="admin-login-username"
                type="text"
                autocomplete="username"
                bind:value={username}
                disabled={isLoggingIn || lockoutRemaining !== null}
                placeholder="Masukkan username"
                class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition disabled:opacity-50"
              />
              <User class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="admin-login-password" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password Administrator
            </label>
            <div class="relative">
              <input
                id="admin-login-password"
                type={showPassword ? 'text' : 'password'}
                autocomplete="current-password"
                bind:value={password}
                disabled={isLoggingIn || lockoutRemaining !== null}
                placeholder="Masukkan password rahasia"
                class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition disabled:opacity-50"
              />
              <Lock class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onclick={() => (showPassword = !showPassword)}
                tabindex="-1"
                class="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {#if showPassword}
                  <EyeOff class="w-4 h-4" />
                {:else}
                  <Eye class="w-4 h-4" />
                {/if}
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            disabled={isLoggingIn || lockoutRemaining !== null}
            class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {#if isLoggingIn}
              <RefreshCw class="w-4 h-4 animate-spin" />
              <span>Memverifikasi...</span>
            {:else}
              <Lock class="w-4 h-4" />
              <span>Masuk ke Dashboard</span>
            {/if}
          </button>
        </form>

      </div>

      <!-- Back to public portfolio link -->
      <div class="text-center mt-4">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition"
        >
          <span>Kembali ke Halaman Portofolio</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </div>
  </div>

<!-- ========================================================================= -->
<!-- AUTHENTICATED ADMIN DASHBOARD                                             -->
<!-- ========================================================================= -->
{:else}
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
    <!-- Top Navigation Header -->
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner">
          P
        </div>
        <div>
          <h1 class="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Chalkboard Portfolio Dashboard
            <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Elysia + Svelte 5
            </span>
          </h1>
          <p class="text-xs text-slate-400">
            Kelola typography papan tulis, konten hero, proyek, prestasi, dan keahlian
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <!-- Live Web Link -->
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
        >
          <Eye class="w-3.5 h-3.5 text-slate-400" />
          Buka Portfolio
          <ExternalLink class="w-3 h-3 text-slate-500" />
        </a>

        <!-- Reload Button -->
        <button
          type="button"
          onclick={loadData}
          disabled={isLoading || isSaving}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw class="w-3.5 h-3.5 {isLoading ? 'animate-spin' : ''}" />
          Refresh
        </button>

        <!-- Save All Button -->
        <button
          type="button"
          onclick={saveAll}
          disabled={isSaving || isLoading}
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          {isSaving ? 'Menyimpan...' : 'Simpan Semua'}
        </button>

        <!-- Authenticated User & Logout -->
        <div class="pl-2 border-l border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onclick={() => (activeTab = 'security')}
            class="hidden sm:flex flex-col text-right cursor-pointer group rounded-lg px-2 py-1 hover:bg-slate-900 transition"
            title="Kelola Akun & Ubah Password"
          >
            <span class="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition">
              {currentUser?.username || 'admin'}
            </span>
            <span class="text-[10px] text-emerald-400 font-mono flex items-center gap-1 justify-end">
              <ShieldCheck class="w-3 h-3" /> Sesi Terenkripsi
            </span>
          </button>

          <button
            type="button"
            onclick={handleLogout}
            class="p-2 rounded-lg text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition flex items-center gap-1"
            title="Keluar / Logout dari Dashboard"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Toast Notification -->
    {#if toast}
      <div
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur transition-all duration-300 {toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-600/50' : 'bg-rose-950/90 text-rose-200 border-rose-600/50'}"
      >
        {#if toast.type === 'success'}
          <CheckCircle2 class="w-5 h-5 text-emerald-400 flex-shrink-0" />
        {:else}
          <AlertCircle class="w-5 h-5 text-rose-400 flex-shrink-0" />
        {/if}
        <span class="text-xs font-medium leading-relaxed">{toast.message}</span>
      </div>
    {/if}

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside class="w-full lg:w-56 xl:w-60 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/50 flex-shrink-0 p-3.5 xl:p-4 space-y-1 overflow-y-auto">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
          Menu Pengaturan
        </div>

        <button
          type="button"
          onclick={() => (activeTab = 'appearance')}
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'appearance' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <Palette class="w-4 h-4 text-emerald-400" />
          Appearance & Chalk Fonts
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'hero')}
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'hero' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <User class="w-4 h-4 text-sky-400" />
          Hero & Identitas Diri
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'mathRain')}
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'mathRain' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <div class="flex items-center gap-2.5">
            <CloudRain class="w-4 h-4 text-cyan-400" />
            <span>Hujan Rumus Math</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold {content.mathRain?.enabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}">
            {content.mathRain?.enabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'nav')}
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'nav' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <Sliders class="w-4 h-4 text-purple-400" />
          Navigasi Sudut Papan
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'projects')}
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'projects' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <div class="flex items-center gap-2.5">
            <FolderKanban class="w-4 h-4 text-amber-400" />
            Daftar Proyek
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {content.projects.length}
          </span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'achievements')}
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'achievements' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <div class="flex items-center gap-2.5">
            <Award class="w-4 h-4 text-yellow-400" />
            Pencapaian & Sertifikasi
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {content.achievements.length}
          </span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'skills')}
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'skills' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <div class="flex items-center gap-2.5">
            <Cpu class="w-4 h-4 text-teal-400" />
            Kategori Keahlian (Skills)
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {content.skills.length}
          </span>
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'socials')}
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'socials' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <Share2 class="w-4 h-4 text-pink-400" />
          Tautan Sosial Media
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'contact')}
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'contact' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <Mail class="w-4 h-4 text-indigo-400" />
          Kontak & Pengantar
        </button>

        <!-- Divider: Keamanan & Akun -->
        <div class="pt-3 pb-1">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3">
            Keamanan Sistem
          </p>
        </div>

        <button
          type="button"
          onclick={() => (activeTab = 'security')}
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition {activeTab === 'security' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
        >
          <div class="flex items-center gap-2.5">
            <KeyRound class="w-4 h-4 text-emerald-400" />
            <span>Akun & Password</span>
          </div>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Admin
          </span>
        </button>
      </aside>

      <!-- Content Workspace -->
      <main class="flex-1 p-5 xl:p-8 overflow-y-auto min-w-0">
        {#if isLoading}
          <div class="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw class="w-8 h-8 animate-spin text-emerald-400" />
            <p class="text-sm">Memuat konfigurasi portfolio...</p>
          </div>
        {:else}
          <!-- TAB 1: APPEARANCE & CHALK FONTS -->
          {#if activeTab === 'appearance'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <Palette class="w-5 h-5 text-emerald-400" />
                    Chalkboard Typography & Tampilan
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Pilih font kapur Google Fonts terbaik untuk judul nama, tombol sudut navigasi, dan teks penjelasan
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => saveSection('appearance', content.appearance)}
                  disabled={isSaving}
                  class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                >
                  <Save class="w-3.5 h-3.5" />
                  Simpan Tampilan
                </button>
              </div>

              <!-- Font Chooser for Title -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label for="font-title-select" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Font Judul Utama / Nama Tengah
                  </label>
                  <p class="text-xs text-slate-400">
                    Diterapkan pada tulisan kapur nama "MHD FIRDAUS" di tengah papan tulis dan judul besar di dalam papan.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {#each FONT_OPTIONS as font}
                    <button
                      type="button"
                      onclick={() => (content.appearance.titleFont = font.id)}
                      class="p-3.5 rounded-xl border text-left transition flex flex-col justify-between {content.appearance.titleFont === font.id ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}"
                    >
                      <div>
                        <div class="text-base text-white tracking-wide" style="font-family: {font.stack};">
                          {font.label}
                        </div>
                        <div class="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {font.note}
                        </div>
                      </div>
                      <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span class="text-slate-400 font-mono">{font.id}</span>
                        {#if content.appearance.titleFont === font.id}
                          <span class="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 class="w-3 h-3" /> Dipilih
                          </span>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Font Chooser for Navigation -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label for="font-nav-select" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Font Navigasi Papan (Projects, Achivements, Skills)
                  </label>
                  <p class="text-xs text-slate-400">
                    Diterapkan pada keempat elemen teks sudut papan yang dapat di-klik dan di-zoom.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {#each FONT_OPTIONS as font}
                    <button
                      type="button"
                      onclick={() => (content.appearance.navFont = font.id)}
                      class="p-3 rounded-xl border text-left transition flex flex-col justify-between {content.appearance.navFont === font.id ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}"
                    >
                      <div class="text-base text-white tracking-wide" style="font-family: {font.stack};">
                        {font.label}
                      </div>
                      <div class="mt-2 flex items-center justify-between text-[10px]">
                        <span class="text-slate-400 font-mono">{font.id}</span>
                        {#if content.appearance.navFont === font.id}
                          <span class="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 class="w-3 h-3" /> Dipilih
                          </span>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Font Chooser for Body Text -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label for="font-body-select" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Font Penjelasan / Body Text Dalam Papan
                  </label>
                  <p class="text-xs text-slate-400">
                    Diterapkan pada deskripsi proyek, sertifikasi, teks pengantar, dan form kontak.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {#each FONT_OPTIONS as font}
                    <button
                      type="button"
                      onclick={() => (content.appearance.bodyFont = font.id)}
                      class="p-3 rounded-xl border text-left transition flex flex-col justify-between {content.appearance.bodyFont === font.id ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}"
                    >
                      <div class="text-sm text-white" style="font-family: {font.stack};">
                        The quick brown fox jumps over the lazy dog.
                      </div>
                      <div class="mt-2 flex items-center justify-between text-[10px]">
                        <span class="text-slate-300 font-semibold">{font.label}</span>
                        {#if content.appearance.bodyFont === font.id}
                          <span class="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 class="w-3 h-3" /> Dipilih
                          </span>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Zoom Duration & Chalk Color -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                  <label for="zoom-duration-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Durasi Animasi Zoom (milidetik)
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      id="zoom-duration-input"
                      type="range"
                      min="300"
                      max="1400"
                      step="50"
                      bind:value={content.appearance.zoomDuration}
                      class="w-full accent-emerald-400"
                    />
                    <span class="text-xs font-mono text-emerald-400 w-16 text-right">
                      {content.appearance.zoomDuration}ms
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400">
                    Kecepatan transisi kamera saat memperbesar sudut papan tulis. Standar: 700ms.
                  </p>
                </div>

                <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                  <label for="chalk-color-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Warna Kapur Tulis (Chalk Color)
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      id="chalk-color-input"
                      type="color"
                      bind:value={content.appearance.chalkColor}
                      class="w-10 h-10 rounded cursor-pointer border border-slate-700 bg-transparent p-1"
                    />
                    <input
                      type="text"
                      bind:value={content.appearance.chalkColor}
                      class="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <p class="text-[11px] text-slate-400">
                    Warna default kapur putih gading (#ebebeb) memberikan efek kapur alami di atas papan hijau.
                  </p>
                </div>
              </div>
            </div>
          {/if}


<!-- TAB 2: HERO & IDENTITAS DIRI -->
          {#if activeTab === 'hero'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <User class="w-5 h-5 text-sky-400" />
                    Hero & Identitas Diri
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Informasi nama, peran profesional, dan foto avatar di pusat papan tulis
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => saveSection('hero', content.hero)}
                  disabled={isSaving}
                  class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                >
                  <Save class="w-3.5 h-3.5" />
                  Simpan Hero
                </button>
              </div>

              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
                <!-- Name -->
                <div>
                  <label for="hero-name-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Lengkap (Ditulis dengan Kapur)
                  </label>
                  <input
                    id="hero-name-input"
                    type="text"
                    bind:value={content.hero.name}
                    placeholder="MHD FIRDAUS"
                    class="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <!-- Role -->
                <div>
                  <label for="hero-role-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Peran / Pekerjaan (Role)
                  </label>
                  <input
                    id="hero-role-input"
                    type="text"
                    bind:value={content.hero.role}
                    placeholder="FULLSTACK DEVELOPER & UI DESIGNER"
                    class="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <!-- Avatar URL & Auto-WebP Upload -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="hero-avatar-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Foto Avatar (Optimasi Auto WebP)
                    </label>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ⚡ Auto WebP Active
                    </span>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-slate-950 flex-shrink-0 flex items-center justify-center">
                      {#if content.hero.avatarUrl}
                        <img src={content.hero.avatarUrl} alt="Preview Avatar" class="w-full h-full object-cover" />
                      {:else}
                        <User class="w-6 h-6 text-slate-600" />
                      {/if}
                    </div>
                    <div class="flex-1 space-y-2">
                      <div class="flex items-center gap-2">
                        <input
                          id="hero-avatar-input"
                          type="text"
                          bind:value={content.hero.avatarUrl}
                          placeholder="/board/avatar.webp"
                          class="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition"
                        />
                        <label
                          for="avatar-file-upload-input"
                          class="px-3.5 py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 transition cursor-pointer shrink-0"
                          title="Upload PNG/JPG, otomatis dioptimasi & dikonversi ke WebP"
                        >
                          <Upload class="w-3.5 h-3.5" />
                          <span>{isUploadingAvatar ? 'Mengonversi...' : 'Upload & Auto WebP'}</span>
                        </label>
                        <input
                          id="avatar-file-upload-input"
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/*"
                          onchange={handleAvatarUpload}
                          disabled={isUploadingAvatar}
                          class="sr-only"
                        />
                      </div>
                      <p class="text-[11px] text-slate-400">
                        Default: <code class="text-emerald-400">/board/avatar.webp</code> (format WebP ultra ringan ~12 KB). Gambar apa pun yang Anda upload akan otomatis dikonversi ke WebP.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Show Avatar Toggle -->
                <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-xs font-semibold text-slate-200">Tampilkan Foto Avatar di Papan</span>
                    <p class="text-[11px] text-slate-400">
                      Bila dimatikan, hanya teks nama dan peran yang akan tampil di tengah papan.
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={content.hero.showAvatar} class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <!-- Avatar Size & Position Controls -->
                {#if content.hero.showAvatar ?? true}
                  <div class="pt-4 border-t border-slate-800 space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <Move class="w-4 h-4 text-emerald-400" />
                        <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Ukuran & Penyesuaian Posisi Foto Avatar
                        </span>
                      </div>
                      <button
                        type="button"
                        onclick={resetAvatarTransform}
                        class="text-[11px] font-medium text-slate-400 hover:text-emerald-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
                        title="Reset ukuran dan posisi ke standar"
                      >
                        <RotateCcw class="w-3 h-3" />
                        <span>Reset Standar</span>
                      </button>
                    </div>
                    <p class="text-[11px] text-slate-400">
                      Ubah ukuran dan geser posisi horizontal/vertikal foto avatar agar pas di tengah papan tulis secara real-time pada preview kanan.
                    </p>

                    <!-- Slider 1: Avatar Size -->
                    <div class="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-medium text-slate-300 flex items-center gap-1.5">
                          <ZoomIn class="w-3.5 h-3.5 text-emerald-400" />
                          Ukuran / Skala Foto Avatar
                        </span>
                        <div class="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="40"
                            max="200"
                            step="5"
                            bind:value={content.hero.avatarSize}
                            class="w-16 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-white text-center font-mono focus:border-emerald-500 focus:outline-none"
                          />
                          <span class="text-xs text-slate-400 font-semibold">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="200"
                        step="5"
                        bind:value={content.hero.avatarSize}
                        class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div class="flex items-center gap-1.5 pt-1">
                        <span class="text-[10px] text-slate-400 mr-1">Preset:</span>
                        {#each [75, 100, 120, 140] as preset}
                          <button
                            type="button"
                            onclick={() => (content.hero.avatarSize = preset)}
                            class="px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer {content.hero.avatarSize === preset ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}"
                          >
                            {preset}%
                          </button>
                        {/each}
                      </div>
                    </div>

                    <!-- Sliders 2 & 3: Position Offset X and Y -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <!-- Offset X (Horizontal) -->
                      <div class="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                          <span class="font-medium text-slate-300">Posisi Horizontal (Geser X)</span>
                          <span class="text-xs font-mono text-emerald-400 font-semibold">{content.hero.avatarOffsetX ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          step="1"
                          bind:value={content.hero.avatarOffsetX}
                          class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div class="flex items-center justify-between text-[10px] text-slate-400">
                          <button
                            type="button"
                            onclick={() => nudgeAvatar(-5, 0)}
                            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            ← Geser Kiri
                          </button>
                          <button
                            type="button"
                            onclick={() => (content.hero.avatarOffsetX = 0)}
                            class="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                          >
                            Tengah
                          </button>
                          <button
                            type="button"
                            onclick={() => nudgeAvatar(5, 0)}
                            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            Kanan →
                          </button>
                        </div>
                      </div>

                      <!-- Offset Y (Vertical) -->
                      <div class="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                          <span class="font-medium text-slate-300">Posisi Vertikal (Geser Y)</span>
                          <span class="text-xs font-mono text-emerald-400 font-semibold">{content.hero.avatarOffsetY ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          step="1"
                          bind:value={content.hero.avatarOffsetY}
                          class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div class="flex items-center justify-between text-[10px] text-slate-400">
                          <button
                            type="button"
                            onclick={() => nudgeAvatar(0, -5)}
                            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            ↑ Geser Atas
                          </button>
                          <button
                            type="button"
                            onclick={() => (content.hero.avatarOffsetY = 0)}
                            class="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                          >
                            Tengah
                          </button>
                          <button
                            type="button"
                            onclick={() => nudgeAvatar(0, 5)}
                            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            Bawah ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}

                <!-- CV (Curriculum Vitae) Button & File Settings -->
                <div class="pt-5 border-t border-slate-800 space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FileText class="w-4 h-4 text-emerald-400" />
                        Fitur CV / Resume (Tepat di Bawah Peran/Role)
                      </h3>
                      <p class="text-[11px] text-slate-400 mt-0.5">
                        Menampilkan tombol unduh atau lihat Curriculum Vitae tepat di bawah tulisan peran pada chalkboard.
                      </p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" bind:checked={content.hero.showCv} class="sr-only peer" />
                      <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {#if content.hero.showCv ?? true}
                    <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-4">
                      <!-- CV Label -->
                      <div>
                        <label for="hero-cv-label-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Teks Label Tombol CV
                        </label>
                        <input
                          id="hero-cv-label-input"
                          type="text"
                          bind:value={content.hero.cvLabel}
                          placeholder="Curriculum Vitae"
                          class="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                        />
                        <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span class="text-[10px] text-slate-400 mr-1">Contoh Cepat:</span>
                          {#each ['Curriculum Vitae', 'Lihat CV', 'Unduh CV / Resume', 'Download CV'] as sample}
                            <button
                              type="button"
                              onclick={() => (content.hero.cvLabel = sample)}
                              class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                            >
                              {sample}
                            </button>
                          {/each}
                        </div>
                      </div>

                      <!-- CV URL / Path -->
                      <div>
                        <label for="hero-cv-url-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          URL / Link File CV
                        </label>
                        <div class="flex items-center gap-2">
                          <input
                            id="hero-cv-url-input"
                            type="text"
                            bind:value={content.hero.cvUrl}
                            placeholder="/cv.pdf"
                            class="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition"
                          />
                          {#if content.hero.cvUrl}
                            <a
                              href={content.hero.cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              class="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-400 flex items-center gap-1 transition cursor-pointer"
                              title="Cek URL CV"
                            >
                              <ExternalLink class="w-3.5 h-3.5" />
                              <span>Test Link</span>
                            </a>
                          {/if}
                        </div>
                        <p class="text-[11px] text-slate-400 mt-1">
                          Gunakan <code class="text-emerald-400">/cv.pdf</code> untuk file lokal, atau masukkan link eksternal (Google Drive, Dropbox, LinkedIn, dll).
                        </p>
                      </div>

                      <!-- Upload PDF File directly -->
                      <div class="pt-3 border-t border-slate-800/80">
                        <span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Upload File PDF CV Baru
                        </span>
                        <div class="flex items-center gap-3">
                          <label for="cv-file-upload-input" class="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 transition cursor-pointer">
                            <Upload class="w-3.5 h-3.5" />
                            <span>{isUploadingCv ? 'Mengunggah...' : 'Pilih File PDF'}</span>
                          </label>
                          <input
                            id="cv-file-upload-input"
                            type="file"
                            accept=".pdf,application/pdf"
                            onchange={handleCvFileUpload}
                            disabled={isUploadingCv}
                            class="sr-only"
                          />
                          <span class="text-[11px] text-slate-400">
                            File akan otomatis disimpan sebagai <code class="text-emerald-400">/cv.pdf</code>.
                          </span>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}

          <!-- TAB: HUJAN RUMUS MATEMATIKA (BACKGROUND FX) -->
          {#if activeTab === 'mathRain'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <CloudRain class="w-5 h-5 text-cyan-400" />
                    Hujan Rumus Matematika (Background FX)
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Kustomisasi animasi hujan simbol matematika di luar papan tulis (transparansi, ukuran, jumlah, dan efek pantul).
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => saveSection('mathRain', content.mathRain)}
                  disabled={isSaving}
                  class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  <Save class="w-3.5 h-3.5" />
                  Simpan Hujan Rumus
                </button>
              </div>

              <!-- Main Toggle Card -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-sm font-semibold text-slate-200">Aktifkan Animasi Hujan Rumus</span>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Menampilkan partikel rumus matematika yang melayang turun di luar papan tulis pada background dinding.
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={content.mathRain.enabled} class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span class="text-sm font-semibold text-slate-200">Efek Pantulan di Lantai (Floor Bounce)</span>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Rumus akan memantul kecil secara elastis saat mendarat di lantai, diam sesaat, lalu menghilang perlahan.
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={content.mathRain.bounce} class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>

              <!-- Sliders Card: Transparency, Size, Density, Speed -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-6">
                <!-- 1. TRANSPARENCY / OPACITY SLIDER -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="rain-opacity-slider" class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Transparansi / Opacity Warna</span>
                      <span class="text-slate-500">({Math.round((content.mathRain.opacity ?? 0.45) * 100)}%)</span>
                    </label>
                    <span class="text-xs font-mono font-bold text-cyan-400">
                      {Math.round((content.mathRain.opacity ?? 0.45) * 100)}%
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] text-slate-500 w-12 text-left">5%</span>
                    <input
                      id="rain-opacity-slider"
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      bind:value={content.mathRain.opacity}
                      class="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <span class="text-[11px] text-slate-500 w-12 text-right">100%</span>
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>5% (Sangat Samar)</span>
                    <span>45% (Rekomendasi Kapur)</span>
                    <span>100% (Sangat Terang)</span>
                  </div>
                </div>

                <!-- 2. SYMBOL SIZE SLIDER -->
                <div class="pt-4 border-t border-slate-800/80">
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="rain-size-slider" class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Ukuran Simbol Rumus</span>
                      <span class="text-slate-500">({content.mathRain.size ?? 20}px)</span>
                    </label>
                    <span class="text-xs font-mono font-bold text-emerald-400">
                      {content.mathRain.size ?? 20} px
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] text-slate-500 w-12 text-left">10px</span>
                    <input
                      id="rain-size-slider"
                      type="range"
                      min="10"
                      max="40"
                      step="1"
                      bind:value={content.mathRain.size}
                      class="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <span class="text-[11px] text-slate-500 w-12 text-right">40px</span>
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>10px (Kecil Halus)</span>
                    <span>20px (Default Rekomendasi)</span>
                    <span>40px (Besar Menonjol)</span>
                  </div>
                </div>

                <!-- 3. PARTICLE DENSITY SLIDER -->
                <div class="pt-4 border-t border-slate-800/80">
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="rain-density-slider" class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Jumlah Icon Rumus yang Turun</span>
                      <span class="text-slate-500">({content.mathRain.density ?? 50} partikel)</span>
                    </label>
                    <span class="text-xs font-mono font-bold text-amber-400">
                      {content.mathRain.density ?? 50} Simbol
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] text-slate-500 w-12 text-left">10</span>
                    <input
                      id="rain-density-slider"
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      bind:value={content.mathRain.density}
                      class="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <span class="text-[11px] text-slate-500 w-12 text-right">150</span>
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>10 (Jarang / Tenang)</span>
                    <span>50 (Seimbang)</span>
                    <span>150 (Lebat / Padat)</span>
                  </div>
                </div>

                <!-- 4. SPEED SLIDER -->
                <div class="pt-4 border-t border-slate-800/80">
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="rain-speed-slider" class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Kecepatan Jatuh (Speed Multiplier)</span>
                      <span class="text-slate-500">({(content.mathRain.speed ?? 1).toFixed(1)}x)</span>
                    </label>
                    <span class="text-xs font-mono font-bold text-sky-400">
                      {(content.mathRain.speed ?? 1).toFixed(1)}x
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] text-slate-500 w-12 text-left">0.5x</span>
                    <input
                      id="rain-speed-slider"
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      bind:value={content.mathRain.speed}
                      class="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                    <span class="text-[11px] text-slate-500 w-12 text-right">2.5x</span>
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0.5x (Lambat / Melayang)</span>
                    <span>1.0x (Normal)</span>
                    <span>2.5x (Cepat)</span>
                  </div>
                </div>
              </div>

              <!-- Color Picker Card -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Warna Kapur Rumus
                </span>
                <div class="flex items-center gap-4">
                  <input
                    type="color"
                    bind:value={content.mathRain.color}
                    class="w-12 h-10 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    bind:value={content.mathRain.color}
                    class="w-32 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <div class="flex gap-2 flex-wrap items-center">
                    {#each [
                      { label: 'Putih Kapur', hex: '#ffffff' },
                      { label: 'Kapur Alami', hex: '#ebebeb' },
                      { label: 'Cyan Neon', hex: '#67e8f9' },
                      { label: 'Hijau Kapur', hex: '#86efac' },
                      { label: 'Kuning Kapur', hex: '#fef08a' }
                    ] as preset}
                      <button
                        type="button"
                        onclick={() => (content.mathRain.color = preset.hex)}
                        class="px-2.5 py-1 rounded text-xs border border-slate-700 hover:border-slate-500 text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span class="w-2.5 h-2.5 rounded-full" style="background-color: {preset.hex}"></span>
                        <span>{preset.label}</span>
                      </button>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Preset Configurations -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Pilihan Preset Cepat
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onclick={() => {
                      content.mathRain.density = 25;
                      content.mathRain.size = 16;
                      content.mathRain.opacity = 0.3;
                      content.mathRain.speed = 0.8;
                      content.mathRain.color = '#ffffff';
                      content.mathRain.bounce = true;
                    }}
                    class="p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950 text-left transition cursor-pointer group"
                  >
                    <div class="text-xs font-bold text-white group-hover:text-cyan-400">Minimalis / Halus</div>
                    <div class="text-[11px] text-slate-400 mt-1">25 simbol, 16px, opacity 30%, speed 0.8x. Sangat tenang di background.</div>
                  </button>

                  <button
                    type="button"
                    onclick={() => {
                      content.mathRain.density = 50;
                      content.mathRain.size = 20;
                      content.mathRain.opacity = 0.45;
                      content.mathRain.speed = 1.0;
                      content.mathRain.color = '#ffffff';
                      content.mathRain.bounce = true;
                    }}
                    class="p-3 rounded-lg border border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/10 hover:bg-cyan-950/20 text-left transition cursor-pointer group"
                  >
                    <div class="text-xs font-bold text-cyan-300">Default Rekomendasi</div>
                    <div class="text-[11px] text-slate-400 mt-1">50 simbol, 20px, opacity 45%, speed 1.0x. Seimbang dan artistik.</div>
                  </button>

                  <button
                    type="button"
                    onclick={() => {
                      content.mathRain.density = 90;
                      content.mathRain.size = 24;
                      content.mathRain.opacity = 0.7;
                      content.mathRain.speed = 1.3;
                      content.mathRain.color = '#ffffff';
                      content.mathRain.bounce = true;
                    }}
                    class="p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950 text-left transition cursor-pointer group"
                  >
                    <div class="text-xs font-bold text-white group-hover:text-amber-400">Deras & Menonjol</div>
                    <div class="text-[11px] text-slate-400 mt-1">90 simbol, 24px, opacity 70%, speed 1.3x. Efek hujan lebat yang dramatis.</div>
                  </button>
                </div>
              </div>
            </div>
          {/if}

          <!-- TAB 3: NAVIGASI SUDUT PAPAN -->
          {#if activeTab === 'nav'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders class="w-5 h-5 text-purple-400" />
                    Label Navigasi Sudut Papan
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Ubah teks kapur tombol navigasi interaktif pada 4 sudut papan tulis
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => saveSection('nav', content.nav)}
                  disabled={isSaving}
                  class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                >
                  <Save class="w-3.5 h-3.5" />
                  Simpan Navigasi
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Projects Label (Kiri Atas) -->
                <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                  <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Sudut Kiri Atas
                  </span>
                  <label for="nav-projects-input" class="block text-xs font-semibold text-slate-200">
                    Label Proyek
                  </label>
                  <input
                    id="nav-projects-input"
                    type="text"
                    bind:value={content.nav.projects}
                    placeholder="Projects"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                  <p class="text-[11px] text-slate-400">
                    Saat di-klik, kamera akan zoom in ke kiri atas dan membuka detail daftar proyek.
                  </p>
                </div>

                <!-- Achievements Label (Kiri Bawah) -->
                <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                  <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Sudut Kiri Bawah
                  </span>
                  <label for="nav-achievements-input" class="block text-xs font-semibold text-slate-200">
                    Label Prestasi / Sertifikat
                  </label>
                  <input
                    id="nav-achievements-input"
                    type="text"
                    bind:value={content.nav.achievements}
                    placeholder="Achivements"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                  <p class="text-[11px] text-slate-400">
                    Sesuai tulisan asli pada mockup PSD: "Achivements".
                  </p>
                </div>

                <!-- Skills Label (Kanan Atas) -->
                <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                  <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Sudut Kanan Atas
                  </span>
                  <label for="nav-skills-input" class="block text-xs font-semibold text-slate-200">
                    Label Keahlian
                  </label>
                  <input
                    id="nav-skills-input"
                    type="text"
                    bind:value={content.nav.skills}
                    placeholder="Skills"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                  <p class="text-[11px] text-slate-400">
                    Membuka matrix keahlian dan bahasa pemrograman yang dikuasai.
                  </p>
                </div>

                <!-- Contact Label (Kanan Bawah) -->
                <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                  <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Sudut Kanan Bawah
                  </span>
                  <label for="nav-contact-input" class="block text-xs font-semibold text-slate-200">
                    Label Kontak
                  </label>
                  <input
                    id="nav-contact-input"
                    type="text"
                    bind:value={content.nav.contact}
                    placeholder="Contact"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                  <p class="text-[11px] text-slate-400">
                    Terletak di samping ikon wifi/gelombang pada sudut kanan bawah.
                  </p>
                </div>
              </div>
            </div>
          {/if}


<!-- TAB 4: PROJECTS MANAGER -->
          {#if activeTab === 'projects'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <FolderKanban class="w-5 h-5 text-amber-400" />
                    Manajemen Proyek Portofolio
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Daftar karya dan aplikasi yang tampil saat pengunjung membuka board Projects
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onclick={addProject}
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Plus class="w-3.5 h-3.5 text-emerald-400" />
                    Tambah Proyek
                  </button>
                  <button
                    type="button"
                    onclick={() => saveSection('projects', content.projects)}
                    disabled={isSaving}
                    class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                  >
                    <Save class="w-3.5 h-3.5" />
                    Simpan Proyek
                  </button>
                </div>
              </div>

              <!-- Intro text -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <label for="intro-projects-input" class="block text-xs font-semibold text-slate-300">
                  Teks Pengantar Halaman Projects
                </label>
                <textarea
                  id="intro-projects-input"
                  rows="2"
                  bind:value={content.intros.projects}
                  class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none transition resize-none"
                ></textarea>
              </div>

              <!-- Project Cards List -->
              <div class="space-y-4">
                {#if content.projects.length === 0}
                  <div class="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                    Belum ada proyek. Klik tombol "Tambah Proyek" di atas.
                  </div>
                {/if}

                {#each content.projects as proj, idx (proj.id)}
                  <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 relative group">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-mono text-emerald-400 font-semibold">
                        #{idx + 1} — {proj.title || 'Tanpa Judul'}
                      </span>
                      <button
                        type="button"
                        onclick={() => removeProject(proj.id)}
                        class="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1.5 rounded-lg transition"
                        title="Hapus proyek"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div class="md:col-span-2">
                        <label for="proj-title-{proj.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Judul Proyek</label>
                        <input
                          id="proj-title-{proj.id}"
                          type="text"
                          bind:value={proj.title}
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label for="proj-year-{proj.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Tahun</label>
                        <input
                          id="proj-year-{proj.id}"
                          type="text"
                          bind:value={proj.year}
                          placeholder="2026"
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label for="proj-desc-{proj.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Deskripsi Proyek</label>
                      <textarea
                        id="proj-desc-{proj.id}"
                        rows="2"
                        bind:value={proj.description}
                        class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
                      ></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label for="proj-tags-{proj.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Tech Stack (pisahkan koma)</label>
                        <input
                          id="proj-tags-{proj.id}"
                          type="text"
                          value={proj.tags.join(', ')}
                          oninput={(e) => updateProjectTags(proj, (e.target as HTMLInputElement).value)}
                          placeholder="Svelte, Bun, Elysia"
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label for="proj-repo-{proj.id}" class="block text-[11px] font-medium text-slate-400 mb-1">GitHub / Repo URL</label>
                        <input
                          id="proj-repo-{proj.id}"
                          type="text"
                          bind:value={proj.repoUrl}
                          placeholder="https://github.com/..."
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label for="proj-live-{proj.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Live Demo URL</label>
                        <input
                          id="proj-live-{proj.id}"
                          type="text"
                          bind:value={proj.liveUrl}
                          placeholder="https://..."
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- TAB 5: ACHIEVEMENTS MANAGER -->
          {#if activeTab === 'achievements'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <Award class="w-5 h-5 text-yellow-400" />
                    Prestasi & Sertifikasi
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Daftar penghargaan, sertifikasi teknis, atau lomba yang ditampilkan di sudut kiri bawah
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onclick={addAchievement}
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Plus class="w-3.5 h-3.5 text-emerald-400" />
                    Tambah Prestasi
                  </button>
                  <button
                    type="button"
                    onclick={() => saveSection('achievements', content.achievements)}
                    disabled={isSaving}
                    class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                  >
                    <Save class="w-3.5 h-3.5" />
                    Simpan Prestasi
                  </button>
                </div>
              </div>

              <!-- Intro text -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <label for="intro-achievements-input" class="block text-xs font-semibold text-slate-300">
                  Teks Pengantar Halaman Achievements
                </label>
                <textarea
                  id="intro-achievements-input"
                  rows="2"
                  bind:value={content.intros.achievements}
                  class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none transition resize-none"
                ></textarea>
              </div>

              <div class="space-y-4">
                {#if content.achievements.length === 0}
                  <div class="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                    Belum ada prestasi. Klik tombol "Tambah Prestasi" di atas.
                  </div>
                {/if}

                {#each content.achievements as ach, idx (ach.id)}
                  <div
                    role="listitem"
                    class="bg-slate-900/60 border rounded-xl p-5 space-y-4 transition-all duration-150 {draggedAchIndex === idx ? 'opacity-40 border-dashed border-emerald-500/80 scale-[0.99]' : dragOverAchIndex === idx ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] bg-slate-800/80' : 'border-slate-800'}"
                    ondragover={(e) => handleAchDragOver(e, idx)}
                    ondragleave={handleAchDragLeave}
                    ondrop={(e) => handleAchDrop(e, idx)}
                  >
                    <div
                      role="toolbar"
                      tabindex="0"
                      class="flex items-center justify-between pb-3 border-b border-slate-800/60 cursor-grab active:cursor-grabbing select-none"
                      draggable="true"
                      ondragstart={(e) => handleAchDragStart(e, idx)}
                      ondragend={handleAchDragEnd}
                      title="Klik & seret untuk memindahkan urutan posisi prestasi"
                    >
                      <div class="flex items-center gap-2">
                        <div class="text-slate-500 hover:text-emerald-400 p-1 rounded transition" title="Seret untuk memindahkan urutan">
                          <GripVertical class="w-4 h-4" />
                        </div>

                        <div class="flex items-center gap-0.5">
                          <button
                            type="button"
                            onclick={(e) => { e.stopPropagation(); moveAchievement(idx, idx - 1); }}
                            disabled={idx === 0}
                            class="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition cursor-pointer"
                            title="Pindah ke atas"
                          >
                            <ArrowUp class="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onclick={(e) => { e.stopPropagation(); moveAchievement(idx, idx + 1); }}
                            disabled={idx === content.achievements.length - 1}
                            class="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition cursor-pointer"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown class="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span class="text-xs font-mono text-yellow-400 font-semibold ml-1">
                          #{idx + 1} — {ach.title || 'Tanpa Judul'}
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                          Tarik bar ini untuk geser posisi
                        </span>
                        <button
                          type="button"
                          onclick={(e) => { e.stopPropagation(); removeAchievement(ach.id); }}
                          class="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1.5 rounded-lg transition"
                          title="Hapus pencapaian"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div class="md:col-span-2">
                        <label for="ach-title-{ach.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Nama Prestasi / Sertifikasi</label>
                        <input
                          id="ach-title-{ach.id}"
                          type="text"
                          bind:value={ach.title}
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label for="ach-issuer-{ach.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Penerbit / Institusi</label>
                        <input
                          id="ach-issuer-{ach.id}"
                          type="text"
                          bind:value={ach.issuer}
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label for="ach-year-{ach.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Tahun</label>
                        <input
                          id="ach-year-{ach.id}"
                          type="text"
                          bind:value={ach.year}
                          placeholder="2025"
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label for="ach-desc-{ach.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Keterangan Tambahan</label>
                      <textarea
                        id="ach-desc-{ach.id}"
                        rows="2"
                        bind:value={ach.description}
                        class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- TAB 6: SKILLS MANAGER -->
          {#if activeTab === 'skills'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <Cpu class="w-5 h-5 text-teal-400" />
                    Kategori Keahlian & Teknologi (Skills)
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Atur kelompok keahlian teknis (Frontend, Backend, DevOps, Tools) dan daftar itemnya
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onclick={addSkillGroup}
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Plus class="w-3.5 h-3.5 text-emerald-400" />
                    Tambah Kategori
                  </button>
                  <button
                    type="button"
                    onclick={() => saveSection('skills', content.skills)}
                    disabled={isSaving}
                    class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                  >
                    <Save class="w-3.5 h-3.5" />
                    Simpan Skills
                  </button>
                </div>
              </div>

              <!-- Intro text -->
              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <label for="intro-skills-input" class="block text-xs font-semibold text-slate-300">
                  Teks Pengantar Halaman Skills
                </label>
                <textarea
                  id="intro-skills-input"
                  rows="2"
                  bind:value={content.intros.skills}
                  class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none transition resize-none"
                ></textarea>
              </div>

              <div class="space-y-4">
                {#if content.skills.length === 0}
                  <div class="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                    Belum ada kategori keahlian. Klik "Tambah Kategori" di atas.
                  </div>
                {/if}

                {#each content.skills as group, idx (group.id)}
                  <div
                    role="listitem"
                    class="bg-slate-900/60 border rounded-xl p-5 space-y-3 transition-all duration-150 {draggedSkillIndex === idx ? 'opacity-40 border-dashed border-teal-500/80 scale-[0.99]' : dragOverSkillIndex === idx ? 'border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.25)] bg-slate-800/80' : 'border-slate-800'}"
                    ondragover={(e) => handleSkillDragOver(e, idx)}
                    ondragleave={handleSkillDragLeave}
                    ondrop={(e) => handleSkillDrop(e, idx)}
                  >
                    <div
                      role="toolbar"
                      tabindex="0"
                      class="flex items-center justify-between pb-3 border-b border-slate-800/60 cursor-grab active:cursor-grabbing select-none"
                      draggable="true"
                      ondragstart={(e) => handleSkillDragStart(e, idx)}
                      ondragend={handleSkillDragEnd}
                      title="Klik & seret untuk memindahkan urutan posisi kategori"
                    >
                      <div class="flex items-center gap-2">
                        <div class="text-slate-500 hover:text-teal-400 p-1 rounded transition" title="Seret untuk memindahkan urutan">
                          <GripVertical class="w-4 h-4" />
                        </div>

                        <div class="flex items-center gap-0.5">
                          <button
                            type="button"
                            onclick={(e) => { e.stopPropagation(); moveSkillGroup(idx, idx - 1); }}
                            disabled={idx === 0}
                            class="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition cursor-pointer"
                            title="Pindah ke atas"
                          >
                            <ArrowUp class="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onclick={(e) => { e.stopPropagation(); moveSkillGroup(idx, idx + 1); }}
                            disabled={idx === content.skills.length - 1}
                            class="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition cursor-pointer"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown class="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span class="text-xs font-mono text-teal-400 font-semibold ml-1">
                          Kelompok #{idx + 1} — {group.category || 'Tanpa Kategori'}
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                          Tarik bar ini untuk geser posisi
                        </span>
                        <button
                          type="button"
                          onclick={(e) => { e.stopPropagation(); removeSkillGroup(group.id); }}
                          class="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1.5 rounded-lg transition"
                          title="Hapus kategori"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label for="skill-cat-{group.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Nama Kategori</label>
                        <input
                          id="skill-cat-{group.id}"
                          type="text"
                          bind:value={group.category}
                          placeholder="Contoh: Frontend Engineering"
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div class="md:col-span-2">
                        <label for="skill-items-{group.id}" class="block text-[11px] font-medium text-slate-400 mb-1">Daftar Keahlian (pisahkan dengan koma)</label>
                        <input
                          id="skill-items-{group.id}"
                          type="text"
                          value={group.items.join(', ')}
                          oninput={(e) => updateSkillItems(group, (e.target as HTMLInputElement).value)}
                          placeholder="Svelte 5, TypeScript, Tailwind CSS, Next.js"
                          class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <!-- Chips preview -->
                    <div class="flex flex-wrap gap-1.5 pt-1">
                      {#each group.items as item}
                        <span class="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700/80">
                          {item}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- TAB 7: TAUTAN SOSIAL MEDIA -->
          {#if activeTab === 'socials'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <Share2 class="w-5 h-5 text-pink-400" />
                    Tautan Sosial Media
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Tautan akun GitHub, LinkedIn, dan Instagram yang diwakili oleh 3 ikon SVG di sudut kanan bawah papan
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => saveSection('socials', content.socials)}
                  disabled={isSaving}
                  class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                >
                  <Save class="w-3.5 h-3.5" />
                  Simpan Sosial
                </button>
              </div>

              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <!-- GitHub -->
                <div>
                  <label for="social-github-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    GitHub Profile URL
                  </label>
                  <input
                    id="social-github-input"
                    type="url"
                    bind:value={content.socials.github}
                    placeholder="https://github.com/mhdfi"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <!-- LinkedIn -->
                <div>
                  <label for="social-linkedin-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    id="social-linkedin-input"
                    type="url"
                    bind:value={content.socials.linkedin}
                    placeholder="https://linkedin.com/in/mhdfirdaus"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <!-- Instagram -->
                <div>
                  <label for="social-instagram-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Instagram Profile URL
                  </label>
                  <input
                    id="social-instagram-input"
                    type="url"
                    bind:value={content.socials.instagram}
                    placeholder="https://instagram.com/mhdfirdaus"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          {/if}


<!-- TAB 8: KONTAK & PENGANTAR -->
          {#if activeTab === 'contact'}
            <div class="space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <Mail class="w-5 h-5 text-indigo-400" />
                    Pengaturan Kontak
                  </h2>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Alamat email dan formulir pesan langsung di dalam sudut Contact
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => saveSection('contact', content.contact)}
                  disabled={isSaving}
                  class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
                >
                  <Save class="w-3.5 h-3.5" />
                  Simpan Kontak
                </button>
              </div>

              <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label for="contact-email-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Alamat Email Utama
                  </label>
                  <input
                    id="contact-email-input"
                    type="email"
                    bind:value={content.contact.email}
                    placeholder="mhd.firdaus@example.com"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label for="contact-heading-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Judul Ajakan Kontak
                  </label>
                  <input
                    id="contact-heading-input"
                    type="text"
                    bind:value={content.contact.heading}
                    placeholder="Mari Berdiskusi & Berkolaborasi"
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label for="contact-desc-input" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Teks Deskripsi Kontak
                  </label>
                  <textarea
                    id="contact-desc-input"
                    rows="3"
                    bind:value={content.contact.description}
                    class="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none transition resize-none"
                  ></textarea>
                </div>

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-xs font-semibold text-slate-200">Aktifkan Formulir Pengiriman Pesan</span>
                    <p class="text-[11px] text-slate-400">
                      Pengunjung dapat langsung mengetik dan mengirim pesan melalui board kontak.
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={content.contact.formEnabled} class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>
          {/if}

          <!-- TAB 10: SECURITY & CREDENTIALS (Ubah Username & Password) -->
          {#if activeTab === 'security'}
            <div class="space-y-6 max-w-3xl">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <KeyRound class="w-5 h-5 text-emerald-400" />
                    <span>Akun & Keamanan Administrator</span>
                  </h2>
                  <p class="text-xs text-slate-400 mt-1">
                    Kelola nama pengguna (username) dan kata sandi (password) untuk autentikasi portal dashboard admin.
                  </p>
                </div>
              </div>

              <!-- Security Information Banner -->
              <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-start gap-3">
                <ShieldCheck class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div class="space-y-1">
                  <p class="font-semibold text-slate-200">Enkripsi Kredensial & Proteksi Multi-Lapis</p>
                  <p class="text-slate-400 text-[11px] leading-relaxed">
                    Password Anda diamankan dengan algoritma hashing <strong class="text-emerald-300">Scrypt + Salt 128-bit</strong> dan sesi login terenkripsi menggunakan <strong class="text-emerald-300">HMAC-SHA256 Signed Token</strong>. Demi keamanan, Anda diwajibkan memasukkan password saat ini untuk memverifikasi identitas sebelum perubahan disimpan.
                  </p>
                </div>
              </div>

              <!-- Success Alert -->
              {#if secSuccess}
                <div class="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div class="leading-relaxed">
                    {secSuccess}
                  </div>
                </div>
              {/if}

              <!-- Error Alert -->
              {#if secError}
                <div class="p-3.5 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle class="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div class="leading-relaxed">
                    {secError}
                  </div>
                </div>
              {/if}

              <!-- Form Ubah Kredensial -->
              <form onsubmit={handleUpdateCredentials} class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
                <!-- Info Akun Saat Ini -->
                <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <User class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Username Terdaftar</p>
                      <p class="text-sm font-mono font-bold text-white mt-0.5">{currentUser?.username || 'admin'}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] px-2.5 py-1 rounded-full font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck class="w-3 h-3 text-emerald-400" />
                      Role: Admin
                    </span>
                  </div>
                </div>

                <!-- 1. Password Saat Ini (Wajib) -->
                <div>
                  <label for="sec-current-pass" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password Saat Ini <span class="text-rose-400">*</span>
                  </label>
                  <p class="text-[11px] text-slate-500 mb-2">
                    Masukkan password yang sedang aktif untuk mengonfirmasi bahwa Anda adalah pemilik sah akun ini.
                  </p>
                  <div class="relative max-w-md">
                    <input
                      id="sec-current-pass"
                      type={secShowCurrentPassword ? 'text' : 'password'}
                      bind:value={secCurrentPassword}
                      placeholder="Masukkan password saat ini"
                      required
                      class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    />
                    <Lock class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <button
                      type="button"
                      onclick={() => (secShowCurrentPassword = !secShowCurrentPassword)}
                      tabindex="-1"
                      class="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                      aria-label="Toggle lihat password"
                    >
                      {#if secShowCurrentPassword}
                        <EyeOff class="w-4 h-4" />
                      {:else}
                        <Eye class="w-4 h-4" />
                      {/if}
                    </button>
                  </div>
                </div>

                <div class="border-t border-slate-800/80 pt-5 space-y-5">
                  <!-- 2. Ganti Username (Opsional) -->
                  <div>
                    <label for="sec-new-user" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Username Baru (Opsional)
                    </label>
                    <p class="text-[11px] text-slate-500 mb-2">
                      Biarkan kosong jika tidak ingin mengubah username (minimal 3 karakter).
                    </p>
                    <div class="relative max-w-md">
                      <input
                        id="sec-new-user"
                        type="text"
                        bind:value={secNewUsername}
                        placeholder={currentUser?.username || 'Masukkan username baru'}
                        class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition font-mono"
                      />
                      <User class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <!-- 3. Ganti Password (Opsional) -->
                  <div>
                    <label for="sec-new-pass" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Password Baru (Opsional)
                    </label>
                    <p class="text-[11px] text-slate-500 mb-2">
                      Minimal 8 karakter. Biarkan kosong jika hanya ingin mengubah username.
                    </p>
                    <div class="relative max-w-md">
                      <input
                        id="sec-new-pass"
                        type={secShowNewPassword ? 'text' : 'password'}
                        bind:value={secNewPassword}
                        placeholder="Masukkan password baru"
                        class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                      />
                      <KeyRound class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <button
                        type="button"
                        onclick={() => (secShowNewPassword = !secShowNewPassword)}
                        tabindex="-1"
                        class="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                        aria-label="Toggle lihat password baru"
                      >
                        {#if secShowNewPassword}
                          <EyeOff class="w-4 h-4" />
                        {:else}
                          <Eye class="w-4 h-4" />
                        {/if}
                      </button>
                    </div>

                    <!-- Password strength helper -->
                    {#if secNewPassword}
                      <div class="mt-2.5 flex items-center gap-2 text-[11px] max-w-md">
                        <span class="text-slate-400">Kekuatan:</span>
                        {#if secNewPassword.length < 8}
                          <span class="text-rose-400 font-semibold">Terlalu Pendek (&lt; 8 Karakter)</span>
                        {:else if /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/.test(secNewPassword)}
                          <span class="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 class="w-3.5 h-3.5" /> Sangat Kuat (Huruf + Angka + Simbol)
                          </span>
                        {:else}
                          <span class="text-amber-400 font-semibold">Sedang (Tambahkan kombinasi angka atau simbol)</span>
                        {/if}
                      </div>
                    {/if}
                  </div>

                  <!-- 4. Konfirmasi Password Baru -->
                  {#if secNewPassword}
                    <div>
                      <label for="sec-confirm-pass" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Konfirmasi Password Baru <span class="text-rose-400">*</span>
                      </label>
                      <div class="relative max-w-md">
                        <input
                          id="sec-confirm-pass"
                          type={secShowConfirmPassword ? 'text' : 'password'}
                          bind:value={secConfirmPassword}
                          placeholder="Ketik ulang password baru"
                          required={!!secNewPassword}
                          class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                        />
                        <Lock class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <button
                          type="button"
                          onclick={() => (secShowConfirmPassword = !secShowConfirmPassword)}
                          tabindex="-1"
                          class="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                          aria-label="Toggle lihat konfirmasi password"
                        >
                          {#if secShowConfirmPassword}
                            <EyeOff class="w-4 h-4" />
                          {:else}
                            <Eye class="w-4 h-4" />
                          {/if}
                        </button>
                      </div>
                      {#if secConfirmPassword && secNewPassword !== secConfirmPassword}
                        <p class="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                          <AlertCircle class="w-3.5 h-3.5" /> Konfirmasi password tidak cocok!
                        </p>
                      {/if}
                    </div>
                  {/if}
                </div>

                <!-- Submit Button -->
                <div class="pt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingCredentials}
                    class="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {#if isUpdatingCredentials}
                      <RefreshCw class="w-4 h-4 animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    {:else}
                      <Save class="w-4 h-4" />
                      <span>Simpan Perubahan Kredensial</span>
                    {/if}
                  </button>
                </div>
              </form>
            </div>
          {/if}
        {/if}
      </main>

      <!-- RIGHT SIDEBAR: PERSISTENT LIVE CHALKBOARD PREVIEW PANE FOR ALL TABS -->
      <aside class="w-full lg:w-[410px] xl:w-[470px] 2xl:w-[520px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/80 p-4 xl:p-5 flex flex-col gap-4 overflow-y-auto">
        <!-- Preview Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Live Preview</h3>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">Real-time</span>
          </div>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            class="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 transition cursor-pointer"
            title="Buka Website Portofolio di Tab Baru"
          >
            <span>Buka Web</span>
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>

        <!-- View Mode Switcher -->
        <div class="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px]">
          <button
            type="button"
            onclick={() => (previewMode = 'board')}
            class="py-1 px-2 rounded-md font-medium transition cursor-pointer text-center {previewMode === 'board' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}"
          >
            Papan Utama
          </button>
          <button
            type="button"
            onclick={() => (previewMode = 'section')}
            class="py-1 px-2 rounded-md font-medium transition cursor-pointer text-center {previewMode === 'section' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}"
          >
            Modal ({activeTab.toUpperCase()})
          </button>
        </div>

        <!-- PREVIEW CONTAINER 1: AUTHENTIC CHALKBOARD SCENE -->
        {#if previewMode === 'board'}
          <div
            class="w-full rounded-xl overflow-hidden border border-slate-800/80 p-2 sm:p-3 relative shadow-2xl flex items-center justify-center select-none"
            style="
              background-image: radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%), url('/board/wall.webp');
              background-size: cover;
              background-position: center;
            "
          >
            <!-- Background Math Formula Rain in Live Preview -->
            {#if content.mathRain?.enabled ?? true}
              <MathRain
                enabled={content.mathRain?.enabled ?? true}
                density={Math.round((content.mathRain?.density ?? 50) * 0.4)}
                size={Math.max(10, Math.round((content.mathRain?.size ?? 20) * 0.65))}
                opacity={content.mathRain?.opacity ?? 0.45}
                speed={content.mathRain?.speed ?? 1}
                color={content.mathRain?.color ?? '#ffffff'}
                bounce={content.mathRain?.bounce ?? true}
                fontFamily={previewTitleStack}
              />
            {/if}

            <!-- Chalkboard Aspect Ratio Box (948 / 615) -->
            <div class="relative z-10 w-full aspect-[948/615] drop-shadow-[0_12px_28px_rgba(0,0,0,0.9)]">
              <!-- Chalkboard Background Image (Wooden frame + math sketches) -->
              <picture class="w-full h-full block">
                <source srcset="/board/board.webp" type="image/webp" />
                <img
                  src="/board/board.png"
                  alt="Chalkboard Preview"
                  class="w-full h-full object-contain pointer-events-none"
                />
              </picture>

              <!-- Top-Left Date Preview -->
              <div
                class="absolute left-[7%] top-[4%] text-[7px] sm:text-[8px] font-bold tracking-wider pointer-events-none select-none text-white/90"
                style="
                  font-family: {previewNavStack};
                  color: {chalkColor};
                  text-shadow: 0 0 1px rgba(255,255,255,0.8);
                "
              >
                {currentDateString}
              </div>

              <!-- Top-Right Time Preview -->
              <div
                class="absolute right-[7%] top-[4%] text-[7px] sm:text-[8px] font-bold tracking-wider font-mono text-right pointer-events-none select-none text-white/90"
                style="
                  font-family: {previewNavStack};
                  color: {chalkColor};
                  text-shadow: 0 0 1px rgba(255,255,255,0.8);
                "
              >
                {currentTimeString}
              </div>

              <!-- Top-Left Nav: Projects -->
              <div
                class="absolute left-[7%] top-[10%] text-[10px] sm:text-xs font-bold tracking-wide pointer-events-none"
                style="
                  font-family: {previewNavStack};
                  color: {chalkColor};
                  text-shadow: 0 0 2px rgba(255,255,255,0.9);
                "
              >
                {content.nav.projects || 'Projects'}
              </div>

              <!-- Top-Right Nav: Achivements -->
              <div
                class="absolute right-[7%] top-[10%] text-[10px] sm:text-xs font-bold tracking-wide text-right pointer-events-none"
                style="
                  font-family: {previewNavStack};
                  color: {chalkColor};
                  text-shadow: 0 0 2px rgba(255,255,255,0.9);
                "
              >
                {content.nav.achievements || 'Achivements'}
              </div>

              <!-- Bottom-Left Nav: Skills -->
              <div
                class="absolute left-[7%] bottom-[12%] text-[10px] sm:text-xs font-bold tracking-wide pointer-events-none"
                style="
                  font-family: {previewNavStack};
                  color: {chalkColor};
                  text-shadow: 0 0 2px rgba(255,255,255,0.9);
                "
              >
                {content.nav.skills || 'Skills'}
              </div>

              <!-- Center Hero Container -->
              <div class="absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none w-full max-w-[85%]">
                <!-- Avatar with live dynamic size & offset -->
                {#if content.hero.showAvatar ?? true}
                  <div
                    class="aspect-[178/210] mb-0.5 sm:mb-1 flex items-center justify-center transition-all duration-150"
                    style="
                      width: calc(18% * {(content.hero.avatarSize ?? 100) / 100});
                      transform: translate({content.hero.avatarOffsetX ?? 0}%, {content.hero.avatarOffsetY ?? 0}%);
                    "
                  >
                    <picture class="w-full h-full block">
                      <source srcset={(content.hero.avatarUrl || '/board/avatar.webp').replace(/\.(png|jpe?g)$/i, '.webp')} type="image/webp" />
                      <img
                        src={content.hero.avatarUrl || '/board/avatar.webp'}
                        alt={content.hero.name || 'Avatar'}
                        class="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                      />
                    </picture>
                  </div>
                {/if}

                <!-- Name -->
                <div
                  class="text-xs sm:text-sm font-extrabold tracking-wide text-center whitespace-nowrap leading-tight text-white transition-all"
                  style="
                    font-family: {previewTitleStack};
                    color: {chalkColor};
                    text-shadow: 0 0 2px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.5);
                  "
                >
                  {content.hero.name || 'MHD FIRDAUS'}
                </div>

                <!-- Role -->
                <div
                  class="text-[8px] sm:text-[9px] font-semibold tracking-wider text-center mt-0.5 text-white/90 transition-all"
                  style="
                    font-family: {previewNavStack};
                    color: {chalkColor};
                    text-shadow: 0 0 1px rgba(255,255,255,0.8);
                  "
                >
                  {content.hero.role || 'Software Engineer'}
                </div>

                <!-- CV Button Miniature on Chalkboard -->
                {#if content.hero.showCv ?? true}
                  <div class="mt-1 flex items-center justify-center pointer-events-none">
                    <div
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/50 bg-black/40 text-[7px] sm:text-[8px] font-bold text-white shadow-sm"
                      style="
                        font-family: {previewNavStack};
                        color: {chalkColor};
                        text-shadow: 0 0 1px rgba(255,255,255,0.8);
                      "
                    >
                      <FileText class="w-2 h-2 text-white/90" />
                      <span>{content.hero.cvLabel || 'Curriculum Vitae'}</span>
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Bottom-Right Icons Cluster -->
              <div class="absolute right-[4.5%] bottom-[6.5%] w-[68px] h-[50px] pointer-events-none">
                <div class="absolute right-[5px] top-[0px] text-white/80">
                  <LinkedinIcon class="w-[11px] h-[11px]" />
                </div>
                <div class="absolute right-[22px] top-[12px] text-white/80">
                  <InstagramIcon class="w-[11px] h-[11px]" />
                </div>
                <div class="absolute right-[38px] bottom-[1px] text-white/80">
                  <GithubIcon class="w-[11px] h-[11px]" />
                </div>
                <div class="absolute right-[2px] bottom-[1px] text-white/80">
                  <WifiWaveIcon class="w-[15px] h-[15px]" />
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- PREVIEW CONTAINER 2: SECTION MODAL GREEN BOARD CHALK VIEW -->
          <div
            class="w-full rounded-xl overflow-hidden border border-slate-800/80 p-4 relative shadow-2xl select-none min-h-[260px] flex flex-col justify-between"
            style="
              background-image: radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 80%), url('/board/texture.webp');
              background-size: cover;
              background-position: center;
            "
          >
            {#if activeTab === 'projects'}
              <div class="space-y-3">
                <div class="border-b border-white/20 pb-2">
                  <div class="text-sm font-bold text-white" style="font-family: {previewTitleStack}; color: {chalkColor};">
                    {content.nav.projects || 'Projects'}
                  </div>
                  <p class="text-[10px] text-white/80 mt-0.5 line-clamp-2" style="font-family: {previewBodyStack};">
                    {content.intros.projects}
                  </p>
                </div>
                <div class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
                  {#each content.projects.filter(p => !p.isDeleted) as proj}
                    <div class="bg-black/25 border border-white/15 rounded p-2 text-left">
                      <div class="text-[11px] font-bold text-white" style="font-family: {previewNavStack}; color: {chalkColor};">
                        {proj.title}
                      </div>
                      <p class="text-[9px] text-white/70 line-clamp-1 mt-0.5" style="font-family: {previewBodyStack};">
                        {proj.description}
                      </p>
                      <div class="flex gap-1 mt-1 flex-wrap">
                        {#each proj.tags as tag}
                          <span class="text-[8px] px-1 py-0.2 rounded bg-white/10 text-white/90">
                            {tag}
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'achievements'}
              <div class="space-y-3">
                <div class="border-b border-white/20 pb-2">
                  <div class="text-sm font-bold text-white" style="font-family: {previewTitleStack}; color: {chalkColor};">
                    {content.nav.achievements || 'Achievements'}
                  </div>
                  <p class="text-[10px] text-white/80 mt-0.5 line-clamp-2" style="font-family: {previewBodyStack};">
                    {content.intros.achievements}
                  </p>
                </div>
                <div class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
                  {#each content.achievements.filter(a => !a.isDeleted) as ach}
                    <div class="bg-black/25 border border-white/15 rounded p-2 text-left">
                      <div class="text-[11px] font-bold text-white" style="font-family: {previewNavStack}; color: {chalkColor};">
                        {ach.title}
                      </div>
                      <div class="text-[9px] text-emerald-300 font-mono mt-0.5">{ach.issuer} ({ach.year})</div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'skills'}
              <div class="space-y-3">
                <div class="border-b border-white/20 pb-2">
                  <div class="text-sm font-bold text-white" style="font-family: {previewTitleStack}; color: {chalkColor};">
                    {content.nav.skills || 'Skills'}
                  </div>
                  <p class="text-[10px] text-white/80 mt-0.5 line-clamp-2" style="font-family: {previewBodyStack};">
                    {content.intros.skills}
                  </p>
                </div>
                <div class="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
                  {#each content.skills.filter(s => !s.isDeleted) as grp}
                    <div>
                      <div class="text-[10px] font-bold text-white/90 mb-1" style="font-family: {previewNavStack};">
                        {grp.category}
                      </div>
                      <div class="flex gap-1 flex-wrap">
                        {#each grp.items as item}
                          <span class="text-[8px] px-1.5 py-0.5 rounded border border-white/20 bg-white/5 text-white">
                            {item}
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeTab === 'contact'}
              <div class="space-y-2 text-left">
                <div class="border-b border-white/20 pb-2">
                  <div class="text-sm font-bold text-white" style="font-family: {previewTitleStack}; color: {chalkColor};">
                    {content.contact.heading || 'Kontak'}
                  </div>
                  <p class="text-[10px] text-white/80 mt-0.5" style="font-family: {previewBodyStack};">
                    {content.contact.description}
                  </p>
                </div>
                <div class="bg-black/30 p-2.5 rounded border border-white/15 text-[10px] text-white space-y-1">
                  <div>Email: <span class="text-emerald-300 font-mono">{content.contact.email}</span></div>
                  <div>Form Kontak: <span class="text-white/80">{content.contact.formEnabled ? 'Aktif' : 'Non-aktif'}</span></div>
                </div>
              </div>
            {:else}
              <div class="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <Sparkles class="w-8 h-8 text-emerald-400 opacity-80" />
                <p class="text-xs font-semibold text-white">Mode Papan Tulis Utama Aktif</p>
                <p class="text-[10px] text-white/70 max-w-xs">
                  Beralih ke tab <strong>Projects</strong>, <strong>Achievements</strong>, <strong>Skills</strong>, atau <strong>Contact</strong> untuk melihat preview modal.
                </p>
                <button
                  type="button"
                  onclick={() => (previewMode = 'board')}
                  class="mt-2 px-3 py-1 text-[11px] rounded bg-white/20 text-white font-medium hover:bg-white/30 transition cursor-pointer"
                >
                  Kembali ke Papan Utama
                </button>
              </div>
            {/if}
          </div>
        {/if}

        <!-- LIVE PARAMETERS & STATUS CARD -->
        <div class="bg-slate-900/60 rounded-xl border border-slate-800/80 p-3 space-y-2.5 text-xs">
          <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Status Visual Kapur</span>
            <span class="text-emerald-400 font-mono font-normal">Aktif</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="bg-slate-950 p-2 rounded border border-slate-800/60">
              <span class="text-slate-400 block text-[10px]">Font Judul:</span>
              <span class="font-medium text-white truncate block">{content.appearance.titleFont}</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800/60 flex items-center justify-between">
              <div>
                <span class="text-slate-400 block text-[10px]">Warna Kapur:</span>
                <span class="font-mono text-white text-[10px]">{content.appearance.chalkColor}</span>
              </div>
              <span
                class="w-4 h-4 rounded-full border border-white/40 shadow-inner flex-shrink-0"
                style="background-color: {content.appearance.chalkColor};"
              ></span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800/60">
              <span class="text-slate-400 block text-[10px]">Ukuran Avatar:</span>
              <span class="font-mono text-emerald-400 font-semibold">{content.hero.avatarSize ?? 100}%</span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800/60">
              <span class="text-slate-400 block text-[10px]">Offset Avatar:</span>
              <span class="font-mono text-emerald-400 font-semibold">
                X: {content.hero.avatarOffsetX ?? 0}% | Y: {content.hero.avatarOffsetY ?? 0}%
              </span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800/60 col-span-2 flex items-center justify-between">
              <div>
                <span class="text-slate-400 block text-[10px]">Tombol CV di Papan:</span>
                <span class="font-medium text-white text-[10px] truncate block max-w-[210px]">
                  {content.hero.showCv ? 'Aktif' : 'Disembunyikan'} — "{content.hero.cvLabel || 'Curriculum Vitae'}"
                </span>
              </div>
              <span class="text-[9px] font-mono px-1.5 py-0.5 rounded {content.hero.showCv ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">
                {content.hero.showCv ? 'ON' : 'OFF'}
              </span>
            </div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800/60 col-span-2 flex items-center justify-between">
              <div>
                <span class="text-slate-400 block text-[10px]">Hujan Rumus Background:</span>
                <span class="font-medium text-white text-[10px] truncate block max-w-[210px]">
                  {content.mathRain?.enabled ? `${content.mathRain.density} simbol • ${content.mathRain.size}px • ${Math.round((content.mathRain.opacity ?? 0.45) * 100)}% transparan` : 'Non-aktif'}
                </span>
              </div>
              <span class="text-[9px] font-mono px-1.5 py-0.5 rounded {content.mathRain?.enabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'}">
                {content.mathRain?.enabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
{/if}
