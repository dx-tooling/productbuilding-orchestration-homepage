import { Controller } from "@hotwired/stimulus";

/**
 * Slack Demo Controller
 *
 * Plays a scripted Slack-style conversation message-by-message when the
 * demo scrolls into view. Each message carries its own pacing via data
 * attributes:
 *   - data-from="user|bot"   — controls the typing-indicator avatar/label
 *   - data-typing-ms="1500"  — how long to show "is typing…" before reveal
 *   - data-pause-ms="800"    — how long to wait after reveal before the next message
 *
 * Honors prefers-reduced-motion by revealing every message at once with
 * no typing indicators.
 */
export default class extends Controller {
    static targets = ["list", "message", "typing", "typingAvatar", "typingLabel", "replay"];

    declare readonly listTarget: HTMLElement;
    declare readonly messageTargets: HTMLElement[];
    declare readonly typingTarget: HTMLElement;
    declare readonly hasTypingTarget: boolean;
    declare readonly typingAvatarTarget: HTMLElement;
    declare readonly hasTypingAvatarTarget: boolean;
    declare readonly typingLabelTarget: HTMLElement;
    declare readonly hasTypingLabelTarget: boolean;
    declare readonly replayTarget: HTMLElement;
    declare readonly hasReplayTarget: boolean;

    private observer: IntersectionObserver | null = null;
    private played = false;
    private cancelled = false;

    connect() {
        if (this.prefersReducedMotion()) {
            this.revealAll();
            this.played = true;
            if (this.hasReplayTarget) {
                this.replayTarget.classList.remove("hidden");
            }
            return;
        }

        this.observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !this.played) {
                        this.played = true;
                        obs.unobserve(entry.target);
                        void this.play();
                    }
                });
            },
            { threshold: 0.25 },
        );
        this.observer.observe(this.element);
    }

    disconnect() {
        this.cancelled = true;
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    async replay() {
        this.cancelled = true;
        // small wait to let any in-flight setTimeout resolve
        await this.sleep(50);
        this.cancelled = false;
        this.resetMessages();
        if (this.hasReplayTarget) this.replayTarget.classList.add("hidden");
        await this.play();
    }

    private async play() {
        for (const message of this.messageTargets) {
            if (this.cancelled) return;

            const typingMs = Number(message.dataset.typingMs ?? "0");
            const pauseMs = Number(message.dataset.pauseMs ?? "600");
            const from = (message.dataset.from ?? "bot") as "user" | "bot";

            if (typingMs > 0 && this.hasTypingTarget) {
                this.showTyping(from);
                await this.sleep(typingMs);
                if (this.cancelled) {
                    this.hideTyping();
                    return;
                }
                this.hideTyping();
            }

            this.reveal(message);
            this.scrollToBottom();
            await this.sleep(pauseMs);
        }

        if (this.hasReplayTarget) {
            this.replayTarget.classList.remove("hidden");
        }
    }

    private revealAll() {
        this.messageTargets.forEach((m) => {
            m.classList.remove("hidden", "opacity-0", "translate-y-2");
        });
        this.hideTyping();
    }

    private resetMessages() {
        this.messageTargets.forEach((m) => {
            m.classList.add("hidden", "opacity-0", "translate-y-2");
        });
        this.hideTyping();
        this.listTarget.scrollTop = 0;
    }

    private reveal(el: HTMLElement) {
        el.classList.remove("hidden");
        // force a reflow so the transition runs from the hidden->visible state
        void el.offsetWidth;
        requestAnimationFrame(() => {
            el.classList.remove("opacity-0", "translate-y-2");
        });
    }

    private showTyping(from: "user" | "bot") {
        if (!this.hasTypingTarget) return;
        // The typing indicator is anchored at the bottom of the list; make sure
        // it's the last DOM child so it renders below all revealed messages.
        this.listTarget.appendChild(this.typingTarget);

        if (from === "user") {
            if (this.hasTypingAvatarTarget) {
                this.typingAvatarTarget.classList.remove("from-emerald-500", "to-teal-600", "bg-gradient-to-br");
                this.typingAvatarTarget.classList.add("bg-blue-500");
                this.typingAvatarTarget.textContent = "MK";
            }
            if (this.hasTypingLabelTarget) {
                this.typingLabelTarget.textContent = "Manuel is typing…";
            }
        } else {
            if (this.hasTypingAvatarTarget) {
                this.typingAvatarTarget.classList.remove("bg-blue-500");
                this.typingAvatarTarget.classList.add("from-emerald-500", "to-teal-600", "bg-gradient-to-br");
                this.typingAvatarTarget.textContent = "PB";
            }
            if (this.hasTypingLabelTarget) {
                this.typingLabelTarget.textContent = "ProductBuilder is typing…";
            }
        }

        this.typingTarget.classList.remove("hidden");
        void this.typingTarget.offsetWidth;
        requestAnimationFrame(() => {
            this.typingTarget.classList.remove("opacity-0", "translate-y-1");
        });
        this.scrollToBottom();
    }

    private hideTyping() {
        if (!this.hasTypingTarget) return;
        this.typingTarget.classList.add("hidden", "opacity-0", "translate-y-1");
    }

    private scrollToBottom() {
        // smooth scroll keeps it feeling like Slack auto-following the latest message
        this.listTarget.scrollTo({
            top: this.listTarget.scrollHeight,
            behavior: "smooth",
        });
    }

    private prefersReducedMotion(): boolean {
        return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
