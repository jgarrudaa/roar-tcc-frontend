import { storage } from "../utils/storage.js";

const ALLOWED_ROLES = Object.freeze([
    "teacher",
    "student",
]);

function isValidSession(session) {
    return Boolean(
        session &&
        typeof session === "object" &&
        typeof session.token === "string" &&
        session.token.trim() &&
        ALLOWED_ROLES.includes(session.role) &&
        session.user?.id,
    );
}

function getSession() {
    const session = storage.getSession();

    if (!isValidSession(session)) {
        return null;
    }

    return session;
}

function startSession(session) {
    if (!isValidSession(session)) {
        throw new Error(
            "Não foi possível iniciar uma sessão válida.",
        );
    }

    storage.setSession(session);
    return session;
}

function endSession() {
    storage.clearSession();
}

function isAuthenticated() {
    return Boolean(getSession());
}

function hasRole(role) {
    return getSession()?.role === role;
}

export const sessionService = Object.freeze({
    get: getSession,
    start: startSession,
    end: endSession,
    isAuthenticated,
    hasRole,
});