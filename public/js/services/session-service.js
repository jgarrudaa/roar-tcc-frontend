import { storage } from "../utils/storage.js";

export const sessionService = Object.freeze({
    get: storage.getSession,
    start(session) {
        storage.setSession(session);
        return session;
    },
    end() {
        storage.clearSession();
    },
    isAuthenticated() {
        return Boolean(storage.getSession()?.token);
    },
});
