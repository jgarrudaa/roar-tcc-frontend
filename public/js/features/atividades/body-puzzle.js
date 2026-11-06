import { createShadowActivity } from './sombra.js';
import { audioService } from '../../services/audio-service.js';

// Reuse the registered images and Jogo das Sombras engine, including profile piece counts.
export function createBodyPuzzleActivity(context) {
    const { activity, elements } = context;
    const stateKey = JSON.stringify([context.student?.supportLevel, context.student?.teaSupportLevel,
        context.gameSettings?.pieceCount, activity.cards.map(card => [card.item.itemId ?? card.item.id ?? card.item.en,
            card.item.vectorImage || card.item.realImage])]);
    const candidate = context.resumeState;
    const savedState = candidate?.version === 1 && candidate.key === stateKey &&
        Number.isInteger(candidate.index) && candidate.index >= 0 && candidate.index < activity.cards.length
        ? candidate : null;
    let index = savedState?.index ?? 0;
    let engine;
    let helpListeners;
    let destroyed = false;

    function render() {
        if (destroyed) return;
        helpListeners?.abort();
        helpListeners = new AbortController();
        engine?.destroy();
        audioService.stop();
        const item = activity.cards[index].item;
        const round = index;
        engine = createShadowActivity({
            ...context,
            resumeState: savedState?.index === index ? savedState.round : null,
            onStateChange() { context.onStateChange?.(); },
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
        const title = document.createElement('h2');
        title.className = 'body-jigsaw-title';
        title.textContent = activity.puzzleTitle || 'Monte o corpo';
        const counter = document.createElement('p');
        counter.className = 'body-jigsaw-round';
        counter.textContent = `Imagem ${index + 1} de ${activity.cards.length}`;
        root.prepend(title, counter);
        if (context.gameSettings?.showHints !== false) {
         const help = document.createElement('details');
            help.className = 'body-jigsaw-help';
            const summary = document.createElement('summary');
            help.append(summary, explanation);
            help.addEventListener('toggle', () => {
                if (!destroyed && round === index && help.open) context.onHelp?.(item);
            }, { signal: helpListeners.signal });
            root.append(help);
        }

        elements.stage.scrollTop = 0;
    }

    return Object.freeze({
        start: render,
        getState: () => ({ version: 1, key: stateKey, index,
            round: engine?.getState?.() ?? (savedState?.index === index ? savedState.round : null) }),
        next: () => !destroyed && index === activity.cards.length - 1 && engine?.next(),
        isRoundComplete: () => !destroyed && engine?.next(),
        advanceRound() {
            if (destroyed || !engine?.next() || index >= activity.cards.length - 1) return false;
            index++;
            render();
            return true;
        },
        repeatInstruction() { if (!destroyed) engine?.repeatInstruction(); },
        destroy() { destroyed = true; helpListeners?.abort(); engine?.destroy(); audioService.stop(); },
    });
}
