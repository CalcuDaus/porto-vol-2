import type { PageLoad } from './$types';
import { defaultContent } from '#lib/data/defaultContent';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const res = await fetch('/api/v1/content');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return { content: json.data };
      }
    }
  } catch {
    // Graceful fallback to bundled defaultContent
  }
  return { content: defaultContent };
};

