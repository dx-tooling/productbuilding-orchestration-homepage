/**
 * Post-build step: inject features data into dist/all-features.html as
 * window.__FEATURES_DATA__ so the page works with file:// (no fetch).
 * Replaces <!-- FEATURES_DATA --> in the built HTML.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const htmlPath = path.join(root, "dist", "all-features.html");
const dataPath = path.join(root, "src", "static", "features-data.json");

const placeholder = "<!-- FEATURES_DATA -->";

const html = fs.readFileSync(htmlPath, "utf8");
if (!html.includes(placeholder)) {
    console.warn("inject-features-data: placeholder not found in dist/all-features.html, skipping");
    process.exit(0);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const script = `<script>window.__FEATURES_DATA__=${JSON.stringify(data)};</script>`;
const out = html.replace(placeholder, script);

fs.writeFileSync(htmlPath, out, "utf8");
console.log("inject-features-data: injected window.__FEATURES_DATA__ into dist/all-features.html");
