// Resolves asset paths from projects.json into URLs Vite can serve in both dev
// and the production build.
//
// projects.json references assets by their source path, e.g.
// "./src/assets/pdfs/Catastrophic Forgetting.pdf". Those strings are passed
// straight to <img>/<iframe> src and are NOT processed by Vite's bundler, so
// they only resolve in dev (where Vite serves /src/*) and 404 in the built
// `dist/` (which has no src/ folder, only hashed files under /assets/).
//
// `import.meta.glob` eagerly imports every file under src/assets as a URL,
// giving us a map from source path -> final (hashed) URL that works everywhere.
const assetUrls = import.meta.glob<string>("/src/assets/**/*", {
  eager: true,
  query: "?url",
  import: "default",
});

/** Normalize a JSON asset reference to a `/src/assets/...` glob key. */
function toKey(path: string): string {
  return "/" + path.replace(/^\.?\/+/, "");
}

/**
 * Map a path from projects.json to a usable URL.
 * - External URLs (http(s), protocol-relative, data:) are returned untouched.
 * - Local `src/assets/...` paths are swapped for their bundled URL.
 * - Anything else (e.g. a /public path) is returned as-is.
 */
export function resolveAsset(path?: string): string {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return assetUrls[toKey(path)] ?? path;
}
