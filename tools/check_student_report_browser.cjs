// Full PDF flow: browser -> API client -> real Flask/JWT handler -> fictitious DB -> PDF download.
const { chromium } = require(process.argv[2] || 'playwright');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
let api, browser, apiOrigin;
let diagnostics = '';
const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/') return response.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8">
        <link rel="stylesheet" href="/public/css/global.css"><link rel="stylesheet" href="/public/css/components/student-learning.css">
        <style>body{margin:20px auto;padding:12px;max-width:960px;background:#f5faff}main{min-width:0}</style>
        <main id="exporter"></main><script type="module">import {mountStudentDataManagement} from '/public/js/components/student-data-management.js';
        window.exporter=mountStudentDataManagement(document.querySelector('#exporter'),17);</script></html>`);
    if (pathname.endsWith('/app-config.js')) {
        response.setHeader('Content-Type','text/javascript');
        return response.end(`export const APP_CONFIG={apiBaseUrl:${JSON.stringify(apiOrigin)},requestTimeoutMs:8000};`);
    }
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    try {
        const body = await fs.readFile(file);
        response.setHeader('Content-Type',{'.js':'text/javascript','.css':'text/css'}[path.extname(file)] || 'application/octet-stream');
        response.end(body);
    } catch { response.writeHead(404).end(); }
});

(async () => {
    try {
        api = spawn(process.argv[3] || process.env.ROAR_TEST_PYTHON || 'python', [path.join(__dirname,'student_data_test_api.py')], {
            cwd:root, windowsHide:true, env:{...process.env,
                PYTHONPATH:[path.join(root,'tmp/privacy-deps'),process.env.PYTHONPATH].filter(Boolean).join(path.delimiter)},
        });
        api.stderr.on('data', chunk => { diagnostics += chunk; });
        const ready = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Test API did not start: '+diagnostics)), 15000);
            const lines = createInterface({input:api.stdout});
            lines.once('line', line => { clearTimeout(timeout); lines.close(); resolve(JSON.parse(line)); });
            api.once('error', error => { clearTimeout(timeout); reject(error); });
            api.once('exit', code => { clearTimeout(timeout); reject(new Error('Test API exited: '+code+' '+diagnostics)); });
        });
        apiOrigin = `http://127.0.0.1:${ready.port}`;
        const control = async options => (await fetch(apiOrigin+'/__test/control', {
            method:'POST', headers:{'Content-Type':'application/json'},body:JSON.stringify(options),
        })).json();
        await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
        const origin = `http://127.0.0.1:${server.address().port}`;
        browser = await chromium.launch({headless:true,...(process.platform === 'win32' ? {channel:'msedge'} : {})});
        for (const width of [1280,390]) {
            await control({reset:true});
            const context = await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
            await context.addInitScript(token => localStorage.setItem('roarSession',JSON.stringify({role:'teacher',token,user:{id:5}})),ready.tokens.teacher);
            const page = await context.newPage();
            const errors = [], downloads = [], exports = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('download', download => downloads.push(download));
            page.on('request', request => {
                if (request.method() === 'POST' && /exportacao-dados|relatorio-dados\.pdf/.test(request.url())) exports.push(request.url());
            });
            await context.route('https://**/*', route => route.fulfill({body:'',contentType:'text/css'}));
            await page.goto(origin);
            const pdf = page.getByRole('button',{name:'Gerar relatório em PDF',exact:true});
            const json = page.getByRole('button',{name:'Exportar cadastro e histórico',exact:true});
            const message = page.getByRole('status');
            await pdf.click();
            assert.equal((await control({})).requests,0);
            await page.locator('select').selectOption('responsavel');
            await page.locator('input').focus();
            await page.keyboard.press('Space');
            await pdf.focus();
            assert.notEqual(await pdf.evaluate(node => getComputedStyle(node).outlineStyle),'none');
            const first = page.waitForEvent('download');
            await page.keyboard.press('Enter');
            const download = await first;
            assert.equal(download.suggestedFilename(),'roar-relatorio-aluno-17.pdf');
            const bytes = await fs.readFile(await download.path());
            assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
            assert.ok(bytes.length > 1000);
            assert.equal(await page.locator('input').isChecked(),false);
            assert.equal((await control({})).requests,1);
            assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key=>/export|report|relatorio/i.test(key))),false);

            await control({fail_table:'atividades'});
            await page.locator('input').check();
            await pdf.click();
            await message.filter({hasText:'Não foi possível exportar os dados'}).waitFor();
            assert.equal(downloads.length,1);
            assert.equal(await json.isEnabled(),true);
            assert.equal(await pdf.isEnabled(),true);
            await control({fail_table:null});
            const retry = page.waitForEvent('download');
            await pdf.click();
            await retry;
            assert.equal(downloads.length,2);

            const endpoint = '**/relatorio-dados.pdf';
            await page.locator('input').check();
            for (const contentType of ['application/pdf','application/json']) {
                await page.route(endpoint, route => route.fulfill({status:200,contentType,body:'not-a-pdf'}));
                await pdf.click();
                await message.filter({hasText:'PDF válido'}).waitFor();
                assert.equal(downloads.length,2);
                await page.unroute(endpoint);
            }
            const setToken = async token => page.evaluate(value => {
                localStorage.setItem('roarSession',JSON.stringify({role:'teacher',token:value,user:{id:5}}));
            },token);
            await setToken(ready.tokens.otherTeacher);
            await pdf.click();
            await message.filter({hasText:'Aluno indisponível para este professor'}).waitFor();
            await setToken(ready.tokens.student);
            await pdf.click();
            await message.filter({hasText:'professor da turma'}).waitFor();
            assert.equal(downloads.length,2);
            await setToken('invalid-test-token');
            const unauthorized = page.waitForResponse(response => response.url().endsWith('/relatorio-dados.pdf') && response.status() === 401);
            await pdf.click();
            await unauthorized;
            await page.waitForFunction(() => localStorage.getItem('roarSession') === null);
            assert.equal(downloads.length,2);
            await setToken(ready.tokens.teacher);

            await pdf.scrollIntoViewIfNeeded();
            const card = await page.locator('.student-data-management').boundingBox();
            for (const button of [json,pdf]) {
                const bounds = await button.boundingBox();
                assert.ok(bounds.x + bounds.width <= card.x + card.width + 1);
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
            await page.screenshot({path:path.join(os.tmpdir(),`roar-pdf-buttons-${width}.png`)});
            await control({reset:true,delay:.5});
            const previousExports = exports.length;
            const completed = page.waitForResponse(response => response.url().endsWith('/relatorio-dados.pdf') && response.request().method()==='POST');
            await pdf.click();
            assert.equal(await json.isDisabled(),true);
            await page.locator('form').evaluate(form => form.dispatchEvent(new SubmitEvent('submit',{
                bubbles:true,cancelable:true,submitter:form.querySelector('button[value="json"]'),
            })));
            await page.evaluate(() => { window.exporter.destroy(); document.querySelector('#exporter').replaceChildren(); });
            await (await completed).finished();
            await page.waitForTimeout(100);
            assert.equal(downloads.length,2,'Closing the profile discards a late PDF.');
            assert.equal((await control({})).requests,1,'Repeated clicks cannot generate another export.');
            assert.equal(exports.length,previousExports+1,'A PDF in progress also blocks a concurrent JSON export.');
            assert.deepEqual(errors,[]);
            console.log(`PASS ${width}px: real PDF API/JWT/download, required verification, ownership, retry, invalid PDF, keyboard, layout and late-response protection.`);
            await context.close();
        }
    } finally {
        await browser?.close();
        server.closeAllConnections();
        if (server.listening) await new Promise(resolve => server.close(resolve));
        api?.kill();
    }
})().catch(error => { console.error(error); process.exitCode=1; });
