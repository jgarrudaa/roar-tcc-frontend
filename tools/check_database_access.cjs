// Real PostgreSQL privileges/RLS, executed only in an in-memory PGlite instance.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..','back-tcc-version-2');
const directory = path.join(root,'supabase/migrations');
const migration = fs.readFileSync(path.join(directory,fs.readdirSync(directory).find(name=>name.endsWith('_restrict_direct_database_access.sql'))),'utf8');
const tables = ['professores','avaliacao_inicial','modulos','itens_modulo','personalizacao_aluno',
    'aluno_suporte_tea','recuperacoes_senha_professor','verificacoes_email_professor',
    'recompensas_missoes','backup_historico_desempenho_20260915'];

(async()=>{
    const db = new PGlite();
    try {
        await db.exec(fs.readFileSync(path.join(root,'tests/learning_fixture.sql'),'utf8'));
        await db.exec('alter role service_role bypassrls;');
        for (const name of tables) await db.exec(`create table public.${name}(id bigint generated always as identity primary key, secret text);`);
        await db.exec('create table public.professor_modulos(professor_id bigint,modulo_id bigint,ativo boolean default true);');
        await db.exec('alter table public.professor_modulos enable row level security; create policy "Mudar o valor" on public.professor_modulos for all to public using(true) with check(true);');
        await db.exec(fs.readFileSync(path.join(root,'migrations/20261104_learning_reliability.sql'),'utf8'));
        await db.exec("create function public.rls_auto_enable() returns event_trigger language plpgsql security definer as $$ begin return; end $$;");
        await db.exec('grant all on all tables in schema public to anon,authenticated,service_role; grant all on all sequences in schema public to anon,authenticated,service_role;');
        await db.exec('alter default privileges in schema public grant all on tables to anon,authenticated; alter default privileges in schema public grant execute on functions to anon,authenticated;');
        const owner = (await db.query('select current_user as name')).rows[0].name;
        // PGlite's bootstrap owner is postgres, matching the hosted application.
        assert.equal(owner,'postgres');
        assert.equal((await db.query("select has_table_privilege('anon','public.alunos','SELECT') as allowed")).rows[0].allowed,true);
        await db.exec(migration);
        await db.exec(migration); // Safe to reapply without restoring broad policies.
        const states = (await db.query(`select c.relname,c.relrowsecurity,
            has_table_privilege('anon',c.oid,'SELECT') as anon_read,
            has_table_privilege('authenticated',c.oid,'UPDATE') as user_write
            from pg_class c join pg_namespace n on n.oid=c.relnamespace
            where n.nspname='public' and c.relkind='r'`)).rows;
        assert.equal(states.length,20);
        assert.ok(states.every(row=>row.relrowsecurity && !row.anon_read && !row.user_write));
        async function denied(role, sql) {
            await db.exec(`set role ${role};`);
            try { await assert.rejects(db.query(sql), error=>error.code==='42501'); }
            finally { await db.exec('reset role;'); }
        }
        for (const role of ['anon','authenticated']) {
            await denied(role,'create table public.unauthorized_table(id bigint)');
            for (const table of ['alunos','professores','historico_desempenho','recuperacoes_senha_professor','backup_historico_desempenho_20260915']) {
                await denied(role,`select * from public.${table}`);
            }
            await denied(role,'update public.alunos set xp_total=999 where id=18');
            await denied(role,'delete from public.alunos where id=18');
            await denied(role,"select public.roar_student_word_report(17)");
            await denied(role,"select public.roar_shop_transaction(18,'consultar',null)");
            await denied(role,"select public.rls_auto_enable()");
        }
        await db.exec('set role service_role;');
        assert.equal((await db.query('select count(*)::int as total from alunos')).rows[0].total,2);
        const saved = (await db.query("select public.roar_register_progress(17,1,0,10,true,'00000000-0000-4000-8000-000000000001','[]') as result")).rows[0].result;
        assert.equal(saved.data.aluno_id,17);
        assert.equal(saved.data.xp_ganho,50);
        assert.equal((await db.query("select public.roar_shop_transaction(17,'comprar',2) as result")).rows[0].result.status,200);
        assert.equal((await db.query('select xp_total from alunos where id=17')).rows[0].xp_total,450);
        assert.equal((await db.query('select xp_total from alunos where id=18')).rows[0].xp_total,0);
        assert.equal((await db.query("select public.roar_save_game_preferences(18,5,'{\"pieceCount\":2}') as result")).rows[0].result.status,403);
        await db.exec('reset role;');
        await db.exec('create table public.future_private_test(id bigint generated always as identity,secret text); create function public.future_private_fn() returns int language sql as $$ select 1 $$;');
        for (const role of ['anon','authenticated']) {
            await denied(role,'select * from public.future_private_test');
            await denied(role,'select public.future_private_fn()');
            await denied(role,"select nextval('public.future_private_test_id_seq')");
        }
        assert.equal((await db.query("select count(*)::int as total from pg_policies where schemaname='public' and policyname='Mudar o valor'")).rows[0].total,0);
        console.log('PASS: 20 tables protected, clients denied table writes/reads/RPCs, future grants closed, server progress/shop preserved and migration idempotent.');
    } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
