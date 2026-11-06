import tailwindcss from '@tailwindcss/vite';
import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { autoWebpPlugin } from './vite-plugin-webp.ts';

// Dynamically select adapter: Vercel on Vercel builds, Node on Docker, Auto for standard SvelteKit
const selectedAdapter = process.env.VERCEL
	? adapterVercel()
	: process.env.DOCKER
		? adapterNode()
		: adapterAuto();

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
			adapter: selectedAdapter
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
