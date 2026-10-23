const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function load(file, sandbox) {
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8')
        .replace(/^import\s[\s\S]*?;\r?\n/gm, '').replace(/^export /gm, ''), sandbox);
    return sandbox;
}
const timers = new Map(), frames = new Map(), listeners = new Map();
let serial = 0, callbacks = 0;
const windowStub = {
    setTimeout(callback) { timers.set(++serial, callback); return serial; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { frames.set(++serial, callback); return serial; },
    cancelAnimationFrame(id) { frames.delete(id); },
};
const lifecycleModule = load('public/js/features/atividades/activity-lifecycle.js', { window: windowStub });
const scope = lifecycleModule.createActivityLifecycle();
const target = {
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
};
scope.listen(target, 'click', () => callbacks++);
scope.timeout(() => callbacks++, 650);
scope.frame(() => callbacks++);
const stale = [...timers.values(), ...frames.values(), ...listeners.values()];
scope.destroy(); scope.destroy();
assert.equal(timers.size + frames.size + listeners.size, 0);
stale.forEach(callback => callback());
scope.timeout(() => callbacks++, 1); scope.frame(() => callbacks++);
assert.equal(callbacks, 0, 'Callbacks de uma rodada encerrada não podem executar.');
assert.equal(timers.size + frames.size, 0);

const engines = {
    associar: 'Associate', 'audio-imagem': 'AudioImage', 'banco-palavras': 'WordBank',
    'completar-frase': 'CompleteSentence', escrita: 'Writing', 'ordenar-frase': 'OrderSentence',
    reconhecer: 'Recognize', validar: 'Validate', 'verdadeiro-falso': 'TrueFalse',
    'quebra-cabeca-sombra': 'ShadowPuzzle',
};
for (const [file, name] of Object.entries(engines)) {
    const sandbox = load(`public/js/features/atividades/${file}.js`, {
        createActivityLifecycle: lifecycleModule.createActivityLifecycle,
        audioService: { stop() {} }, document: { querySelector: () => null },
    });
    const engine = sandbox[`create${name}Activity`]({
        activity: { item: { id: 1, en: 'COW', pt: 'Vaca' } },
        module: { items: [] }, student: { supportLevel: 2 }, elements: {},
    });
    engine.destroy();
    assert.equal(engine.next(), false, `${file}: motor encerrado não pode concluir.`);
    execFileSync(process.execPath, ['--check', path.join(root, `public/js/features/atividades/${file}.js`)]);
}

let preferences = { soundsEnabled: false, volume: 20 };
const oscillators = [];
const parameter = { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} };
class AudioContext {
    currentTime = 0;
    createOscillator() {
        const oscillator = { frequency: parameter, connect() {}, start() {}, stop(at) { if (at === undefined) this.cancelled = true; } };
        oscillators.push(oscillator); return oscillator;
    }
    createGain() { return { gain: parameter, connect() {} }; }
}
const effects = load('public/js/services/roar-sound-fx.js', {
    storage: { getPreferences: () => preferences },
    window: { AudioContext, addEventListener() {} },
});
const sound = vm.runInContext('soundFx', effects);
sound.playSuccess(); assert.equal(oscillators.length, 0, 'Som desligado também silencia efeitos.');
preferences = { soundsEnabled: true, volume: 0 };
sound.playTryAgain(); assert.equal(oscillators.length, 0);
preferences = { soundsEnabled: true, volume: 40 };
sound.playSuccess(); assert.equal(oscillators.length, 2);
assert.ok(Math.abs(sound._getPreferences().masterGain - 0.088) < 0.001);
sound.stop(); assert.ok(oscillators.every(oscillator => oscillator.cancelled));
preferences = { volume: 'inválido' };
assert.ok(Number.isFinite(sound._getPreferences().masterGain));

const spoken = [];
const englishVoice = { lang: 'en-US', name: 'English test voice' };
const speech = load('public/js/services/audio-service.js', {
    storage: { getPreferences: () => preferences },
    window: { addEventListener() {}, speechSynthesis: { cancel() {}, speak: phrase => spoken.push(phrase), getVoices: () => [{ lang: 'pt-BR' }, englishVoice] } },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
});
const audio = vm.runInContext('audioService', speech);
preferences = { volume: 'inválido', speechRate: 'inválido' };
audio.speakSequence([{ text: 'Olá' }, { text: 'cow', language: 'en-US' }]);
assert.equal(spoken[0].volume, 0.8); assert.equal(spoken[0].rate, 0.9);
preferences = { soundsEnabled: false };
spoken[0].onend(); assert.equal(spoken.length, 1, 'Silenciar interrompe a próxima frase da sequência.');
preferences = { soundsEnabled: true, volume: 35, speechRate: 0.8 };
audio.speak('arm', 'en-US');
assert.equal(spoken.at(-1).voice, englishVoice, 'Vocabulário usa a voz inglesa disponível.');
assert.equal(spoken.at(-1).rate, 0.8);
assert.equal(spoken.at(-1).volume, 0.35);
console.log('PASS: 10 motores encerram corretamente; timers, frames e eventos cancelados; efeitos e fala respeitam preferências atuais.');
