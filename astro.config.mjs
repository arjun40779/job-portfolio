// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://arjun.buzz",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
