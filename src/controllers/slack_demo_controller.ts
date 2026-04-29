import { Controller } from "@hotwired/stimulus";

/**
 * Slack Demo Controller
 *
 * Plays a scripted Slack-style conversation message-by-message when the
 * demo scrolls into view.
 *
 * Bot messages: a "ProductBuilder is typing…" indicator shows for
 * data-typing-ms, then the message reveals.
 *
 * User messages: the message is typed letter-by-letter into the
 * composer input (taken from data-input-text), then "submitted" — the
 * composer clears and the message appears in the thread. This makes
 * the user side of the conversation feel as live as the bot side.
 *
 * Common attributes on each [data-slack-demo-target="message"]:
 *   - data-from="user|bot"
 *   - data-typing-ms="1500"   (bot only — duration of typing indicator)
 *   - data-pause-ms="800"     (delay after reveal before next message)
 *   - data-input-text="..."   (user only — text typed into the composer)
 *
 * Honors prefers-reduced-motion by revealing every message at once with
 * no typing indicators or composer animation.
 */
export default class extends Controller {
    static targets = [
        "list",
        "message",
        "typing",
        "typingAvatar",
        "typingLabel",
        "replay",
        "composerPlaceholder",
        "composerTyped",
        "composerCursor",
        "cursor",
        "cursorSvg",
        "browserPanel",
        "previewLink",
        "previewPage",
        "previewToggle",
    ];

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
    declare readonly composerPlaceholderTarget: HTMLElement;
    declare readonly hasComposerPlaceholderTarget: boolean;
    declare readonly composerTypedTarget: HTMLElement;
    declare readonly hasComposerTypedTarget: boolean;
    declare readonly composerCursorTarget: HTMLElement;
    declare readonly hasComposerCursorTarget: boolean;
    declare readonly cursorTarget: HTMLElement;
    declare readonly hasCursorTarget: boolean;
    declare readonly cursorSvgTarget: SVGElement;
    declare readonly hasCursorSvgTarget: boolean;
    declare readonly browserPanelTarget: HTMLElement;
    declare readonly hasBrowserPanelTarget: boolean;
    declare readonly previewLinkTarget: HTMLElement;
    declare readonly hasPreviewLinkTarget: boolean;
    declare readonly previewPageTarget: HTMLElement;
    declare readonly hasPreviewPageTarget: boolean;
    declare readonly previewToggleTarget: HTMLElement;
    declare readonly hasPreviewToggleTarget: boolean;

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
            const inputText = message.dataset.inputText ?? "";

            if (from === "user" && inputText.length > 0) {
                // User turn: type the message letter-by-letter into the composer,
                // pause briefly (as if reading what they typed), then "submit".
                await this.typeIntoComposer(inputText);
                if (this.cancelled) {
                    this.deactivateComposer();
                    return;
                }
                await this.sleep(350);
                if (this.cancelled) {
                    this.deactivateComposer();
                    return;
                }
                this.deactivateComposer();
            } else if (typingMs > 0 && this.hasTypingTarget) {
                // Bot turn: show the "is typing…" indicator for the configured duration.
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

            if (message.dataset.triggerPreview === "true") {
                if (this.cancelled) return;
                await this.playPreviewSequence();
                if (this.cancelled) return;
            }
        }

