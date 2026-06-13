import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createReadStream, cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

export default defineConfig({
  base: '/gesture-mask-studio/',
  plugins: [react(), mediapipeWasmPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});

function mediapipeWasmPlugin(): Plugin {
  let config: ResolvedConfig | null = null;
  const sourceDir = path.resolve('node_modules', '@mediapipe', 'tasks-vision', 'wasm');

  return {
    name: 'gesture-mask-studio-mediapipe-wasm',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = request.url ?? '';
        const fileName = extractMediapipeWasmFileName(requestUrl, server.config.base);

        if (!fileName) {
          next();
          return;
        }

        const filePath = path.join(sourceDir, fileName);
        if (!existsSync(filePath)) {
          next();
          return;
        }

        response.setHeader(
          'Content-Type',
          fileName.endsWith('.wasm') ? 'application/wasm' : 'text/javascript',
        );
        createReadStream(filePath).pipe(response);
      });
    },

    closeBundle() {
      if (!config || config.command !== 'build') {
        return;
      }

      const outputDir = path.resolve(config.root, config.build.outDir, 'mediapipe', 'wasm');
      cpSync(sourceDir, outputDir, { recursive: true });
    },
  };
}

function extractMediapipeWasmFileName(requestUrl: string, base: string): string | null {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const prefixes = [`${normalizedBase}mediapipe/wasm/`, '/mediapipe/wasm/'];
  const match = prefixes.find((prefix) => requestUrl.startsWith(prefix));

  if (!match) {
    return null;
  }

  const fileName = decodeURIComponent(requestUrl.slice(match.length).split('?')[0]);

  if (fileName.includes('/') || fileName.includes('\\') || fileName.startsWith('.')) {
    return null;
  }

  return fileName;
}
