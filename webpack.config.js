const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const glob = require("glob");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Function to generate the config based on environment
module.exports = (env, argv) => {
    const isProduction = argv.mode === "production";

    // Find all HTML files in src directory (excluding partials)
    const htmlFiles = glob.sync("./src/**/*.html", {
        ignore: ["./src/partials/**/*.html"], // Exclude partials from direct processing by HtmlWebpackPlugin
    });

    // Find all Markdown blog posts
    const markdownBlogFiles = glob.sync("./src/blog/*.md");

    // Create an HtmlWebpackPlugin instance for each HTML file found
    const htmlPlugins = [
        // HTML pages
        ...htmlFiles.map((file) => {
            return new HtmlWebpackPlugin({
                template: file,
                // Calculate relative path for filename based on src directory
                filename: path.relative("src", file),
                // Important: Prevent HtmlWebpackPlugin from injecting assets again,
                // as html-loader/posthtml-loader will handle it.
                // Or configure injection points if needed, but for simple includes, 'false' is easier.
                inject: true, // Keep injection for CSS/JS unless manual placement is preferred
            });
        }),
        // Markdown blog posts → generate blog/<name>.html
        ...markdownBlogFiles.map((file) => {
            const base = path.basename(file, path.extname(file));
            return new HtmlWebpackPlugin({
                template: file,
                filename: path.join("blog", `${base}.html`),
                inject: true,
            });
        }),
    ];

    return {
        entry: "./src/index.ts",
        mode: isProduction ? "production" : "development",
        devtool: isProduction ? false : "inline-source-map", // Add source maps for dev
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                // url: true, // Re-enable url processing (default)
                                sourceMap: !isProduction, // Keep source maps consistent
                            },
                        },
                        {
                            loader: "postcss-loader",
                            options: {
                                sourceMap: !isProduction, // Keep source maps consistent
                            },
                        },
                    ],
                },
                {
                    test: /\.html$/i,
                    // Apply PostHTML loader *first* to handle includes,
                    // then html-loader to process the final HTML string.
                    use: [
                        {
                            loader: "posthtml-loader",
                            options: {
                                plugins: [
                                    require("posthtml-include")({ root: path.resolve(__dirname, "src") }),
                                    require("./posthtml-blog-posts.js").default(),
                                ],
                            },
                        },
                        {
                            loader: "html-loader",
                            options: {
                                // Optional: Disable attribute processing if causing issues
                                // sources: false,
                            },
                        },
                    ],
                },
                {
                    // Markdown blog posts → convert to HTML, then process includes, then html-loader
                    test: /\.md$/i,
                    use: [
                        {
                            loader: "posthtml-loader",
                            options: {
                                plugins: [require("posthtml-include")({ root: path.resolve(__dirname, "src") })],
                            },
                        },
                        {
                            loader: "html-loader",
                        },
                        {
                            loader: path.resolve(__dirname, "loaders/markdown-to-html.js"),
                            options: {
                                esModule: true,
                            },
                        },
                    ],
                },
                {
                    // Add rule for images using Asset Modules
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "images/[name][ext]", // Output path for images
                    },
                },
            ],
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js", ".css", ".html"],
        },
        output: {
            // Use contenthash for production builds, simple name for development
            filename: isProduction ? "bundle.[contenthash].js" : "bundle.js",
            path: path.resolve(__dirname, "dist"),
            clean: true,
            publicPath: "auto",
        },
        plugins: [
            ...htmlPlugins,
            new CopyWebpackPlugin({
                patterns: [{ from: "src/static/features-data.json", to: "features-data.json" }],
            }),
            new MiniCssExtractPlugin({
                // Use contenthash for production builds, simple name for development
                filename: isProduction ? "styles/[name].[contenthash].css" : "styles/[name].css",
            }),
        ],
        // Optional: Add optimization settings for production
        optimization: {
            // Split vendor code if needed
            // splitChunks: {
            //    chunks: 'all',
            // },
        },
    };
};
