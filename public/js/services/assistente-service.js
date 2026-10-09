import { assistenteApi } from "../api/assistente-api.js";

function normalizeText(value, fallback = "") {
    const text = String(value ?? "").trim();

    return text || fallback;
}

function normalizeList(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .slice(0, 4);
}

function normalizeAnalysis(analysis) {
    return Object.freeze({
        summary: normalizeText(
            analysis?.resumo,
            "Não foi possível gerar um resumo.",
        ),

        positivePoints: normalizeList(
            analysis?.pontos_positivos,
        ),

        difficulties: normalizeList(
            analysis?.dificuldades,
        ),

        suggestions: normalizeList(
            analysis?.sugestoes,
        ),

        warning: normalizeText(
            analysis?.aviso,
            (
                "Esta análise é apenas um apoio e não "
                + "substitui a avaliação do professor."
            ),
        ),
    });
}

export const assistenteService = Object.freeze({
    async generateStudentAnalysis(studentId) {
        const payload =
            await assistenteApi.generateStudentAnalysis(
                studentId,
            );

        if (!payload?.disponivel) {
            return Object.freeze({
                available: false,
                code: normalizeText(
                    payload?.codigo,
                    "AI_UNAVAILABLE",
                ),
                message: normalizeText(
                    payload?.mensagem,
                    (
                        "O assistente está indisponível "
                        + "neste momento."
                    ),
                ),
                analysis: null,
            });
        }

        return Object.freeze({
            available: true,
            code: null,
            message: "",
            analysis: normalizeAnalysis(
                payload.analise,
            ),
        });
    },
});