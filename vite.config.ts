import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter(),
    }),
    SvelteKitPWA({
      registerType: "prompt",
      manifest: {
        name: "TabelhaFin",
        short_name: "TabelhaFin",
        description: "Controle financeiro pessoal com IA",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        display: "standalone",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["client/**/*.{js,css,ico,png,svg,woff,woff2}"],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: [
        "@myriaddreamin/typst-ts-web-compiler",
        "@myriaddreamin/typst-ts-renderer",
      ],
    },
  },
  ssr: {
    external: [
      "@myriaddreamin/typst-ts-web-compiler",
      "@myriaddreamin/typst-ts-renderer",
    ],
  },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
