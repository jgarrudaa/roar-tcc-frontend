const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/js/services/atividade-service.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export const atividadeService', 'const atividadeService');
const context = vm.createContext({});
vm.runInContext(source, context);

for (const [mode, level] of [
    ['Visual Guiado', 1], ['Interativo Visual', 2], ['Verbal', 3],
    ['Nível 1 - Suporte Visual Puro', 1],
    ['Nível 2 - Aprendiz Guiado', 2],
    ['Nível 3 - Autonomia Contextual', 3],
    ['  VERBAL  ', 3], ['Nível 3 — Autonomia Contextual', 3],
]) {
    const student = context.normalizeStudent({id: 7, name: 'Aluno', supportLevel: mode});
    assert.equal(student.supportLevel, level, mode);
    assert.equal(student.id, 7);
}
for (const supportLevel of ['', 'Desconhecido']) {
    assert.throws(() => context.normalizeStudent({id: 7, supportLevel}), /Modo de aprendizagem não suportado/);
}
console.log('Modos atuais e antigos reconhecidos; valores desconhecidos continuam rejeitados.');
