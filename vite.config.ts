import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { listings } from "./src/data/listings";

type HtmlEntry = {
  name: string;
  file: string;
  prettyPath?: string;
};

type GeneratedRoute = {
  htmlFile: string;
  outputPath: string;
};

const htmlEntries: HtmlEntry[] = [
  { name: "main", file: "index.html" },
  { name: "contact", file: "contact.html", prettyPath: "/contact" },
  { name: "privacy", file: "privacy.html", prettyPath: "/privacy" },
  { name: "terms", file: "terms.html", prettyPath: "/terms" },
  { name: "listings", file: "listings.html", prettyPath: "/listings" },
  { name: "listingTemplate", file: "src/templates/listing.html" },
];

const staticPrettyRoutes: GeneratedRoute[] = htmlEntries
  .filter((entry): entry is HtmlEntry & { prettyPath: string } => Boolean(entry.prettyPath))
  .map((entry) => ({
    htmlFile: entry.file,
    outputPath: entry.prettyPath.replace(/^\/+/, ""),
  }));

const listingPrettyRoutes: GeneratedRoute[] = listings.map((listing) => ({
  htmlFile: "src/templates/listing.html",
  outputPath: `listings/${listing.slug}`,
}));

const generatedRoutes = [...staticPrettyRoutes, ...listingPrettyRoutes];

const normalizePathname = (pathname: string) => {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
};

const isListingDetailPath = (pathname: string) => /^\/listings\/[^/]+$/.test(pathname);

const htmlFileUrl = (file: string) => new URL(`./${file}`, import.meta.url);

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
  const devRoutes = new Map(staticPrettyRoutes.map((route) => [`/${route.outputPath}`, `/${route.htmlFile}`]));
  const internalListingTemplatePaths = new Set(["/listing", "/listing.html", "/src/templates/listing"]);

  return {
    name: "pretty-html-routes",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = request.url || "";
        const [pathname, query] = requestUrl.split("?");
        const normalizedPathname = normalizePathname(pathname);

        if (internalListingTemplatePaths.has(normalizedPathname)) {
          response.statusCode = 302;
          response.setHeader("Location", "/listings");
          response.end();
          return;
        }

        const target = isListingDetailPath(normalizedPathname)
          ? "/src/templates/listing.html"
          : devRoutes.get(normalizedPathname);

        if (target) {
          request.url = query ? `${target}?${query}` : target;
        }

        next();
      });
    },
    async writeBundle() {
      await Promise.all(
        generatedRoutes.map(async (route) => {
          const routeDir = new URL(`./dist/${route.outputPath}/`, import.meta.url);
          await mkdir(routeDir, { recursive: true });
          await copyFile(new URL(`./dist/${route.htmlFile}`, import.meta.url), new URL("index.html", routeDir));
        }),
      );

      await rm(new URL("./dist/src/templates/listing.html", import.meta.url), { force: true });
    },
  };
}

export default defineConfig({
  plugins: [removeLocalSplatAssets(), prettyHtmlRoutes()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        htmlEntries.map((entry) => [entry.name, fileURLToPath(htmlFileUrl(entry.file))]),
      ),
    },
  },
});
