import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
    static targets = ["toggleButton", "sunIcon", "moonIcon"];

    declare readonly toggleButtonTarget: HTMLButtonElement;
    declare readonly hasToggleButtonTarget: boolean;
    declare readonly sunIconTarget: SVGElement;
    declare readonly hasSunIconTarget: boolean;
    declare readonly moonIconTarget: SVGElement;
    declare readonly hasMoonIconTarget: boolean;

    connect() {
        this.applyTheme();
    }

    toggle() {
        // Determine the *new* theme based on the *current* visual state
        const isCurrentlyDark = document.documentElement.classList.contains("dark");
        const newTheme = isCurrentlyDark ? "light" : "dark";

        localStorage.setItem("theme", newTheme);
        this.applyTheme(newTheme);
    }

    applyTheme(theme: string | null = null) {
        const selectedTheme = theme ?? localStorage.getItem("theme");
        const osPreferenceDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const htmlElement = document.documentElement;

        let effectiveTheme: "dark" | "light";

        if (selectedTheme === "dark" || (selectedTheme === null && osPreferenceDark)) {
            htmlElement.classList.add("dark");
            effectiveTheme = "dark";
        } else {
            htmlElement.classList.remove("dark");
            effectiveTheme = "light";
        }

        // Update icon visibility: show sun in dark mode (to switch to light), moon in light mode (to switch to dark)
        if (this.hasSunIconTarget && this.hasMoonIconTarget) {
            if (effectiveTheme === "dark") {
                this.sunIconTarget.classList.remove("hidden");
                this.moonIconTarget.classList.add("hidden");
            } else {
                this.sunIconTarget.classList.add("hidden");
                this.moonIconTarget.classList.remove("hidden");
            }
        }

        // Update aria-label for accessibility
        if (this.hasToggleButtonTarget) {
            this.toggleButtonTarget.setAttribute(
                "aria-label",
                effectiveTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
            );
        }
    }
}
