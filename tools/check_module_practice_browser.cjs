// Local browser integration check. No learner credentials or production requests.
// Usage: node tools/check_module_practice_browser.cjs <absolute playwright package path>
const { chromium } = require(process.argv[2] || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const items = ['COW', 'DUCK', 'HORSE', 'HEN'].map((en, i) => ({
    id: String(i + 1), itemId: i + 1, en, pt: ['vaca', 'pato', 'cavalo', 'galinha'][i],
    vectorImage: `/public/assets/imagens/modulos/fazenda/${en.toLowerCase()}.png`,
}));
const fixture = {
    student: { id: 999, supportLevel: 2, supportMode: 'Aprendiz Guiado' },
    activity: { id: 22, type: 'associate', status: 'active', item: items[0], instruction: 'Escolha COW.' },
    module: { id: 9, title: 'Animais da fazenda', items, activities: [{ activityId: 22, order: 1 }] },
};
const saves = [];
const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/test-save') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => { saves.push(JSON.parse(body)); res.setHeader('Content-Type', 'application/json'); res.end('{}'); });
        return;
    }
    const file = path.resolve(root, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
        if (error) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream');
        res.end(bytes);
    });
});

(async () => {
    let browser;
    try {
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const origin = `http://127.0.0.1:${server.address().port}`;
        browser = await chromium.launch({ channel: 'msedge', headless: true });
        for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
            const bodyModule = viewport.width >= 390;
            if (bodyModule) {
                fixture.module.items = ['ARM', 'HEAD', 'LEG', 'BELLY', 'FOOT'].map((en, i) => ({
                    id: String(i + 1), itemId: i + 1, en, pt: en,
                    vectorImage: `/public/assets/imagens/modulos/corpo_humano/corpo_humano_vetor/${en.toLowerCase()}.png`,
                }));
                fixture.activity.item = fixture.module.items[2];
                fixture.module.title = 'Corpo Humano';
            }
            const categoryFor = word => bodyModule ? (['ARM', 'LEG'].includes(word) ? 'limbs' : 'head-torso') : (['DUCK', 'HEN'].includes(word) ? 'birds' : 'mammals');
            const touch = viewport.width < 761;
            const context = await browser.newContext({ viewport, hasTouch: touch });
            const page = await context.newPage();
            const cdp = touch ? await context.newCDPSession(page) : null;
            async function dragCard(destination, { cancel = false, leaveHeld = false } = {}) {
                const puzzle = (await page.locator('.body-jigsaw').count()) > 0;
                const card = page.locator(puzzle ? '.shadow-piece[data-piece-id="0"]' : '.activity-content .practice-card');
                await card.scrollIntoViewIfNeeded();
                const from = await card.boundingBox();
                const to = typeof destination === 'string' ? await page.locator(destination).boundingBox() : destination;
                const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
                const end = { x: to.x + (to.width || 0) / 2, y: to.y + (to.height || 0) / 2 };
                if (touch) {
                    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
                    for (let step = 1; step <= 8; step++) {
                        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: start.x + (end.x - start.x) * step / 8, y: start.y + (end.y - start.y) * step / 8 }] });
                    }
                } else {
                    await page.mouse.move(start.x, start.y);
                    await page.mouse.down();
                    await page.mouse.move(end.x, end.y, { steps: 8 });
                }
                assert.equal(await page.locator('.practice-drag-ghost, .shadow-ghost').count(), 1, 'Card follows the pointer.');
                if (typeof destination === 'string') await page.waitForFunction(selector => {
                    const el = document.querySelector(selector);
                    return el?.classList.contains('is-drop-hover') || el?.classList.contains('is-over');
                }, destination);
                if (leaveHeld) return;
                if (cancel && !touch) await page.keyboard.press('Escape');
                if (touch) await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
                else await page.mouse.up();
                assert.equal(await page.locator('.practice-drag-ghost, .shadow-ghost, .is-drop-hover, .is-over, .is-dragging').count(), 0, 'Drag clears on drop/cancel.');
            }
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await context.route('**/*', async route => {
                const url = new URL(route.request().url());
                if (url.origin !== origin) return route.fulfill({ body: '', contentType: 'text/css' });
                if (/route-guard.js|roar-avatar.js|roar-page-transition.js/.test(url.pathname)) return route.fulfill({ body: '', contentType: 'text/javascript' });
                if (url.pathname.endsWith('/atividade-service.js')) return route.fulfill({
                    contentType: 'text/javascript', body: `export const atividadeService = {
                        getContext: async () => (${JSON.stringify(fixture)}),
                        complete: async (id, stats) => { const response = await fetch('/test-save', {method:'POST', body: JSON.stringify({id,stats})}); return response.json(); }
                    };`,
                });
                if (url.pathname.endsWith('/atividades.html')) return route.fulfill({ contentType: 'text/html', body: '<h1>Módulos</h1>' });
                return route.continue();
            });
            await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
            await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
            await page.addInitScript(() => {
                if (!localStorage.getItem('roarPreferences:anonymous')) localStorage.setItem('roarPreferences:anonymous', JSON.stringify({ soundsEnabled: false, autoAdvancePaused: false }));
            });
            await page.goto(origin + '/pages/aluno/atividade.html?modulo=9&etapa=1');
            await page.locator(`.association-grid button[data-answer="${fixture.activity.item.en}"]`).click();
            await page.locator('#next-button').click();
            await page.getByRole('heading', { name: 'Separe por categorias' }).waitFor();
            assert.equal(await page.locator('#auto-advance-toggle, .practice-continue').count(), 0);
            assert.equal(await page.locator('.practice-choice svg').count(), 2);
            assert.equal(await page.locator('.practice-choice').filter({ hasText: 'Mamíferos' }).count(), 0);
            const dictionary = page.locator('.practice-dictionary').first();
            await dictionary.locator('summary').click();
            assert.equal(await dictionary.locator('p').isVisible(), true);
            await dictionary.locator('summary').click();
            const countBefore = saves.length;
            // Deliberately wrong first; the correct answer remains available.
            if (bodyModule) {
                assert.equal(await page.locator('.practice-arm-highlight').count(), 1);
                const shot = path.join(os.tmpdir(), 'roar-body-categories.png');
                await page.screenshot({ path: shot });
                console.log(`Screenshot: ${shot}`);
            }
            const firstWord = await page.locator('.practice-card .practice-word').innerText();
            await page.locator(`[data-choice]:not([data-choice="${categoryFor(firstWord)}"])`).click();
            assert.match(await page.locator('#lex-message').innerText(), /tentar de novo/);
            for (let i = 0; i < 4; i++) {
                const word = await page.locator('.practice-card .practice-word').innerText();
                const target = page.locator(`[data-choice="${categoryFor(word)}"]`);
                await page.keyboard.press('Tab');
                await target.focus();
                assert.notEqual(await target.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
                await page.keyboard.press('Enter');
                if (i < 3) {
                    await page.clock.runFor(1000);
                }
            }
            assert.equal(saves.length, countBefore);
            await page.clock.runFor(1000);
            if (bodyModule) {
                await page.getByRole('heading', { name: 'Monte o corpo' }).waitFor();
                await page.locator('.shadow-piece').first().waitFor();
                assert.equal(await page.locator('.practice-place, .body-puzzle-board').count(), 0);
                await page.getByText('Como jogar', { exact: true }).click();
                assert.equal(await page.locator('.body-jigsaw-help p').isVisible(), true);
                await page.getByText('Como jogar', { exact: true }).click();
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                await page.screenshot({ path: path.join(os.tmpdir(), `roar-body-jigsaw-${viewport.width}.png`) });
                await dragCard({ x: 5, y: 100 });
                assert.match(await page.locator('#lex-message').innerText(), /voltou para o mesmo lugar/);
                await dragCard('.shadow-target[data-piece-id="0"]', { cancel: true });
                for (let i = 0; i < fixture.module.items.length; i++) {
                    await page.locator('.shadow-piece').first().waitFor();
                    const pieces = await page.locator('.shadow-piece').count();
                    assert.equal(pieces, 4); // Registered guided learning mode; TEA absent.
                    const urls = await page.locator('.shadow-piece image').evaluateAll(images => images.map(image => image.getAttribute('href')));
                    assert.ok(urls.every(url => url === fixture.module.items[i].vectorImage), 'All pieces crop the registered image.');
                    await dragCard('.shadow-target[data-piece-id="0"]');
                    assert.equal(await page.locator('.shadow-target.is-matched').count(), 1);
                    await page.clock.runFor(1000);
                    assert.equal(await page.locator('.shadow-target.is-matched').count(), 1, 'Partial puzzle must not advance.');
                    for (let id = 1; id < pieces; id++) {
                        await page.locator(`.shadow-piece[data-piece-id="${id}"]`).focus();
                        await page.keyboard.press('Enter');
                        await page.locator(`.shadow-target[data-piece-id="${id}"]`).focus();
                        await page.keyboard.press('Enter');
                    }
                    assert.equal(await page.locator('.shadow-target.is-matched').count(), pieces);
                    await page.clock.runFor(999);
                    assert.equal(saves.length, countBefore);
                    await page.clock.runFor(1);
                }
                await page.waitForURL('**/atividades.html');
                assert.equal(saves.length, countBefore + 1);
                assert.equal(saves.at(-1).stats.correct, 10);
                assert.equal(saves.at(-1).stats.wrong, 1);
            } else {
            await page.getByRole('heading', { name: 'Complete a cena' }).waitFor();
            assert.match(await page.locator('.practice-help').innerText(), /^Arraste o cartão/);
            if (bodyModule) {
                assert.match(await page.locator('.practice-card img').getAttribute('src'), /leg-complete.svg$/);
                await page.waitForFunction(() => [...document.querySelectorAll('.practice-card img')].every(img => img.complete && img.naturalWidth > 0));
                await page.screenshot({ path: path.join(os.tmpdir(), `roar-leg-scene-${viewport.width}.png`) });
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.locator('[data-choice="in"]').click();
            assert.match(await page.locator('#lex-message').innerText(), /Pegue o cartão primeiro/);
            await dragCard({ x: 10, y: 120 });
            assert.match(await page.locator('#lex-message').innerText(), /voltou ao início/);
            assert.equal(await page.locator('.module-practice .practice-card').getAttribute('aria-pressed'), 'false');
            await dragCard('[data-choice="in"]', { cancel: true });
            assert.equal(await page.locator('.practice-placed-card').count(), 0);
            await dragCard('[data-choice="on"]');
            assert.match(await page.locator('#lex-message').innerText(), /tentar de novo/);
            await dragCard('[data-choice="in"]');
            assert.equal(await page.locator('.practice-placed-card').count(), 1);
            await page.waitForFunction(() => [...document.querySelectorAll('.practice-placed-card')].every(img => img.complete && img.naturalWidth > 0));
            if (viewport.width === 390) {
                const screenshot = path.join(os.tmpdir(), 'roar-module-practice.png');
                await page.screenshot({ path: screenshot });
                console.log(`Screenshot: ${screenshot}`);
            }
            await page.clock.runFor(999);
            assert.equal(await page.locator('.practice-placed-card').count(), 1);
            await page.clock.runFor(1);
            await page.locator('.module-practice .practice-card').focus();
            await page.keyboard.press('Enter');
            await page.locator('[data-choice="on"]').focus();
            await page.keyboard.press('Space');
            assert.equal(saves.length, countBefore);
            await page.clock.runFor(1000);
            await page.waitForURL('**/atividades.html');
            assert.equal(saves.length, countBefore + 1);
            assert.equal(saves.at(-1).stats.correct, 7);
            assert.equal(saves.at(-1).stats.wrong, 2);
            }
            if (bodyModule) {
                await page.goto(origin + '/pages/aluno/configuracoes.html');
                assert.deepEqual(errors, [], 'Settings should initialize without JavaScript errors.');
                await page.locator('label:has(#cfgAutoAdvance)').click();
                assert.equal(await page.locator('#cfgAutoAdvance').isChecked(), false);
                await page.locator('#btnSave').click();
                assert.deepEqual(errors, [], 'Settings save should execute without errors.');
                assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('roarPreferences:anonymous')).autoAdvancePaused), true);
                assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('roarPreferences:anonymous')).soundsEnabled), false);
                await page.reload();
                assert.equal(await page.locator('#cfgAutoAdvance').isChecked(), false);
                await page.goto(origin + '/pages/aluno/atividade.html?modulo=9&etapa=1');
                await page.locator('.association-grid button[data-answer="LEG"]').click();
                await page.clock.runFor(3000);
                assert.equal(await page.locator('.module-practice').count(), 0);
                await page.locator('#next-button').click();
                await page.locator('[data-choice="limbs"]').click();
                await page.clock.runFor(5000);
                assert.equal(await page.locator('.practice-word').innerText(), 'ARM');
                await page.locator('#next-button').click();
                assert.equal(await page.locator('.practice-word').innerText(), 'HEAD');
                // Leave during a held drag: remove visual state and don't save progress.
                for (let i = 0; i < 3; i++) {
                    const word = await page.locator('.practice-card .practice-word').innerText();
                    await page.locator(`[data-choice="${categoryFor(word)}"]`).click();
                    await page.locator('#next-button').click();
                }
                await page.getByRole('heading', { name: 'Monte o corpo' }).waitFor();
                await page.locator('.shadow-piece').first().waitFor();
                await dragCard('.shadow-target[data-piece-id="0"]', { leaveHeld: true });
                await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
                assert.equal(await page.locator('.practice-drag-ghost, .shadow-ghost, .is-drop-hover, .is-over, .is-dragging').count(), 0);
                if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                else await page.mouse.up();
                await page.clock.runFor(5000);
                assert.equal(saves.length, countBefore + 1);
            }
            assert.deepEqual(errors, []);
            console.log(`PASS ${viewport.width}px: arrasto ${touch ? 'por toque' : 'por mouse'}, cancelamento, teclado, erro/acerto, avanço em 1s, conclusão única, sem erros JS.`);
            await context.close();
        }
    } finally {
        await browser?.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
