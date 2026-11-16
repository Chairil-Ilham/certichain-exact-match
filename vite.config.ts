// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    resolve: {
      alias: [
        {
          find: /^buffer$/,
          replacement: new URL("./node_modules/buffer/index.js", import.meta.url).pathname,
          // The browser needs the npm implementation; SSR keeps its built-in.
          customResolver(source, _importer, options) {
            return options?.ssr ? "node:buffer" : source;
          },
        },
        { find: "rpc-websockets", replacement: new URL("./node_modules/rpc-websockets/dist/index.browser.mjs", import.meta.url).pathname },
      ],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
