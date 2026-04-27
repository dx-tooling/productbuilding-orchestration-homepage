import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
    static targets = ["year"];

    declare readonly yearTarget: HTMLElement;

    connect() {
        this.updateYear();
    }

    private updateYear() {
        const currentYear = new Date().getFullYear();
        this.yearTarget.textContent = currentYear.toString();
    }
}
