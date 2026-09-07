import { apiClient } from "./api-client.js";


function requirePositiveInteger(value, fieldName) {
    const parsedValue = Number(value);

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue <= 0
    ) {
        throw new TypeError(
            `${fieldName} deve ser um número inteiro positivo.`,
        );
    }

    return parsedValue;
}


function getProfile(teacherId) {
    const validTeacherId =
        requirePositiveInteger(
            teacherId,
            "teacherId",
        );

    return apiClient.get(
        `/professores/perfil/${validTeacherId}`,
    );
}


function updateProfile(teacherId, profileData) {
    const validTeacherId =
        requirePositiveInteger(
            teacherId,
            "teacherId",
        );

    if (
        !profileData ||
        typeof profileData !== "object" ||
        Array.isArray(profileData)
    ) {
        throw new TypeError(
            "Os dados do perfil são inválidos.",
        );
    }

    return apiClient.put(
        `/professores/perfil/${validTeacherId}`,
        profileData,
    );
}


export const professoresApi = Object.freeze({
    getProfile,
    updateProfile,
});