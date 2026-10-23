import { createActivityLifecycle } from "./activity-lifecycle.js";
import {
    audioService,
} from "../../services/audio-service.js";

import {
    createButton,
    createImage,
} from "./activity-helpers.js";


function normalizeAnswer(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.!?]+$/g, "")
        .toLocaleUpperCase("en-US");
}


function getCorrectAnswer(activity) {
    return normalizeAnswer(
        activity.answer ||
        activity.item?.en,
    );
}


export function createWritingActivity(
    context,
) {
    const lifecycle = createActivityLifecycle();
    const {
        activity,
        student,
        elements,
        onCorrect,
        onWrong,
    } = context;

    const item = activity.item;

    let resolved = false;
    let answerInput = null;
    let checkButton = null;


    function getInstruction() {
        return (
            activity.instruction ||
            "Escreva em inglês o nome da imagem."
        );
    }


    function speakWord(word) {
        audioService.speak(
            word,
            "en-US",
        );
    }


    function handleImageClick() {
        speakWord(item.en);

        elements.setMessage(
            "Ouça a palavra. Depois, escreva sua resposta.",
        );
    }


    function createPromptButton() {
        const button =
            document.createElement("button");

        const image =
            createImage(
                item,
                student.supportLevel,
            );

        button.type = "button";

        button.className =
            "writing-image-button";

        button.title =
            "Clique para ouvir a palavra";

        button.setAttribute(
            "aria-label",
            (
                "Imagem da atividade. " +
                "Clique para ouvir a palavra em inglês."
            ),
        );

        image.alt =
            `Imagem de ${item.pt}`;

        button.append(image);

        lifecycle.listen(button,
            "click",
            handleImageClick,
        );

        return button;
    }


    function showEmptyAnswerMessage() {
        answerInput.setAttribute(
            "aria-invalid",
            "true",
        );

        elements.setMessage(
            "Digite uma palavra antes de conferir.",
        );

        answerInput.focus();
    }


    function handleCorrectAnswer() {
        resolved = true;

        answerInput.disabled = true;
        checkButton.disabled = true;

        answerInput.setAttribute(
            "aria-invalid",
            "false",
        );

        answerInput.classList.remove(
            "is-wrong",
        );

        answerInput.classList.add(
            "is-correct",
        );

        elements.setMessage(
            (
                "Muito bem! Você escreveu " +
                `${item.en}.`
            ),
        );

        elements.setProgress(
            1,
            1,
        );

        elements.nextButton.disabled =
            false;

        onCorrect(item);

        speakWord(item.en);
    }


    function handleWrongAnswer() {
        answerInput.setAttribute(
            "aria-invalid",
            "true",
        );

        answerInput.classList.add(
            "is-wrong",
        );

        elements.setMessage(
            (
                "Essa ainda não é a palavra correta. " +
                "Observe a imagem e tente novamente."
            ),
        );

        onWrong(item);

        answerInput.focus();
        answerInput.select();

        lifecycle.timeout(
            () => {
                answerInput.classList.remove(
                    "is-wrong",
                );
            },
            650,
        );
    }


    function checkAnswer() {
        if (resolved) {
            return;
        }

        const studentAnswer =
            normalizeAnswer(
                answerInput.value,
            );

        if (!studentAnswer) {
            showEmptyAnswerMessage();
            return;
        }

        const correctAnswer =
            getCorrectAnswer(activity);

        if (
            studentAnswer ===
            correctAnswer
        ) {
            handleCorrectAnswer();
            return;
        }

        handleWrongAnswer();
    }


    function handleSubmit(event) {
        event.preventDefault();
        checkAnswer();
    }


    function handleInput() {
        answerInput.setAttribute(
            "aria-invalid",
            "false",
        );

        answerInput.classList.remove(
            "is-wrong",
        );

        if (!resolved) {
            elements.setMessage(
                "Quando terminar, pressione Conferir.",
            );
        }
    }


    function createWritingForm() {
        const form =
            document.createElement("form");

        const label =
            document.createElement("label");

        const help =
            document.createElement("p");

        answerInput =
            document.createElement("input");

        checkButton =
            createButton(
                "Conferir",
                "writing-check-button",
            );

        checkButton.type = "submit";

        form.className =
            "writing-form";

        form.noValidate = true;

        label.className =
            "writing-label";

        label.htmlFor =
            "writing-answer";

        label.textContent =
            "Escreva a palavra em inglês";

        answerInput.id =
            "writing-answer";

        answerInput.className =
            "writing-input";

        answerInput.type =
            "text";

        answerInput.name =
            "answer";

        answerInput.maxLength =
            40;

        answerInput.autocomplete =
            "off";

        answerInput.spellcheck =
            false;

        answerInput.placeholder =
            "Digite sua resposta";

        answerInput.setAttribute(
            "aria-describedby",
            "writing-help",
        );

        answerInput.setAttribute(
            "aria-invalid",
            "false",
        );

        help.id =
            "writing-help";

        help.className =
            "writing-help";

        help.textContent =
            (
                "Você pode usar letras maiúsculas " +
                "ou minúsculas."
            );

        lifecycle.listen(answerInput,
            "input",
            handleInput,
        );

        lifecycle.listen(form,
            "submit",
            handleSubmit,
        );

        form.append(
            label,
            answerInput,
            help,
            checkButton,
        );

        return form;
    }


    function render() {
        if (lifecycle.destroyed) return;
        resolved = false;

        elements.stage.replaceChildren();

        elements.nextButton.disabled =
            true;

        const content =
            document.createElement("div");

        const promptArea =
            document.createElement("div");

        const formArea =
            document.createElement("div");

        content.className =
            (
                "activity-content " +
                "writing-game"
            );

        promptArea.className =
            "writing-prompt";

        formArea.className =
            "writing-form-area";

        promptArea.append(
            createPromptButton(),
        );

        formArea.append(
            createWritingForm(),
        );

        content.append(
            promptArea,
            formArea,
        );

        elements.stage.append(
            content,
        );

        elements.setInstruction(
            getInstruction(),
        );

        elements.setMessage(
            (
                "Observe a imagem e escreva " +
                "a palavra em inglês."
            ),
        );

        elements.setProgress(
            0,
            1,
        );

        lifecycle.frame(
            () => {
                answerInput.focus();
            },
        );
    }


    return Object.freeze({
        destroy() {
            lifecycle.destroy();
            audioService.stop();
        },
        start: render,

        repeatInstruction() {
            if (lifecycle.destroyed) return;
            audioService.speak(
                getInstruction(),
                "pt-BR",
            );
        },

        next() {
            return !lifecycle.destroyed && resolved;
        },
    });
}
