const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real controller with deterministic time and independently controlled
// engines/network. No browser, backend, or learner account is needed.
const controllerSource = fs.readFileSync(path.join(__dirname,
    '../public/js/features/atividades/atividade-controller.js'), 'utf8')
    .replace(/^import\s[\s\S]*?;\r?\n/gm, '')
    .replace(/^export /gm, '');

async function flush() {
    for (let index = 0; index < 12; index++) await Promise.resolve();
}

function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

async function fixture({ type = 'recognize', level = 1, index = 1, items = [], paused = false,
    complete = async () => ({ xp_ganho: 10 }) } = {}) {
    let now = 100, nextTimerId = 0;
    const timers = new Map(), navigations = [], requests = [], engines = [], messages = [];
    const activities = [{ activityId: 11, order: 2 }, { activityId: 22, order: 7 },
        { activityId: 33, order: 12 }];
    const context = {
        activity: { id: activities[index].activityId, status: 'active', type,
            instruction: 'Find the cow', item: { id: 77, en: 'cow', pt: 'vaca' } },
        module: { id: 9, title: 'Animals', activities, items },
        student: { supportLevel: level, supportMode: `Nível ${level}` },
    };
    const elements = { title: {}, levelBadge: {}, stage: { inert: false,
        replaceChildren() {}, setAttribute() {}, removeAttribute() {}, contains() { return false; } },
        nextButton: { disabled: false }, previousButton: { disabled: false },
        repeatButton: { disabled: false }, progress: {}, progressLabel: {},
        setInstruction() {}, setMessage(message) { messages.push(message); } };
    const makeEngine = kind => options => {
        const engine = { kind, options, completed: false, starts: 0, destroys: 0, roundComplete: false, roundsAdvanced: 0,
            nextCalls: 0, repeats: 0,
            start() { this.starts++; },
            next() { this.nextCalls++; return this.completed; },
            destroy() { this.destroys++; },
            repeatInstruction() { this.repeats++; },
            isRoundComplete() { return this.roundComplete; },
            advanceRound() { this.roundsAdvanced++; this.roundComplete = false; return true; },
            correct(id = 77, finished = true) {
                // Several real engines update their resolved flag AFTER onCorrect.
                options.onCorrect({ id });
                this.completed = finished;
                this.roundComplete = ['Categories', 'Scene'].includes(kind);
            },
            wrong() { options.onWrong(); },
        };
        engines.push(engine);
        return engine;
    };
    const setTimeout = (callback, delay = 0) => {
        const id = ++nextTimerId;
        timers.set(id, { callback, time: now + delay });
        return id;
    };
    const clearTimeout = id => timers.delete(id);
    let preferences = { autoAdvancePaused: paused, volume: 35 };
    const sandbox = { URLSearchParams, Promise, queueMicrotask, setTimeout, clearTimeout,
        storage: { getPreferences: () => preferences, setPreferences: value => { preferences = value; } },
        document: { activeElement: null },
        performance: { now: () => now },
        console: { error() {}, warn() {}, log() {} },
        window: { setTimeout, clearTimeout, roarNavigate: url => navigations.push(url),
            location: { assign: url => navigations.push(url) } },
        soundFx: { playSuccess() {}, playTryAgain() {}, playAchievement() {} },
        audioService: { stop() {}, speak() {} },
        atividadeService: { getContext: async () => context,
            complete: (id, stats) => { requests.push({ id, stats }); return complete(id, stats); } },
    };
    for (const name of ['Associate', 'Recognize', 'Validate', 'AudioImage', 'TrueFalse',
        'Memory', 'CompleteSentence', 'OrderSentence', 'Writing', 'WordBank', 'ShadowPuzzle', 'Shadow', 'Categories', 'Scene', 'BodyPuzzle']) {
        sandbox[`create${name}Activity`] = makeEngine(name);
    }
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname,
        '../public/js/features/atividades/module-practice.js'), 'utf8').replace(/^export /gm, ''), sandbox);
    vm.runInContext(controllerSource, sandbox);
    const controller = await sandbox.createActivityController({ moduleId: 9,
        stage: activities[index].order, elements });
    controller.start();
    async function tick(milliseconds) {
        await flush();
        const target = now + milliseconds;
        while (true) {
            const due = [...timers].filter(([, timer]) => timer.time <= target)
                .sort((a, b) => a[1].time - b[1].time)[0];
            if (!due) break;
            now = due[1].time;
            timers.delete(due[0]);
            due[1].callback();
            await flush();
        }
        now = target;
        await flush();
    }
    return { controller, elements, engines, requests, navigations, messages, tick, context,
        getPreferences: () => preferences };
}

