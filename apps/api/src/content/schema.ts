import { t, type Static } from 'elysia';

const Url = t.String({ maxLength: 500 });
const Id = t.String({ minLength: 1, maxLength: 64 });

/* ------------------------------------------------------------------ */
/* Section schemas (each one is edited independently in the dashboard) */
/* ------------------------------------------------------------------ */

export const AppearanceSchema = t.Object({
  /** Font for the big name on the board */
  titleFont: t.String({ maxLength: 60 }),
  /** Font for navigation labels + role */
  navFont: t.String({ maxLength: 60 }),
  /** Font for the content inside the full-screen section boards */
  bodyFont: t.String({ maxLength: 60 }),
  /** Chalk colour (hex) */
  chalkColor: t.String({ pattern: '^#[0-9a-fA-F]{6}$' }),
  /** Zoom animation duration in ms */
  zoomDuration: t.Number({ minimum: 300, maximum: 3000 })
});

export const HeroSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 60 }),
  role: t.String({ maxLength: 80 }),
  avatarUrl: Url,
  showAvatar: t.Boolean(),
  avatarSize: t.Optional(t.Number({ minimum: 30, maximum: 300 })),
  avatarOffsetX: t.Optional(t.Number({ minimum: -200, maximum: 200 })),
  avatarOffsetY: t.Optional(t.Number({ minimum: -200, maximum: 200 })),
  cvUrl: t.Optional(t.String({ maxLength: 500 })),
  cvLabel: t.Optional(t.String({ maxLength: 60 })),
  showCv: t.Optional(t.Boolean())
});

export const NavSchema = t.Object({
  projects: t.String({ minLength: 1, maxLength: 30 }),
  achievements: t.String({ minLength: 1, maxLength: 30 }),
  skills: t.String({ minLength: 1, maxLength: 30 }),
  contact: t.String({ minLength: 1, maxLength: 30 })
});

export const SocialsSchema = t.Object({
  github: Url,
  linkedin: Url,
  instagram: Url
});

export const ProjectSchema = t.Object({
  id: Id,
  title: t.String({ minLength: 1, maxLength: 120 }),
  description: t.String({ maxLength: 1000 }),
  tags: t.Array(t.String({ maxLength: 40 }), { maxItems: 20 }),
  year: t.String({ maxLength: 10 }),
  repoUrl: Url,
  liveUrl: Url,
  isDeleted: t.Boolean()
});

export const AchievementSchema = t.Object({
  id: Id,
  title: t.String({ minLength: 1, maxLength: 120 }),
  issuer: t.String({ maxLength: 120 }),
  year: t.String({ maxLength: 10 }),
  description: t.String({ maxLength: 1000 }),
  isDeleted: t.Boolean()
});

export const SkillGroupSchema = t.Object({
  id: Id,
  category: t.String({ minLength: 1, maxLength: 80 }),
  items: t.Array(t.String({ maxLength: 60 }), { maxItems: 40 }),
  isDeleted: t.Boolean()
});

export const ContactSchema = t.Object({
  heading: t.String({ maxLength: 120 }),
  description: t.String({ maxLength: 600 }),
  email: t.String({ maxLength: 200 }),
  formEnabled: t.Boolean()
});

export const SectionIntroSchema = t.Object({
  projects: t.String({ maxLength: 300 }),
  achievements: t.String({ maxLength: 300 }),
  skills: t.String({ maxLength: 300 })
});

export const MathRainSchema = t.Object({
  enabled: t.Boolean(),
  density: t.Number({ minimum: 5, maximum: 200 }),
  size: t.Number({ minimum: 8, maximum: 60 }),
  opacity: t.Number({ minimum: 0.05, maximum: 1 }),
  speed: t.Number({ minimum: 0.2, maximum: 4 }),
  color: t.String({ maxLength: 30 }),
  bounce: t.Boolean()
});

export const SiteContentSchema = t.Object({
  appearance: AppearanceSchema,
  hero: HeroSchema,
  nav: NavSchema,
  socials: SocialsSchema,
  intros: SectionIntroSchema,
  mathRain: t.Optional(MathRainSchema),
  projects: t.Array(ProjectSchema, { maxItems: 100 }),
  achievements: t.Array(AchievementSchema, { maxItems: 100 }),
  skills: t.Array(SkillGroupSchema, { maxItems: 30 }),
  contact: ContactSchema,
  updatedAt: t.String()
});

/** Map of editable section name -> schema of that section */
export const SECTION_SCHEMAS = {
  appearance: AppearanceSchema,
  hero: HeroSchema,
  nav: NavSchema,
  socials: SocialsSchema,
  intros: SectionIntroSchema,
  mathRain: MathRainSchema,
  projects: t.Array(ProjectSchema, { maxItems: 100 }),
  achievements: t.Array(AchievementSchema, { maxItems: 100 }),
  skills: t.Array(SkillGroupSchema, { maxItems: 30 }),
  contact: ContactSchema
} as const;

export const ContactMessageInputSchema = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: 'email', maxLength: 200 }),
  message: t.String({ minLength: 5, maxLength: 3000 })
});

export type Appearance = Static<typeof AppearanceSchema>;
export type Hero = Static<typeof HeroSchema>;
export type NavLabels = Static<typeof NavSchema>;
export type Socials = Static<typeof SocialsSchema>;
export type SectionIntros = Static<typeof SectionIntroSchema>;
export type MathRain = Static<typeof MathRainSchema>;
export type Project = Static<typeof ProjectSchema>;
export type Achievement = Static<typeof AchievementSchema>;
export type SkillGroup = Static<typeof SkillGroupSchema>;
export type ContactInfo = Static<typeof ContactSchema>;
export type SiteContent = Static<typeof SiteContentSchema>;
export type SectionKey = keyof typeof SECTION_SCHEMAS;
export type ContactMessageInput = Static<typeof ContactMessageInputSchema>;

export interface ContactMessage extends ContactMessageInput {
  id: string;
  createdAt: string; // ISO UTC
  isRead: boolean;
  isDeleted: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string; // ISO 8601 UTC
}

