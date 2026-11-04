import { Elysia, t } from 'elysia';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { createSuccessResponse, createErrorResponse } from '../types/api';
import { getContent, saveContent, updateSection } from '../content/store';
import { FONT_OPTIONS } from '../content/fonts';
import { checkAuth } from '../auth/guard';
import {
  SECTION_SCHEMAS,
  type SectionKey,
  type SiteContent
} from '../content/schema';

export const contentRoutes = new Elysia({ prefix: '/content' })
  // GET /api/v1/content (Public - Portfolio & Admin)
  .get('/', () => {
    return createSuccessResponse<SiteContent>(getContent(), 'Site content retrieved');
  })

  // GET /api/v1/content/fonts (Public - Font Catalog)
  .get('/fonts', () => {
    return createSuccessResponse(FONT_OPTIONS, 'Font options retrieved');
  })

  // PUT /api/v1/content (Protected - Requires Admin Token)
  .put('/', ({ body, headers, set }) => {
    const auth = checkAuth(headers);
    if (!auth.authorized) {
      set.status = 401;
      return createErrorResponse('UNAUTHORIZED', auth.error || 'Akses ditolak: autentikasi diperlukan');
    }

    try {
      saveContent(body as SiteContent);
      return createSuccessResponse<SiteContent>(getContent(), 'Site content updated successfully');
    } catch (err) {
      set.status = 500;
      return createErrorResponse(
        err instanceof Error ? err.message : 'Unknown error',
        'Failed to save site content'
      );
    }
  })

  // PATCH /api/v1/content/:section (Protected - Requires Admin Token)
  .patch('/:section', ({ params: { section }, body, headers, set }) => {
    const auth = checkAuth(headers);
    if (!auth.authorized) {
      set.status = 401;
      return createErrorResponse('UNAUTHORIZED', auth.error || 'Akses ditolak: autentikasi diperlukan');
    }

    const validSections = Object.keys(SECTION_SCHEMAS) as SectionKey[];

    if (!validSections.includes(section as SectionKey)) {
      set.status = 400;
      return createErrorResponse('INVALID_SECTION', `Section '${section}' is not valid`);
    }

    try {
      const updated = updateSection(section as SectionKey, body as any);
      return createSuccessResponse(updated[section as SectionKey], `Section '${section}' updated successfully`);
    } catch (err) {
      set.status = 500;
      return createErrorResponse(
        err instanceof Error ? err.message : 'Unknown error',
        `Failed to update section '${section}'`
      );
    }
  })

  // POST /api/v1/content/upload-cv (Protected - Upload CV File)
  .post('/upload-cv', async ({ body, headers, set }) => {
    const auth = checkAuth(headers);
    if (!auth.authorized) {
      set.status = 401;
      return createErrorResponse('UNAUTHORIZED', auth.error || 'Akses ditolak: autentikasi diperlukan');
    }

    try {
      const file = (body as any)?.file;
      if (!file) {
        set.status = 400;
        return createErrorResponse('NO_FILE', 'File PDF tidak ditemukan dalam request');
      }

      const buffer = await file.arrayBuffer();
      const webStaticDir = join(process.cwd(), '..', 'web', 'static');
      const adminStaticDir = join(process.cwd(), '..', 'admin', 'static');
      mkdirSync(webStaticDir, { recursive: true });
      mkdirSync(adminStaticDir, { recursive: true });

      const webPath = join(webStaticDir, 'cv.pdf');
      const adminPath = join(adminStaticDir, 'cv.pdf');
      writeFileSync(webPath, Buffer.from(buffer));
      writeFileSync(adminPath, Buffer.from(buffer));

      // Also update hero.cvUrl in memory & store
      const current = getContent();
      const updatedHero = {
        ...current.hero,
        cvUrl: '/cv.pdf'
      };
      updateSection('hero', updatedHero);

      return createSuccessResponse({ url: '/cv.pdf' }, 'File CV berhasil diunggah!');
    } catch (err) {
      set.status = 500;
      return createErrorResponse(
        err instanceof Error ? err.message : 'Unknown error',
        'Gagal mengunggah file CV'
      );
    }
  })

  // POST /api/v1/content/upload-image (Protected - Upload & Auto Convert to WebP)
  .post('/upload-image', async ({ body, headers, set }) => {
    const auth = checkAuth(headers);
    if (!auth.authorized) {
      set.status = 401;
      return createErrorResponse('UNAUTHORIZED', auth.error || 'Akses ditolak: autentikasi diperlukan');
    }

    try {
      const file = (body as any)?.file;
      const targetName = (body as any)?.name || 'avatar';
      if (!file) {
        set.status = 400;
        return createErrorResponse('NO_FILE', 'File gambar tidak ditemukan dalam request');
      }

      const rawBuffer = Buffer.from(await file.arrayBuffer());
      
      // Auto convert to WebP using Sharp with high quality & transparency
      const webpBuffer = await sharp(rawBuffer)
        .webp({ quality: 85, effort: 6, alphaQuality: 90 })
        .toBuffer();

      const filename = `${targetName}.webp`;
      const webStaticDir = join(process.cwd(), '..', 'web', 'static', 'board');
      const adminStaticDir = join(process.cwd(), '..', 'admin', 'static', 'board');
      mkdirSync(webStaticDir, { recursive: true });
      mkdirSync(adminStaticDir, { recursive: true });

      const webPath = join(webStaticDir, filename);
      const adminPath = join(adminStaticDir, filename);
      writeFileSync(webPath, webpBuffer);
      writeFileSync(adminPath, webpBuffer);

      // If target is avatar, also update hero.avatarUrl in memory & store
      if (targetName === 'avatar') {
        const current = getContent();
        const updatedHero = {
          ...current.hero,
          avatarUrl: `/board/${filename}`
        };
        updateSection('hero', updatedHero);
      }

      const saving = ((1 - webpBuffer.length / rawBuffer.length) * 100).toFixed(1);

      return createSuccessResponse({
        url: `/board/${filename}`,
        size: webpBuffer.length,
        originalSize: rawBuffer.length,
        saving: `${saving}%`
      }, `Gambar berhasil dioptimasi & dikonversi otomatis ke WebP (${saving}% lebih hemat)!`);
    } catch (err) {
      set.status = 500;
      return createErrorResponse(
        err instanceof Error ? err.message : 'Unknown error',
        'Gagal mengonversi & menyimpan gambar WebP'
      );
    }
  });
