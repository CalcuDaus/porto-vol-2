export interface FontOption {
  id: string;
  label: string;
  stack: string;
  google?: string;
  note: string;
}

export interface Appearance {
  titleFont: string;
  navFont: string;
  bodyFont: string;
  chalkColor: string;
  zoomDuration: number;
}

export interface Hero {
  name: string;
  role: string;
  avatarUrl: string;
  showAvatar: boolean;
  avatarSize?: number;
  avatarOffsetX?: number;
  avatarOffsetY?: number;
  cvUrl?: string;
  cvLabel?: string;
  showCv?: boolean;
}

export interface NavLabels {
  projects: string;
  achievements: string;
  skills: string;
  contact: string;
}

export interface Socials {
  github: string;
  linkedin: string;
  instagram: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  year: string;
  repoUrl: string;
  liveUrl: string;
  isDeleted: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
  isDeleted: boolean;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
  isDeleted: boolean;
}

export interface ContactInfo {
  heading: string;
  description: string;
  email: string;
  formEnabled: boolean;
}

export interface SectionIntros {
  projects: string;
  achievements: string;
  skills: string;
}

export interface MathRain {
  enabled: boolean;
  density: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
  bounce: boolean;
}

export interface SiteContent {
  appearance: Appearance;
  hero: Hero;
  nav: NavLabels;
  socials: Socials;
  mathRain: MathRain;
  intros: SectionIntros;
  projects: Project[];
  achievements: Achievement[];
  skills: SkillGroup[];
  contact: ContactInfo;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface AuthUser {
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}
