import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "vendor-react"
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase"
            }
            if (id.includes("framer-motion") || id.includes("motion") || id.includes("gsap") || id.includes("ogl")) {
              return "vendor-animation"
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-charts"
            }
            if (id.includes("lucide-react") || id.includes("@hugeicons")) {
              return "vendor-icons"
            }
            if (id.includes("@sentry") || id.includes("posthog-js") || id.includes("@vercel")) {
              return "vendor-analytics"
            }
            if (id.includes("date-fns") || id.includes("react-day-picker")) {
              return "vendor-date"
            }
            return "vendor-misc"
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
  },
})
