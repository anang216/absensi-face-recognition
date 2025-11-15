import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './resources/js'),
            '@css': resolve(__dirname, './resources/css'),
            '@layouts': resolve(__dirname, './resources/js/layouts'),
            '@types': resolve(__dirname, './resources/js/types'),
            '@pages': resolve(__dirname, './resources/js/pages'),
        },
    },
});