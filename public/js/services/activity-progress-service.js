// Only this student's module is read. A draft never changes server completion or XP.
const VERSION = 1;
const MAX_AGE = 14 * 24 * 60 * 60 * 1000;
const MAX_SIZE = 150000;

function key(studentId, moduleId) {
    if (!studentId || !moduleId) return null;
    return `roarActivityDraft:${studentId}:${moduleId}`;
}

export function createAttemptId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
        const random = Math.floor(Math.random() * 16);
        return (character === 'x' ? random : (random & 3) | 8).toString(16);
    });
}

export function activityFingerprint(context) {
    return JSON.stringify({
        // Discard drafts from the former box/table activity after changing flow.
        practiceFlow: 2,
        activities: context.module.activities.map(item => [item.activityId, item.order, item.type]),
        items: context.module.items.map(item => [item.itemId ?? item.id, item.en, item.realImage, item.vectorImage]),
        learning: context.student.supportLevel,
        tea: context.student.teaSupportLevel ?? null,
        settings: context.gameSettings ?? null,
    });
}

export const activityProgressService = Object.freeze({
    savedStage(studentId, moduleId) {
        try {
            const raw = window.localStorage?.getItem(key(studentId, moduleId));
            if (!raw || raw.length > MAX_SIZE) return null;
            const draft = JSON.parse(raw);
            return draft.version === VERSION && Number.isInteger(draft.stage) && draft.stage > 0 &&
                Number.isFinite(draft.updatedAt) && Date.now() - draft.updatedAt <= MAX_AGE &&
                draft.updatedAt <= Date.now() + 60000 ? draft.stage : null;
        } catch { return null; }
    },
    read(studentId, moduleId, fingerprint) {
        try {
            const storageKey = key(studentId, moduleId);
            const raw = storageKey && window.localStorage?.getItem(storageKey);
            if (!raw || raw.length > MAX_SIZE) return null;
            const draft = JSON.parse(raw);
            if (draft.version !== VERSION || draft.fingerprint !== fingerprint ||
                !Number.isFinite(draft.updatedAt) || Date.now() - draft.updatedAt > MAX_AGE ||
                draft.updatedAt > Date.now() + 60000 ||
                !Number.isInteger(draft.stage) || draft.stage < 1 ||
                !Number.isInteger(draft.phaseIndex) || draft.phaseIndex < 0 ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draft.attemptId)) return null;
            return draft;
        } catch { return null; }
    },
    save(studentId, moduleId, draft) {
        try {
            const storageKey = key(studentId, moduleId);
            if (!storageKey) return false;
            const raw = JSON.stringify({ ...draft, version: VERSION, updatedAt: Date.now() });
            if (raw.length > MAX_SIZE) return false;
            window.localStorage.setItem(storageKey, raw);
            return true;
        } catch { return false; }
    },
    clear(studentId, moduleId, attemptId) {
        try {
            const storageKey = key(studentId, moduleId);
            if (!storageKey) return;
            const draft = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
            // A late response must not delete a newer attempt opened in another tab.
            if (draft?.attemptId === attemptId) window.localStorage.removeItem(storageKey);
        } catch { /* Storage is optional; the server remains authoritative. */ }
    },
});
