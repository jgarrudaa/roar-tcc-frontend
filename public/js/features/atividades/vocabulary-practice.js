import { createAudioImageActivity } from './audio-imagem.js?v=4';
import { createAssociateActivity } from './associar.js?v=4';
import { audioService } from '../../services/audio-service.js';

const FACTORIES = Object.freeze({
    audioImage: createAudioImageActivity,
    associate: createAssociateActivity,
});

export function createVocabularyPracticeActivity(context) {
    const { activity, elements } = context;
    const factory = FACTORIES[activity.practiceType];
    let index = 0;
    let engine;
    let destroyed = false;

    function render() {
        if (destroyed) return;
        engine?.destroy();
        audioService.stop();
        const item = activity.cards[index];
        const round = index;
        engine = factory({
            ...context,
            activity: { ...activity, item, answer: item.en },
            elements: {
                ...elements,
                setProgress(value, maximum) {
                    elements.setProgress(index + value / Math.max(1, maximum), activity.cards.length);
                },
            },
            onCorrect() {
                if (!destroyed && round === index) context.onCorrect(item);
            },
        });
        engine.start();
        const root = elements.stage.querySelector('.activity-content');
        const heading = document.createElement('h2');
        heading.className = 'body-jigsaw-title';
        heading.textContent = activity.title;
        const counter = document.createElement('p');
        counter.className = 'body-jigsaw-round';
        counter.textContent = `Cartão ${index + 1} de ${activity.cards.length}`;
        root.prepend(heading, counter);
        elements.stage.scrollTop = 0;
    }

    return Object.freeze({
        start: render,
        next: () => !destroyed && index === activity.cards.length - 1 && engine?.next(),
        isRoundComplete: () => !destroyed && engine?.next(),
        advanceRound() {
            if (destroyed || !engine?.next() || index >= activity.cards.length - 1) return false;
            index += 1;
            render();
            return true;
        },
        repeatInstruction() { if (!destroyed) engine?.repeatInstruction(); },
        destroy() {
            destroyed = true;
            engine?.destroy();
            audioService.stop();
        },
    });
}
