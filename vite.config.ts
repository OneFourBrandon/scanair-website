import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        contact: fileURLToPath(new URL("./contact.html", import.meta.url)),
      },
    },
  },
});
