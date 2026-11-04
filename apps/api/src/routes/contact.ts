import { Elysia, t } from 'elysia';
import { createSuccessResponse, createErrorResponse } from '../types/api';
import type { ContactMessage } from '../types/portfolio';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const messages: ContactMessage[] = [];

export const contactRoutes = new Elysia({ prefix: '/contact' })
  .post('/', async ({ body, set }) => {
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: body.name,
      email: body.email,
      message: body.message,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('messages').insert({
        name: body.name,
        email: body.email,
        message: body.message,
        created_at: newMessage.createdAt
      });

      if (error) {
        set.status = 500;
        return createErrorResponse(error.message, 'Failed to save message to Supabase');
      }
    }

    messages.push(newMessage);
    set.status = 201;
    return createSuccessResponse(
      { id: newMessage.id, status: 'received' },
      'Thank you! Your message has been sent successfully.'
    );
  }, {
    body: t.Object({
      name: t.String({ minLength: 2, error: 'Name must have at least 2 characters' }),
      email: t.String({ format: 'email', error: 'Please provide a valid email address' }),
      message: t.String({ minLength: 5, error: 'Message must have at least 5 characters' })
    })
  });

