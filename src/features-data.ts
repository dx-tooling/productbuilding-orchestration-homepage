/**
 * Types and constants for the commit-centric features database.
 * The actual data is inlined at build time (window.__FEATURES_DATA__) or loaded from static/features-data.json.
 *
 * --- Updating the features database ---
 *
 * Rule: Each feature is tied to the commit and date when it FIRST ENTERED the codebase.
 *
 * - Only add a feature to a commit if that commit introduced it. Do not attribute a general
 *   capability to a commit that only added a sub-feature or extended an existing one.
 *   Example: "Edit Project Settings" (ability to change project config) existed before
 *   commit 6a878d7; that commit added "per-project agent configuration with project-type
 *   templates". So 6a878d7 should list only the agent-config features, not "Edit Project Settings".
 *
 * - Fixes (performance, security, bugs) are not first introductions. If a commit only fixes
 *   or improves something that already existed, do not add a new feature entry there; move
 *   the feature to the commit that first introduced it, or omit the commit if it has no
 *   other first-introduction features.
 *   Example: "Fix slow projects page by caching GitHub PR URLs" → performance fix; PR URL
 *   display was introduced earlier (e.g. in the "cross-linking" commit). Attribute there.
 *
 * - When in doubt, check the commit message: does it say "Add X", "Implement X", or "Fix X"?
 *   "Add/Implement" = candidate for first introduction. "Fix" = usually no new feature entry.
 *
 * - After adding or moving features, update categoryFeatureOrder so each feature name
 *   appears in the desired display order for its category. Remove feature names that no
 *   longer appear in any commit.
 */

export interface FeatureEntry {
    description: string;
    category: string;
}

export interface CommitEntry {
    date: string;
    features: Record<string, FeatureEntry>;
}

export interface CategoryImage {
    src: string;
    alt: string;
    caption: string;
}

export interface Category {
    id: string;
    title: string;
    quickNavTitle?: string;
    inQuickNav: boolean;
    iconBgColor: string;
    iconColor: string;
    iconFill?: boolean;
    iconSvg: string;
    images: CategoryImage[];
}

export interface FeaturesData {
    commitBaseUrl: string;
    categories: Category[];
    commits: Record<string, CommitEntry>;
    categoryFeatureOrder?: Record<string, string[]>;
}

export const NAV_LINK_CLASS =
    "px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors";

declare global {
    interface Window {
        __FEATURES_DATA__?: FeaturesData;
    }
}
