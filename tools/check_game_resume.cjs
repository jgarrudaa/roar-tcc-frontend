const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise production engines with a small DOM and deterministic image/timer
// completion. Saved states cross a JSON boundary, as browser storage does.
class Element {
    constructor(tag = 'div') {
        this.tag = tag; this.children = []; this.dataset = {}; this.style = {};
        this.attrs = {}; this.events = {}; this.disabled = false; this.isConnected = true;
        this.classes = new Set();
        this.classList = {
            add: (...values) => values.forEach(value => this.classes.add(value)),
            remove: (...values) => values.forEach(value => this.classes.delete(value)),
            contains: value => this.classes.has(value),
            toggle: (value, force) => {
                const next = force ?? !this.classes.has(value);
                if (next) this.classes.add(value); else this.classes.delete(value);
                return next;
            },
        };
    }
    set className(value) { this.classes = new Set(value.split(' ').filter(Boolean)); }
    setAttribute(name, value) {
        this.attrs[name] = String(value);
        if (name === 'class') this.className = value;
    }
    removeAttribute(name) { delete this.attrs[name]; }
    append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
    prepend(...children) { children.forEach(child => { child.parent = this; }); this.children.unshift(...children); }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
    removeEventListener(name, callback) { this.events[name] = (this.events[name] || []).filter(value => value !== callback); }
    emit(name, extra = {}) {
        for (const callback of this.events[name] || []) callback({ detail: 0, preventDefault() {}, ...extra });
    }
    click() { if (!this.disabled && !this.hidden) this.emit('click'); }
    focus() {}
    querySelectorAll(selector) {
        const matches = element => selector.startsWith('.')
            ? element.classes.has(selector.slice(1)) : element.tag === selector;
        return this.children.flatMap(child => [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    cloneNode() {
        const clone = new Element(this.tag); clone.className = [...this.classes].join(' ');
        clone.append(...this.children.map(child => child.cloneNode())); return clone;
    }
}
const clone = value => JSON.parse(JSON.stringify(value));
const root = path.resolve(__dirname, '..');

function fixture() {
    const timers = new Map(); let serial = 0;
    const body = new Element('body');
    const sandbox = {
        console, AbortController, queueMicrotask, performance,
        document: { body, activeElement: null, createElement: tag => new Element(tag),
            createElementNS: (_, tag) => new Element(tag), querySelector: selector => body.querySelector(selector) },
        window: { addEventListener() {}, removeEventListener() {},
            setTimeout(callback, delay) { timers.set(++serial, { callback, delay }); return serial; },
            clearTimeout(id) { timers.delete(id); } },
        Image: class { complete = true; naturalWidth = 400; naturalHeight = 400; },
        audioService: { speak() {}, speakSequence() {}, stop() {} },
        shuffle: values => [...values],
        createImage: () => new Element('img'),
        createButton: (text, classes) => { const button = new Element('button'); button.textContent = text; button.className = classes; return button; },
        categoryPictogram: () => new Element(), itemPictogram: () => null, armHighlight: () => null,
        createSceneDrag: () => ({ destroy() {} }),
    };
    vm.createContext(sandbox);
    for (const filename of ['activity-lifecycle', 'sombra-puzzle', 'sombra', 'memoria',
        'module-practice-games', 'body-puzzle', 'quebra-cabeca-sombra']) {
        const source = fs.readFileSync(path.join(root, `public/js/features/atividades/${filename}.js`), 'utf8')
            .replace(/^import\s[\s\S]*?;\r?\n/gm, '').replace(/^export /gm, '');
        vm.runInContext(source, sandbox, { filename });
    }
    const items = ['HEAD', 'ARM', 'FOOT', 'BELLY'].map((en, index) => ({ id: index + 1, itemId: index + 1,
        en, pt: en.toLowerCase(), vectorImage: `${en}.png` }));
    function create(name, extra = {}) {
        const stage = new Element(); body.append(stage);
        let correct = 0, wrong = 0, helps = 0, changes = 0;
        const elements = { stage, nextButton: new Element('button'), setMessage() {}, setInstruction() {}, setProgress() {} };
        const context = { activity: { item: items[0] }, module: { items }, student: { supportLevel: 2 }, elements,
            onCorrect() { correct++; }, onWrong() { wrong++; }, onHelp() { helps++; }, onStateChange() { changes++; }, ...extra };
        const engine = sandbox[`create${name}Activity`](context);
        engine.start();
        return { engine, context, elements, get correct() { return correct; }, get wrong() { return wrong; },
            get helps() { return helps; }, get changes() { return changes; } };
    }
    function tick(delay) { for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.callback(); } }
    return { create, tick, timers, sandbox, items };
}

(async () => {
    const f = fixture();
    assert.equal(f.sandbox.getShadowPieceCount({ student: { teaSupportLevel: 1 }, gameSettings: { pieceCount: 2 } }), 2);
    assert.equal(f.sandbox.getShadowPieceCount({ student: { teaSupportLevel: 1 }, gameSettings: { pieceCount: 3 } }), 6);

    const memory = f.create('Memory', { gameSettings: { memoryPreviewSeconds: 8 } });
    assert.ok([...f.timers.values()].some(timer => timer.delay === 8000));
    f.tick(5000);
    assert.ok(memory.elements.stage.querySelectorAll('.memory-card').every(card => card.disabled));
    f.tick(8000);
    const cards = memory.elements.stage.querySelectorAll('.memory-card');
    cards[0].click(); cards[1].click(); cards[2].click();
    const memoryState = clone(memory.engine.getState());
    assert.equal(memory.correct, 1);
    assert.equal(memoryState.matched.length, 1);
    memory.engine.destroy();
    const resumed = f.create('Memory', { gameSettings: { memoryPreviewSeconds: 8 }, resumeState: memoryState });
    assert.deepEqual(clone(resumed.engine.getState()), memoryState, 'Memory preserves deck order, matched pairs, and single open card.');
    assert.equal(resumed.correct, 0, 'Restoring a pair does not award it again.');
    const resumedCards = resumed.elements.stage.querySelectorAll('.memory-card');
    resumedCards[3].click(); resumedCards[4].click(); resumedCards[5].click();
    assert.equal(resumed.engine.next(), true);
    assert.equal(resumed.correct, 2);
    const invalid = f.create('Memory', { gameSettings: { memoryPreviewSeconds: 8 },
        resumeState: { ...memoryState, order: [...memoryState.order.slice(1), memoryState.order[1]] } });
    assert.equal(invalid.engine.getState().matched.length, 0, 'Corrupt memory deck is rejected.');
    const changed = f.create('Memory', { resumeState: memoryState, student: { supportLevel: 1 } });
    assert.equal(changed.engine.getState().items.length, 2, 'Changed profile invalidates the previous board.');

    const shadow = f.create('Shadow', { gameSettings: { pieceCount: 4 } });
    await Promise.resolve();
    const choosePiece = (view, id) => view.elements.stage.querySelectorAll('.shadow-piece').find(piece => Number(piece.dataset.pieceId) === id);
    const chooseTarget = (view, id) => view.elements.stage.querySelectorAll('.shadow-target').find(piece => Number(piece.dataset.pieceId) === id);
    choosePiece(shadow, 0).click();
    shadow.elements.stage.querySelector('.shadow-hint-button').click();
    assert.equal(shadow.helps, 1);
    chooseTarget(shadow, 0).click();
    const shadowState = clone(shadow.engine.getState());
    shadow.engine.destroy();
    const interruptedShadow = f.create('Shadow', { gameSettings: { pieceCount: 4 }, resumeState: shadowState });
    assert.deepEqual(clone(interruptedShadow.engine.getState()), shadowState,
        'Restored pieces remain in the checkpoint while the image is still loading.');
    interruptedShadow.engine.destroy();
    assert.deepEqual(clone(interruptedShadow.engine.getState()), shadowState,
        'Leaving before image.onload must not erase restored pieces.');
    const shadowResume = f.create('Shadow', { gameSettings: { pieceCount: 4, showHints: false }, resumeState: shadowState });
    await Promise.resolve();
    assert.deepEqual(clone(shadowResume.engine.getState()), shadowState);
    assert.equal(shadowResume.correct, 0);
    assert.equal(shadowResume.elements.stage.querySelector('.shadow-hint-button').hidden, true);
    for (const id of [1, 2, 3]) { choosePiece(shadowResume, id).click(); chooseTarget(shadowResume, id).click(); }
    assert.equal(shadowResume.engine.next(), true);
    assert.equal(shadowResume.correct, 1);
    const finishedShadow = f.create('Shadow', { gameSettings: { pieceCount: 4 }, resumeState: clone(shadowResume.engine.getState()) });
    await Promise.resolve();
    assert.equal(finishedShadow.engine.next(), true);
    assert.equal(finishedShadow.correct, 0, 'A complete restored puzzle is ready without a duplicate award.');
    const corruptShadow = f.create('Shadow', { gameSettings: { pieceCount: 4 },
        resumeState: { ...shadowState, placed: [0, 0] } });
    await Promise.resolve();
    assert.equal(corruptShadow.engine.getState().placed.length, 0, 'Duplicate placed ids invalidate the entire saved puzzle.');

    const activity = { item: f.items[0], cards: [{ item: f.items[0], category: 'a' }, { item: f.items[1], category: 'b' }],
        groups: [{ id: 'a', en: 'A', pt: 'A' }, { id: 'b', en: 'B', pt: 'B' }] };
    const categories = f.create('Categories', { activity });
    const dictionary = categories.elements.stage.querySelector('.practice-dictionary');
    dictionary.open = true; dictionary.emit('toggle');
    assert.equal(categories.helps, 1);
    categories.elements.stage.querySelectorAll('.practice-choice').find(button => button.dataset.choice === 'a').click();
    const state = clone(categories.engine.getState());
    categories.engine.destroy();
    const categoriesResume = f.create('Categories', { activity, resumeState: state, gameSettings: { showHints: false } });
    assert.equal(categoriesResume.engine.isRoundComplete(), true);
    assert.equal(categoriesResume.correct, 0);
    assert.equal(categoriesResume.elements.stage.querySelector('.practice-dictionary'), null);
    assert.equal(categoriesResume.engine.advanceRound(), true);
    categoriesResume.elements.stage.querySelectorAll('.practice-choice').find(button => button.dataset.choice === 'b').click();
    assert.equal(categoriesResume.engine.next(), true);
    assert.equal(categoriesResume.correct, 1);
    const categoriesDone = f.create('Categories', { activity, resumeState: clone(categoriesResume.engine.getState()) });
    assert.equal(categoriesDone.engine.next(), true);
    assert.equal(categoriesDone.correct, 0);

    const scene = f.create('Scene');
    scene.elements.stage.querySelector('.practice-card').click();
    scene.elements.stage.querySelectorAll('.practice-choice').find(button => button.dataset.choice === 'in').click();
    assert.equal(scene.engine.advanceRound(), true);
    const sceneState = clone(scene.engine.getState());
    const sceneResume = f.create('Scene', { resumeState: sceneState });
    assert.equal(sceneResume.engine.getState().index, 1, 'Scene resumes the table round after completing the box.');
    sceneResume.elements.stage.querySelector('.practice-card').click();
    sceneResume.elements.stage.querySelectorAll('.practice-choice').find(button => button.dataset.choice === 'on').click();
    assert.equal(sceneResume.engine.next(), true);
    assert.equal(sceneResume.correct, 1);

    const bodyActivity = { item: f.items[0], cards: f.items.slice(0, 2).map(item => ({ item })) };
    const bodyPuzzle = f.create('BodyPuzzle', { activity: bodyActivity, gameSettings: { pieceCount: 2 } });
    await Promise.resolve();
    assert.equal(bodyPuzzle.elements.stage.querySelector('.body-jigsaw-title').textContent, 'Monte o corpo');
    assert.equal(bodyPuzzle.elements.stage.querySelector('.body-jigsaw-round').textContent, 'Imagem 1 de 2');
    const bodyHelp = bodyPuzzle.elements.stage.querySelector('.body-jigsaw-help');
    bodyHelp.open = true; bodyHelp.emit('toggle');
    assert.equal(bodyPuzzle.helps, 1, 'Opening the instructions records one explicit help use.');
    for (const id of [0, 1]) { choosePiece(bodyPuzzle, id).click(); chooseTarget(bodyPuzzle, id).click(); }
    assert.equal(bodyPuzzle.engine.advanceRound(), true);
    await Promise.resolve();
    choosePiece(bodyPuzzle, 1).click(); chooseTarget(bodyPuzzle, 1).click();
    const bodyState = clone(bodyPuzzle.engine.getState());
    bodyPuzzle.engine.destroy();
    const interruptedBody = f.create('BodyPuzzle', { activity: bodyActivity, gameSettings: { pieceCount: 2 }, resumeState: bodyState });
    assert.deepEqual(clone(interruptedBody.engine.getState()), bodyState,
        'The body round keeps restored pieces before its child image has loaded.');
    interruptedBody.engine.destroy();
    assert.deepEqual(clone(interruptedBody.engine.getState()), bodyState,
        'Leaving a body round immediately after resuming keeps its saved pieces.');
    const bodyResume = f.create('BodyPuzzle', { activity: bodyActivity, gameSettings: { pieceCount: 2 }, resumeState: bodyState });
    await Promise.resolve();
    assert.equal(bodyResume.engine.getState().index, 1);
    assert.deepEqual(clone(bodyResume.engine.getState().round.placed), [1]);
    assert.equal(bodyResume.correct, 0);
    choosePiece(bodyResume, 0).click(); chooseTarget(bodyResume, 0).click();
    assert.equal(bodyResume.engine.next(), true);
    const noBodyHints = f.create('BodyPuzzle', { activity: bodyActivity, gameSettings: { pieceCount: 2, showHints: false } });
    assert.equal(noBodyHints.elements.stage.querySelector('.body-jigsaw-help'), null);
    const animalsPuzzle = f.create('BodyPuzzle', { activity: { ...bodyActivity, puzzleTitle: 'Monte os animais' } });
    assert.equal(animalsPuzzle.elements.stage.querySelector('.body-jigsaw-title').textContent, 'Monte os animais');
    const animalsHelp = animalsPuzzle.elements.stage.querySelector('.body-jigsaw-help');
    assert.ok(animalsHelp.children[1].textContent.includes('montar a imagem'));
    assert.ok(!animalsHelp.children[1].textContent.includes('parte do corpo'));

    const whole = f.create('ShadowPuzzle');
    const wholeTiles = whole.elements.stage.querySelectorAll('.shadow-puzzle-piece');
    wholeTiles[0].click(); whole.elements.stage.querySelector('.shadow-puzzle-target').click();
    assert.equal(whole.engine.next(), true);
    const wholeResume = f.create('ShadowPuzzle', { resumeState: clone(whole.engine.getState()) });
    assert.equal(wholeResume.engine.next(), true);
    assert.equal(wholeResume.correct, 0);
    console.log('PASS: game settings, preview timing, hints, and JSON resume for memory, shadows, categories and body rounds.');
})().catch(error => { console.error(error); process.exitCode = 1; });