        if (this.hasReplayTarget) {
            this.replayTarget.classList.remove("hidden");
        }
    }

    /**
     * The "grand finale": after the preview-link message is revealed, an
     * oversized cursor moves to the unfurl card, "clicks" it, a browser-
     * window overlay slides in over the messages list, and the cursor
     * clicks the theme toggle a few times to demonstrate light/dark.
     */
    private async playPreviewSequence() {
        if (
            !this.hasCursorTarget ||
            !this.hasBrowserPanelTarget ||
            !this.hasPreviewLinkTarget ||
            !this.hasPreviewPageTarget ||
            !this.hasPreviewToggleTarget
        ) {
            return;
        }

        // 1. Show the cursor near the preview-link card (no animation in — it
        //    just appears, as if the user moved their hand to the trackpad).
        this.previewPageTarget.dataset.theme = "light";
        this.positionCursorOver(this.previewLinkTarget, { instant: true });
        this.cursorTarget.classList.remove("hidden");
        await this.sleep(450);
        if (this.cancelled) return;

        // 2. Click the preview link
        await this.simulateClick();
        if (this.cancelled) return;

        // 3. Slide the browser panel in over the messages list
        this.positionBrowserPanel();
        this.browserPanelTarget.classList.remove("hidden");
        // double rAF so the transition picks up the change reliably
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.browserPanelTarget.classList.remove("opacity-0", "scale-95");
            });
        });
        await this.sleep(400);
        if (this.cancelled) return;

        // 4. Move the cursor to the toggle button and click 3 times,
        //    flipping the theme each click. End state: dark.
        for (let i = 0; i < 3; i++) {
            this.positionCursorOver(this.previewToggleTarget);
            // wait for the smooth-move transition (700 ms) plus a beat to read
            await this.sleep(900);
            if (this.cancelled) return;

            await this.simulateClick();
            if (this.cancelled) return;
            this.togglePreviewTheme();

            await this.sleep(i === 2 ? 700 : 600);
            if (this.cancelled) return;
        }

        // 5. Hide panel + cursor
        this.browserPanelTarget.classList.add("opacity-0", "scale-95");
        this.cursorTarget.classList.add("hidden");
        await this.sleep(320);
        this.browserPanelTarget.classList.add("hidden");
    }

    private positionCursorOver(el: HTMLElement, opts: { instant?: boolean } = {}) {
        if (!this.hasCursorTarget) return;
        const containerRect = this.element.getBoundingClientRect();
        const targetRect = el.getBoundingClientRect();
        // Land the cursor's tip near the centre of the target. The arrow's
        // hot-spot in the SVG is roughly at (5, 2), so subtract a small offset.
        const x = targetRect.left - containerRect.left + targetRect.width / 2 - 6;
        const y = targetRect.top - containerRect.top + targetRect.height / 2 - 4;

        if (opts.instant) {
            // Suspend the transition for an instant placement
            const previous = this.cursorTarget.style.transition;
            this.cursorTarget.style.transition = "none";
            this.cursorTarget.style.transform = `translate(${x}px, ${y}px)`;
            // force reflow so the change applies before transitions are restored
            void this.cursorTarget.offsetWidth;
            this.cursorTarget.style.transition = previous;
        } else {
            this.cursorTarget.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

    private positionBrowserPanel() {
        if (!this.hasBrowserPanelTarget) return;
        const containerRect = this.element.getBoundingClientRect();
        const listRect = this.listTarget.getBoundingClientRect();
        // Inset by ~7.5% on each side → panel covers ~85% × 85% ≈ 72% of the list area.
        const insetH = Math.round(listRect.width * 0.075);
        const insetV = Math.round(listRect.height * 0.075);
        this.browserPanelTarget.style.top = `${listRect.top - containerRect.top + insetV}px`;
        this.browserPanelTarget.style.left = `${listRect.left - containerRect.left + insetH}px`;
        this.browserPanelTarget.style.width = `${listRect.width - insetH * 2}px`;
        this.browserPanelTarget.style.height = `${listRect.height - insetV * 2}px`;
    }

    private async simulateClick() {
        if (!this.hasCursorSvgTarget) {
            await this.sleep(180);
            return;
        }
        const svg = this.cursorSvgTarget as unknown as HTMLElement;
        svg.style.transform = "scale(0.85)";
        await this.sleep(110);
        if (this.cancelled) return;
        svg.style.transform = "scale(1)";
        await this.sleep(140);
    }

    private togglePreviewTheme() {
        if (!this.hasPreviewPageTarget) return;
        const current = this.previewPageTarget.dataset.theme ?? "light";
        this.previewPageTarget.dataset.theme = current === "light" ? "dark" : "light";
    }

    private resetPreviewSequence() {
        if (this.hasCursorTarget) {
            this.cursorTarget.classList.add("hidden");
        }
        if (this.hasBrowserPanelTarget) {
            this.browserPanelTarget.classList.add("hidden", "opacity-0", "scale-95");
        }
        if (this.hasPreviewPageTarget) {
            this.previewPageTarget.dataset.theme = "light";
        }
    }

    private async typeIntoComposer(text: string) {
        if (!this.hasComposerTypedTarget) return;
        this.activateComposer();
        // Split by code point so emoji + surrogate pairs don't get cut in half.
        const chars = Array.from(text);
        const baseDelay = 28;
        const jitter = 22;
        let buffer = "";
        for (const ch of chars) {
            if (this.cancelled) return;
            buffer += ch;
            this.composerTypedTarget.textContent = buffer;
            let delay = baseDelay + Math.random() * jitter;
            if (ch === "." || ch === "?" || ch === "!") delay += 140;
            else if (ch === "," || ch === ";" || ch === ":") delay += 70;
            else if (ch === " ") delay += 10;
            await this.sleep(delay);
        }
    }

    private activateComposer() {
        if (this.hasComposerPlaceholderTarget) {
            this.composerPlaceholderTarget.classList.add("hidden");
        }
        if (this.hasComposerTypedTarget) {
            this.composerTypedTarget.textContent = "";
            this.composerTypedTarget.classList.remove("hidden");
        }
        if (this.hasComposerCursorTarget) {
            this.composerCursorTarget.classList.remove("hidden");
        }
    }

    private deactivateComposer() {
        if (this.hasComposerTypedTarget) {
            this.composerTypedTarget.textContent = "";
            this.composerTypedTarget.classList.add("hidden");
        }
        if (this.hasComposerCursorTarget) {
            this.composerCursorTarget.classList.add("hidden");
        }
        if (this.hasComposerPlaceholderTarget) {
            this.composerPlaceholderTarget.classList.remove("hidden");
        }
    }

    private revealAll() {
        this.messageTargets.forEach((m) => {
            m.classList.remove("hidden", "opacity-0", "translate-y-2");
        });
        this.hideTyping();
        this.deactivateComposer();
        this.resetPreviewSequence();
    }

    private resetMessages() {
        this.messageTargets.forEach((m) => {
            m.classList.add("hidden", "opacity-0", "translate-y-2");
        });
        this.hideTyping();
        this.deactivateComposer();
        this.resetPreviewSequence();
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
                this.typingAvatarTarget.textContent = "A";
            }
            if (this.hasTypingLabelTarget) {
                this.typingLabelTarget.textContent = "Alex is typing…";
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
