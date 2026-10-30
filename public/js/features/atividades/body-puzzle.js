import { createShadowActivity } from './sombra.js';
import { audioService } from '../../services/audio-service.js';

// Reuse the registered images and Jogo das Sombras engine, including profile piece counts.
export function createBodyPuzzleActivity(context) {
    const { activity, elements } = context;
    let index = 0;
    let engine;
    let destroyed = false;

    function render() {
        if (destroyed) return;
        engine?.destroy();
        audioService.stop();
        const item = activity.cards[index].item;
        const round = index;
        engine = createShadowActivity({
            ...context,
            activity: { ...activity, item, instruction: `Monte a imagem de ${item.en}. Arraste cada peça até sua sombra.` },
            elements: {
                ...elements,
                setProgress(value, maximum) {
                    elements.setProgress(index + value / Math.max(1, maximum), activity.cards.length);
                },
            },
            onCorrect() {
                if (destroyed || round !== index) return;
                context.onCorrect({ ...item, itemId: `body:${round}:${item.itemId ?? item.id}` });
            },
        });
        engine.start();
        const root = elements.stage.querySelector('.shadow-game');
        root.classList.add('body-jigsaw');

        elements.stage.scrollTop = 0;
    }

    return Object.freeze({
        start: render,
        next: () => !destroyed && index === activity.cards.length - 1 && engine?.next(),
        isRoundComplete: () => !destroyed && engine?.next(),
        advanceRound() {
            if (destroyed || !engine?.next() || index >= activity.cards.length - 1) return false;
            index++;
            render();
            return true;
        },
        repeatInstruction() { if (!destroyed) engine?.repeatInstruction(); },
        destroy() { destroyed = true; engine?.destroy(); audioService.stop(); },
    });
}