const tests = [];
function test(name, run) { tests.push({ name, run }); }

test('practice cards advance after one second, never save a partial game, and manual next cancels its timer', async () => {
    const f = await fixture({ type: 'categories' });
    f.engines[0].correct('card1', false);
    await f.tick(999);
    assert.equal(f.engines[0].roundsAdvanced, 0);
    await f.tick(1);
    assert.equal(f.engines[0].roundsAdvanced, 1);
    assert.equal(f.elements.stage.inert, false);
    assert.equal(f.requests.length, 0);
    f.engines[0].correct('card2', false);
    await flush();
    await f.controller.next();
    await f.controller.next();
    await f.tick(1000);
    assert.equal(f.engines[0].roundsAdvanced, 2, 'Manual and automatic advancement cannot skip a card.');
    f.engines[0].correct('card3', true);
    await f.tick(1000);
    assert.equal(f.requests.length, 1);
});

test('paused or abandoned practice cards do not auto advance', async () => {
    const paused = await fixture({ type: 'scene', paused: true });
    paused.engines[0].correct('in', false);
    await paused.tick(5000);
    assert.equal(paused.engines[0].roundsAdvanced, 0);
    await paused.controller.next();
    assert.equal(paused.engines[0].roundsAdvanced, 1);
    const closed = await fixture({ type: 'categories' });
    closed.engines[0].correct('card1', false);
    await closed.tick(500);
    closed.controller.destroy();
    await closed.tick(5000);
    assert.equal(closed.engines[0].roundsAdvanced, 0);
    assert.equal(closed.requests.length, 0);
});

test('pause cancels pending advancement, preserves preferences and restarts a full one second', async () => {
    const f = await fixture();
    f.engines[0].correct();
    await f.tick(500);
    f.controller.toggleAutoAdvance();
    await f.tick(5000);
    assert.equal(f.requests.length, 0);
    assert.equal(f.getPreferences().autoAdvancePaused, true);
    assert.equal(f.getPreferences().volume, 35);
    f.controller.toggleAutoAdvance();
    await f.tick(999);
    assert.equal(f.requests.length, 0);
    await f.tick(1);
    assert.equal(f.requests.length, 1);
});

test('saved pause allows manual next and remains in effect in the next phase', async () => {
    const f = await fixture({ type: 'memory', level: 2, paused: true });
    f.engines[0].correct();
    await f.tick(5000);
    assert.equal(f.engines.length, 1);
    await f.controller.next();
    f.engines[1].correct();
    await f.tick(5000);
    assert.equal(f.requests.length, 0);
    await f.controller.next();
    assert.equal(f.requests.length, 1);
});

test('final module stage adds categories and scene, saves once after both and returns to modules', async () => {
    const items = ['COW', 'DUCK', 'HORSE', 'HEN'].map((en, i) => ({ id: i + 1, itemId: i + 1, en, vectorImage: '/image.png' }));
    const f = await fixture({ index: 2, items });
    f.engines[0].correct();
    await f.tick(1000);
    assert.equal(f.engines[1].kind, 'Categories');
    assert.equal(f.requests.length, 0);
    f.engines[1].correct();
    await f.tick(1000);
    assert.equal(f.engines[2].kind, 'Scene');
    assert.equal(f.requests.length, 0);
    f.engines[2].correct();
    await f.tick(1000);
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].id, 33);
    assert.deepEqual(f.navigations, ['atividades.html']);
});

