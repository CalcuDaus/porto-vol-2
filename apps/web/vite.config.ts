import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { autoWebpPlugin } from './vite-plugin-webp.ts';

export default defineConfig({
	plugins: [
		autoWebpPlugin(),
		tailwindcss(),
		sveltekit({
			inspector: false,
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	server: {
		host: '0.0.0.0',
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:3002',
				changeOrigin: true
			}
		}
	}
});
