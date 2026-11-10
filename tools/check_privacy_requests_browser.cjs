// Browser/component/API-client tests with fictitious HTTP responses; no live data.
const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/') return response.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="stylesheet" href="/public/css/global.css"><link rel="stylesheet" href="/public/css/components/privacy-requests.css">
        <style>body{padding:16px;max-width:940px;margin:auto}</style><main id="requests"></main>
        <script type="module">import {mountPrivacyRequests} from '/public/js/components/privacy-requests.js';
        window.mount=(options)=>{window.panel?.destroy();window.panel=mountPrivacyRequests(document.querySelector('#requests'),options);};
        window.mount({studentId:17});</script></html>`);
    if (pathname.endsWith('/app-config.js')) {
        response.setHeader('Content-Type', 'text/javascript');
        return response.end(`export const APP_CONFIG={apiBaseUrl:location.origin,requestTimeoutMs:8000};`);
    }
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    try {
        response.setHeader('Content-Type', { '.js': 'text/javascript', '.css': 'text/css' }[path.extname(file)] || 'application/octet-stream');
        response.end(await fs.readFile(file));
    } catch { response.writeHead(404).end(); }
});

(async () => {
    let browser;
    try {
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const origin = `http://127.0.0.1:${server.address().port}`;
        browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
        for (const width of [1280, 390]) {
            const context = await browser.newContext({ viewport: { width, height: 900 } });
            const page = await context.newPage();
            const errors = [], created = [], updates = [];
            let enabled = false, entries = [], loseFirstResponse = true, pending, delay = false, conflict = false;
            page.on('pageerror', error => errors.push(error.message));
            await context.addInitScript(() => localStorage.setItem('roarSession', JSON.stringify({ role: 'teacher', token: 'test-only-token', user: { id: 5 } })));
            await context.route('**/*', async route => {
                const request = route.request();
                const url = new URL(request.url());
                if (url.pathname === '/privacidade/atendimento') return route.fulfill({ json: { disponivel: enabled, responsavel: enabled ? 'Instituição de teste' : null, contato: enabled ? 'teste@example.invalid' : null } });
                if (url.pathname.includes('/solicitacoes-dados')) {
                    assert.equal(request.headers().authorization, 'Bearer test-only-token');
                    if (request.method() === 'GET') {
                        const copy = structuredClone(entries);
                        if (delay && url.pathname.includes('/17/')) await new Promise(resolve => { pending = resolve; });
                        return route.fulfill({ json: { solicitacoes: url.pathname.includes('/18/') ? [] : copy, proximo_cursor: null } });
                    }
                    const body = request.postDataJSON();
                    if (request.method() === 'POST') {
                        created.push(body);
                        if (!entries.length) entries.push({ ...body, protocolo: 'ROAR-' + body.id.toUpperCase(), versao: 1, status: 'recebida',
                            criado_em: '2026-11-06T18:00:00Z', resposta: '', eventos: [{ status: 'recebida', nome_professor: 'Docente A', criado_em: '2026-11-06T18:00:00Z' }] });
                        if (loseFirstResponse) {
                            loseFirstResponse = false;
                            return route.fulfill({ status: 503, json: { erro: 'Resposta perdida. Tente novamente.' } });
                        }
                        return route.fulfill({ json: { solicitacao: entries[0] } });
                    }
                    updates.push(body);
                    if (conflict) { conflict = false; return route.fulfill({ status: 409, json: { erro: 'Esta solicitação já foi atualizada. Recarregue a lista.' } }); }
                    assert.equal(body.versao, entries[0].versao);
                    entries[0] = { ...entries[0], ...body, versao: body.versao + 1,
                        eventos: [...entries[0].eventos, { status: body.status, nome_professor: 'Docente A', criado_em: '2026-11-06T18:01:00Z' }] };
                    return route.fulfill({ json: { solicitacao: entries[0] } });
                }
                if (url.origin !== origin) return route.fulfill({ body: '', contentType: 'text/css' });
                return route.continue();
            });
            const status = page.locator('.privacy-requests__message');
            await page.goto(origin);
            await status.filter({ hasText: 'Pedidos atualizados' }).waitFor();
            assert.equal(await page.locator('.privacy-requests form').count(), 0, 'Intake is disabled before official configuration.');
            await page.getByText(/Atendimento em configuração/).waitFor();
            enabled = true;
            await page.getByRole('button', { name: 'Atualizar pedidos', exact: true }).click();
            const form = page.locator('.privacy-requests__form');
            const register = form.getByRole('button', { name: 'Registrar pedido verificado' });
            await register.click();
            assert.equal(created.length, 0);
            await form.getByLabel('Quem fez o pedido?').selectOption('responsavel');
            const description = 'Corrigir o ano escolar. <img src=x onerror="window.injection=true">';
            await form.getByLabel('Descrição do pedido').fill(description);
            await form.locator('input').focus();
            await page.keyboard.press('Space');
            await register.focus();
            assert.notEqual(await register.evaluate(element => getComputedStyle(element).outlineStyle), 'none');
            await page.keyboard.press('Enter');
            await status.filter({ hasText: 'Resposta perdida' }).waitFor();
            await register.click();
            await status.filter({ hasText: 'Pedido registrado. Protocolo' }).waitFor();
            assert.equal(created.length, 2);
            assert.equal(created[0].id, created[1].id, 'Lost-response retries reuse the original UUID.');
            assert.equal(entries.length, 1);
            assert.equal(await form.locator('input').isChecked(), false);
            const entry = page.locator('.privacy-requests__entry');
            await entry.locator('summary').click();
            assert.equal(await entry.locator('img').count(), 0);
            assert.equal(await page.evaluate(() => window.injection), undefined);
            await entry.getByText(description, { exact: true }).waitFor();
            await entry.getByRole('button', { name: 'Iniciar análise' }).click();
            await status.filter({ hasText: 'Pedido em análise' }).waitFor();
            const reply = page.locator('.privacy-requests__reply');
            await reply.getByLabel(/Resposta ao solicitante/).fill('curta');
            await reply.getByRole('button').click();
            assert.equal(updates.length, 1);
            await reply.getByLabel(/Resposta ao solicitante/).fill('Ano escolar conferido e corrigido pela instituição.');
            conflict = true;
            await reply.getByRole('button').click();
            await status.filter({ hasText: 'Recarregue a lista' }).waitFor();
            assert.equal(await reply.getByLabel(/Resposta ao solicitante/).inputValue(), 'Ano escolar conferido e corrigido pela instituição.');
            await page.getByRole('button', { name: 'Atualizar pedidos', exact: true }).click();
            await status.filter({ hasText: 'Pedidos atualizados' }).waitFor();
            await entry.locator('summary').click();
            await reply.getByLabel(/Resposta ao solicitante/).fill('Ano escolar conferido e corrigido pela instituição.');
            await reply.getByRole('button').click();
            await status.filter({ hasText: 'Pedido respondido' }).waitFor();
            assert.equal(await page.locator('.privacy-requests__reply').count(), 0);
            assert.equal(await entry.locator('li').count(), 3);
            await entry.screenshot({ path: path.join(os.tmpdir(), `roar-privacy-teacher-${width}.png`) });
            // Pausing intake keeps existing requests visible to students, with no action form.
            enabled = false;
            await page.evaluate(() => window.mount({}));
            await status.filter({ hasText: 'Pedidos atualizados' }).waitFor();
            assert.equal(await page.locator('form').count(), 0);
            await page.locator('summary').click();
            await page.getByText('Ano escolar conferido e corrigido pela instituição.', { exact: true }).waitFor();
            assert.equal(await page.locator('textarea,input,select').count(), 0);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.screenshot({ path: path.join(os.tmpdir(), `roar-privacy-student-${width}.png`) });
            // Switching profiles discards a late response from the previous student.
            delay = true;
            await page.evaluate(() => window.mount({ studentId: 17 }));
            await page.waitForFunction(() => document.querySelector('.privacy-requests').getAttribute('aria-busy') === 'true');
            while (!pending) await new Promise(resolve => setTimeout(resolve, 10));
            await page.evaluate(() => window.mount({ studentId: 18 }));
            await status.filter({ hasText: 'Pedidos atualizados' }).waitFor();
            pending();
            await page.waitForTimeout(100);
            assert.equal(await page.locator('details').count(), 0);
            assert.equal(await page.getByText(/Nenhum pedido registrado/).isVisible(), true);
            assert.deepEqual(errors, []);
            assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => /privacy|pedido|solicita/i.test(key))), false);
            console.log(`PASS ${width}px: configuration gate, verification, keyboard, lost-response idempotency, version conflict, XSS, audit, student read-only tracking and late-response isolation.`);
            await context.close();
        }
    } finally {
        await browser?.close();
        server.closeAllConnections();
        if (server.listening) await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
