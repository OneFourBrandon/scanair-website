import { readdir, rm } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";

function removeLocalSplatAssets(): Plugin {
  return {
    name: "remove-local-splat-assets",
    apply: "build",
    async closeBundle() {
      const splatDir = fileURLToPath(new URL("./dist/splats/", import.meta.url));

      try {
        const entries = await readdir(splatDir, { withFileTypes: true });
        await Promise.all(
          entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(".splat"))
            .map((entry) => rm(new URL(`./dist/splats/${entry.name}`, import.meta.url), { force: true })),
        );
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
          throw error;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [removeLocalSplatAssets()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        contact: fileURLToPath(new URL("./contact.html", import.meta.url)),
      },
    },
  },
});
