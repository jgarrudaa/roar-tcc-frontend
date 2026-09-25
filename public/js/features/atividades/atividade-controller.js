import { atividadeService } from "../../services/atividade-service.js";
import { soundFx } from "../../services/roar-sound-fx.js";
import { createAssociateActivity, } from "./associar.js?v=2";
import { createRecognizeActivity, } from "./reconhecer.js";
import { createValidateActivity, } from "./validar.js?v=2";
import { createAudioImageActivity, } from "./audio-imagem.js";
import { createTrueFalseActivity, } from "./verdadeiro-falso.js";
import { createMemoryActivity, } from "./memoria.js?v=2";
import { createCompleteSentenceActivity,} from "./completar-frase.js";
import { createOrderSentenceActivity,} from "./ordenar-frase.js";
import { createWritingActivity,} from "./escrita.js";
import { createWordBankActivity,} from "./banco-palavras.js";



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
    if (!startedAt) {
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

export async function createActivityController({
    moduleId,
    stage,
    elements,
}) {
    const context =
        await atividadeService.getContext(
            moduleId,
            stage,
        );

    const {
        activity,
        module,
        student,
    } = context;

    elements.title.textContent =
        module.title;

    elements.levelBadge.textContent =
        student.supportMode;

    elements.setInstruction(
        activity.instruction,
    );

    if (activity.status !== "active") {
        createBlockedMessage(elements);

        elements.setInstruction(
            "Escolha outra atividade disponível.",
        );

        elements.setMessage(
            "Quando ela for liberada, você poderá continuar.",
        );

        setControlsDisabled(
            elements,
            true,
        );

        return null;
    }

    const factory =
        ACTIVITY_FACTORIES[
        activity.type
        ];

    if (!factory) {
        throw new Error(
            `Motor não encontrado para o tipo '${activity.type}'.`,
        );
    }


    /*
 * Progresso geral do módulo.
 *
 * Cada motor trabalha internamente com seu próprio progresso,
 * por exemplo 0/1 ou 1/2. O controller converte esse valor
 * para a posição correspondente entre todas as atividades.
 */
    const currentActivityIndex =
        findCurrentActivityIndex(
            module,
            activity,
        );

    if (currentActivityIndex < 0) {
        throw new Error(
            "A atividade atual não foi encontrada no módulo.",
        );
    }

    const totalModuleActivities =
        Math.max(
            1,
            module.activities.length,
        );

    function setModuleProgress(
        activityValue,
        activityMaximum,
    ) {
        const safeMaximum =
            Math.max(
                1,
                Number(activityMaximum) || 1,
            );

        const safeValue =
            Math.min(
                safeMaximum,
                Math.max(
                    0,
                    Number(activityValue) || 0,
                ),
            );

        const activityPercentage =
            safeValue / safeMaximum;

        const moduleProgress =
            Math.min(
                totalModuleActivities,
                currentActivityIndex +
                activityPercentage,
            );

        elements.progress.max =
            totalModuleActivities;

        elements.progress.value =
            moduleProgress;

        elements.progressLabel.textContent =
            `Etapa ${currentActivityIndex + 1} de ${totalModuleActivities}`;
    }

    const engineElements = {
        ...elements,
        setProgress: setModuleProgress,
    };

    /*
     * Mostra a posição correta imediatamente,
     * antes mesmo de o aluno responder.
     */
    setModuleProgress(0, 1);

    const statistics = {
        correct: 0,
        wrong: 0,
    };

    /*
     * Evita contabilizar o mesmo item
     * como correto mais de uma vez.
     */
    const correctItems = new Set();

    let startedAt = null;
    let completionPromise = null;
    let navigationStarted = false;
    let activityStarted = false;

    function registerCorrect(item) {
        const itemId =
            item?.itemId ??
            item?.id ??
            activity.id;

        const itemKey =
            String(itemId);

        if (
            correctItems.has(itemKey)
        ) {
            return;
        }

        correctItems.add(itemKey);
        statistics.correct += 1;
    }

    function registerWrong() {
        statistics.wrong += 1;
    }

    const engine = factory({
        ...context,

        /*
         * barra representa o módulo completo.
         */
        elements: engineElements,

        onCorrect(item) {
            soundFx.playSuccess();
            registerCorrect(item);
        },

        onWrong() {
            soundFx.playTryAgain();
            registerWrong();
        },
    });

    if (
        !engine ||
        typeof engine.start !==
        "function" ||
        typeof engine.next !==
        "function"
    ) {
        throw new Error(
            "O motor da atividade possui uma interface inválida.",
        );
    }

    function getNextDestination() {
        const currentIndex =
            findCurrentActivityIndex(
                module,
                activity,
            );

        if (currentIndex < 0) {
            throw new Error(
                "A atividade atual não foi encontrada no módulo.",
            );
        }

        const nextActivity =
            module.activities[
            currentIndex + 1
            ];

        if (!nextActivity) {
            return "atividades.html";
        }

        return buildNextUrl(
            module.id,
            nextActivity,
        );
    }

    async function finishActivity() {
        const timeSeconds =
            calculateElapsedSeconds(
                startedAt,
            );

        elements.setMessage(
            "Salvando seu progresso...",
        );

        setControlsDisabled(
            elements,
            true,
        );

        try {
            const result =
                await atividadeService.complete(
                    activity.id,
                    {
                        correct:
                            statistics.correct,

                        wrong:
                            statistics.wrong,

                        timeSeconds,
                    },
                );

            const earnedXp =
                Number(
                    result?.data?.xp_ganho ??
                    result?.xp_ganho,
                ) || 0;

            soundFx.playAchievement();
            elements.setMessage(
                earnedXp > 0
                    ? `Atividade concluída! Você ganhou ${earnedXp} XP.`
                    : "Atividade concluída! Seu progresso foi salvo.",
            );

            if (navigationStarted) {
                return true;
            }

            navigationStarted = true;

            const destination =
                getNextDestination();

            window.setTimeout(() => {
                navigateTo(destination);
            }, 700);

            return true;
        } catch (error) {
            console.error(
                "Não foi possível registrar a conclusão:",
                error,
            );

            completionPromise = null;

            elements.setMessage(
                error?.message ||
                "Não foi possível salvar seu progresso. Tente novamente.",
            );

            elements.nextButton.disabled =
                false;

            elements.repeatButton.disabled =
                false;

            return false;
        }
    }

    return Object.freeze({
        start() {
            if (activityStarted) {
                return;
            }

            activityStarted = true;

            startedAt =
                performance.now();

            engine.start();
        },

        repeatInstruction() {
            if (
                navigationStarted ||
                completionPromise
            ) {
                return;
            }

            if (
                typeof
                engine.repeatInstruction ===
                "function"
            ) {
                engine.repeatInstruction();
            }
        },

        next() {
            if (navigationStarted) {
                return completionPromise;
            }

            /*
             * Enquanto o progresso estiver
             * sendo enviado, cliques adicionais
             * reutilizam a mesma Promise.
             */
            if (completionPromise) {
                return completionPromise;
            }

            const completed =
                engine.next();

            if (!completed) {
                return Promise.resolve(false);
            }

            completionPromise =
                finishActivity();

            return completionPromise;
        },

        getStatistics() {
            return Object.freeze({
                correct:
                    statistics.correct,

                wrong:
                    statistics.wrong,

                timeSeconds:
                    calculateElapsedSeconds(
                        startedAt,
                    ),
            });
        },
    });
}