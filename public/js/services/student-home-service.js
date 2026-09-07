import { alunosApi } from "../api/alunos-api.js";
import { moduloService } from "./modulo-service.js";

function normalizeProfile(payload) {
    const id = Number(payload?.id);
    const name = String(payload?.name ?? "").trim();
    if (!Number.isInteger(id) || id <= 0 || !name) {
        throw new Error("A API retornou um perfil de aluno inválido.");
    }
    return Object.freeze({
        id,
        name,
        initial: name.charAt(0).toLocaleUpperCase("pt-BR"),
        email: String(payload.email ?? "").trim(),
        schoolYear: String(payload.schoolYear ?? "Não informado").trim(),
        learningMode: String(payload.supportLevel ?? "Não informado").trim(),
        xpTotal: Math.max(0, Number(payload.xpTotal) || 0),
    });
}

export const studentHomeService = Object.freeze({
    async load() {
        const [profilePayload, modules] = await Promise.all([
            alunosApi.getCurrent(),
            moduloService.listJourney(),
        ]);
        return Object.freeze({
            profile: normalizeProfile(profilePayload),
            modules,
            featuredModule: modules[0] ?? null,
        });
    },
});
