// Real writing UI/controller with a local context and save endpoint; no student account or production writes.
// Usage: node tools/check_writing_activity_browser.cjs <absolute playwright package path>
const { chromium } = require(process.argv[2] || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const item = { id: 'foot', itemId: 5, en: 'FOOT', pt: 'pé', vectorImage: '/public/assets/imagens/modulos/corpo_humano/corpo_humano_vetor/foot.png' };
const fixture = {
    student: { id: 999, supportLevel: 2, supportMode: 'Aprendiz Guiado' },
    activity: { id: 109, type: 'writing', status: 'active', item, answer: 'FOOT', instruction: 'Escreva em inglês o nome da parte do corpo.' },
    module: { id: 9, title: 'Corpo Humano', items: [item], activities: Array.from({ length: 12 }, (_, index) => ({ activityId: 101 + index, order: index + 1 })) },
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
        for (const mode of ['mouse', 'touch', 'keyboard']) {
            const context = await browser.newContext({ viewport: mode === 'touch' ? { width: 390, height: 844 } : { width: 1280, height: 800 }, hasTouch: mode === 'touch' });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await context.route('**/*', async route => {
                const url = new URL(route.request().url());
                if (url.origin !== origin) return route.fulfill({ body: '', contentType: 'text/css' });
                if (/route-guard.js|roar-avatar.js|roar-page-transition.js/.test(url.pathname)) return route.fulfill({ body: '', contentType: 'text/javascript' });
                if (url.pathname.endsWith('/atividade-service.js')) return route.fulfill({ contentType: 'text/javascript', body: `export const atividadeService = {
                    getContext: async () => (${JSON.stringify(fixture)}),
                    complete: async (id, stats) => { const response = await fetch('/test-save', {method:'POST', body: JSON.stringify({id,stats})}); return response.json(); }
                };` });
                if (url.pathname.endsWith('/atividade.html') && url.searchParams.get('etapa') === '10') return route.fulfill({ contentType: 'text/html', body: '<h1>Etapa 10</h1>' });
                return route.continue();
            });
            await page.clock.install();
            await page.addInitScript(() => localStorage.setItem('roarPreferences:anonymous', JSON.stringify({ soundsEnabled: false, autoAdvancePaused: false })));
            await page.goto(origin + '/pages/aluno/atividade.html?modulo=9&etapa=9');
            const input = page.locator('#writing-answer');
            const check = page.getByRole('button', { name: 'Conferir', exact: true });
            const next = page.locator('#next-button');
            const message = page.locator('#lex-message');
            const countBefore = saves.length;
            async function submit() {
                if (mode === 'touch') await check.tap();
                else if (mode === 'keyboard') { await input.focus(); await page.keyboard.press('Enter'); }
                else await check.click();
            }

            assert.equal(await next.isDisabled(), true);
            await submit();
            assert.match(await message.innerText(), /Digite uma palavra antes de conferir/, 'Conferir should submit the form.');
            assert.equal(await input.getAttribute('aria-invalid'), 'true');
            assert.equal(saves.length, countBefore);
            await input.fill('ARM');
            await submit();
            assert.match(await message.innerText(), /tente novamente/);
            assert.equal(await next.isDisabled(), true);
            assert.equal(await input.isEnabled(), true);

            await input.fill(mode === 'mouse' ? 'FOOT' : mode === 'touch' ? 'foot' : ' Foot. ');
            await submit();
            assert.match(await message.innerText(), /Muito bem! Você escreveu FOOT/);
            assert.equal(await input.getAttribute('aria-invalid'), 'false');
            assert.equal(await check.isDisabled(), true);
            assert.equal(await next.isEnabled(), true);
            // Repeated submit events cannot count another success or create another save.
            await page.locator('.writing-form').dispatchEvent('submit');
            await page.clock.runFor(999);
            assert.equal(saves.length, countBefore);
            assert.equal(new URL(page.url()).searchParams.get('etapa'), '9');
            await page.clock.runFor(1);
            await page.waitForURL('**/atividade.html?modulo=9&etapa=10');
            assert.equal(saves.length, countBefore + 1);
            assert.equal(saves.at(-1).id, 109);
            assert.equal(saves.at(-1).stats.correct, 1);
            assert.equal(saves.at(-1).stats.wrong, 1);
            assert.deepEqual(errors, []);
            console.log(`PASS writing ${mode}: vazio, erro e nova tentativa, FOOT, avanço em 1s e um único salvamento.`);
            await context.close();
        }
    } finally {
        await browser?.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
