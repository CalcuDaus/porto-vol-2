import { Elysia, t } from 'elysia';
import { createSuccessResponse, createErrorResponse } from '../types/api';
import type { Achievement } from '../content/schema';
import { getContent, updateSection } from '../content/store';

export const achievementRoutes = new Elysia({ prefix: '/achievements' })
  .get('/', () => {
    const list = getContent().achievements.filter((a) => !a.isDeleted);
    return createSuccessResponse<Achievement[]>(list, 'Achievements retrieved successfully');
  })

  .post('/', ({ body, set }) => {
    const newAch: Achievement = {
      id: `ach-${Date.now()}`,
      title: body.title,
      issuer: body.issuer,
      year: body.year || new Date().getFullYear().toString(),
      description: body.description,
      isDeleted: false
    };

    const current = getContent().achievements;
    updateSection('achievements', [newAch, ...current]);
    set.status = 201;
    return createSuccessResponse<Achievement>(newAch, 'Achievement created');
  }, {
    body: t.Object({
      title: t.String({ minLength: 3 }),
      issuer: t.String(),
      year: t.Optional(t.String()),
      description: t.String()
    })
  })

  .delete('/:id', ({ params: { id }, set }) => {
    const current = getContent().achievements;
    const item = current.find((a) => a.id === id);
    if (!item || item.isDeleted) {
      set.status = 404;
      return createErrorResponse('ACHIEVEMENT_NOT_FOUND', `Achievement ${id} not found`);
    }

    const updated = current.map((a) => a.id === id ? { ...a, isDeleted: true } : a);
    updateSection('achievements', updated);
    return createSuccessResponse({ id, isDeleted: true }, 'Achievement soft deleted');
  });
