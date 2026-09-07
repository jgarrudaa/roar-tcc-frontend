import { APP_CONFIG } from "../config/app-config.js";
import { storage } from "../utils/storage.js";

export class ApiError extends Error {
    constructor(
        message,
        {
            status = 0,
            code = "UNKNOWN_ERROR",
            details = null,
        } = {},
    ) {
        super(message);

        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function getAccessToken() {
    const session = storage.getSession();
    return session?.token ?? null;
}

function createRequestUrl(path) {
    if (typeof path !== "string" || !path.trim()) {
        throw new ApiError("O endpoint da requisição é inválido.", {
            code: "INVALID_ENDPOINT",
        });
    }

    const baseUrl = APP_CONFIG.apiBaseUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${baseUrl}${normalizedPath}`;
}

function createRequestHeaders(customHeaders = {}, hasBody = false) {
    const token = getAccessToken();

    return {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...customHeaders,
    };
}

async function parseResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const isJsonResponse = contentType.includes("application/json");

    if (!isJsonResponse) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        throw new ApiError("O servidor retornou um JSON inválido.", {
            status: response.status,
            code: "INVALID_JSON_RESPONSE",
        });
    }
}

function getErrorMessage(responseData, status) {
    const backendMessage =
        responseData?.message ??
        responseData?.erro ??
        responseData?.mensagem;

    if (backendMessage) {
        return backendMessage;
    }

    const messagesByStatus = {
        400: "Os dados enviados são inválidos.",
        401: "Sua sessão é inválida ou expirou.",
        403: "Você não possui permissão para realizar esta ação.",
        404: "O recurso solicitado não foi encontrado.",
        409: "Os dados enviados causaram um conflito.",
        422: "Não foi possível processar os dados enviados.",
        429: "Muitas solicitações foram realizadas. Tente novamente.",
        500: "O servidor encontrou um erro interno.",
        502: "O servidor está temporariamente indisponível.",
        503: "O serviço está temporariamente indisponível.",
    };

    return (
        messagesByStatus[status] ??
        "Não foi possível concluir a solicitação."
    );
}

function createHttpError(response, responseData) {
    return new ApiError(
        getErrorMessage(responseData, response.status),
        {
            status: response.status,
            code: responseData?.code ?? `HTTP_${response.status}`,
            details: responseData,
        },
    );
}

function handleInvalidSession(error) {
    if (error.status !== 401) {
        return;
    }

    storage.clearSession();

    window.dispatchEvent(
        new CustomEvent("roar:session-invalid", {
            detail: {
                code: error.code,
                message: error.message,
            },
        }),
    );
}

function createFetchOptions(options, controller) {
    const hasBody =
        options.body !== undefined &&
        options.body !== null;

    return {
        ...options,
        headers: createRequestHeaders(options.headers, hasBody),
        body: hasBody
            ? JSON.stringify(options.body)
            : undefined,
        signal: controller.signal,
    };
}

async function request(path, options = {}) {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(
        () => controller.abort(),
        APP_CONFIG.requestTimeoutMs,
    );

    try {
        const response = await fetch(
            createRequestUrl(path),
            createFetchOptions(options, controller),
        );

        const responseData = await parseResponse(response);

        if (!response.ok) {
            const error = createHttpError(response, responseData);
            handleInvalidSession(error);
            throw error;
        }

        return responseData;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === "AbortError") {
            throw new ApiError(
                "O servidor demorou muito para responder. Tente novamente.",
                {
                    status: 408,
                    code: "REQUEST_TIMEOUT",
                },
            );
        }

        throw new ApiError(
            "Não foi possível conectar ao servidor. Verifique sua conexão.",
            {
                status: 0,
                code: "NETWORK_ERROR",
                details: error,
            },
        );
    } finally {
        window.clearTimeout(timeoutId);
    }
}

export const apiClient = Object.freeze({
    get(path, options = {}) {
        return request(path, {
            ...options,
            method: "GET",
        });
    },

    post(path, body, options = {}) {
        return request(path, {
            ...options,
            method: "POST",
            body,
        });
    },

    put(path, body, options = {}) {
        return request(path, {
            ...options,
            method: "PUT",
            body,
        });
    },

    patch(path, body, options = {}) {
        return request(path, {
            ...options,
            method: "PATCH",
            body,
        });
    },

    delete(path, options = {}) {
        return request(path, {
            ...options,
            method: "DELETE",
        });
    },
});