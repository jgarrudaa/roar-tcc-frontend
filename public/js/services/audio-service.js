import { storage } from "../utils/storage.js";

function getPreferences() {
    const value = storage.getPreferences();
    return {
        enabled: value?.soundsEnabled !== false,
        volume: Math.min(1, Math.max(0, Number(value?.volume ?? 80) / 100)),
        rate: Math.min(1.5, Math.max(0.6, Number(value?.speechRate ?? 0.9))),
    };
}

export const audioService = Object.freeze({
    speak(text, language = "pt-BR") {
        const preferences = getPreferences();
        if (!preferences.enabled || !("speechSynthesis" in window) || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = preferences.rate;
        utterance.volume = preferences.volume;
        window.speechSynthesis.speak(utterance);
    },
    stop() {
        window.speechSynthesis?.cancel();
    },
});
