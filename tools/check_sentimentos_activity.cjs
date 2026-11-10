const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

// 1. Validate modulos.json configuration for sentimentos
const modulosRaw = fs.readFileSync(path.join(root, 'public/mocks/modulos.json'), 'utf8');
const modulosData = JSON.parse(modulosRaw);
const sentimentosModule = modulosData.modules.find(m => m.id === 'sentimentos');

assert.ok(sentimentosModule, 'O módulo sentimentos deve estar configurado em modulos.json');
assert.equal(sentimentosModule.status, 'active');
assert.equal(sentimentosModule.title, 'Sentimentos');
assert.equal(sentimentosModule.items.length, 12, 'O módulo sentimentos deve conter os 12 itens de sentimentos');

// Verify that all 12 items have correct paths pointing to sentimento_real and sentimento_vetor
for (const item of sentimentosModule.items) {
    assert.ok(item.realImage.includes('/sentimentos/sentimento_real/'), `${item.id}: realImage deve apontar para sentimento_real`);
    assert.ok(item.vectorImage.includes('/sentimentos/sentimento_vetor/'), `${item.id}: vectorImage deve apontar para sentimento_vetor`);
    
    // Check that files exist on disk
    const realDiskPath = path.join(root, item.realImage.replace(/^\//, ''));
    const vectorDiskPath = path.join(root, item.vectorImage.replace(/^\//, ''));
    assert.ok(fs.existsSync(realDiskPath), `Arquivo real deve existir: ${realDiskPath}`);
    assert.ok(fs.existsSync(vectorDiskPath), `Arquivo vetor deve existir: ${vectorDiskPath}`);
}

assert.equal(sentimentosModule.activities.length, 4, 'O módulo deve ter 4 etapas de atividades');
assert.equal(sentimentosModule.activities[0].type, 'recognize');
assert.equal(sentimentosModule.activities[1].type, 'associate');
assert.equal(sentimentosModule.activities[2].type, 'validate');
assert.equal(sentimentosModule.activities[3].type, 'shadowPuzzle');

// 2. Validate imageForLevel in activity-helpers
const helpersSource = fs.readFileSync(path.join(root, 'public/js/features/atividades/activity-helpers.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const helpersContext = vm.createContext({});
vm.runInContext(helpersSource, helpersContext);

const testItem = sentimentosModule.items[0]; // alegria
// Modo suporte 1 -> sentimento_real
assert.equal(helpersContext.imageForLevel(testItem, 1), testItem.realImage);
assert.ok(helpersContext.imageForLevel(testItem, 1).includes('sentimento_real'));

// Modo suporte 2 e 3 -> sentimento_vetor
assert.equal(helpersContext.imageForLevel(testItem, 2), testItem.vectorImage);
assert.ok(helpersContext.imageForLevel(testItem, 2).includes('sentimento_vetor'));
assert.equal(helpersContext.imageForLevel(testItem, 3), testItem.vectorImage);
assert.ok(helpersContext.imageForLevel(testItem, 3).includes('sentimento_vetor'));

// 3. Validate module-practice with sentimentos
const practiceSource = fs.readFileSync(path.join(root, 'public/js/features/atividades/module-practice.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const practiceContext = vm.createContext({});
vm.runInContext(practiceSource, practiceContext);

const phases = practiceContext.getModulePracticePhases({
    activity: sentimentosModule.activities[3],
    module: sentimentosModule,
});

assert.ok(phases.length >= 2, 'Sentimentos deve gerar fases de prática (categorias e quebra-cabeça)');
const categoriesPhase = phases.find(p => p.type === 'categories');
assert.ok(categoriesPhase, 'Fase de categorias deve existir');
assert.equal(categoriesPhase.groups.length, 2);
assert.equal(categoriesPhase.groups[0].id, 'positive-feelings');
assert.equal(categoriesPhase.groups[1].id, 'challenging-feelings');

const puzzlePhase = phases.find(p => p.type === 'bodyPuzzle');
assert.ok(puzzlePhase, 'Fase de quebra-cabeça deve existir');
assert.equal(puzzlePhase.puzzleTitle, 'Monte os sentimentos');
assert.ok(puzzlePhase.instruction.includes('Monte os sentimentos'));

// 4. Validate practice-pictograms draws positive-feelings and challenging-feelings
const pictogramsSource = fs.readFileSync(path.join(root, 'public/js/features/atividades/practice-pictograms.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
class SvgElement {
    setAttribute(name, val) { this[name] = val; }
    set innerHTML(val) { this._markup = val; }
    get innerHTML() { return this._markup; }
}
const pictogramsContext = vm.createContext({
    document: {
        createElementNS: () => new SvgElement(),
    },
});
vm.runInContext(pictogramsSource, pictogramsContext);
const posSvg = pictogramsContext.categoryPictogram('positive-feelings');
assert.ok(posSvg.innerHTML.length > 0, 'Pictograma para positive-feelings deve ter markup');
const diffSvg = pictogramsContext.categoryPictogram('challenging-feelings');
assert.ok(diffSvg.innerHTML.length > 0, 'Pictograma para challenging-feelings deve ter markup');

// 5. Validate resolution of moduleId in atividade-service.js
const serviceSource = fs.readFileSync(path.join(root, 'public/js/services/atividade-service.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '')
    .replace(/import\.meta\.url/g, '"http://localhost"');
const serviceContext = vm.createContext({});
vm.runInContext(serviceSource, serviceContext);
assert.equal(serviceContext.resolveModuleId('sentimentos'), 3);
assert.equal(serviceContext.resolveModuleId('emocoes'), 3);
assert.equal(serviceContext.resolveModuleId(3), 3);

console.log('PASS: Todas as verificações do módulo de sentimentos passaram com sucesso!');
