export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface Profile {
  id: string;
  name: string;
  role: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  skills: string[];
  socials: SocialLink[];
  availableForHire: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  repoUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured: boolean;
  isDeleted: boolean; // Soft delete convention
  createdAt: string;  // ISO UTC
  updatedAt: string;  // ISO UTC
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export interface ContactMessage extends ContactPayload {
  id: string;
  createdAt: string; // ISO UTC
}

