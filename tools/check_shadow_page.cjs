const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
    constructor() {
        this.listeners = new Map();
        this.children = [];
        this.attributes = new Map();
        this.value = '2';
        this.hidden = false;
        this.disabled = false;
        this.textContent = '';
    }
    addEventListener(name, listener) { this.listeners.set(name, listener); }
    fire(name, event = {}) { return this.listeners.get(name)?.(event); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    querySelector() { return null; }
    focus() {}
    scrollIntoView() {}
}

function source(relative) {
    return fs.readFileSync(path.join(__dirname, relative), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
}
const puzzle = vm.createContext({});
vm.runInContext(source('../public/js/features/atividades/sombra-puzzle.js'), puzzle);

const flush = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
    let resolve, reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

async function load({ loggedIn = true, profile = {}, failOnce = false, fetchProfile } = {}) {
    const elements = new Map();
    const rounds = [];
    let requests = 0;
    const document = {
        querySelector(selector) {
            if (!elements.has(selector)) elements.set(selector, new Element());
            return elements.get(selector);
        },
        createElement() { return new Element(); },
    };
    const window = new Element();
    const context = vm.createContext({
        document, window,
        sessionService: { hasRole: () => loggedIn },
        alunosApi: { async getCurrent() {
            requests++;
            if (failOnce && requests === 1) throw new Error('offline');
            if (fetchProfile) return fetchProfile(requests);
            return profile;
        } },
        audioService: { stop() {}, speak() {} },
        storage: { getPreferences: () => ({}), setPreferences() {} },
        getShadowPieceCount: puzzle.getShadowPieceCount,
        createShadowActivity(round) {
            rounds.push(round);
            return { start() {}, destroy() {}, next: () => true };
        },
    });
    vm.runInContext(source('../public/js/pages/aluno/sombra.js'), context);
    await flush();
    return { elements, rounds, window, requests: () => requests };
}

(async () => {
    for (const [teaSupportLevel, expected] of [[1, 6], [2, 4], [3, 2]]) {
        // O modo de aprendizagem não pode decidir a quantidade.
        const app = await load({ profile: { teaSupportLevel, supportLevel: 'Visual Guiado' } });
        const get = selector => app.elements.get(selector);
        assert.equal(app.requests(), 1);
        assert.equal(app.rounds.length, 1);
        assert.equal(puzzle.getShadowPieceCount(app.rounds[0]), expected);
        assert.equal(get('#shadow-difficulty-control').hidden, true);
        assert.equal(get('#shadow-difficulty').disabled, true);
        assert.equal(get('#shadow-piece-count').hidden, false);
        assert.equal(get('#shadow-piece-count').textContent, `${expected} peças`);
        get('#shadow-difficulty').value = '4';
        get('#shadow-difficulty').fire('change');
        assert.equal(app.rounds.length, 1, 'Quantidade atribuída não aceita troca manual.');
        for (let index = 0; index < 6; index++) {
            app.rounds[index].onCorrect();
            get('#next-button').fire('click');
        }
        assert.equal(app.rounds.length, 6);
        assert.equal(get('#next-button').hidden, true);
        assert.ok(app.rounds.every(round => puzzle.getShadowPieceCount(round) === expected));
        const summary = get('#activity-stage').children[0];
        assert.equal(summary.children[1].children.length, 6);
        summary.children[2].fire('click');
        assert.equal(app.rounds.length, 7);
        assert.equal(puzzle.getShadowPieceCount(app.rounds[6]), expected);
        assert.equal(get('#shadow-difficulty').disabled, true);
    }
    for (const loggedIn of [true, false]) {
        const app = await load({ loggedIn });
        assert.equal(app.requests(), loggedIn ? 1 : 0);
        const difficulty = app.elements.get('#shadow-difficulty');
        assert.equal(difficulty.disabled, false);
        assert.equal(puzzle.getShadowPieceCount(app.rounds[0]), 2);
        difficulty.value = '6';
        difficulty.fire('change');
        assert.equal(puzzle.getShadowPieceCount(app.rounds[1]), 6);
    }
    const app = await load({ profile: { teaSupportLevel: 1 }, failOnce: true });
    assert.equal(app.rounds.length, 0, 'Não iniciar com quantidade incorreta se perfil falhar.');
    app.elements.get('#activity-stage').children[0].fire('click');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(app.requests(), 2);
    assert.equal(puzzle.getShadowPieceCount(app.rounds[0]), 6);
    app.window.fire('pagehide');

    // Returning from the browser's page cache must resume with a fresh profile.
    const restored = await load({ profile: { teaSupportLevel: 2 } });
    restored.rounds[0].onCorrect();
    restored.elements.get('#next-button').fire('click');
    restored.rounds[1].onCorrect();
    assert.equal(restored.elements.get('#activity-progress').value, 2);
    restored.window.fire('pagehide');
    restored.window.fire('pageshow', { persisted: true });
    await flush();
    assert.equal(restored.requests(), 2);
    assert.equal(restored.rounds.length, 3);
    assert.equal(restored.rounds[2].activity.id, 'practice-horse');
    assert.equal(restored.elements.get('#activity-progress').value, 1,
        'Restarting the current animal cannot keep its previous completion.');
    assert.equal(puzzle.getShadowPieceCount(restored.rounds[2]), 4);

    // A restored summary stays a summary and can start a fresh full session.
    for (let index = 2; index < 7; index++) {
        restored.rounds[index].onCorrect();
        restored.elements.get('#next-button').fire('click');
    }
    restored.window.fire('pagehide');
    restored.window.fire('pageshow', { persisted: true });
    await flush();
    assert.equal(restored.rounds.length, 7);
    assert.equal(restored.elements.get('#next-button').hidden, true);
    assert.equal(restored.elements.get('#activity-progress').value, 6);
    const restoredSummary = restored.elements.get('#activity-stage').children[0];
    assert.equal(restoredSummary.children[1].children.length, 6);
    restoredSummary.children[2].fire('click');
    assert.equal(restored.rounds[7].activity.id, 'practice-cow');

    // Responses belonging to an old visit cannot replace the restored page.
    for (const rejectOld of [false, true]) {
        const oldProfile = deferred();
        const freshProfile = deferred();
        const pending = await load({
            fetchProfile: request => request === 1 ? oldProfile.promise : freshProfile.promise,
        });
        assert.equal(pending.rounds.length, 0);
        pending.window.fire('pageshow', { persisted: false });
        assert.equal(pending.requests(), 1);
        pending.window.fire('pagehide');
        pending.window.fire('pageshow', { persisted: true });
        assert.equal(pending.requests(), 2);
        freshProfile.resolve({ teaSupportLevel: 1 });
        await flush();
        assert.equal(pending.rounds.length, 1);
        assert.equal(puzzle.getShadowPieceCount(pending.rounds[0]), 6);
        if (rejectOld) oldProfile.reject(new Error('old request failed'));
        else oldProfile.resolve({ teaSupportLevel: 3 });
        await flush();
        assert.equal(pending.rounds.length, 1);
        assert.equal(pending.elements.get('#shadow-piece-count').textContent, '6 peças');
        assert.notEqual(pending.elements.get('#activity-stage').children[0]?.className, 'shadow-retry');
    }
    console.log('Lifecycle: restored round/summary and stale profile responses verified.');
    console.log('Página de sombras: perfil, seis animais, reinício, quantidade fixa, visitante, ajuste manual e recuperação de erro verificados.');
})().catch(error => { console.error(error); process.exitCode = 1; });
