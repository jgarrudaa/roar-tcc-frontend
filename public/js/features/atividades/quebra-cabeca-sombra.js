import { audioService } from "../../services/audio-service.js";
import { createImage, shuffle } from "./activity-helpers.js";

/**
 * Seleciona o item correto e distratores apropriados para o nível do aluno.
 * Nível 1: 2 opções (1 correta + 1 distrator) para reduzir sobrecarga sensorial.
 * Nível 2: 3 opções (1 correta + 2 distratores).
 * Nível 3: até 4 opções.
 */
function getPieces(item, items, limit) {
    const itemKey = item.id ?? item.en;
    const alternatives = (items || []).filter(
        (candidate) => (candidate.id ?? candidate.en) !== itemKey,
    );
    return shuffle([item, ...shuffle(alternatives).slice(0, Math.max(1, limit - 1))]);
}

/**
 * Cria a atividade de Jogo de Sombras / Quebra-Cabeça de Encaixar na Sombra.
 * Projetado com foco em estudantes com Transtorno do Espectro Autista (TEA):
 * - Tolerância generosa na área de soltar (drop tolerance) para hipotonia/dispraxia.
 * - Drag & drop multimodal: Pointer Events (touch, caneta/stylus e mouse) e HTML5 Drag & Drop nativo.
 * - Modo acessível de 2 toques: Toque na peça -> Toque na sombra.
 * - Navegação completa por teclado (Tab + Enter/Espaço).
 * - Feedback visual calmo, sem sobrecarga sensorial ou punição por erro.
 * - Reforço positivo com fala em inglês e apoio pedagógico do mascote LEX.
 */
