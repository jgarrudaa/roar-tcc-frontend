import { storage } from "../utils/storage.js";

function getPreferences() {
    const value = storage.getPreferences();
    return {
        enabled: value?.soundsEnabled !== false,
        volume: Math.min(1, Math.max(0, Number(value?.volume ?? 80) / 100)),
        rate: Math.min(1.5, Math.max(0.6, Number(value?.speechRate ?? 0.9))),
    };
}

let sequenceVersion = 0;

function stop() {
    sequenceVersion += 1;
    window.speechSynthesis?.cancel();
}

function speakSequence(parts) {
    stop();
    const version = sequenceVersion;
    const preferences = getPreferences();
    if (!preferences.enabled || !("speechSynthesis" in window)) return;
    const phrases = parts.filter((part) => String(part?.text ?? "").trim());
    function speakPart(index) {
        if (version !== sequenceVersion || index >= phrases.length) return;
        const part = phrases[index];
        const utterance = new SpeechSynthesisUtterance(String(part.text));
        utterance.lang = part.language || "pt-BR";
        utterance.rate = preferences.rate;
        utterance.volume = preferences.volume;
        utterance.onend = () => speakPart(index + 1);
        window.speechSynthesis.speak(utterance);
    }
    speakPart(0);
}

export const audioService = Object.freeze({
    speak(text, language = "pt-BR") {
        speakSequence([{ text, language }]);
    },
    speakSequence,
    stop,
});