test('unclassified vocabulary gets scene only and intermediate stages keep their original sequence', async () => {
    const items = [{ id: 1, itemId: 1, en: 'BLUE', realImage: '/blue.png' }];
    const last = await fixture({ index: 2, items });
    last.engines[0].correct(); await last.tick(1000);
    assert.equal(last.engines[1].kind, 'Scene');
    last.engines[1].correct(); await last.tick(1000);
    assert.equal(last.engines.length, 2);
    const middle = await fixture({ index: 1, items });
    middle.engines[0].correct(); await middle.tick(1000);
    assert.equal(middle.engines.length, 1);
});

test('completion detected after onCorrect; exactly one second of success feedback', async () => {
    const f = await fixture();
    f.engines[0].correct();
    await flush();
    assert.equal(f.elements.stage.inert, true, 'Completed content must stop accepting input.');
    await f.tick(999);
    assert.equal(f.requests.length, 0);
    await f.tick(1);
    assert.equal(f.requests.length, 1, 'Auto advancement must observe the updated engine state.');
    await f.tick(5000);
    assert.deepEqual(f.navigations, ['atividade.html?modulo=9&etapa=12']);
});

test('partial answers do not advance; duplicate answer callbacks count once', async () => {
    const f = await fixture();
    f.engines[0].correct(1, false);
    await f.tick(5000);
    assert.equal(f.requests.length, 0);
    f.engines[0].wrong();
    f.engines[0].correct(2);
    f.engines[0].correct(2);
    await f.tick(1000);
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].stats.correct, 2);
    assert.equal(f.requests[0].stats.wrong, 1);
});

test('manual next cancels automatic completion and concurrent clicks share one save', async () => {
    const pending = deferred();
    const f = await fixture({ complete: () => pending.promise });
    f.engines[0].correct();
    await flush();
    const first = f.controller.next();
    const second = f.controller.next();
    assert.equal(f.requests.length, 1);
    assert.equal(first, second);
    await f.tick(5000);
    assert.equal(f.requests.length, 1);
    pending.resolve({ xp_ganho: 3 });
    await first;
    await f.tick(5000);
    assert.equal(f.navigations.length, 1);
});

test('failed save allows explicit retry without an automatic retry loop', async () => {
    let attempts = 0;
    const f = await fixture({ complete: async () => {
        if (++attempts === 1) throw new Error('offline');
        return {};
    } });
    f.engines[0].correct();
    await f.tick(1000);
    assert.equal(f.requests.length, 1);
    assert.equal(f.elements.nextButton.disabled, false);
    await f.tick(10000);
    assert.equal(f.requests.length, 1);
    await f.controller.next();
    await f.tick(5000);
    assert.equal(f.requests.length, 2);
    assert.equal(f.navigations.length, 1);
});

test('destroy cancels auto advance and ignores late engine callbacks', async () => {
    const f = await fixture();
    f.engines[0].correct();
    await flush();
    f.controller.destroy();
    f.engines[0].correct(999);
    await f.tick(10000);
    assert.equal(f.requests.length, 0);
    assert.equal(f.navigations.length, 0);
    assert.equal(f.engines[0].destroys, 1);
});

test('destroy during pending save prevents subsequent navigation', async () => {
    const pending = deferred();
    const f = await fixture({ complete: () => pending.promise });
    f.engines[0].correct();
    const result = f.controller.next();
    f.controller.destroy();
    pending.resolve({ xp_ganho: 5 });
    await result;
    await f.tick(10000);
    assert.equal(f.navigations.length, 0);
});

