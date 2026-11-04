// Real activity page/controller with deterministic local failures. No accounts,
// credentials or production requests are used.
const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const saves = [];
const item = { id: 1, itemId: 1, en: 'COW', pt: 'vaca',
    realImage: '/public/assets/imagens/modulos/fazenda/cow.png',
    vectorImage: '/public/assets/imagens/modulos/fazenda/cow.png' };
const fixture = { student: { id: 999, supportLevel: 1 },
    module: { id: 9, title: 'Animais', items: [item],
        activities: [1, 2, 3].map(order => ({ activityId: order * 11, order })) } };
const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/test-save') {
        let body = '';
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {
            saves.push(JSON.parse(body));
            response.setHeader('Content-Type', 'application/json');
            response.end('{}');
        });
        return;
    }
    const file = path.resolve(root, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
        if (error) { response.writeHead(404).end(); return; }
        response.setHeader('Content-Type', { '.js': 'text/javascript', '.html': 'text/html',
            '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream');
        response.end(data);
    });
});

(async () => {
    let browser;
    try {
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const origin = `http://127.0.0.1:${server.address().port}`;
        browser = await chromium.launch({ headless: true,
            ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
        async function setup(scenario, viewport = { width: 1280, height: 800 }) {
            const context = await browser.newContext({ viewport });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await context.route('**/*', async route => {
                const url = new URL(route.request().url());
                if (url.origin !== origin) return route.fulfill({ body: '', contentType: 'text/css' });
                if (/route-guard.js|roar-avatar.js|roar-page-transition.js/.test(url.pathname)) {
                    return route.fulfill({ body: '', contentType: 'text/javascript' });
                }
                if (url.pathname.endsWith('/atividade-service.js')) {
                    return route.fulfill({ contentType: 'text/javascript', body: `
                        let loads=0, stageTwoAttempts=0;
                        const context=${JSON.stringify(fixture)};
                        const scenario=${JSON.stringify(scenario)};
                        export const atividadeService={
                            async loadModuleContext(){
                                loads++;
                                if(scenario==='late'){
                                    await new Promise(resolve=>setTimeout(resolve,1000));
                                }
                                if((scenario==='initial'||scenario==='back'||scenario==='unavailable')&&loads===1){
                                    const error=new Error('Configure SUPABASE_SECRET_KEY and apply internal SQL');
                                    error.code=scenario==='unavailable'?'LEARNING_STORAGE_UNAVAILABLE':'NETWORK_ERROR';
                                    error.status=scenario==='unavailable'?503:0;
                                    throw error;
                                }
                                return context;
                            },
                            getActivityContext(current,stage){
                                if(scenario==='next'&&stage===2&&stageTwoAttempts++===0){
                                    const error=new Error('temporary failure'); error.code='NETWORK_ERROR';throw error;
                                }
                                return {...current,activity:{id:stage*11,type:'recognize',status:'active',item:${JSON.stringify(item)}}};
                            },
                            async complete(id,stats){
                                const response=await fetch('/test-save',{method:'POST',body:JSON.stringify({id,stats})});
                                return response.json();
                            }
                        };` });
                }
                if (url.pathname.endsWith('/atividades.html')) {
                    return route.fulfill({ contentType: 'text/html', body: '<meta charset="utf-8"><h1>Módulos disponíveis</h1>' });
                }
                return route.continue();
            });
            await page.addInitScript(() => localStorage.setItem('roarPreferences:anonymous',
                JSON.stringify({ soundsEnabled: false, autoAdvancePaused: true })));
            if (scenario === 'late') await page.clock.install();
            await page.goto(origin + '/pages/aluno/atividade.html?modulo=9&etapa=1');
            return { context, page, errors };
        }

        for (const scenario of ['initial', 'unavailable']) {
            const { context, page, errors } = await setup(scenario, { width: 390, height: 844 });
            await page.getByRole('heading', { name: 'Atividade indisponível', exact: true }).waitFor();
            assert.equal(await page.locator('#repeat-instruction').isDisabled(), true);
            assert.equal(await page.locator('#next-button').isDisabled(), true);
            assert.equal(await page.locator('.activity-back').getAttribute('href'), 'atividades.html');
            assert.equal((await page.locator('body').innerText()).includes('SUPABASE_SECRET_KEY'), false);
            assert.equal((await page.locator('body').innerText()).includes('Verifique sua conexão'), false);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
            await page.locator('.recognize-card').waitFor();
            assert.equal(await page.locator('#activity-title').innerText(), 'Animais');
            assert.equal(await page.locator('#repeat-instruction').isEnabled(), true);
            assert.deepEqual(errors, []);
            await context.close();
            console.log(`PASS activity error ${scenario}: clear title, safe message, controls and retry.`);
        }
        {
            const { context, page } = await setup('back');
            await page.getByRole('heading', { name: 'Atividade indisponível', exact: true }).waitFor();
            await page.locator('.activity-back').click();
            await page.getByRole('heading', { name: 'Módulos disponíveis', exact: true }).waitFor({timeout:5000}).catch(async error=>{console.error('BACK URL',page.url(),await page.locator('body').innerText());throw error;});
            await context.close();
            console.log('PASS activity error: back arrow remains usable without a controller.');
        }
        {
            const { context, page, errors } = await setup('next');
            const initialSaves = saves.length;
            await page.locator('.recognize-card').click();
            await page.locator('#next-button').click();
            await page.getByRole('heading', { name: 'Atividade indisponível', exact: true }).waitFor();
            assert.equal(saves.length, initialSaves + 1);
            await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
            await page.locator('.recognize-card').waitFor();
            assert.equal(new URL(page.url()).searchParams.get('etapa'), '2');
            assert.equal(saves.length, initialSaves + 1, 'Retry opens the failed next stage without resending completed progress.');
            assert.equal(await page.locator('#next-button').isDisabled(), true);
            assert.deepEqual(errors, []);
            await context.close();
            console.log('PASS activity error: next-stage failure recovers without duplicate saving.');
        }
        {
            const { context, page, errors } = await setup('late');
            await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
            await page.clock.runFor(1500);
            assert.equal(await page.locator('.recognize-card').count(), 0);
            assert.equal(await page.locator('.activity-error-recovery').count(), 0);
            assert.deepEqual(errors, []);
            await context.close();
            console.log('PASS activity error: late module response cannot render after pagehide.');
        }
    } finally {
        await browser?.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
