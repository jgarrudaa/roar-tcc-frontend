const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
    constructor() {
        this.children = []; this.dataset = {}; this.disabled = false;
        this.classes = new Set(); this.events = {}; this.attrs = {};
        this.classList = {
            add: (...names) => names.forEach((name) => this.classes.add(name)),
            remove: (...names) => names.forEach((name) => this.classes.delete(name)),
            contains: (name) => this.classes.has(name),
        };
    }
    set className(value) { this.classes = new Set(value.split(' ')); }
    setAttribute(name, value) { this.attrs[name] = value; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(name, callback) { this.events[name] = callback; }
    click() { this.events.click?.(); }
    focus() {}
}

function setup(level) {
    const timers = new Map(); const speech = []; const events = {};
    let nextTimer = 0; let correct = 0; let wrong = 0;
    const sandbox = {
        document: { createElement: () => new Element() },
        window: {
            setTimeout(callback, delay) { timers.set(++nextTimer, { callback, delay }); return nextTimer; },
            clearTimeout(id) { timers.delete(id); },
            addEventListener(name, callback) { events[name] = callback; },
            removeEventListener(name) { delete events[name]; },
        },
        audioService: { speak(text) { speech.push(text); }, stop() {} },
        shuffle: (items) => items.slice(),
        createImage: () => new Element(),
        createButton: (label, classes) => {
            const e = new Element(); e.textContent = label; e.className = classes; return e;
        },
    };
    const source = fs.readFileSync(path.join(__dirname, '../public/js/features/atividades/memoria.js'), 'utf8')
        .replace(/import\s*\{[\s\S]*?\}\s*from\s*"[^"]+";/g, '')
        .replace('export function createMemoryActivity', 'function createMemoryActivity');
    vm.runInNewContext(source, sandbox);
    const items = ['cat', 'dog', 'cow', 'pig'].map((en, id) => ({ id, en }));
    const elements = {
        stage: new Element(), nextButton: new Element(),
        setMessage() {}, setInstruction() {}, setProgress() {},
    };
    const engine = sandbox.createMemoryActivity({
        activity: { item: items[0] }, module: { items }, student: { supportLevel: level }, elements,
        onCorrect() { correct++; }, onWrong() { wrong++; },
    });
    engine.start();
    const content = elements.stage.children[0];
    const controls = content.children[0]; const cards = content.children[1].children;
    function tick(delay) {
        for (const [id, timer] of [...timers]) {
            if (timer.delay === delay) { timers.delete(id); timer.callback(); }
        }
    }
    return { engine, elements, cards, controls, timers, speech, events, tick,
        get correct() { return correct; }, get wrong() { return wrong; } };
}

for (const level of [1, 2]) {
    const t = setup(level);
    assert.equal(t.cards.length, level === 1 ? 4 : 6);
    assert.ok(t.cards.every(c => c.disabled && c.classList.contains('is-revealed')));
    assert.equal(t.speech.length, 1, 'instruction spoken on entry');
    t.cards[0].click(); t.cards[1].click();
    assert.equal(t.correct, 0, 'preview does not count guesses');
    assert.equal(t.wrong, 0);
    assert.equal(t.engine.next(), false);
    const positions = [...t.cards];
    t.tick(5000);
    assert.deepEqual(t.cards, positions, 'preview keeps actual card positions');
    assert.ok(t.cards.every(c => !c.disabled && !c.classList.contains('is-revealed')));
    t.cards[0].click(); t.cards[2].click();
    assert.equal(t.wrong, 1);
    t.cards[1].click();
    assert.equal(t.correct, 0, 'input locked while unmatched cards visible');
    t.tick(1000);
    assert.ok(t.cards.every(c => !c.classList.contains('is-revealed')));
    for (let i = 0; i < t.cards.length; i += 2) {
        t.cards[i].click(); t.cards[i + 1].click();
        assert.equal(t.engine.next(), i + 2 === t.cards.length);
    }
    assert.equal(t.correct, t.cards.length / 2);
    t.cards[0].click(); t.cards[1].click();
    assert.equal(t.correct, t.cards.length / 2, 'matched pair cannot count twice');
    assert.equal(t.elements.nextButton.disabled, false);
    t.engine.destroy();
}
const early = setup(2);
early.controls.children[1].click();
assert.equal(early.timers.size, 0, 'manual start cancels preview timeout');
assert.equal(early.controls.hidden, true);
const leaving = setup(1);
leaving.events.pagehide();
assert.equal(leaving.timers.size, 0, 'navigation cancels pending preview');
assert.equal(leaving.engine.next(), false);
const pending = setup(2);
pending.tick(5000); pending.cards[0].click(); pending.cards[2].click();
pending.engine.destroy();
assert.equal(pending.timers.size, 0, 'destroy cancels mismatch timeout');
const advanced = setup(3);
assert.equal(advanced.cards.length, 8);
assert.equal(advanced.timers.size, 0, 'level 3 retains direct start');
console.log('Memory: preview, stable positions, matching, mismatch lock, early start and lifecycle checks passed.');
