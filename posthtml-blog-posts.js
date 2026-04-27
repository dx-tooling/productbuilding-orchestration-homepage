import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function blogPostsPlugin() {
    return function (tree) {
        const blogDir = path.resolve(__dirname, "src/blog");
        const blogPosts = [];

        // Read all blog post files
        try {
            const files = fs.readdirSync(blogDir);

            files.forEach((file) => {
                if (file.endsWith(".html")) {
                    const filePath = path.join(blogDir, file);
                    const content = fs.readFileSync(filePath, "utf8");

                    // Extract metadata from standard schemas
                    const ogTitleMatch = content.match(/<meta property="og:title" content="([^"]+)"/);
                    const ogDescriptionMatch = content.match(/<meta property="og:description" content="([^"]+)"/);
                    const ogPublishedTimeMatch = content.match(
                        /<meta property="article:published_time" content="([^"]+)"/,
                    );
                    const ogAuthorMatch = content.match(/<meta property="article:author" content="([^"]+)"/);
                    const ogTags = content.match(/<meta property="article:tag" content="([^"]+)"/g);

                    const twitterTitleMatch = content.match(/<meta name="twitter:title" content="([^"]+)"/);
                    const twitterDescriptionMatch = content.match(/<meta name="twitter:description" content="([^"]+)"/);

                    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
                    const descriptionMatch = content.match(/<meta name="description" content="([^"]+)"/);
                    const authorMatch = content.match(/<meta name="author" content="([^"]+)"/);
                    const keywordsMatch = content.match(/<meta name="keywords" content="([^"]+)"/);

                    const readTimeMatch = content.match(/<meta name="blog:readTime" content="([^"]+)"/);

                    const title = ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleMatch?.[1];
                    const summary = ogDescriptionMatch?.[1] || twitterDescriptionMatch?.[1] || descriptionMatch?.[1];
                    const date = ogPublishedTimeMatch?.[1];
                    const author = ogAuthorMatch?.[1] || authorMatch?.[1];

                    let tags = [];
                    if (ogTags) {
                        ogTags.forEach((tagMeta) => {
                            const tagMatch = tagMeta.match(/content="([^"]+)"/);
                            if (tagMatch) tags.push(tagMatch[1]);
                        });
                    } else if (keywordsMatch) {
                        tags = keywordsMatch[1].split(",").map((tag) => tag.trim());
                    }

                    const readTime = readTimeMatch ? readTimeMatch[1] : "";

                    if (title && summary && date) {
                        let displayDate;
                        try {
                            const dateObj = new Date(date);
                            if (!isNaN(dateObj.getTime())) {
                                displayDate = dateObj.toISOString().split("T")[0];
                            } else {
                                displayDate = date;
                            }
                        } catch {
                            displayDate = date;
                        }

                        blogPosts.push({
                            title: title,
                            summary: summary,
                            date: displayDate,
                            author: author || "Unknown",
                            tags: tags,
                            readTime: readTime,
                            filename: file,
                            url: `blog/${file}`,
                        });
                    }
                }

                if (file.endsWith(".md")) {
                    const filePath = path.join(blogDir, file);
                    const content = fs.readFileSync(filePath, "utf8");
                    const { data } = matter(content);
                    const title = data.title;
                    const summary = data.description || data.summary;
                    const date = data.published_time || data.date;
                    const author = data.author || "Unknown";
                    const tags = Array.isArray(data.tags)
                        ? data.tags
                        : typeof data.tags === "string"
                          ? data.tags
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)
                          : [];
                    const readTime = data.readTime || data.read_time || "";

                    if (title && summary && date) {
                        const base = path.basename(file, path.extname(file));
                        blogPosts.push({
                            title,
                            summary,
                            date,
                            author,
                            tags,
                            readTime,
                            filename: `${base}.html`,
                            url: `blog/${base}.html`,
                        });
                    }
                }
            });
        } catch (error) {
            console.warn("Warning: Could not read blog directory:", error.message);
        }

        // Sort blog posts by date (newest first)
        blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Limit to latest 6 posts
        const latestPosts = blogPosts.slice(0, 6);

        // When no posts exist, remove any element marked with data-hide-if-no-posts.
        if (latestPosts.length === 0) {
            tree.walk((node) => {
                if (node.tag && node.attrs && "data-hide-if-no-posts" in node.attrs) {
                    node.tag = false;
                    node.content = [];
                    node.attrs = {};
                }
                return node;
            });
        }

        // Find the blog section and populate it
        tree.walk((node) => {
            // Populate compact list
            if (node.tag === "div" && node.attrs && node.attrs.id === "blog-posts-compact-container") {
                node.content = latestPosts.map((post) => {
                    return {
                        tag: "a",
                        attrs: {
                            href: post.url,
                            class: "group bg-white dark:bg-gray-800 rounded-md px-4 py-3 shadow-sm flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer no-underline",
                        },
                        content: [
                            {
                                tag: "span",
                                attrs: { class: "shrink-0 text-sm text-gray-600 dark:text-gray-300" },
                                content: new Date(post.date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                }),
                            },
                            {
                                tag: "div",
                                attrs: { class: "min-w-0 flex-1" },
                                content: [
                                    {
                                        tag: "p",
                                        attrs: {
                                            class: "truncate text-sm font-medium text-gray-900 dark:text-gray-100",
                                        },
                                        content: post.title,
                                    },
                                ],
                            },
                            {
                                tag: "span",
                                attrs: {
                                    class: "shrink-0 text-teal-700 dark:text-teal-300 group-hover:underline text-sm font-medium",
                                },
                                content: "Read More →",
                            },
                        ],
                    };
                });
            }
            return node;
        });

        return tree;
    };
}
