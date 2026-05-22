import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
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

function prettyHtmlRoutes(): Plugin {
  const routes = new Map([
    ["/contact", "/contact.html"],
    ["/contact/", "/contact.html"],
    ["/privacy", "/privacy.html"],
    ["/privacy/", "/privacy.html"],
    ["/terms", "/terms.html"],
    ["/terms/", "/terms.html"],
  ]);

  return {
    name: "pretty-html-routes",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const requestUrl = request.url || "";
        const [pathname, query] = requestUrl.split("?");
        const target = routes.get(pathname);

        if (target) {
          request.url = query ? `${target}?${query}` : target;
        }

        next();
      });
    },
    async writeBundle() {
      const routeNames = ["contact", "privacy", "terms"];

      await Promise.all(
        routeNames.map(async (routeName) => {
          const routeDir = new URL(`./dist/${routeName}/`, import.meta.url);
          await mkdir(routeDir, { recursive: true });
          await copyFile(new URL(`./dist/${routeName}.html`, import.meta.url), new URL("index.html", routeDir));
        }),
      );
    },
  };
}

export default defineConfig({
  plugins: [removeLocalSplatAssets(), prettyHtmlRoutes()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        contact: fileURLToPath(new URL("./contact.html", import.meta.url)),
        privacy: fileURLToPath(new URL("./privacy.html", import.meta.url)),
        terms: fileURLToPath(new URL("./terms.html", import.meta.url)),
      },
    },
  },
});
