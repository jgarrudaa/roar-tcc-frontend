const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const values = new Map();
let blocked = false;
const context = vm.createContext({ window: { localStorage: {
    getItem(key) { if (blocked) throw new Error('blocked'); return values.get(key) || null; },
    setItem(key, value) { if (blocked) throw new Error('quota'); values.set(key, value); },
    removeItem(key) { if (blocked) throw new Error('blocked'); values.delete(key); },
} } });
vm.runInContext(fs.readFileSync(path.join(__dirname,
    '../public/js/services/activity-progress-service.js'), 'utf8').replace(/^export /gm, ''), context);
const progress = vm.runInContext('activityProgressService', context);
const attemptId = '00000000-0000-4000-8000-000000000001';
const draft = { stage: 2, phaseIndex: 0, fingerprint: 'content-v1', attemptId };
assert.equal(progress.save(1, 9, draft), true);
assert.equal(progress.read(1, 9, 'content-v1').stage, 2);
assert.equal(progress.read(2, 9, 'content-v1'), null, 'Different students cannot resume another profile.');
assert.equal(progress.read(1, 8, 'content-v1'), null, 'Different modules have different drafts.');
assert.equal(progress.read(1, 9, 'content-v2'), null, 'Changed content/settings invalidate the draft.');
assert.equal(progress.savedStage(1, 9), 2);
progress.clear(1, 9, '00000000-0000-4000-8000-000000000002');
assert.equal(progress.savedStage(1, 9), 2, 'Late requests cannot erase a newer draft.');
const key = [...values.keys()][0];
const valid = values.get(key);
for (const raw of ['{broken', JSON.stringify({ ...JSON.parse(valid), updatedAt: 0 }),
    JSON.stringify({ ...JSON.parse(valid), stage: -1 }),
    JSON.stringify({ ...JSON.parse(valid), attemptId: 'invalid' }), 'x'.repeat(160000)]) {
    values.set(key, raw);
    assert.equal(progress.read(1, 9, 'content-v1'), null);
}
values.set(key, valid);
blocked = true;
assert.equal(progress.save(1, 9, draft), false);
assert.equal(progress.read(1, 9, 'content-v1'), null);
assert.doesNotThrow(() => progress.clear(1, 9, attemptId));
blocked = false;
progress.clear(1, 9, attemptId);
assert.equal(progress.savedStage(1, 9), null);
console.log('PASS: draft isolation, invalidation, expiry, corrupt storage, quota and late-response protection.');
