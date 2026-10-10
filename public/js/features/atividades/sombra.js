import { audioService } from "../../services/audio-service.js";
import { createShadowPuzzle, getShadowPieceCount } from "./sombra-puzzle.js";

const SVG_NS = "http://www.w3.org/2000/svg";
let graphicSequence = 0;

function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function button(label, className) {
    const element = node("button", className, label);
    element.type = "button";
    return element;
}

function svgNode(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, String(value));
    }
    return element;
}

function shuffledPieces(pieces) {
    const shuffled = [...pieces];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const nextIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
    }
    // Even a two-piece puzzle begins with a visibly mixed tray.
    if (shuffled.every((piece, index) => piece.id === pieces[index].id)) {
        shuffled.push(shuffled.shift());
    }
    return shuffled;
}

export function createShadowActivity(context) {
    const { activity, elements, onCorrect, onWrong } = context;
    const item = activity.item;
    const puzzle = createShadowPuzzle(getShadowPieceCount(context));
    const source = String(item.vectorImage || item.realImage || "").trim();
    const instruction = activity.instruction ||
        "Arraste cada peça até sua sombra. Você também pode tocar na peça e na sombra.";
    const placed = new Set();
    const pieceButtons = new Map();
    const targetButtons = new Map();
    let root;
    let board;
    let counter;
    let hintButton;
    let selectedId = null;
    let drag = null;
    let ghost = null;
    let hoveredTarget = null;
    let loaded = false;
    let resolved = false;
    let reportedCorrect = false;
    let destroyed = false;
    let started = false;
    let loadImage = null;
    let loadVersion = 0;
    let listeners = null;
    let suppressClick = null;

    function playWord() {
        if (destroyed || context.soundsEnabled === false) return;
        const speak = context.speak || context.onSpeak;
        if (typeof speak === "function") speak(item.en, "en-US");
        else audioService.speak(item.en, "en-US");
    }

    function setMessage(message) {
        elements.setMessage(message);
    }

    function createGraphic(piece, shadow = false) {
        const id = `shadow-graphic-${++graphicSequence}`;
        const { bounds } = piece;
        const svg = svgNode("svg", {
            viewBox: `${bounds.x} ${bounds.y} ${bounds.right - bounds.x} ${bounds.bottom - bounds.y}`,
            "aria-hidden": "true",
            focusable: "false",
            class: "shadow-piece-graphic",
        });
        const defs = svgNode("defs");
        const clip = svgNode("clipPath", { id: `${id}-clip`, clipPathUnits: "userSpaceOnUse" });
        clip.append(svgNode("path", { d: piece.path }));
        defs.append(clip);
        if (shadow) {
            const filter = svgNode("filter", {
                id: `${id}-filter`, x: "0%", y: "0%", width: "100%", height: "100%",
                "color-interpolation-filters": "sRGB",
            });
            filter.append(svgNode("feColorMatrix", {
                type: "matrix",
                values: "0 0 0 0 0.20  0 0 0 0 0.25  0 0 0 0 0.33  0 0 0 1 0",
            }));
            defs.append(filter);
        }
        const shape = svgNode("path", {
            d: piece.path,
            class: "shadow-piece-shape",
            fill: shadow ? "#e5e9ed" : "#fffaf1",
        });
        const image = svgNode("image", {
            href: source,
            x: 0, y: 0, width: puzzle.size, height: puzzle.size,
            preserveAspectRatio: "xMidYMid meet",
            "clip-path": `url(#${id}-clip)`,
        });
        if (shadow) image.setAttribute("filter", `url(#${id}-filter)`);
        const outline = svgNode("path", {
            d: piece.path,
            fill: "none",
            stroke: shadow ? "#96a3ad" : "#65889a",
            "stroke-width": 1.7,
            "vector-effect": "non-scaling-stroke",
            class: "shadow-piece-outline",
        });
        svg.append(defs, shape, image, outline);
        return svg;
    }

    function clearHighlights() {
        targetButtons.forEach((target) => {
            target.classList.remove("is-hinted", "is-over");
        });
        hoveredTarget = null;
    }

    function selectPiece(id, announce = true) {
        if (!loaded || resolved || placed.has(id)) return;
        selectedId = id;
        clearHighlights();
        pieceButtons.forEach((pieceButton, pieceId) => {
            const selected = pieceId === id;
            pieceButton.classList.toggle("is-selected", selected);
            pieceButton.setAttribute("aria-pressed", String(selected));
        });
        hintButton.disabled = false;
        if (announce) {
            setMessage("Peça selecionada. Arraste até a sombra ou toque no lugar de encaixe.");
        }
    }

    function updateProgress() {
        counter.textContent = `${placed.size} de ${puzzle.pieces.length} peças`;
        elements.setProgress(placed.size, puzzle.pieces.length);
    }

    function placePiece(pieceId, targetId) {
        if (!loaded || resolved || placed.has(pieceId) || placed.has(targetId)) return;
        if (pieceId !== targetId) {
            setMessage("Essa peça encaixa em outra sombra. Vamos tentar de novo, com calma.");
            onWrong?.(item);
            return;
        }

        placed.add(pieceId);
        const target = targetButtons.get(targetId);
        const pieceButton = pieceButtons.get(pieceId);
        const wasFocused = document.activeElement === pieceButton || document.activeElement === target;
        target.replaceChildren(createGraphic(puzzle.pieces[pieceId]));
        target.classList.add("is-matched");
        target.disabled = true;
        target.setAttribute("aria-label", `Peça ${pieceId + 1} encaixada`);
        pieceButton.disabled = true;
        pieceButton.classList.remove("is-selected", "is-dragging");
        pieceButton.classList.add("is-matched");
        pieceButton.setAttribute("aria-pressed", "false");
        pieceButton.setAttribute("aria-label", `Peça ${pieceId + 1} já encaixada`);
        selectedId = null;
        hintButton.disabled = true;
        clearHighlights();
        updateProgress();

        if (placed.size === puzzle.pieces.length) {
            resolved = true;
            root.classList.add("is-complete");
            elements.nextButton.disabled = false;
            setMessage(`Você montou o quebra-cabeça! ${item.en} significa ${item.pt}.`);
            if (!reportedCorrect) {
                reportedCorrect = true;
                onCorrect?.(item);
            }
            if (wasFocused) elements.nextButton.focus({ preventScroll: true });
        } else {
            setMessage("Encaixou! Escolha outra peça quando quiser.");
            if (wasFocused) {
                [...pieceButtons.values()].find((piece) => !piece.disabled)?.focus({ preventScroll: true });
            }
        }
    }

    function containsPoint(target, x, y) {
        const path = target.querySelector(".shadow-piece-shape");
        const matrix = path?.getScreenCTM();
        if (!matrix || typeof path.isPointInFill !== "function") return false;
        try {
            const point = new DOMPoint(x, y).matrixTransform(matrix.inverse());
            return path.isPointInFill(point);
        } catch {
            return false;
        }
    }

    function targetAt(x, y) {
        // The ghost ignores hit tests. SVG tabs can extend beyond a button's cell.
        const underPointer = document.elementFromPoint(x, y)?.closest(".shadow-target");
        if (underPointer && board.contains(underPointer) && !underPointer.disabled &&
            containsPoint(underPointer, x, y)) return underPointer;

        for (const target of targetButtons.values()) {
            if (!target.disabled && containsPoint(target, x, y)) return target;
        }

        const boardBounds = board.getBoundingClientRect();
        const tolerance = Math.min(24, Math.max(12, boardBounds.width * 0.035));
        let closest = null;
        let closestDistance = Infinity;
        for (const [id, target] of targetButtons) {
            if (target.disabled) continue;
            const piece = puzzle.pieces[id];
            const left = boardBounds.left + piece.x / puzzle.size * boardBounds.width;
            const top = boardBounds.top + piece.y / puzzle.size * boardBounds.height;
            const right = left + piece.width / puzzle.size * boardBounds.width;
            const bottom = top + piece.height / puzzle.size * boardBounds.height;
            const distanceX = Math.max(left - x, 0, x - right);
            const distanceY = Math.max(top - y, 0, y - bottom);
            if (Math.hypot(distanceX, distanceY) > tolerance) continue;
            const distance = Math.hypot(x - (left + right) / 2, y - (top + bottom) / 2);
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = target;
            }
        }
        return closest;
    }

    function moveGhost(x, y) {
        if (!ghost || !drag) return;
        ghost.style.transform = `translate3d(${x - drag.offsetX}px, ${y - drag.offsetY}px, 0)`;
        const target = targetAt(x, y);
        if (hoveredTarget !== target) {
            hoveredTarget?.classList.remove("is-over");
            target?.classList.add("is-over");
            hoveredTarget = target;
        }
    }

    function createGhost() {
        const graphic = drag.button.querySelector("svg");
        const bounds = graphic.getBoundingClientRect();
        drag.offsetX = drag.startX - bounds.left;
        drag.offsetY = drag.startY - bounds.top;
        ghost = node("div", "shadow-ghost");
        ghost.setAttribute("aria-hidden", "true");
        Object.assign(ghost.style, {
            position: "fixed", left: "0", top: "0", pointerEvents: "none",
            zIndex: "10000", width: `${bounds.width}px`, height: `${bounds.height}px`,
        });
        ghost.append(createGraphic(puzzle.pieces[drag.pieceId]));
        document.body.append(ghost);
        drag.button.classList.add("is-dragging");
    }

    function cleanupDrag() {
        const currentDrag = drag;
        drag = null;
        if (currentDrag) {
            currentDrag.button.classList.remove("is-dragging");
            if (currentDrag.button.hasPointerCapture?.(currentDrag.pointerId)) {
                currentDrag.button.releasePointerCapture(currentDrag.pointerId);
            }
        }
        ghost?.remove();
        ghost = null;
        hoveredTarget?.classList.remove("is-over");
        hoveredTarget = null;
    }

    function pointerDown(event, pieceId, pieceButton) {
        if (!loaded || resolved || placed.has(pieceId) || drag ||
            event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0)) return;
        suppressClick = null;
        selectPiece(pieceId, false);
        drag = {
            pointerId: event.pointerId,
            pieceId,
            button: pieceButton,
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
            threshold: event.pointerType === "touch" ? 10 : 6,
        };
        pieceButton.setPointerCapture?.(event.pointerId);
    }

    function pointerMove(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= drag.threshold) {
            drag.moved = true;
            createGhost();
        }
        if (!drag.moved) return;
        event.preventDefault();
        moveGhost(event.clientX, event.clientY);
    }

    function pointerUp(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const currentDrag = drag;
        const target = currentDrag.moved ? targetAt(event.clientX, event.clientY) : null;
        if (currentDrag.moved) suppressClick = { pieceId: currentDrag.pieceId, until: performance.now() + 500 };
        cleanupDrag();
        if (!currentDrag.moved) return;
        event.preventDefault();
        if (target) placePiece(currentDrag.pieceId, Number(target.dataset.pieceId));
        else setMessage("A peça voltou para o mesmo lugar. Leve-a até uma sombra quando quiser.");
    }

    function cancelPointer(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const currentDrag = drag;
        if (currentDrag.moved) suppressClick = { pieceId: currentDrag.pieceId, until: performance.now() + 500 };
        cleanupDrag();
    }

    function handleEscape(event) {
        if (event.key !== "Escape" || !root?.isConnected || (!drag && selectedId === null)) return;
        if (drag?.moved) suppressClick = { pieceId: drag.pieceId, until: performance.now() + 500 };
        cleanupDrag();
        selectedId = null;
        clearHighlights();
        pieceButtons.forEach((pieceButton) => {
            pieceButton.classList.remove("is-selected");
            pieceButton.setAttribute("aria-pressed", "false");
        });
        hintButton.disabled = true;
        setMessage("Escolha uma peça quando quiser continuar.");
    }

    function hint() {
        if (selectedId === null || placed.has(selectedId) || !loaded || resolved) return;
        clearHighlights();
        targetButtons.get(selectedId).classList.add("is-hinted");
        setMessage("A sombra destacada é o lugar desta peça. Você pode tocar nela para encaixar.");
    }

    function renderPuzzle() {
        const workspace = node("div", "shadow-workspace");
        const boardPanel = node("section", "shadow-board-panel");
        const trayPanel = node("section", "shadow-tray-panel");
        board = node("div", "shadow-board");
        board.style.position = "relative";
        board.style.aspectRatio = "1";
        board.dataset.columns = String(puzzle.columns);
        board.dataset.rows = String(puzzle.rows);
        board.setAttribute("role", "group");
        board.setAttribute("aria-label", "Sombras para montar o quebra-cabeça");
        counter = node("p", "shadow-counter");
        counter.setAttribute("aria-live", "polite");
        const tray = node("div", "shadow-tray");
        tray.setAttribute("role", "group");
        tray.setAttribute("aria-label", "Peças do quebra-cabeça");

        for (const piece of puzzle.pieces) {
            const target = button("", "shadow-target");
            const { bounds } = piece;
            target.dataset.pieceId = String(piece.id);
            target.setAttribute("aria-label", `Encaixe ${piece.id + 1}, linha ${piece.row + 1}, coluna ${piece.column + 1}`);
            Object.assign(target.style, {
                position: "absolute",
                left: `${bounds.x / puzzle.size * 100}%`,
                top: `${bounds.y / puzzle.size * 100}%`,
                width: `${(bounds.right - bounds.x) / puzzle.size * 100}%`,
                height: `${(bounds.bottom - bounds.y) / puzzle.size * 100}%`,
                padding: "0", border: "0", background: "transparent",
            });
            target.append(createGraphic(piece, true));
            target.addEventListener("click", (event) => {
                if (selectedId === null) {
                    setMessage("Primeiro, escolha uma peça. Depois, toque na sombra.");
                    return;
                }
                const destination = event.detail > 0 ? targetAt(event.clientX, event.clientY) : target;
                if (destination) placePiece(selectedId, Number(destination.dataset.pieceId));
            }, { signal: listeners.signal });
            targetButtons.set(piece.id, target);
            board.append(target);
        }

        for (const piece of shuffledPieces(puzzle.pieces)) {
            const pieceButton = button("", "shadow-piece");
            pieceButton.dataset.pieceId = String(piece.id);
            pieceButton.setAttribute("aria-label", `Selecionar peça ${piece.id + 1} de ${item.pt}`);
            pieceButton.setAttribute("aria-pressed", "false");
            // Only the piece blocks touch scrolling; the rest of the page scrolls normally.
            pieceButton.style.touchAction = "none";
            pieceButton.style.userSelect = "none";
            pieceButton.append(createGraphic(piece));
            pieceButton.addEventListener("pointerdown", (event) => pointerDown(event, piece.id, pieceButton), { signal: listeners.signal });
            pieceButton.addEventListener("lostpointercapture", cancelPointer, { signal: listeners.signal });
            pieceButton.addEventListener("click", (event) => {
                if (event.detail > 0 && suppressClick?.pieceId === piece.id && performance.now() < suppressClick.until) {
                    suppressClick = null;
                    return;
                }
                selectPiece(piece.id);
            }, { signal: listeners.signal });
            pieceButtons.set(piece.id, pieceButton);
            tray.append(pieceButton);
        }

        boardPanel.append(node("h2", "shadow-panel-title", "Monte na sombra"), board, counter);
        trayPanel.append(
            node("h2", "shadow-panel-title", "Escolha uma peça"),
            tray,
            node("p", "shadow-help", "Arraste ou toque em uma peça e depois na sombra. Sem pressa."),
        );
        workspace.append(boardPanel, trayPanel);
        root.append(workspace);
        updateProgress();
        setMessage("Escolha uma peça para começar. Você pode ouvir a palavra quantas vezes quiser.");
    }

    function showLoadError(status) {
        loaded = false;
        elements.nextButton.disabled = true;
        root.removeAttribute("aria-busy");
        elements.stage.removeAttribute("aria-busy");
        status.className = "shadow-error";
        status.replaceChildren(
            node("p", "", "A imagem não carregou. Vamos tentar novamente?"),
        );
        const retry = button("Tentar novamente", "shadow-retry");
        retry.addEventListener("click", () => loadPuzzle(status), { signal: listeners.signal });
        status.append(retry);
        setMessage("Para jogar, precisamos carregar a imagem. Toque em Tentar novamente.");
    }

    function loadPuzzle(status) {
        const version = ++loadVersion;
        root.setAttribute("aria-busy", "true");
        status.className = "shadow-status";
        status.textContent = "Carregando o quebra-cabeça…";
        if (loadImage) {
            loadImage.onload = null;
            loadImage.onerror = null;
        }
        if (!source) {
            showLoadError(status);
            return;
        }
        const image = new Image();
        loadImage = image;
        let settled = false;
        const finish = (success) => {
            if (settled || destroyed || version !== loadVersion) return;
            settled = true;
            image.onload = null;
            image.onerror = null;
            if (!success || !image.naturalWidth || !image.naturalHeight) {
                showLoadError(status);
                return;
            }
            loaded = true;
            root.removeAttribute("aria-busy");
            elements.stage.removeAttribute("aria-busy");
            status.remove();
            renderPuzzle();
        };
        image.onload = () => finish(true);
        image.onerror = () => finish(false);
        image.src = source;
        if (image.complete) queueMicrotask(() => finish(image.naturalWidth > 0));
    }

    function start() {
        if (started || destroyed) return;
        started = true;
        listeners = new AbortController();
        root = node("div", "activity-content shadow-game");
        const header = node("div", "shadow-header");
        const word = node("strong", "shadow-word", item.en);
        word.lang = "en";
        const translation = node("span", "shadow-translation", item.pt);
        translation.lang = "pt-BR";
        header.append(word, translation);
        const controls = node("div", "shadow-controls");
        const listen = button("Ouvir palavra", "listen-button shadow-listen-button");
        listen.setAttribute("aria-label", `Ouvir ${item.en} em inglês`);
        listen.addEventListener("click", playWord, { signal: listeners.signal });
        hintButton = button("Mostrar dica", "shadow-hint-button");
        hintButton.disabled = true;
        hintButton.addEventListener("click", hint, { signal: listeners.signal });
        controls.append(listen, hintButton);
        const status = node("div", "shadow-status", "Carregando o quebra-cabeça…");
        status.setAttribute("role", "status");
        root.append(header, controls, status);
        elements.stage.replaceChildren(root);
        elements.nextButton.disabled = true;
        elements.setInstruction(instruction);
        elements.setProgress(0, puzzle.pieces.length);
        window.addEventListener("pointermove", pointerMove, { passive: false, signal: listeners.signal });
        window.addEventListener("pointerup", pointerUp, { signal: listeners.signal });
        window.addEventListener("pointercancel", cancelPointer, { signal: listeners.signal });
        window.addEventListener("keydown", handleEscape, { signal: listeners.signal });
        window.addEventListener("blur", cleanupDrag, { signal: listeners.signal });
        loadPuzzle(status);
    }

    function destroy() {
        if (destroyed) return;
        destroyed = true;
        loadVersion += 1;
        cleanupDrag();
        listeners?.abort();
        if (loadImage) {
            loadImage.onload = null;
            loadImage.onerror = null;
        }
    }

    return Object.freeze({
        start,
        repeatInstruction() {
            if (destroyed || context.soundsEnabled === false) return;
            const speak = context.speak || context.onSpeak || audioService.speak;
            speak(instruction, "pt-BR");
        },
        next: () => loaded && resolved && !destroyed,
        destroy,
    });
}
