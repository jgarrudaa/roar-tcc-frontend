const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
function load(file, bindings = {}) {
    const source = fs.readFileSync(path.join(root, file), 'utf8')
        .replace(/^import[\s\S]*?;\r?\n/gm, '')
        .replace(/^export /gm, '');
    const context = vm.createContext({ console, Intl, Date, ...bindings });
    vm.runInContext(source, context);
    return context;
}
async function flush() { for (let index = 0; index < 15; index++) await Promise.resolve(); }
function deferred() {
    let resolve;
    const promise = new Promise(yes => { resolve = yes; });
    return { promise, resolve };
}
class Node {
    constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.listeners = {};
        this.attributes = {};
        this.value = '';
        this.disabled = false;
        this.isConnected = true;
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = value; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(event, callback) { this.listeners[event] = callback; }
    get firstChild() { return this.children[0]; }
    get text() { return [this.textContent ?? '', ...this.children.map(child => child.text)].join(' '); }
    find(predicate) {
        if (predicate(this)) return this;
        for (const child of this.children) {
            const result = child.find(predicate);
            if (result) return result;
        }
        return null;
    }
}
const document = { createElement: tag => new Node(tag) };

async function main() {
    const calls = [];
    const context = load('public/js/services/game-settings-service.js', { apiClient: {
        get: async endpoint => { calls.push(endpoint); return {}; },
        patch: async (endpoint, value) => { calls.push({ endpoint, value }); return value; },
    } });
    const service = vm.runInContext('gameSettingsService', context);
    assert.equal((await service.getCurrent()).memoryPreviewSeconds, 5);
    assert.equal(calls[0], '/alunos/preferencias-jogos');
    const configured = await service.saveForStudent(7, { pieceCount: 4, showHints: false,
        memoryPreviewSeconds: 8, advanceDelaySeconds: 3 });
    assert.equal(configured.pieceCount, 4);
    assert.equal(calls.at(-1).endpoint, '/professores/alunos/7/preferencias-jogos');
    assert.equal(Object.hasOwn(calls.at(-1).value, 'teaSupportLevel'), false);
    for (const invalid of [{ pieceCount: 3 }, { showHints: 'true' },
        { memoryPreviewSeconds: 60 }, { advanceDelaySeconds: 0 }]) {
        assert.throws(() => context.normalizeGameSettings(invalid));
    }
    await assert.rejects(() => service.getForStudent(0));

    const reports = load('public/js/services/relatorios-service.js', { relatoriosApi: {} });
    const report = reports.normalizeStudentWords({ aluno_id: 7, palavras: [
        { palavra: 'head', acertos: 2, erros: 1, ajudas: 0, tentativas: 1 },
        { palavra: 'foot', acertos: 1 },
    ] });
    assert.equal(report.words[0].word, 'HEAD');
    assert.equal(report.words[0].needsReview, true);
    assert.equal(report.words[1].hints, null, 'An unreported hint count cannot become zero.');
    assert.equal(report.words[1].errors, null);
    assert.throws(() => reports.normalizeStudentWords({ aluno_id: 7, palavras: [
        { palavra: 'head', acertos: -1 },
    ] }));
    assert.throws(() => reports.normalizeStudentWords({ aluno_id: 7, palavras: [
        { palavra: 'head', acertos: true },
    ] }), 'A malformed boolean must not become a successful answer.');

    let saved, loads = 0;
    const settings = load('public/js/components/student-game-settings.js', { document, gameSettingsService: {
        getForStudent: async () => { if (++loads === 1) throw Error('Indisponível'); return configured; },
        saveForStudent: async (id, value) => { saved = { id, value }; return value; },
    } });
    const container = new Node('div');
    settings.mountStudentGameSettings(container, 7);
    await flush();
    const save = container.find(node => node.type === 'submit');
    assert.equal(save.disabled, true, 'Do not overwrite unknown settings with defaults on load failure.');
    const retry = container.find(node => node.type === 'button');
    assert.equal(retry.hidden, false);
    await retry.listeners.click();
    assert.equal(save.disabled, false);
    const piece = container.find(node => node.name === 'pieceCount');
    piece.value = '6';
    await container.find(node => node.tagName === 'form').listeners.submit({ preventDefault() {} });
    assert.equal(saved.id, 7);
    assert.equal(saved.value.pieceCount, 6);

    const pending = deferred();
    const stale = load('public/js/components/student-game-settings.js', { document,
        gameSettingsService: { getForStudent: () => pending.promise } });
    const closed = new Node('div');
    const mounted = stale.mountStudentGameSettings(closed, 7);
    mounted.destroy();
    pending.resolve(configured);
    await flush();
    assert.equal(closed.find(node => node.type === 'submit').disabled, true,
        'A response arriving after closing the pupil must not enable saving.');

    const vocabulary = load('public/js/components/student-word-progress.js', { document,
        relatoriosService: { getStudentWords: async () => ({ words: [
            { word: '<img src=x onerror=alert(1)>', correct: 1, errors: null, hints: null,
                sessions: 1, needsReview: false, lastPractice: null },
        ] }) } });
    const section = vocabulary.createStudentWordProgress(7);
    await flush();
    assert.ok(section.text.includes('<img src=x onerror=alert(1)>'), 'Word must be rendered as literal text.');
    assert.equal(section.find(node => node.tagName === 'img'), null);
    assert.ok(section.text.includes('—'), 'Unknown observations remain visibly unknown.');
    const empty = load('public/js/components/student-word-progress.js', { document,
        relatoriosService: { getStudentWords: async () => ({ words: [] }) } });
    const emptySection = empty.createStudentWordProgress(7);
    await flush();
    assert.ok(emptySection.text.includes('Ainda não há registros por palavra'));
    console.log('Teacher learning: settings validation, API scope, retry, stale response, honest metrics and text rendering passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