test('previous uses configured order and cancels pending automatic completion', async () => {
    const f = await fixture();
    f.engines[0].correct();
    await flush();
    f.controller.previous();
    await f.tick(10000);
    assert.deepEqual(f.navigations, ['atividade.html?modulo=9&etapa=2']);
    assert.equal(f.requests.length, 0);
    const first = await fixture({ index: 0 });
    first.controller.previous();
    assert.deepEqual(first.navigations, ['atividades.html']);
});

test('level 2 memory adds shadow round and records the activity only once', async () => {
    const f = await fixture({ type: 'memory', level: 2 });
    f.engines[0].correct(77);
    await f.tick(1000);
    assert.equal(f.engines.length, 2);
    assert.equal(f.engines[1].kind, 'Shadow');
    assert.equal(f.engines[1].starts, 1);
    assert.equal(f.engines[1].options.activity.id, f.context.activity.id);
    assert.equal(f.elements.stage.inert, false);
    assert.equal(f.requests.length, 0, 'Memory and shadow must share one completion POST.');
    f.engines[1].correct(77);
    await f.tick(1000);
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].stats.correct, 2,
        'The same vocabulary item counts in both learning rounds.');
    await f.tick(5000);
    assert.equal(f.navigations.length, 1);
});

test('other learning levels complete memory without inserting a shadow round', async () => {
    for (const level of [1, 3]) {
        const f = await fixture({ type: 'memory', level });
        f.engines[0].correct();
        await f.tick(1000);
        assert.equal(f.engines.length, 1);
        assert.equal(f.requests.length, 1);
    }
});

test('spoken question preserves Portuguese/English order and learner sound preferences', async () => {
    const spoken = [];
    let cancellations = 0;
    let preferences = { soundsEnabled: true, volume: 40, speechRate: 0.8 };
    const sandbox = {
        storage: { getPreferences: () => preferences },
        SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
        window: { speechSynthesis: {
            cancel() { cancellations++; },
            speak(utterance) { spoken.push(utterance); },
        } },
    };
    vm.createContext(sandbox);
    const source = fs.readFileSync(path.join(__dirname,
        '../public/js/services/audio-service.js'), 'utf8')
        .replace(/^import\s[\s\S]*?;\r?\n/gm, '').replace(/^export /gm, '');
    vm.runInContext(source, sandbox);
    const audio = vm.runInContext('audioService', sandbox);
    audio.speakSequence([
        { text: 'Esta imagem é', language: 'pt-BR' },
        { text: 'cow?', language: 'en-US' },
    ]);
    assert.equal(cancellations, 1, 'Only cancel preceding speech, not the Portuguese prompt.');
    assert.equal(spoken[0].text, 'Esta imagem é');
    assert.equal(spoken[0].lang, 'pt-BR');
    spoken[0].onend?.();
    await flush();
    assert.equal(spoken.length, 2);
    assert.equal(spoken[1].text, 'cow?');
    assert.equal(spoken[1].lang, 'en-US');
    assert.equal(spoken[1].volume, 0.4);
    assert.equal(spoken[1].rate, 0.8);
    preferences = { soundsEnabled: false };
    audio.speakSequence([{ text: 'silêncio', language: 'pt-BR' }]);
    audio.speak('silêncio');
    assert.equal(spoken.length, 2);
    audio.stop();
    assert.ok(cancellations >= 2);
    preferences = { soundsEnabled: true };
    audio.speakSequence([
        { text: 'Esta imagem é', language: 'pt-BR' },
        { text: 'duck?', language: 'en-US' },
    ]);
    const currentUtterance = spoken.at(-1);
    const countBeforeStop = spoken.length;
    audio.stop();
    currentUtterance.onend?.();
    await flush();
    assert.equal(spoken.length, countBeforeStop,
        'A late speech callback cannot restart playback after stop.');
});

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`PASS ${name}`); }
        catch (error) { failures++; console.error(`FAIL ${name}\n${error.stack}`); }
    }
    if (failures) process.exitCode = 1;
    else console.log(`${tests.length} activity flow regression checks passed.`);
})();
