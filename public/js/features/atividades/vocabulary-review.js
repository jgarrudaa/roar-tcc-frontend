import { audioService } from '../../services/audio-service.js';
import { createActivityLifecycle } from './activity-lifecycle.js';
import { createButton, createImage } from './activity-helpers.js';

export function createVocabularyReviewActivity(context) {
    const { activity, student, elements, onCorrect } = context;
    const lifecycle = createActivityLifecycle();
    let resolved = false;

    function start() {
        if (lifecycle.destroyed) return;
        const content = document.createElement('div');
        content.className = 'activity-content vocabulary-review';
        const title = document.createElement('h2');
        title.textContent = 'Animais que aprendemos';
        const grid = document.createElement('div');
        grid.className = 'choice-grid';
        for (const item of activity.cards) {
            const card = createButton('');
            card.setAttribute('aria-label', `Ouvir ${item.en} em inglês`);
            const word = document.createElement('strong');
            word.lang = 'en';
            word.textContent = item.en;
            card.append(createImage(item, student.supportLevel), word);
            lifecycle.listen(card, 'click', () => audioService.speak(item.en, 'en-US'));
            grid.append(card);
        }
        const finish = createButton('Concluir revisão', 'check-button');
        lifecycle.listen(finish, 'click', () => {
            if (resolved) return;
            resolved = true;
            finish.disabled = true;
            elements.nextButton.disabled = false;
            elements.setProgress(1, 1);
            elements.setMessage('Muito bem! Você terminou a revisão dos animais.');
            onCorrect(activity.item);
        });
        content.append(title, grid, finish);
        elements.stage.replaceChildren(content);
        elements.setInstruction(activity.instruction);
        elements.setMessage('Ouça quantas vezes quiser. Quando terminar, escolha Concluir revisão.');
        elements.setProgress(0, 1);
        elements.nextButton.disabled = true;
    }

    return Object.freeze({
        start,
        next: () => resolved && !lifecycle.destroyed,
        repeatInstruction() {
            if (!lifecycle.destroyed) audioService.speak(activity.instruction, 'pt-BR');
        },
        destroy() {
            lifecycle.destroy();
            audioService.stop();
        },
    });
}
