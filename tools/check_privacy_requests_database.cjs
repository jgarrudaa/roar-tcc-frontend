// Exercise the actual migration and trigger on disposable PostgreSQL, never production.
const { PGlite } = require('@electric-sql/pglite');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.resolve(__dirname, '../back-tcc-version-2/supabase/migrations');
const sql = fs.readFileSync(path.join(directory, fs.readdirSync(directory).find(name => name.endsWith('_privacy_request_workflow.sql'))), 'utf8');
const id = '00000000-0000-4000-8000-000000000001';

(async () => {
    const db = new PGlite();
    try {
        await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
            create table public.professores(id integer primary key, nome text not null);
            create table public.alunos(id integer primary key, professor_id integer references public.professores);
            insert into public.professores values(5,'Docente A'),(6,'Docente B');
            insert into public.alunos values(17,5),(18,6);
            grant select,update on public.alunos to service_role;
            grant select on public.professores to service_role;`);
        await db.exec(sql);
        for (const role of ['anon', 'authenticated']) {
            await db.exec(`set role ${role};`);
            for (const table of ['solicitacoes_dados', 'solicitacoes_dados_eventos']) {
                await assert.rejects(db.query(`select * from public.${table}`), error => error.code === '42501');
            }
            await assert.rejects(db.query('select roar_private.audit_privacy_request()'), error => error.code === '42501');
            await db.exec('reset role;');
        }
        await db.exec('set role service_role;');
        const insert = `insert into public.solicitacoes_dados(id,aluno_id,professor_abertura_id,atendido_por_id,tipo,descricao,solicitante,verificacao_confirmada)
            values('${id}',17,5,5,'correcao','Corrigir o ano escolar.','responsavel',true)`;
        await db.exec(insert);
        await db.exec(insert + ' on conflict(id) do nothing');
        assert.equal((await db.query('select count(*)::int n from public.solicitacoes_dados')).rows[0].n, 1);
        assert.equal((await db.query('select count(*)::int n from public.solicitacoes_dados_eventos')).rows[0].n, 1);
        await assert.rejects(db.exec(`update public.solicitacoes_dados set descricao='Descrição adulterada.',versao=2,status='em_analise' where id='${id}'`), error => error.code === '23514');
        await assert.rejects(db.exec(`update public.solicitacoes_dados set atendido_por_id=6,versao=2,status='em_analise' where id='${id}'`), error => error.code === '42501');
        assert.equal((await db.query('select count(*)::int n from public.solicitacoes_dados_eventos')).rows[0].n, 1);
        await db.exec(`update public.solicitacoes_dados set status='em_analise',versao=2 where id='${id}' and versao=1`);
        // A stale writer changes no rows and cannot create a second event.
        const stale = await db.query(`update public.solicitacoes_dados set status='respondida',resposta='Resposta para o aluno.',versao=2 where id='${id}' and versao=1 returning id`);
        assert.equal(stale.rows.length, 0);
        await db.exec(`update public.solicitacoes_dados set status='respondida',resposta='Ano escolar corrigido e conferido.',versao=3 where id='${id}' and versao=2`);
        const events = (await db.query('select versao,status,nome_professor from public.solicitacoes_dados_eventos order by id')).rows;
        assert.deepEqual(events.map(row => row.status), ['recebida', 'em_analise', 'respondida']);
        assert.ok(events.every(row => row.nome_professor === 'Docente A'));
        await assert.rejects(db.exec(`update public.solicitacoes_dados set status='em_analise',versao=4 where id='${id}'`), error => error.code === '23514');
        await assert.rejects(db.exec('update public.solicitacoes_dados_eventos set resposta=\'adulterada\''), error => error.code === '42501');
        await assert.rejects(db.exec('delete from public.solicitacoes_dados_eventos'), error => error.code === '42501');
        await assert.rejects(db.exec('delete from public.solicitacoes_dados'), error => error.code === '42501');
        assert.equal((await db.query('select count(*)::int n from public.solicitacoes_dados')).rows[0].n, 1);
        await db.exec(insert.replaceAll(id, '00000000-0000-4000-8000-000000000002'));
        await db.exec('reset role;');
        // Reassignment preserves the audit and accepts only the current teacher.
        await db.exec("update public.alunos set professor_id=6 where id=17;");
        await db.exec('set role service_role;');
        const transferred = '00000000-0000-4000-8000-000000000002';
        await assert.rejects(db.exec(`update public.solicitacoes_dados set status='em_analise',versao=2 where id='${transferred}'`), error => error.code === '42501');
        await db.exec(`update public.solicitacoes_dados set status='respondida',resposta='Decisão registrada pela nova turma.',atendido_por_id=6,versao=2 where id='${transferred}'`);
        assert.deepEqual((await db.query(`select nome_professor from public.solicitacoes_dados_eventos where solicitacao_id='${transferred}' order by id`)).rows.map(row => row.nome_professor), ['Docente A', 'Docente B']);
        console.log('PASS: privacy requests are private, idempotent, versioned and atomically audited; invalid transitions, other teachers and audit edits/deletes denied.');
    } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
