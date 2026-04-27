import { Controller } from "@hotwired/stimulus";

/**
 * Expandable List Controller
 *
 * Shows a limited number of items initially, with a toggle button to reveal/hide the rest.
 * Items to be hidden should have the data-expandable-list-target="hiddenItem" attribute.
 */
export default class extends Controller {
    static targets = ["list", "toggleContainer", "toggleButton", "toggleText", "chevron", "hiddenItem"];

    declare readonly listTarget: HTMLElement;
    declare readonly toggleContainerTarget: HTMLElement;
    declare readonly toggleButtonTarget: HTMLButtonElement;
    declare readonly toggleTextTarget: HTMLElement;
    declare readonly chevronTarget: SVGElement;
    declare readonly hiddenItemTargets: HTMLElement[];
    declare readonly hasHiddenItemTarget: boolean;

    private expanded = false;

    connect() {
        // Hide the toggle button if there are no hidden items
        if (!this.hasHiddenItemTarget || this.hiddenItemTargets.length === 0) {
            this.toggleContainerTarget.classList.add("hidden");
            return;
        }

        // Initially hide all hidden items
        this.hiddenItemTargets.forEach((item) => {
            item.classList.add("hidden");
        });

        this.updateToggleText();
    }

    toggle() {
        this.expanded = !this.expanded;

        this.hiddenItemTargets.forEach((item) => {
            if (this.expanded) {
                item.classList.remove("hidden");
            } else {
                item.classList.add("hidden");
            }
        });

        // Rotate chevron
        if (this.expanded) {
            this.chevronTarget.classList.add("rotate-180");
        } else {
            this.chevronTarget.classList.remove("rotate-180");
        }

        this.updateToggleText();
    }

    private updateToggleText() {
        const count = this.hiddenItemTargets.length;
        if (this.expanded) {
            this.toggleTextTarget.textContent = "Show fewer";
        } else {
            this.toggleTextTarget.textContent = `See all updates (+${count} more)`;
        }
    }
}
