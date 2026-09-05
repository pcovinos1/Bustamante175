import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Bustamante175/",
  plugins: [react()],
  build: {
    sourcemap: true
  }
});
