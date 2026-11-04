import { Elysia, t } from 'elysia';
import { createSuccessResponse } from '../types/api';
import { getContent, updateSection } from '../content/store';

export const profileRoutes = new Elysia({ prefix: '/profile' })
  .get('/', () => {
    const c = getContent();
    return createSuccessResponse({
      ...c.hero,
      socials: [
        { platform: 'GitHub', url: c.socials.github, label: 'GitHub' },
        { platform: 'LinkedIn', url: c.socials.linkedin, label: 'LinkedIn' },
        { platform: 'Instagram', url: c.socials.instagram, label: 'Instagram' }
      ]
    }, 'Profile retrieved');
  })

  .patch('/', ({ body }) => {
    const c = getContent();
    const updatedHero = { ...c.hero, ...body };
    updateSection('hero', updatedHero);
    return createSuccessResponse(updatedHero, 'Hero profile updated');
  }, {
    body: t.Partial(t.Object({
      name: t.String(),
      role: t.String(),
      avatarUrl: t.String(),
      showAvatar: t.Boolean()
    }))
  });
