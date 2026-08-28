export const audioService = Object.freeze({
    speak(text, language = "pt-BR") {
        if (!("speechSynthesis" in window) || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    },
    stop() {
        window.speechSynthesis?.cancel();
    },
});
