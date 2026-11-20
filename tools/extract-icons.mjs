// Writes tech-icons.js for the oak (tree.js): brand logos (24x24 SVG paths) and colours from Simple Icons (CC0).
// Usage, from this folder:  npm install simple-icons  then  node extract-icons.mjs ../tech-icons.js
// Edit WANT below to change the set (slugs: https://simpleicons.org). node_modules is not needed on the site.
import fs from "node:fs";
import * as si from "simple-icons";

// Slugs from https://simpleicons.org. [slug, title, colour] overrides the title or colour: OpenJDK is shown as Java,
// and logos whose brand colour is black or near-black get a colour of their own so the crown stays colourful.
const WANT = [
  "php", "javascript", "typescript", "react", "vuedotjs", ["angular", "", "#DD0031"], "svelte", "nextdotjs", "nuxt",
  "laravel", "symfony", "wordpress", "woocommerce", "nodedotjs", "deno", "electron", "tauri",
  ["openjdk", "Java", "#F89820"], "kotlin", "springboot", "cplusplus", "c", "dotnet", "python", ["django", "", "#44B78B"], "go", ["rust", "", "#DEA584"], "ruby",
  "swift", "dart", "flutter", "android", ["lua", "", "#4B4BD6"],
  "html5", "css", "sass", "tailwindcss", "bootstrap", "jquery", "vite", "webpack", "npm", "graphql", "redux",
  "mysql", ["mariadb", "", "#C0765A"], "postgresql", ["sqlite", "", "#0F80CC"], "mongodb", "redis", "supabase", "firebase",
  "git", "github", "gitlab", "docker", "kubernetes", "linux", "ubuntu", ["almalinux", "", "#86DA2F"], "nginx", "apache", "cpanel", "cloudflare", "netlify",
  "figma", "blender", "godotengine", "unity", "webflow", "shopify", ["phpstorm", "", "#B74AF7"], "postman"
];
// Simple Icons has no C# logo any more, so C# is a plain hexagon with the letters drawn on top (x = text).
const EXTRA = [{ t: "C#", c: "#A179DC", p: "M12 1l9.5 5.5v11L12 23l-9.5-5.5v-11z", x: "C#" }];

const all = Object.values(si).filter(x => x && x.slug);
const bySlug = new Map(all.map(x => [x.slug, x]));
const found = [], missing = [];
for (const w of WANT) {
  const [slug, title, color] = Array.isArray(w) ? w : [w];
  const icon = bySlug.get(slug);
  if (icon) found.push({ t: title || icon.title, c: color || "#" + icon.hex, p: icon.path });
  else missing.push(slug);
}
found.splice(found.findIndex(f => f.t === ".NET"), 0, ...EXTRA);
const version = JSON.parse(fs.readFileSync(new URL("./node_modules/simple-icons/package.json", import.meta.url))).version;
const out = `/* Technology logos for the v3 background tree (tree.js): 24x24 SVG paths and brand colours
   from Simple Icons ${version} (CC0-1.0), https://simpleicons.org. Logos belong to their owners.
   C# is a plain hexagon with text (x). Regenerate with tools/extract-icons.mjs, or edit the list by hand:
   { t: title, c: colour, p: SVG path in a 24x24 box, x: optional text drawn on top }. */
window.TECH_ICONS = ${JSON.stringify(found)};
`;
fs.writeFileSync(process.argv[2], out);
console.log(JSON.stringify({ count: found.length, missing, kb: Math.round(out.length / 1024) }));
console.log(found.map(f => `${f.t} ${f.c} ${f.p.length}`).join("\n"));
