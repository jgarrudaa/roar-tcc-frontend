const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const redirects = [];
vm.runInNewContext(read('public/js/pages/aluno/sombra.js'), {
    window: { location: { replace: target => redirects.push(target) } },
});
assert.deepEqual(redirects, ['atividades.html']);
const legacyPage = read('pages/aluno/sombra.html');
assert.ok(legacyPage.includes('src="../../public/js/pages/aluno/sombra.js"'));
assert.ok(legacyPage.includes('href="atividades.html"'));
assert.ok(!legacyPage.includes('<select'));
assert.ok(!legacyPage.includes('id="activity-stage"'));
assert.ok(!read('pages/aluno/atividades.html').includes('href="sombra.html"'));
assert.ok(!read('pages/aluno/atividades.html').includes('shadow-launcher'));
console.log('Sombras: endereço antigo retorna aos módulos; catálogo sem jogo separado.');
