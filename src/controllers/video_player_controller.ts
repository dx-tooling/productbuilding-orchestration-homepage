import { Controller } from "@hotwired/stimulus";

export default class VideoPlayerController extends Controller<HTMLVideoElement> {
    static values = { rate: { type: Number, default: 1 } };

    declare readonly rateValue: number;

    private onLoadedMetadata = () => this.applyRate();

    connect() {
        this.applyRate();
        this.element.addEventListener("loadedmetadata", this.onLoadedMetadata);
    }

    disconnect() {
        this.element.removeEventListener("loadedmetadata", this.onLoadedMetadata);
    }

    private applyRate() {
        this.element.defaultPlaybackRate = this.rateValue;
        this.element.playbackRate = this.rateValue;
    }
}
