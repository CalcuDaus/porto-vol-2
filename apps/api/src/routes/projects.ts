import { Elysia, t } from 'elysia';
import { createSuccessResponse, createErrorResponse } from '../types/api';
import type { Project } from '../content/schema';
import { getContent, updateSection } from '../content/store';

export const projectRoutes = new Elysia({ prefix: '/projects' })
  // GET /api/v1/projects
  .get('/', () => {
    const list = getContent().projects.filter((p) => !p.isDeleted);
    return createSuccessResponse<Project[]>(list, 'Projects retrieved successfully');
  })

  // GET /api/v1/projects/:id
  .get('/:id', ({ params: { id }, set }) => {
    const project = getContent().projects.find((p) => p.id === id && !p.isDeleted);
    if (!project) {
      set.status = 404;
      return createErrorResponse('PROJECT_NOT_FOUND', `Project with ID ${id} not found`);
    }
    return createSuccessResponse<Project>(project, 'Project details retrieved');
  })

  // POST /api/v1/projects
  .post('/', ({ body, set }) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: body.title,
      description: body.description,
      tags: body.tags || [],
      year: body.year || new Date().getFullYear().toString(),
      repoUrl: body.repoUrl || '',
      liveUrl: body.liveUrl || '',
      isDeleted: false
    };

    const current = getContent().projects;
    updateSection('projects', [newProject, ...current]);
    set.status = 201;
    return createSuccessResponse<Project>(newProject, 'Project created successfully');
  }, {
    body: t.Object({
      title: t.String({ minLength: 3 }),
      description: t.String({ minLength: 5 }),
      tags: t.Optional(t.Array(t.String())),
      year: t.Optional(t.String()),
      repoUrl: t.Optional(t.String()),
      liveUrl: t.Optional(t.String())
    })
  })

  // DELETE /api/v1/projects/:id
  .delete('/:id', ({ params: { id }, set }) => {
    const current = getContent().projects;
    const project = current.find((p) => p.id === id);
    if (!project || project.isDeleted) {
      set.status = 404;
      return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found or deleted`);
    }

    const updated = current.map((p) => p.id === id ? { ...p, isDeleted: true } : p);
    updateSection('projects', updated);
    return createSuccessResponse({ id, isDeleted: true }, 'Project soft deleted');
  });
