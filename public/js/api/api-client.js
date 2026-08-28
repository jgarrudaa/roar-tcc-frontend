import { APP_CONFIG } from "../config/app-config.js";
import { storage } from "../utils/storage.js";

export class ApiError extends Error {
    constructor(message, status = 0, details = null) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

async function parseResponse(response) {
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;
    if (!response.ok) {
        throw new ApiError(payload?.message || "Não foi possível concluir a solicitação.", response.status, payload);
    }
    return payload;
}

export async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), APP_CONFIG.requestTimeoutMs);
    const token = storage.getSession()?.token;

    try {
        const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
            ...options,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
            signal: controller.signal,
        });
        return await parseResponse(response);
    } catch (error) {
        if (error.name === "AbortError") {
            throw new ApiError("A solicitação demorou mais que o esperado.");
        }
        throw error instanceof ApiError ? error : new ApiError("Não foi possível conectar à API.");
    } finally {
        window.clearTimeout(timeout);
    }
}