export function createShadowPuzzleActivity(context) {
    const { activity, module, student, elements, onCorrect, onWrong } = context;
    const item = activity.item;

    function getDefaultInstruction() {
        if (student.supportLevel === 1) {
            return "Arraste a figura até a sombra igual.";
        }
        if (student.supportLevel === 2) {
            return `Arraste a imagem de ${item.pt || item.en} até a sombra.`;
        }
        return `Encaixe a silhueta de ${item.en}.`;
    }

    const instruction = activity.instruction || getDefaultInstruction();
    let resolved = false;
    let selectedPiece = null;
    let target = null;
    let options = [];
    let tiles = [];

    // Limpeza de listeners globais ao desmontar ou reiniciar
    let cleanupPointerListeners = null;

    function cleanupGhost() {
        const existingGhost = document.querySelector(".shadow-puzzle-ghost");
        if (existingGhost) {
            existingGhost.remove();
        }
    }

    function placePiece(piece, tile) {
        if (resolved) {
            return;
        }

        const isMatch = (piece.id ?? piece.en) === (item.id ?? item.en);

        if (isMatch) {
            resolved = true;
            selectedPiece = null;

            // Marca a peça no tabuleiro como encaixada e correta
            tiles.forEach((candidate) => candidate.classList.remove("is-selected"));
            tile?.classList.add("is-placed", "is-correct");
            tile?.setAttribute("aria-disabled", "true");

            // Atualiza o alvo da sombra para a figura colorida resolvida
            target.classList.remove("is-drag-over");
            target.classList.add("is-solved");
            target.replaceChildren(createImage(item, student.supportLevel));
            target.setAttribute(
                "aria-label",
                `Correto: ${item.pt || item.en} encaixado na sombra. Toque para ouvir o áudio novamente.`,
            );

            elements.setMessage(
                `Muito bem! Você encaixou ${item.pt || item.en} perfeitamente na sombra!`,
            );
            elements.setProgress(1, 1);
            elements.nextButton.disabled = false;

            onCorrect(item);
            audioService.speak(item.en, "en-US");
            return;
        }

        // Resposta incorreta: feedback amigável, sem som estridente ou punição
        tile?.classList.add("is-wrong");
        elements.setMessage(
            "Essa imagem não combina com a sombra. Observe o formato e tente outra figura!",
        );
        onWrong(item);

        window.setTimeout(() => {
            tile?.classList.remove("is-wrong");
            if (selectedPiece?.item === piece) {
                selectedPiece = null;
                tile?.classList.remove("is-selected");
            }
        }, 650);
    }

    function startPointerDrag(startEvent, piece, tile) {
        if (resolved || tile.classList.contains("is-placed")) {
            return;
        }

        // Limpa qualquer arrasto prévio pendente
        if (cleanupPointerListeners) {
            cleanupPointerListeners();
        }
        cleanupGhost();

        // Pronúncia imediata ao tocar para reforço auditivo e multimodal
        audioService.speak(piece.en, "en-US");

        // Cria o avatar flutuante (ghost) para arrasto fluido a 60fps
        const ghost = document.createElement("div");
        ghost.className = "shadow-puzzle-ghost";
        const ghostImg = createImage(piece, student.supportLevel);
        ghostImg.alt = "";
        ghost.append(ghostImg);
        document.body.append(ghost);

        ghost.style.left = `${startEvent.clientX}px`;
        ghost.style.top = `${startEvent.clientY}px`;

        tile.classList.add("is-dragging-source");
        elements.setMessage("Arraste a figura até a sombra no centro.");

        function isPointOverTarget(clientX, clientY) {
            if (!target) return false;
            const rect = target.getBoundingClientRect();
            // Margem de tolerância generosa (40px) para auxiliar estudantes com dispraxia/TEA
            const tolerance = 40;
            return (
                clientX >= rect.left - tolerance &&
                clientX <= rect.right + tolerance &&
                clientY >= rect.top - tolerance &&
                clientY <= rect.bottom + tolerance
            );
        }

        function onPointerMove(event) {
            ghost.style.left = `${event.clientX}px`;
            ghost.style.top = `${event.clientY}px`;

            if (isPointOverTarget(event.clientX, event.clientY)) {
                target.classList.add("is-drag-over");
                elements.setMessage("Isso! Solte aqui para encaixar na sombra.");
            } else {
                target.classList.remove("is-drag-over");
            }
        }

        function finishDrag(event, dropped) {
            if (cleanupPointerListeners) {
                cleanupPointerListeners();
                cleanupPointerListeners = null;
            }
            ghost.remove();
            tile.classList.remove("is-dragging-source");
            target?.classList.remove("is-drag-over");

            if (dropped && isPointOverTarget(event.clientX, event.clientY)) {
                placePiece(piece, tile);
            }
        }

        function onPointerUp(event) {
            finishDrag(event, true);
        }

        function onPointerCancel(event) {
            finishDrag(event, false);
        }

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerCancel);

        cleanupPointerListeners = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerCancel);
            ghost.remove();
        };
    }

    function render() {
        resolved = false;
        selectedPiece = null;
        if (cleanupPointerListeners) {
            cleanupPointerListeners();
            cleanupPointerListeners = null;
        }
        cleanupGhost();

        elements.stage.replaceChildren();
        elements.nextButton.disabled = true;

        const board = document.createElement("section");
        board.className = "activity-content shadow-puzzle-game";
        board.setAttribute("aria-label", "Quebra-cabeça de sombras: arrastar a imagem até a sombra");

        const help = document.createElement("p");
        help.className = "shadow-puzzle-help";
        help.textContent =
            student.supportLevel === 1
                ? "Arraste a figura até a sombra ou toque nela e depois na sombra."
                : "Arraste a figura até a sombra ou selecione uma imagem e toque na sombra para encaixar.";

        const targetArea = document.createElement("div");
        targetArea.className = "shadow-puzzle-target-area";

        const prompt = document.createElement("p");
        prompt.className = "shadow-puzzle-prompt";
        if (student.supportLevel === 1) {
            prompt.textContent = "Encontre a figura igual";
        } else if (student.supportLevel === 2) {
            prompt.textContent = `Encaixe: ${item.pt || item.en}`;
        } else {
            prompt.textContent = `Silhouette: ${item.en}`;
        }

        target = document.createElement("button");
        target.type = "button";
        target.className = "shadow-puzzle-target";
        target.setAttribute(
            "aria-label",
            "Sombra da figura. Solte aqui a peça correta ou selecione uma peça abaixo e toque nesta sombra.",
        );

        const shadow = createImage(item, student.supportLevel);
        shadow.className = "shadow-puzzle-silhouette";
        shadow.alt = `Sombra da figura de ${item.pt || item.en}`;
        target.append(shadow);

        // Clique/Toque no alvo da sombra
        target.addEventListener("click", () => {
            if (resolved) {
                audioService.speak(item.en, "en-US");
                return;
            }
            if (selectedPiece) {
                placePiece(selectedPiece.item, selectedPiece.button);
            } else {
                elements.setMessage(
                    "Escolha primeiro uma figura abaixo e depois toque na sombra para encaixar!",
                );
                audioService.speak("Escolha uma imagem abaixo para encaixar na sombra.", "pt-BR");
            }
        });

        // Eventos HTML5 Drag & Drop nativos (Desktop mouse)
        target.addEventListener("dragenter", (event) => {
            event.preventDefault();
            if (!resolved) {
                target.classList.add("is-drag-over");
            }
        });

        target.addEventListener("dragover", (event) => {
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "move";
            }
            if (!resolved) {
                target.classList.add("is-drag-over");
            }
        });

        target.addEventListener("dragleave", (event) => {
            if (event.relatedTarget && target.contains(event.relatedTarget)) {
                return;
            }
            target.classList.remove("is-drag-over");
        });

        target.addEventListener("drop", (event) => {
            event.preventDefault();
            target.classList.remove("is-drag-over");
            const index = Number(event.dataTransfer?.getData("text/plain"));
            const chosen = options[index];
            if (chosen && tiles[index]) {
                placePiece(chosen, tiles[index]);
            }
        });

        // Bandeja de peças disponíveis
        const tray = document.createElement("div");
        tray.className = "shadow-puzzle-pieces";
        tray.setAttribute("aria-label", "Peças disponíveis para encaixar");

        const optionLimit =
            student.supportLevel === 1 ? 2 : student.supportLevel === 2 ? 3 : 4;
        options = getPieces(item, module.items, optionLimit);
        tiles = [];

        options.forEach((piece, index) => {
            const tile = document.createElement("button");
            tile.type = "button";
            tile.className = "shadow-puzzle-piece";
            tile.draggable = true;
            tile.setAttribute(
                "aria-label",
                `Peça: ${piece.pt || piece.en}. Arraste até a sombra ou dê dois toques para encaixar.`,
            );

            const pieceImage = createImage(piece, student.supportLevel);
            tile.append(pieceImage);

            // Rótulo de vocabulário para níveis 2 e 3 (apoio letrado e visual)
            if (student.supportLevel > 1) {
                const label = document.createElement("span");
                label.className = "shadow-puzzle-piece-label";
                label.textContent = piece.en;
                tile.append(label);
            }

            // Modo acessível por clique / seleção
            tile.addEventListener("click", () => {
                if (resolved) {
                    audioService.speak(piece.en, "en-US");
                    elements.setMessage(`Esta palavra é ${piece.en}.`);
                    return;
                }

                selectedPiece = { item: piece, button: tile };
                tiles.forEach((candidate) =>
                    candidate.classList.toggle("is-selected", candidate === tile),
                );
                audioService.speak(piece.en, "en-US");
                elements.setMessage(
                    `Figura selecionada: ${piece.pt || piece.en}. Agora toque na sombra para encaixar!`,
                );
            });

            // HTML5 Drag & Drop nativo
            tile.addEventListener("dragstart", (event) => {
                if (resolved || tile.classList.contains("is-placed")) {
                    event.preventDefault();
                    return;
                }
                event.dataTransfer?.setData("text/plain", String(index));
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = "move";
                }
                tile.classList.add("is-dragging-source");
                audioService.speak(piece.en, "en-US");
            });

            tile.addEventListener("dragend", () => {
                tile.classList.remove("is-dragging-source");
                target?.classList.remove("is-drag-over");
            });

            // Pointer Events (suporte unificado para Touch, Caneta Stylus e Mouse)
            tile.addEventListener("pointerdown", (event) => {
                // Se o usuário clicar com o botão primário ou tocar
                if (event.button !== 0 && event.pointerType === "mouse") {
                    return;
                }
                startPointerDrag(event, piece, tile);
            });

            tiles.push(tile);
            tray.append(tile);
        });

        board.append(help, targetArea, tray);
        targetArea.append(prompt, target);
        elements.stage.append(board);

        elements.setInstruction(instruction);
        elements.setMessage(
            student.supportLevel === 1
                ? "Observe a sombra e encontre a figura igual."
                : "Observe a sombra e escolha a figura correspondente.",
        );
        elements.setProgress(0, 1);
    }

    return Object.freeze({
        start: render,
        repeatInstruction() {
            audioService.speak(instruction, "pt-BR");
        },
        next() {
            return resolved;
        },
    });
}
