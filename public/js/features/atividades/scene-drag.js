import { createActivityLifecycle } from "./activity-lifecycle.js";

// Pointer events support mouse, pen and touch with the same drop validation.
export function createSceneDrag({ card, targets, enabled, onSelect, onDrop, onCancel }) {
    const lifecycle = createActivityLifecycle();
    let pointer = null;
    let ghost = null;
    let hovered = null;
    let suppressClick = false;

    function targetAt(x, y) {
        const target = document.elementFromPoint(x, y)?.closest(".practice-choice");
        return targets.includes(target) && !target.disabled ? target : null;
    }

    function highlight(target) {
        hovered?.classList.remove("is-drop-hover");
        hovered = target;
        hovered?.classList.add("is-drop-hover");
    }

    function cleanup() {
        const previous = pointer;
        pointer = null;
        ghost?.remove();
        ghost = null;
        highlight(null);
        card.classList.remove("is-dragging");
        targets.forEach(target => target.classList.remove("is-drop-ready"));
        if (previous && card.hasPointerCapture?.(previous.id)) card.releasePointerCapture(previous.id);
    }

    function cancel() {
        if (!pointer) return;
        suppressClick = pointer.moved;
        cleanup();
        onSelect(false);
        onCancel();
    }

    lifecycle.listen(card, "dragstart", event => event.preventDefault());
    lifecycle.listen(card, "click", event => {
        if (suppressClick && event.detail !== 0) {
            suppressClick = false;
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
    lifecycle.listen(card, "pointerdown", event => {
        if (!enabled() || pointer || event.isPrimary === false || event.button !== 0) return;
        suppressClick = false;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
        card.setPointerCapture?.(event.pointerId);
    });
    lifecycle.listen(window, "pointermove", event => {
        if (!pointer || event.pointerId !== pointer.id) return;
        if (!enabled()) { cancel(); return; }
        if (!pointer.moved && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 8) return;
        event.preventDefault();
        if (!pointer.moved) {
            pointer.moved = true;
            onSelect(true);
            card.classList.add("is-dragging");
            targets.forEach(target => target.classList.add("is-drop-ready"));
            ghost = card.cloneNode(true);
            ghost.classList.remove("is-dragging", "is-selected");
            ghost.classList.add("practice-drag-ghost");
            ghost.removeAttribute("id");
            ghost.setAttribute("aria-hidden", "true");
            ghost.tabIndex = -1;
            ghost.inert = true;
            document.body.append(ghost);
        }
        ghost.style.left = `${event.clientX}px`;
        ghost.style.top = `${event.clientY}px`;
        highlight(targetAt(event.clientX, event.clientY));
    }, { passive: false });
    lifecycle.listen(window, "pointerup", event => {
        if (!pointer || event.pointerId !== pointer.id) return;
        const moved = pointer.moved;
        const target = moved ? targetAt(event.clientX, event.clientY) : null;
        suppressClick = moved;
        cleanup();
        if (!moved || !enabled()) return;
        if (target) onDrop(target);
        else { onSelect(false); onCancel(); }
    });
    lifecycle.listen(window, "pointercancel", event => {
        if (event.pointerId === pointer?.id) cancel();
    });
    lifecycle.listen(card, "lostpointercapture", cancel);
    lifecycle.listen(window, "blur", cancel);
    lifecycle.listen(document, "visibilitychange", () => { if (document.hidden) cancel(); });
    lifecycle.listen(window, "keydown", event => {
        if (event.key !== "Escape") return;
        if (pointer) { event.preventDefault(); cancel(); }
        else onSelect(false);
    });
    return { destroy() { lifecycle.destroy(); cleanup(); } };
}
