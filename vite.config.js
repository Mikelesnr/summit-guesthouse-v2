import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            manifest: false, // Since you are managing your manifest.json manually in public/
            workbox: {
                // Tell Workbox what assets to cache for offline usage
                globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
                // Ensure Inertia/Laravel routes don't break when offline
                navigateFallback: '/',
                navigateFallbackDenylist: [/^\/api\//], // Don't cache API calls offline
            },
        }),
    ],
});
