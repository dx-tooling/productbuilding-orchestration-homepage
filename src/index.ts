import { Application } from "@hotwired/stimulus";
import { definitionsFromContext } from "@hotwired/stimulus-webpack-helpers";

// Import global styles
import "./styles/main.css";
import { renderFeaturesPage } from "./features-render";

// Initialize Stimulus
const application = Application.start();
const context = require.context("./controllers", true, /_controller\.ts$/);
application.load(definitionsFromContext(context));

// Attach Stimulus application to window for global access (if needed)
declare global {
    interface Window {
        Stimulus: Application;
    }
}
window.Stimulus = application;

// Features page: use inlined data (file://) or fetch (HTTP)
const featuresRoot = document.getElementById("features-sections");
if (featuresRoot) {
    const data = window.__FEATURES_DATA__;
    if (data) {
        renderFeaturesPage(data);
    } else {
        fetch("features-data.json")
            .then((r) => r.json())
            .then((d) => renderFeaturesPage(d))
            .catch((err) => console.error("Failed to load features data:", err));
    }
}

console.log("Stimulus application started.");
