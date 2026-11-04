import type { SiteContent } from '#lib/types';
import { toggleSound, isSoundMuted } from '#lib/audio/chalkAudio';

let cachedContent: SiteContent | null = null;
let isInitialized = false;

interface CallableCommand<T> {
  (): T;
  [Symbol.toPrimitive]?: () => string;
  toString?: () => string;
}

function makeCallable<T>(fn: () => T, preview?: string): CallableCommand<T> {
  const callable = (() => fn()) as CallableCommand<T>;
  const repr = preview || (typeof fn === 'function' ? 'Executed command.' : String(fn));
  callable[Symbol.toPrimitive] = () => repr;
  callable.toString = () => repr;
  return callable;
}

export function updateConsoleData(content: SiteContent) {
  cachedContent = content;
}

export function initConsoleEasterEgg(initialContent: SiteContent | null) {
  if (typeof window === 'undefined') return;
  if (initialContent) cachedContent = initialContent;
  if (isInitialized) return;
  isInitialized = true;

  const bannerStyle = `
    color: #34d399;
    font-family: monospace;
    font-size: 11px;
    font-weight: bold;
    line-height: 1.25;
  `;

  const bannerText = [
    '┌────────────────────────────────────────────────────────────┐',
    '│   __  __ _  _ ___    ___ ___ ___ ___   _   _   _ ___       │',
    '│  |  \\/  | || |   \\  | __|_ _| _ \\   \\ /_\\ | | | / __|      │',
    '│  | |\\/| | __ | |) | | _| | ||   / |) / _ \\| |_| \\__ \\      │',
    '│  |_|  |_|_||_|___/  |_| |___|_|_\\___/_/ \\_\\\\___/|___/      │',
    '│                                                            │',
    '│   Chalkboard Portfolio • Svelte 5 • Bun • Elysia.js        │',
    '└────────────────────────────────────────────────────────────┘'
  ].join('\n');

  console.log(`%c${bannerText}`, bannerStyle);

  console.log(
    '%cHello Tech Lead / Fellow Engineer! Welcome to DevTools.\n' +
    '• Built with: Svelte 5 (Runes), Bun Runtime, Elysia.js & Canvas 2D Engine.\n' +
    '• 60-120 FPS delta-time physics & procedural Web Audio API synthesis.\n\n' +
    'Try typing the interactive CLI commands below:\n' +
    '  • firdaus.help()        : Show list of all available commands\n' +
    '  • firdaus.about         : Summary of engineer profile & background\n' +
    '  • firdaus.skills        : Categorized technical skills table\n' +
    '  • firdaus.projects      : Selected software works & links\n' +
    '  • firdaus.architecture  : Architecture & design decisions breakdown\n' +
    '  • firdaus.hireMe()      : Fast contact & recruiting channels\n' +
    '  • firdaus.downloadCV()  : Open / download Curriculum Vitae\n' +
    '  • firdaus.clearBoard()  : Trigger chalk dust explosion on screen\n' +
    '  • firdaus.doodle()      : Switch cursor into chalk drawing mode\n' +
    '  • firdaus.toggleSound() : Toggle procedural chalk SFX\n' +
    '  • firdaus.stats         : Live runtime & render statistics',
    'color: #94a3b8; font-family: monospace; font-size: 11px; line-height: 1.6;'
  );

  const getProfile = () => {
    const c = cachedContent;
    return {
      name: c?.hero?.name || 'MHD FIRDAUS',
      role: c?.hero?.role || 'Software Engineer',
      status: 'Open to High-Impact Software Engineering Roles',
      location: 'Indonesia',
      focus: 'Modern Reactive Frontends (Svelte 5) & High-Throughput Microservice APIs (Bun + Elysia)',
      email: c?.contact?.email || 'mhdfirdaus@example.com',
      github: c?.socials?.github || 'https://github.com/calcudaus',
      linkedin: c?.socials?.linkedin || 'https://www.linkedin.com/in/mhd-firdaus/'
    };
  };

  const getSkillsTable = () => {
    const c = cachedContent;
    if (c?.skills && c.skills.length > 0) {
      return c.skills
        .filter((g) => !g.isDeleted)
        .map((g) => ({
          Category: g.category,
          Competencies: g.items.join(', ')
        }));
    }
    return [
      { Category: 'Languages & Runtime', Competencies: 'TypeScript, JavaScript (ESNext), Bun Runtime, SQL (PostgreSQL), HTML5/CSS3' },
      { Category: 'Frontend Engineering', Competencies: 'Svelte 5 (Runes), SvelteKit, Tailwind CSS v4, Canvas 2D API, Web Audio API, Vite' },
      { Category: 'Backend & APIs', Competencies: 'ElysiaJS, REST APIs, TypeBox Validation, OpenAPI/Swagger, Eden Treaty' },
      { Category: 'Database & Cloud', Competencies: 'Supabase, PostgreSQL, Row Level Security (RLS), Supabase Auth, Git/GitHub' }
    ];
  };

  const getProjectsTable = () => {
    const c = cachedContent;
    if (c?.projects && c.projects.length > 0) {
      return c.projects
        .filter((p) => !p.isDeleted)
        .map((p) => ({
          Title: p.title,
          Year: p.year,
          Stack: p.tags.join(', '),
          LiveDemo: p.liveUrl || '-',
          Repo: p.repoUrl || '-'
        }));
    }
    return [];
  };

  const getAchievementsTable = () => {
    const c = cachedContent;
    if (c?.achievements && c.achievements.length > 0) {
      return c.achievements
        .filter((a) => !a.isDeleted)
        .map((a) => ({
          Title: a.title,
          Issuer: a.issuer,
          Year: a.year,
          Description: a.description
        }));
    }
    return [];
  };

  const printHelp = () => {
    console.log(
      '%c--- Available Interactive Commands on `firdaus` ---',
      'color: #34d399; font-weight: bold; font-family: monospace;'
    );
    console.table([
      { Command: 'firdaus.about', Description: 'Summary of engineer background & credentials' },
      { Command: 'firdaus.skills', Description: 'Detailed competencies categorized table' },
      { Command: 'firdaus.projects', Description: 'Selected engineering projects with live links' },
      { Command: 'firdaus.achievements', Description: 'Certifications and milestones earned' },
      { Command: 'firdaus.architecture', Description: 'Technical design decisions & architecture breakdown' },
      { Command: 'firdaus.hireMe()', Description: 'Fast-pass contact info & email copy' },
      { Command: 'firdaus.downloadCV()', Description: 'Open / download Curriculum Vitae (cv.pdf)' },
      { Command: 'firdaus.clearBoard()', Description: 'Trigger dramatic chalk dust explosion & wipe canvas' },
      { Command: 'firdaus.doodle()', Description: 'Activate chalk cursor and drawing mode' },
      { Command: 'firdaus.toggleSound()', Description: 'Toggle procedural chalk sound FX on/off' },
      { Command: 'firdaus.stats', Description: 'View live FPS, DPR, viewport & audio runtime stats' }
    ]);
    return 'Tip: Commands work both as properties (firdaus.skills) and functions (firdaus.skills())';
  };

  const printArchitecture = () => {
    console.log(
      '%c[ System Architecture & Engineering Trade-offs ]',
      'color: #38bdf8; font-weight: bold; font-family: monospace; font-size: 12px;'
    );
    console.log(
      '%c1. Frontend Reactive Engine: Svelte 5 (Runes)\n' +
      '   - Fine-grained signal reactivity ($state, $derived, $effect) eliminates VDOM diffing overhead.\n' +
      '   - Sub-60kB production client footprint with instantaneous first paint.\n\n' +
      '2. High-Throughput Backend: Elysia.js + Bun Runtime\n' +
      '   - Native TypeScript execution with JIT compilation.\n' +
      '   - TypeBox compile-time schema validation and Swagger OpenAPI auto-generation.\n\n' +
      '3. Visual Rendering: HTML5 Canvas 2D with Delta-Time Physics\n' +
      '   - Zero DOM particle thrashing. Math symbol rain runs on an isolated requestAnimationFrame loop.\n' +
      '   - Elastic floor bounce physics with delta-time normalization (smooth across 60Hz - 240Hz displays).\n\n' +
      '4. Audio Synthesis: Pure Web Audio API\n' +
      '   - 100% self-contained procedural chalk taps, scratches, eraser wipes, and dust explosion puff sounds.\n' +
      '   - Zero network overhead: No external audio asset downloads required.',
      'color: #cbd5e1; font-family: monospace; font-size: 11px; line-height: 1.6;'
    );
    return {
      frontend: 'Svelte 5 (Runes) + SvelteKit + Tailwind CSS v4',
      backend: 'Elysia.js + Bun Runtime + TypeBox',
      graphics: 'HTML5 Canvas 2D + Delta-time Physics',
      audio: 'Procedural Web Audio API Synthesis'
    };
  };

  const handleHireMe = () => {
    const prof = getProfile();
    console.log(
      '%c✦ Let\'s Build Something Great Together! ✦',
      'color: #34d399; font-weight: bold; font-family: monospace; font-size: 12px;'
    );
    console.log(
      `%cEmail    : ${prof.email}\n` +
      `LinkedIn : ${prof.linkedin}\n` +
      `GitHub   : ${prof.github}\n` +
      `Status   : ${prof.status}`,
      'color: #e2e8f0; font-family: monospace; font-size: 11px; line-height: 1.6;'
    );

    // Try copying email to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(prof.email).catch(() => {});
      console.log('%c✓ Email address has been automatically copied to your clipboard!', 'color: #34d399; font-style: italic;');
    }
    return prof;
  };

  const handleDownloadCV = () => {
    const cvUrl = cachedContent?.hero?.cvUrl || '/cv.pdf';
    if (typeof window !== 'undefined') {
      window.open(cvUrl, '_blank');
      console.log(`%c✓ Opening Curriculum Vitae: ${cvUrl}`, 'color: #34d399; font-family: monospace;');
    }
    return cvUrl;
  };

  const handleClearBoard = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chalk:clear'));
      console.log('%c[OK] Chalkboard cleared with dust explosion!', 'color: #38bdf8; font-family: monospace;');
    }
    return 'Chalkboard cleared.';
  };

  const handleDoodle = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chalk:activate'));
      console.log('%c[OK] Chalk mode activated. Click and drag on the green board to draw.', 'color: #34d399; font-family: monospace;');
    }
    return 'Chalk mode active.';
  };

  const handleToggleSound = () => {
    const isMuted = toggleSound();
    const status = isMuted ? 'Muted (Bisu)' : 'Active (Aktif)';
    console.log(`%cChalk sound effect: ${status}`, 'color: #38bdf8; font-family: monospace;');
    return status;
  };

  const getStats = () => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    const viewport = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A';
    const soundActive = !isSoundMuted();
    const statsObj = {
      devicePixelRatio: dpr,
      viewport,
      soundActive,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    };
    console.table(statsObj);
    return statsObj;
  };

  // Build the CLI object with dual property/function capabilities
  const cli: Record<string, unknown> = {};

  Object.defineProperty(cli, 'help', {
    get: () => makeCallable(printHelp, 'Printed help commands table.')
  });

  Object.defineProperty(cli, 'about', {
    get: () => {
      const data = getProfile();
      console.table(data);
      return makeCallable(() => data, JSON.stringify(data, null, 2));
    }
  });

  Object.defineProperty(cli, 'skills', {
    get: () => {
      const data = getSkillsTable();
      console.table(data);
      return makeCallable(() => data, `Skills table printed (${data.length} categories).`);
    }
  });

  Object.defineProperty(cli, 'projects', {
    get: () => {
      const data = getProjectsTable();
      console.table(data);
      return makeCallable(() => data, `Projects table printed (${data.length} projects).`);
    }
  });

  Object.defineProperty(cli, 'achievements', {
    get: () => {
      const data = getAchievementsTable();
      console.table(data);
      return makeCallable(() => data, `Achievements table printed (${data.length} entries).`);
    }
  });

  Object.defineProperty(cli, 'architecture', {
    get: () => makeCallable(printArchitecture, 'Printed architecture breakdown.')
  });

  Object.defineProperty(cli, 'hireMe', {
    get: () => makeCallable(handleHireMe, 'Recruiting contact details displayed.')
  });

  Object.defineProperty(cli, 'contact', {
    get: () => makeCallable(handleHireMe, 'Recruiting contact details displayed.')
  });

  Object.defineProperty(cli, 'downloadCV', {
    get: () => makeCallable(handleDownloadCV, 'Opened CV in new tab.')
  });

  Object.defineProperty(cli, 'clearBoard', {
    get: () => makeCallable(handleClearBoard, 'Chalkboard wiped.')
  });

  Object.defineProperty(cli, 'doodle', {
    get: () => makeCallable(handleDoodle, 'Chalk mode enabled.')
  });

  Object.defineProperty(cli, 'chalk', {
    get: () => makeCallable(handleDoodle, 'Chalk mode enabled.')
  });

  Object.defineProperty(cli, 'toggleSound', {
    get: () => makeCallable(handleToggleSound, 'Sound toggled.')
  });

  Object.defineProperty(cli, 'stats', {
    get: () => makeCallable(getStats, 'Runtime stats displayed.')
  });

  // Attach to window
  (window as unknown as { firdaus: unknown }).firdaus = cli;
}
