/**
 * Renders the features page from commit-centric data.
 * Derives features by category from commits, then builds Quick Nav and section DOM.
 */

import type { Category, FeaturesData } from "./features-data";
import { NAV_LINK_CLASS } from "./features-data";

const IMAGE_CLASS = "w-full rounded-xl shadow-md border border-gray-200 dark:border-gray-700";
const CARD_CLASS = "p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm relative";
const DATE_BADGE_CLASS = "text-[10px] text-gray-300 dark:text-gray-600 font-mono absolute top-4 right-3";
const COMMIT_LINK_CLASS =
    "absolute bottom-2 right-3 text-[10px] text-gray-300 dark:text-gray-600 hover:text-blue-400 font-mono";

function formatSinceDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export interface DerivedFeature {
    name: string;
    description: string;
    category: string;
    commitHash: string;
    date: string;
}

function deriveFeaturesByCategory(data: FeaturesData): Map<string, DerivedFeature[]> {
    const byCategory = new Map<string, DerivedFeature[]>();

    for (const [commitHash, entry] of Object.entries(data.commits)) {
        const { date, features } = entry;
        for (const [name, { description, category }] of Object.entries(features)) {
            const list = byCategory.get(category) ?? [];
            list.push({ name, description, category, commitHash, date });
            byCategory.set(category, list);
        }
    }

    // Sort within each category: use categoryFeatureOrder if present, else by date then name
    const orderMap = data.categoryFeatureOrder;
    for (const [categoryId, list] of byCategory.entries()) {
        const order = orderMap?.[categoryId];
        if (order && order.length > 0) {
            const indexOf = (name: string) => {
                const i = order.indexOf(name);
                return i === -1 ? order.length : i;
            };
            list.sort((a, b) => indexOf(a.name) - indexOf(b.name));
        } else {
            list.sort((a, b) => {
                const d = a.date.localeCompare(b.date);
                if (d !== 0) return d;
                return a.name.localeCompare(b.name);
            });
        }
    }

    return byCategory;
}

function buildQuickNavLinks(data: FeaturesData): HTMLAnchorElement[] {
    const links: HTMLAnchorElement[] = [];
    for (const cat of data.categories) {
        if (!cat.inQuickNav) continue;
        const a = document.createElement("a");
        a.href = `#${cat.id}`;
        a.className = NAV_LINK_CLASS;
        a.textContent = cat.quickNavTitle ?? cat.title;
        links.push(a);
    }
    return links;
}

function buildSection(data: FeaturesData, category: Category, features: DerivedFeature[]): HTMLElement {
    const section = document.createElement("section");
    section.className = "mb-16";
    section.id = category.id;

    const header = document.createElement("div");
    header.className = "flex items-center gap-3 mb-6";

    const iconBox = document.createElement("div");
    iconBox.className = `w-10 h-10 ${category.iconBgColor} rounded-lg flex items-center justify-center`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `w-5 h-5 ${category.iconColor}`);
    svg.setAttribute("viewBox", "0 0 24 24");
    if (category.iconFill) {
        svg.setAttribute("fill", "currentColor");
    } else {
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke-width", "1.5");
        svg.setAttribute("stroke", "currentColor");
    }
    svg.innerHTML = category.iconSvg;
    iconBox.appendChild(svg);
    header.appendChild(iconBox);

    const title = document.createElement("h2");
    title.className = "text-2xl font-bold text-gray-800 dark:text-gray-200";
    title.textContent = category.title;
    header.appendChild(title);
    section.appendChild(header);

    for (const img of category.images) {
        const figure = document.createElement("figure");
        figure.className = "my-8 max-w-xl mx-auto";
        const image = document.createElement("img");
        image.src = img.src;
        image.alt = img.alt;
        image.className = IMAGE_CLASS;
        image.loading = "lazy";
        figure.appendChild(image);
        const figcap = document.createElement("figcaption");
        figcap.className = "text-sm text-gray-500 dark:text-gray-400 mt-2 text-center";
        figcap.innerHTML = img.caption;
        figure.appendChild(figcap);
        section.appendChild(figure);
    }

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

    for (const f of features) {
        const card = document.createElement("div");
        card.className = CARD_CLASS;

        const titleRow = document.createElement("div");
        titleRow.className = "flex items-baseline mb-2";
        const h3 = document.createElement("h3");
        h3.className = "font-semibold text-gray-900 dark:text-gray-100";
        h3.textContent = f.name;
        titleRow.appendChild(h3);
        const since = document.createElement("span");
        since.className = DATE_BADGE_CLASS;
        since.textContent = `since ${formatSinceDate(f.date)}`;
        titleRow.appendChild(since);
        card.appendChild(titleRow);

        const p = document.createElement("p");
        p.className = "text-sm text-gray-600 dark:text-gray-400";
        p.textContent = f.description;
        card.appendChild(p);

        const commitUrl = `${data.commitBaseUrl}${f.commitHash}`;
        const link = document.createElement("a");
        link.href = commitUrl;
        link.className = COMMIT_LINK_CLASS;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = f.commitHash;
        card.appendChild(link);

        grid.appendChild(card);
    }

    section.appendChild(grid);
    return section;
}

export function renderFeaturesPage(data: FeaturesData): void {
    const navContainer = document.getElementById("features-quick-nav-links");
    const sectionsRoot = document.getElementById("features-sections");
    if (!navContainer || !sectionsRoot || !data) return;

    const featuresByCategory = deriveFeaturesByCategory(data);

    for (const a of buildQuickNavLinks(data)) {
        navContainer.appendChild(a);
    }

    for (const category of data.categories) {
        const features = featuresByCategory.get(category.id) ?? [];
        const section = buildSection(data, category, features);
        sectionsRoot.appendChild(section);
    }
}
