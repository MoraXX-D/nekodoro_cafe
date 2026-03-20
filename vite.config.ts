import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',   // relative paths – needed for Capacitor wrapper later
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'src'),
        },
    },
    server: {
        open: true,
    },
    build: {
        target: 'es2022',
        outDir: 'dist',
        sourcemap: true,
    },
});
