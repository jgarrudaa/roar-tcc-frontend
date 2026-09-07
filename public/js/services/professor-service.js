import { professoresApi } from "../api/professores-api.js";


const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


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


function normalizeText(value, fallback = "") {
    const normalizedValue =
        String(value ?? "").trim();

    return normalizedValue || fallback;
}


function onlyDigits(value) {
    return String(value ?? "")
        .replace(/\D/g, "");
}


function formatCpf(value) {
    const cpf = onlyDigits(value)
        .slice(0, 11);

    if (cpf.length !== 11) {
        return cpf;
    }

    return cpf.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        "$1.$2.$3-$4",
    );
}


function formatDate(value) {
    if (!value) {
        return "Não informado";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Não informado";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        },
    ).format(date);
}


function createInitials(name) {
    const words = normalizeText(name)
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) {
        return "P";
    }

    const firstInitial =
        words[0].charAt(0);

    const lastInitial =
        words.length > 1
            ? words.at(-1).charAt(0)
            : "";

    return (
        firstInitial + lastInitial
    ).toLocaleUpperCase("pt-BR");
}


function normalizeProfile(response) {
    const professor =
        response?.professor ?? response;

    const id = Number(professor?.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            "O servidor não retornou um perfil de professor válido.",
        );
    }

    const name = normalizeText(
        professor?.nome,
        "Professor",
    );

    const email = normalizeText(
        professor?.email,
    ).toLocaleLowerCase("pt-BR");

    const cpf = onlyDigits(
        professor?.cpf,
    );

    return Object.freeze({
        id,
        name,
        email,
        cpf,
        formattedCpf: formatCpf(cpf),
        initials: createInitials(name),

        createdAt:
            professor?.criado_em
                ? new Date(professor.criado_em)
                : null,

        formattedCreatedAt:
            formatDate(professor?.criado_em),
    });
}


function validateName(value) {
    const name = normalizeText(value);

    if (name.length < 3) {
        throw new TypeError(
            "O nome deve possuir pelo menos 3 caracteres.",
        );
    }

    if (name.length > 150) {
        throw new TypeError(
            "O nome deve possuir no máximo 150 caracteres.",
        );
    }

    return name;
}


function validateEmail(value) {
    const email = normalizeText(value)
        .toLocaleLowerCase("pt-BR");

    if (!EMAIL_PATTERN.test(email)) {
        throw new TypeError(
            "Informe um endereço de e-mail válido.",
        );
    }

    return email;
}


function validateCpf(value) {
    const cpf = onlyDigits(value);

    if (cpf.length !== 11) {
        throw new TypeError(
            "O CPF deve possuir 11 números.",
        );
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
        throw new TypeError(
            "Informe um CPF válido.",
        );
    }

    return cpf;
}


function createUpdatePayload(profileData) {
    if (
        !profileData ||
        typeof profileData !== "object" ||
        Array.isArray(profileData)
    ) {
        throw new TypeError(
            "Os dados do perfil são inválidos.",
        );
    }

    return {
        nome: validateName(
            profileData.name ??
            profileData.nome,
        ),

        email: validateEmail(
            profileData.email,
        ),

        cpf: validateCpf(
            profileData.cpf,
        ),
    };
}


async function getProfile(teacherId) {
    const validTeacherId =
        requirePositiveInteger(
            teacherId,
            "teacherId",
        );

    const response =
        await professoresApi.getProfile(
            validTeacherId,
        );

    return normalizeProfile(response);
}


async function updateProfile(
    teacherId,
    profileData,
) {
    const validTeacherId =
        requirePositiveInteger(
            teacherId,
            "teacherId",
        );

    const payload =
        createUpdatePayload(profileData);

    const response =
        await professoresApi.updateProfile(
            validTeacherId,
            payload,
        );

    return Object.freeze({
        message:
            normalizeText(
                response?.mensagem,
                "Perfil atualizado com sucesso.",
            ),

        profile:
            normalizeProfile(response),
    });
}


export const professorService = Object.freeze({
    getProfile,
    updateProfile,
    formatCpf,
});