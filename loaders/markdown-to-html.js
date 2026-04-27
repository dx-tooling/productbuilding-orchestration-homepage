/*
 * Markdown-to-HTML loader for blog posts
 * - Parses front matter with gray-matter
 * - Renders markdown with markdown-it
 * - Wraps content in our blog HTML template (with Tailwind classes)
 * - Leaves <include> tags for PostHTML to resolve
 */

import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import path from "path";

/**
 * @param {string} source Markdown file contents
 */
export default function markdownToHtmlLoader(source) {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    });

    const { data, content } = matter(source);

    const title = data.title || "Untitled";
    const description = data.description || data.summary || "";
    const author = data.author || "Unknown";
    const published = data.published_time || data.date || "";
    const tags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === "string"
          ? data.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
          : [];
    const readTime = data.readTime || data.read_time || "";

    // Compute canonical URL path based on filename
    const resourcePath = this.resourcePath; // absolute path of the .md
    const fileBase = path.basename(resourcePath, path.extname(resourcePath));
    const pageUrl = `https://sitebuilder.dx-tooling.org/blog/${fileBase}.html`;

    const rendered = md.render(content);

    const headTags = [
        `<title>${escapeHtml(title)} - SiteBuilder Blog</title>`,
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        description ? `<meta name="description" content="${escapeHtml(description)}">` : "",
        `<meta name="author" content="${escapeHtml(author)}">`,
        '<meta name="robots" content="index, follow">',
        tags.length ? `<meta name="keywords" content="${escapeHtml(tags.join(", "))}">` : "",
        // Open Graph
        '<meta property="og:type" content="article">',
        `<meta property="og:url" content="${pageUrl}">`,
        `<meta property="og:title" content="${escapeHtml(title)}">`,
        description ? `<meta property="og:description" content="${escapeHtml(description)}">` : "",
        '<meta property="og:site_name" content="SiteBuilder">',
        '<meta property="og:locale" content="en_US">',
        published ? `<meta property="article:published_time" content="${escapeHtml(published)}">` : "",
        `<meta property="article:author" content="${escapeHtml(author)}">`,
        ...tags.map((t) => `<meta property="article:tag" content="${escapeHtml(t)}">`),
        // Twitter
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:site" content="@dx_tooling">',
        '<meta name="twitter:creator" content="@manuelkiessling">',
        `<meta name="twitter:title" content="${escapeHtml(title)}">`,
        description ? `<meta name="twitter:description" content="${escapeHtml(description)}">` : "",
        // Blog system specific
        readTime ? `<meta name="blog:readTime" content="${escapeHtml(readTime)}">` : "",
    ]
        .filter(Boolean)
        .join("\n        ");

    const tagBadges = tags
        .map(
            (t) =>
                `<span class="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 rounded">${escapeHtml(t)}</span>`,
        )
        .join("\n                        ");

    const dateDisplay = published
        ? new Date(published).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "";

    const html = `<!DOCTYPE html>
<html lang="en" class="h-full scroll-smooth">
<head>
        ${headTags}

        <!-- Include FOUC guard script -->
        <include src="partials/theme-fouc-guard.html"></include>
        <!-- Link to CSS will be injected here by HtmlWebpackPlugin -->
</head>
<body class="h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
    <div class="container mx-auto px-4 py-12 max-w-4xl">
        <header class="mb-8">
            <div class="flex justify-between items-center mb-6">
                <nav>
                    <a href="../index.html" class="text-teal-600 dark:text-teal-400 hover:underline">← Back to Home</a>
                </nav>
                <!-- Theme Toggle Controller -->
                <div data-controller="theme">
                    <button
                        data-theme-target="toggleButton"
                        data-action="click->theme#toggle"
                        aria-label="Toggle theme"
                        class="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
                               hover:bg-gray-100 dark:hover:bg-gray-800
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900
                               cursor-pointer transition-colors duration-200"
                    >
                        <!-- Sun icon (shown in dark mode) -->
                        <svg data-theme-target="sunIcon" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                        </svg>
                        <!-- Moon icon (shown in light mode) -->
                        <svg data-theme-target="moonIcon" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    ${published ? `<time datetime="${escapeHtml(String(published))}">${escapeHtml(dateDisplay)}</time>` : ""}
                    ${readTime ? `<span>•</span><span>${escapeHtml(readTime)}</span>` : ""}
                    <span>•</span>
                    <span>${escapeHtml(author)}</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${tagBadges}
                </div>
            </div>
            <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">${escapeHtml(
                title,
            )}</h1>
            ${description ? `<p class="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">${escapeHtml(description)}</p>` : ""}
        </header>
        <article class="prose prose-lg dark:prose-invert max-w-none prose-headings:font-extrabold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-teal-600 dark:prose-a:text-teal-400 hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-li:marker:text-gray-400 dark:prose-li:marker:text-gray-500 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:text-gray-800 dark:prose-pre:text-gray-200 prose-code:text-gray-800 dark:prose-code:text-gray-200">
            ${rendered}
        </article>
        <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-center">
                <a href="../index.html" class="text-teal-600 dark:text-teal-400 hover:underline">← Back to Home</a>
            </div>
            <div class="mt-6 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
                Sponsored by
                <a href="https://www.joboo.de" class="inline-flex items-center hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded" rel="noopener noreferrer" target="_blank" aria-label="JOBOO! GmbH">
                    <img src="https://webassets.cdn.www.joboo.de/assets/images/joboo-inverted.png" alt="JOBOO! GmbH" class="h-5 w-auto" width="2570" height="843" loading="lazy">
                </a>
            </div>
        </footer>
    </div>
    <!-- The script tag will be injected by HtmlWebpackPlugin -->
</body>
</html>`;

    return html;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
