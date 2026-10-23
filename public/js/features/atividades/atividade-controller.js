import { atividadeService } from "../../services/atividade-service.js";
import { audioService } from "../../services/audio-service.js";
import { soundFx } from "../../services/roar-sound-fx.js";
import { createAssociateActivity, } from "./associar.js?v=4";
import { createRecognizeActivity, } from "./reconhecer.js?v=4";
import { createValidateActivity, } from "./validar.js?v=4";
import { createAudioImageActivity, } from "./audio-imagem.js?v=4";
import { createTrueFalseActivity, } from "./verdadeiro-falso.js?v=4";
import { createMemoryActivity, } from "./memoria.js?v=4";
import { createCompleteSentenceActivity,} from "./completar-frase.js";
import { createOrderSentenceActivity,} from "./ordenar-frase.js?v=1";
import { createWritingActivity,} from "./escrita.js";
import { createWordBankActivity,} from "./banco-palavras.js";
import { createShadowPuzzleActivity } from "./quebra-cabeca-sombra.js";
import { createShadowActivity } from "./sombra.js";
import { getModulePracticePhases } from "./module-practice.js";
import { createCategoriesActivity, createSceneActivity } from "./module-practice-games.js";
import { storage } from "../../utils/storage.js";
import { createBodyPuzzleActivity } from './body-puzzle.js';




const ACTIVITY_FACTORIES = Object.freeze({
   recognize: createRecognizeActivity,
    associate: createAssociateActivity,
    validate: createValidateActivity,
    audioImage: createAudioImageActivity,
    trueFalse: createTrueFalseActivity,
    memory: createMemoryActivity,
    completeSentence: createCompleteSentenceActivity,
    orderSentence:createOrderSentenceActivity,
    writing:createWritingActivity,
    wordBank:createWordBankActivity,
    shadowPuzzle: createShadowPuzzleActivity,
    shadow: createShadowActivity,
    categories: createCategoriesActivity,
    scene: createSceneActivity,
    bodyPuzzle: createBodyPuzzleActivity,
});

function navigateTo(url) {
    if (
        typeof window.roarNavigate ===
        "function"
    ) {
        window.roarNavigate(url);
        return;
    }

    window.location.assign(url);
}

function createBlockedMessage(elements) {
    const container =
        document.createElement("div");

    const title =
        document.createElement("h2");

    const description =
        document.createElement("p");

    container.className =
        "activity-blocked";

    title.textContent =
        "Atividade bloqueada";

    description.textContent =
        "Sua professora ainda não liberou esta atividade.";

    container.append(
        title,
        description,
    );

    elements.stage.replaceChildren(
        container,
    );
}

function findCurrentActivityIndex(
    module,
    activity,
) {
    return module.activities.findIndex(
        (moduleActivity) =>
            moduleActivity.activityId ===
            activity.id,
    );
}

function buildNextUrl(
    moduleId,
    nextActivity,
) {
    const parameters =
        new URLSearchParams({
            modulo: String(moduleId),
            etapa: String(
                nextActivity.order,
            ),
        });

    return `atividade.html?${parameters.toString()}`;
}

function calculateElapsedSeconds(
    startedAt,
) {
    if (startedAt === null) {
        return 0;
    }

    const elapsedMilliseconds =
        performance.now() - startedAt;

    return Math.max(
        1,
        Math.ceil(
            elapsedMilliseconds / 1000,
        ),
    );
}

function setControlsDisabled(
    elements,
    disabled,
) {
    elements.nextButton.disabled =
        disabled;

    elements.repeatButton.disabled =
        disabled;
}

