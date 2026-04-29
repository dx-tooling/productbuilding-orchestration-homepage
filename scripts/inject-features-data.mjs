/**
 * Post-build step: inject features data into dist/all-features.html (and any
 * locale variants) as window.__FEATURES_DATA__ so the page works with file://
 * (no fetch). Replaces <!-- FEATURES_DATA --> in the built HTML.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const placeholder = "<!-- FEATURES_DATA -->";

const targets = [
    {
        htmlPath: path.join(root, "dist", "all-features.html"),
        dataPath: path.join(root, "src", "static", "features-data.json"),
    },
    {
        htmlPath: path.join(root, "dist", "de", "all-features.html"),
        dataPath: path.join(root, "src", "static", "features-data.de.json"),
    },
];

for (const { htmlPath, dataPath } of targets) {
    if (!fs.existsSync(htmlPath)) {
        console.warn(`inject-features-data: ${path.relative(root, htmlPath)} not found, skipping`);
        continue;
    }
    const html = fs.readFileSync(htmlPath, "utf8");
    if (!html.includes(placeholder)) {
        console.warn(
            `inject-features-data: placeholder not found in ${path.relative(root, htmlPath)}, skipping`,
        );
        continue;
    }
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const script = `<script>window.__FEATURES_DATA__=${JSON.stringify(data)};</script>`;
    const out = html.replace(placeholder, script);
    fs.writeFileSync(htmlPath, out, "utf8");
    console.log(
        `inject-features-data: injected window.__FEATURES_DATA__ into ${path.relative(root, htmlPath)}`,
    );
}
