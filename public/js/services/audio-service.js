import { storage } from "../utils/storage.js";

function getPreferences() {
    const value = storage.getPreferences();
    const volume = Number(value?.volume ?? 80);
    const rate = Number(value?.speechRate ?? 0.9);
    return {
        enabled: value?.soundsEnabled !== false,
        volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume / 100)) : 0.8,
        rate: Number.isFinite(rate) ? Math.min(1.5, Math.max(0.6, rate)) : 0.9,
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
        const current = getPreferences();
        if (!current.enabled || current.volume === 0) return;
        const part = phrases[index];
        const utterance = new SpeechSynthesisUtterance(String(part.text));
        utterance.lang = part.language || "pt-BR";
        const voices = window.speechSynthesis.getVoices?.() || [];
        const language = utterance.lang.toLowerCase();
        const voice = voices.find(candidate => candidate.lang.toLowerCase() === language)
            || voices.find(candidate => candidate.lang.toLowerCase().split('-')[0] === language.split('-')[0]);
        if (voice) utterance.voice = voice;
        utterance.rate = current.rate;
        utterance.volume = current.volume;
        utterance.onend = () => speakPart(index + 1);
        window.speechSynthesis.speak(utterance);
    }
    speakPart(0);
}

window.addEventListener?.("roar-preferences-changed", stop);

export const audioService = Object.freeze({
    speak(text, language = "pt-BR") {
        speakSequence([{ text, language }]);
    },
    speakSequence,
    stop,
});