export async function createActivityController({ moduleId, stage, elements }) {
    const context = await atividadeService.getContext(moduleId, stage);
    const { activity, module, student } = context;
    const currentIndex = findCurrentActivityIndex(module, activity);
    const previousActivity = module.activities[currentIndex - 1];
    const previousUrl = previousActivity ? buildNextUrl(module.id, previousActivity) : "atividades.html";
    elements.title.textContent = module.title;
    if (elements.levelBadge) elements.levelBadge.textContent = student.supportMode;
    if (elements.backButton) {
        elements.backButton.href = previousUrl;
        elements.backButton.setAttribute("aria-label", previousActivity ? "Voltar à atividade anterior" : "Voltar para atividades");
        elements.backButton.title = previousActivity ? "Atividade anterior" : "Atividades";
    }
    elements.setInstruction(activity.instruction);
    if (activity.status !== "active") {
        createBlockedMessage(elements);
        elements.setInstruction("Escolha outra atividade disponível.");
        elements.setMessage("Quando ela for liberada, você poderá continuar.");
        setControlsDisabled(elements, true);
        return null;
    }
    if (currentIndex < 0) throw new Error("A atividade atual não foi encontrada no módulo.");
    if (!ACTIVITY_FACTORIES[activity.type]) throw new Error(`Motor não encontrado para o tipo '${activity.type}'.`);

    // The additional level-two game belongs to the same saved activity. The API
    // receives one completion only, after memory AND the puzzle are finished.
    const phases = [activity];
    if (activity.type === "memory" && Number(student.supportLevel) === 2) {
        phases.push({ ...activity, type: "shadow", instruction:
            "Agora monte a imagem! Arraste cada peça até a sombra ou toque para encaixar." });
    }
    if (currentIndex === module.activities.length - 1) {
        phases.push(...getModulePracticePhases(context));
    }
    const statistics = { correct: 0, wrong: 0 };
    const correctItems = new Set();
    let engine;
    let phaseIndex = 0;
    let epoch = 0;
    let phaseLocked = false;
    let autoAdvanceTimer = null;
    let startedAt = null;
    let completionPromise = null;
    let navigationStarted = false;
    let activityStarted = false;
    let disposed = false;
    let autoAdvancePaused = storage.getPreferences()?.autoAdvancePaused === true;

    function scheduleAutoAdvance() {
        clearAutoAdvance();
        if (autoAdvancePaused || disposed || completionPromise || !phaseLocked) return;
        autoAdvanceTimer = window.setTimeout(() => {
            autoAdvanceTimer = null;
            next();
        }, 1000);
    }

    function toggleAutoAdvance() {
        if (disposed || completionPromise) return;
        autoAdvancePaused = !autoAdvancePaused;
        try {
            storage.setPreferences({ ...storage.getPreferences(), autoAdvancePaused });
        } catch {
            // A browser that blocks storage can still pause the current activity.
        }
        scheduleAutoAdvance();
    }

    function clearAutoAdvance() {
        if (autoAdvanceTimer !== null) window.clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
    }

    function setModuleProgress(value, maximum) {
        const max = Math.max(1, Number(maximum) || 1);
        const fraction = Math.min(max, Math.max(0, Number(value) || 0)) / max;
        elements.progress.max = module.activities.length;
        elements.progress.value = currentIndex + (phaseIndex + fraction) / phases.length;
        elements.progressLabel.textContent = `Etapa ${currentIndex + 1} de ${module.activities.length}` +
            (phases.length > 1 ? ` · Jogo ${phaseIndex + 1} de ${phases.length}` : "");
    }

    function lockCompletedStage() {
        phaseLocked = true;
        if (elements.stage.contains(document.activeElement)) elements.nextButton.focus?.({ preventScroll: true });
        elements.stage.inert = true;
    }

    function prepareEngine() {
        const activeEpoch = ++epoch;
        phaseLocked = false;
        elements.stage.inert = false;
        elements.nextButton.disabled = true;
        elements.repeatButton.disabled = false;
        elements.setInstruction(phases[phaseIndex].instruction);
        setModuleProgress(0, 1);
        engine = ACTIVITY_FACTORIES[phases[phaseIndex].type]({
            ...context, activity: phases[phaseIndex],
            elements: { ...elements, setProgress: setModuleProgress },
            onCorrect(item) {
                if (disposed || phaseLocked || activeEpoch !== epoch) return;
                const key = `${phaseIndex}:${item?.itemId ?? item?.id ?? activity.id}`;
                if (!correctItems.has(key)) {
                    correctItems.add(key);
                    statistics.correct += 1;
                    soundFx.playSuccess();
                }
                // Some engines report the answer immediately before updating their
                // resolved flag. Check after the complete input handler has returned.
                queueMicrotask(() => {
                    if (disposed || activeEpoch !== epoch || phaseLocked || completionPromise) return;
                    if (!engine.next() && !engine.isRoundComplete?.()) return;
                    lockCompletedStage();
                    scheduleAutoAdvance();
                });
            },
            onWrong() {
                if (disposed || phaseLocked || activeEpoch !== epoch) return;
                statistics.wrong += 1;
                soundFx.playTryAgain();
            },
        });
        if (!engine || typeof engine.start !== "function" || typeof engine.next !== "function") {
            throw new Error("O motor da atividade possui uma interface inválida.");
        }
    }

    function destroy() {
        if (disposed) return;
        disposed = true;
        epoch += 1;
        clearAutoAdvance();
        engine?.destroy?.();
        audioService.stop();
        soundFx.stop?.();
        elements.stage.inert = false;
    }

    async function finishActivity() {
        elements.setMessage("Salvando seu progresso...");
        setControlsDisabled(elements, true);
        try {
            const result = await atividadeService.complete(activity.id, {
                ...statistics, timeSeconds: calculateElapsedSeconds(startedAt),
            });
            if (disposed) return false;
            const earnedXp = Number(result?.data?.xp_ganho ?? result?.xp_ganho) || 0;
            soundFx.playAchievement();
            elements.setMessage(earnedXp > 0 ? `Atividade concluída! Você ganhou ${earnedXp} XP.` :
                "Atividade concluída! Seu progresso foi salvo.");
            navigationStarted = true;
            const nextActivity = module.activities[currentIndex + 1];
            destroy();
            navigateTo(nextActivity ? buildNextUrl(module.id, nextActivity) : "atividades.html");
            return true;
        } catch (error) {
            if (disposed) return false;
            console.error("Não foi possível registrar a conclusão:", error);
            completionPromise = null;
            elements.setMessage("Não foi possível salvar seu progresso. Toque em Próximo para tentar novamente.");
            setControlsDisabled(elements, false);
            return false;
        }
    }

    function next() {
        if (completionPromise) return completionPromise;
        if (disposed || navigationStarted || !activityStarted) return Promise.resolve(false);
        if (!engine.next() && !engine.isRoundComplete?.()) return Promise.resolve(false);
        clearAutoAdvance();
        if (!engine.next() && engine.advanceRound) {
            phaseLocked = false;
            elements.stage.inert = false;
            return Promise.resolve(engine.advanceRound());
        }
        lockCompletedStage();
        if (phaseIndex + 1 < phases.length) {
            engine.destroy?.();
            audioService.stop();
            soundFx.stop?.();
            phaseIndex += 1;
            prepareEngine();
            engine.start();
            return Promise.resolve(true);
        }
        completionPromise = finishActivity();
        return completionPromise;
    }

    prepareEngine();
    return Object.freeze({
        start() {
            if (activityStarted || disposed) return;
            activityStarted = true;
            startedAt = performance.now();
            engine.start();
        },
        repeatInstruction() {
            if (disposed || navigationStarted || completionPromise) return;
            engine.repeatInstruction?.();
        },
        next,
        toggleAutoAdvance,
        previous() {
            if (disposed || navigationStarted) return;
            destroy();
            navigateTo(previousUrl);
        },
        destroy,
        getStatistics() {
            return Object.freeze({ ...statistics, timeSeconds: calculateElapsedSeconds(startedAt) });
        },
    });
}
