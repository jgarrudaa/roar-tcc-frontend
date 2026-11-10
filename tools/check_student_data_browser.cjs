// Real page/component/API-client integration with fictitious records and API responses.
const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const root = path.resolve(__dirname, '..');

const students = [17, 18].map(id => ({id, name:`Aluno Teste ${id}`, initial:'A',
    schoolYear:'6º Ano', email:`aluno${id}@example.com`, level:{number:2},
    xp:0, completed:0, availableActivities:12, completionRate:0, lastAccess:null}));
const server = http.createServer(async (request, response) => {
    const file = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    try {
        const bytes = await fs.readFile(file);
        response.setHeader('Content-Type', {'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream');
        response.end(bytes);
    } catch { response.writeHead(404).end(); }
});

(async () => {
    let browser;
    try {
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const origin = `http://127.0.0.1:${server.address().port}`;
        browser = await chromium.launch({headless:true, ...(process.platform === 'win32' ? {channel:'msedge'} : {})});
        for (const width of [1280, 390]) {
            const context = await browser.newContext({viewport:{width,height:900}, acceptDownloads:true});
            const page = await context.newPage();
            const errors = [];
            const downloads = [];
            const requests = [];
            const diagnostics = [];
            let mode = 'success';
            let pending;
            page.on('pageerror', error => errors.push(error.message));
            page.on('download', download => downloads.push(download));
            await context.addInitScript(() => localStorage.setItem('roarSession', JSON.stringify({
                role:'teacher',token:'test-only-token',user:{id:5,name:'Professor Teste'},
            })));
            await context.route('**/*', async route => {
                const url = new URL(route.request().url());
                if (url.pathname === '/privacidade/atendimento') return route.fulfill({json:{disponivel:false,responsavel:null,contato:null}});
                if (url.pathname.endsWith('/solicitacoes-dados')) return route.fulfill({json:{solicitacoes:[],proximo_cursor:null}});
                if (/exportacao-dados$/.test(url.pathname)) {
                    if (route.request().method() === 'GET') {
                        diagnostics.push(route.request().headers());
                        if (mode === 'offline') return route.abort('failed');
                        return route.fulfill({status:mode === 'cors' ? 405 : 404,
                            contentType:'application/json',body:'{}'});
                    }
                    requests.push({body:route.request().postDataJSON(),auth:route.request().headers().authorization});
                    if (['unpublished-preflight','offline','cors'].includes(mode)) return route.abort('failed');
                    if (mode === 'missing-route') return route.fulfill({status:404,
                        contentType:'application/json',body:JSON.stringify({erro:'Recurso não encontrado.'})});
                    const id = Number(url.pathname.split('/').at(-2));
                    const body = JSON.stringify({versao:1,exportacao:{id:'test-export-id'},
                        cadastro:{id:mode === 'wrong-student' ? 999 : id,nome:`Aluno Teste ${id}`},historico_atividades:[]});
                    if (mode === 'pending') {
                        await new Promise(resolve => { pending = resolve; });
                    }
                    return route.fulfill({status:mode === 'failure' ? 503 : 200,contentType:'application/json',
                        body:mode === 'failure' ? JSON.stringify({erro:'Falha simulada. Tente novamente.'}) : body});
                }
                if (url.origin !== origin) return route.fulfill({body:'',contentType:'text/css'});
                if (/route-guard.js|roar-avatar.js|roar-page-transition.js/.test(url.pathname)) return route.fulfill({body:'',contentType:'text/javascript'});
                if (url.pathname.endsWith('/app-config.js')) return route.fulfill({contentType:'text/javascript',body:`export const APP_CONFIG={apiBaseUrl:'${origin}',requestTimeoutMs:8000};`});
                if (url.pathname.endsWith('/relatorios-service.js')) return route.fulfill({contentType:'text/javascript',body:`export const relatoriosService={getTeacherDashboard:async()=>({students:${JSON.stringify(students)}}),getStudentReport:async()=>({summary:{},history:[]}),getStudentWords:async()=>({words:[]})};`});
                if (url.pathname.endsWith('/aluno-service.js')) return route.fulfill({contentType:'text/javascript',body:`export const alunoService={listByTeacher:async()=>(${JSON.stringify(students)})};`});
                if (url.pathname.endsWith('/game-settings-service.js')) return route.fulfill({contentType:'text/javascript',body:`export const gameSettingsService={getForStudent:async()=>({}),saveForStudent:async()=>({})};`});
                if (url.pathname.endsWith('/alunos-api.js')) return route.fulfill({contentType:'text/javascript',body:`export const alunosApi={getCurrent:async()=>({id:17,pin:'0000'})};`});
                return route.continue();
            });
            await page.goto(origin+'/pages/professor/alunos.html');
            const firstStudent = page.getByRole('button',{name:'Ver detalhes de Aluno Teste 17',exact:true});
            await firstStudent.click();
            const form = page.locator('#studentDataManagement form');
            const submit = form.getByRole('button',{name:'Exportar cadastro e histórico'});
            await submit.click();
            assert.equal(requests.length, 0, 'Unverified requests never reach the API.');
            await form.locator('select').selectOption('responsavel');
            await form.locator('input').focus();
            await page.keyboard.press('Space');
            const downloadEvent = page.waitForEvent('download');
            await submit.focus();
            await page.keyboard.press('Enter');
            const download = await downloadEvent;
            assert.equal(download.suggestedFilename(), 'roar-aluno-17.json');
            const json = JSON.parse(await fs.readFile(await download.path(),'utf8'));
            assert.equal(json.cadastro.id, 17);
            assert.deepEqual(requests[0].body,{solicitante:'responsavel',verificacao_confirmada:true});
            assert.equal(requests[0].auth, 'Bearer test-only-token');
            assert.equal(await form.locator('input').isChecked(), false);
            assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => /export/i.test(key))),false);

            mode = 'failure';
            await form.locator('input').check();
            await submit.click();
            await form.getByRole('status').filter({hasText:'Falha simulada'}).waitFor();
            assert.equal(downloads.length, 1);
            assert.equal(await submit.isEnabled(), true);
            mode = 'wrong-student';
            await submit.click();
            await form.getByRole('status').filter({hasText:'dados inválidos'}).waitFor();
            assert.equal(downloads.length, 1, 'Wrong-student payload must never be downloaded.');

            mode = 'pending';
            await submit.click();
            await page.waitForFunction(() => document.querySelector('.student-data-management').getAttribute('aria-busy') === 'true');
            await form.evaluate(node => node.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
            assert.equal(requests.length, 4, 'Repeated submit while busy cannot create another request.');
            await page.locator('#modalAluno .modal-close').click();
            pending();
            await page.getByRole('button',{name:'Ver detalhes de Aluno Teste 18',exact:true}).click();
            assert.equal(await page.locator('#studentDataManagement select').inputValue(), '');
            assert.equal(await page.locator('#studentDataManagement input').isChecked(), false);
            await page.waitForTimeout(150);
            assert.equal(downloads.length, 1, 'Closing the student invalidates a late download.');
            mode = 'success';
            await page.locator('#studentDataManagement select').selectOption('titular');
            await page.locator('#studentDataManagement input').check();
            const second = page.waitForEvent('download');
            await page.locator('#studentDataManagement button[value="json"]').click();
            assert.equal((await second).suggestedFilename(), 'roar-aluno-18.json');
            const currentForm = page.locator('#studentDataManagement form');
            await currentForm.locator('input').check();
            for (const [failureMode, expected] of [
                ['missing-route','publicar a atualização da API'],
                ['unpublished-preflight','publicar a atualização da API'],
                ['cors','O servidor está online'],
                ['offline','Não foi possível conectar ao servidor'],
            ]) {
                mode = failureMode;
                const previousRequests = requests.length;
                await currentForm.getByRole('button',{name:'Exportar cadastro e histórico'}).click();
                await currentForm.getByRole('status').filter({hasText:expected}).waitFor();
                assert.equal(requests.length, previousRequests + 1, 'Diagnostics must not repeat the export POST.');
                assert.equal(downloads.length, 2, 'An unavailable export never downloads a file.');
                assert.equal(await currentForm.getByRole('button',{name:'Exportar cadastro e histórico'}).isEnabled(),true);
            }
            assert.equal(diagnostics.length,3);
            assert.ok(diagnostics.every(headers => !headers.authorization), 'Diagnostics never send the session token.');
            await page.locator('#studentDataManagement').scrollIntoViewIfNeeded();
            const sectionBounds = await page.locator('.student-data-management').boundingBox();
            const selectBounds = await page.locator('#studentDataManagement select').boundingBox();
            assert.ok(selectBounds.x + selectBounds.width <= sectionBounds.x + sectionBounds.width,
                'The requester selector must fit inside its card on mobile.');
            await page.screenshot({path:path.join(os.tmpdir(),`roar-data-management-${width}.png`)});
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);

            await page.goto(origin+'/pages/aluno/configuracoes.html');
            await page.getByRole('button',{name:'Gerenciar dados',exact:true}).click();
            await page.getByRole('dialog',{name:'Seus dados no ROAR'}).waitFor();
            assert.equal(await page.locator('#dataHelpDialog').getByText(/Para pedir uma cópia/).isVisible(),true);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#btnDados').evaluate(node => node === document.activeElement),true);
            assert.deepEqual(errors, []);
            console.log(`PASS ${width}px: verification, keyboard, download, retry, isolation, late response, unpublished API, CORS, offline and student help.`);
            await context.close();
        }
    } finally {
        await browser?.close();
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode=1; });
