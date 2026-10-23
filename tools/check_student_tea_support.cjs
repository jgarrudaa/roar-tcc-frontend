const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
    path.join(__dirname, "../public/js/services/aluno-service.js"),
    "utf8",
)
    .replace(/^import[\s\S]*?from\s+"[^"]+";\r?\n/gm, "")
    .replace("export const alunoService", "globalThis.alunoService");

const calls = [];
let listedStudents = [];
const context = vm.createContext({
    APP_CONFIG: { useMocks: false },
    window: {},
    required: (value) => String(value ?? "").trim().length > 0,
    isValidEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    alunosApi: {
        create: async (payload) => {
            calls.push({ action: "create", payload });
            return { aluno_id: 7, nivel_identificado: 1 };
        },
        update: async (id, payload) => {
            calls.push({ action: "update", id, payload });
            return { mensagem: "Atualizado" };
        },
        listByTeacher: async () => listedStudents,
    },
});
vm.runInContext(source, context);
const service = context.alunoService;
const registration = {
    teacherId: 9,
    name: "Aluno Teste",
    email: "aluno@example.com",
    schoolYear: "6º Ano",
    communication: "A1",
    reading: "B1",
};
const updateData = {
    name: registration.name,
    email: registration.email,
    schoolYear: registration.schoolYear,
    level: 3,
};

async function main() {
    for (const teaSupportLevel of [1, 2, 3, "1", "2", "3"]) {
        const student = await service.create({ ...registration, teaSupportLevel });
        assert.equal(calls.at(-1).payload.nivel_suporte_tea, Number(teaSupportLevel));
        assert.equal(student.teaSupportLevel, Number(teaSupportLevel));
        assert.equal(student.level, 1, "Suporte TEA não altera a triagem de aprendizagem");
    }

    for (const teaSupportLevel of [undefined, null, ""]) {
        await service.create({ ...registration, teaSupportLevel });
        assert.equal(Object.hasOwn(calls.at(-1).payload, "nivel_suporte_tea"), false);
        await service.update(7, { ...updateData, teaSupportLevel });
        assert.equal(calls.at(-1).payload.nivel_suporte_tea, null);
    }

    await service.update(7, updateData);
    assert.equal(Object.hasOwn(calls.at(-1).payload, "nivel_suporte_tea"), false);

    for (const teaSupportLevel of [1, 2, 3]) {
        await service.update(7, { ...updateData, teaSupportLevel });
        assert.equal(calls.at(-1).payload.nivel_suporte_tea, teaSupportLevel);
        assert.equal(calls.at(-1).payload.nivel, 3);
    }

    for (const teaSupportLevel of [0, 4, 1.5, true, false, {}, [], "TEA 1", "2.0"]) {
        const callCount = calls.length;
        await assert.rejects(service.create({ ...registration, teaSupportLevel }), /suporte TEA válido/);
        await assert.rejects(service.update(7, { ...updateData, teaSupportLevel }), /suporte TEA válido/);
        assert.equal(calls.length, callCount, "Valores inválidos não devem chegar à API");
    }

    listedStudents = [1, 2, 3, "2", null, undefined, "inválido", true, 4].map((value, index) => ({
        id: index + 1,
        modo_aprendizagem: "Autonomia Contextual",
        nivel_suporte_tea: value,
    }));
    const students = await service.listByTeacher(9);
    assert.deepEqual(Array.from(students, (student) => student.teaSupportLevel), [1, 2, 3, 2, null, null, null, null, null]);
    assert.equal(students.every((student) => student.level === 3), true);

    console.log("Suporte TEA separado: cadastro, edição, limpeza, compatibilidade e validação de payloads verificados.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
