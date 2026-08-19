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
            if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("/react/")) {
              return "vendor-react"
            }
            if (id.includes("framer-motion") || id.includes("/motion/") || id.includes("gsap")) {
              return "vendor-animation"
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase"
            }
            if (id.includes("recharts")) {
              return "vendor-charts"
            }
            if (id.includes("lucide-react") || id.includes("@hugeicons")) {
              return "vendor-icons"
            }
            if (id.includes("radix-ui") || id.includes("sonner") || id.includes("cmdk") || id.includes("vaul")) {
              return "vendor-ui"
            }
            return "vendor"
          }
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
  },
})
