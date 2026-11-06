# Retomada, ajustes dos jogos e aprendizagem por palavra

## O que mudou

- O catálogo oferece **Continuar de onde parei** quando existe uma rodada salva para aquele aluno e módulo neste navegador.
- Memória preserva a ordem das cartas, os pares encontrados e a carta aberta. Sombras preserva as peças encaixadas. Categorias, cena e Monte o corpo preservam a rodada. Jogos de resposta simples preservam a etapa e uma resposta já concluída; rascunhos de texto ainda não enviados não são recuperados.
- O registro local é separado por aluno e módulo, expira em 14 dias e é descartado se o conteúdo, o perfil ou os ajustes mudarem. Não há sincronização entre dispositivos. Um navegador que bloqueia armazenamento continua permitindo jogar, mas não garante retomada.
- Em **Professor → Alunos → abrir aluno → Ajustes dos jogos**, o professor responsável escolhe peças, disponibilidade de dicas, duração da prévia da memória e intervalo para avançar. Isso não altera a triagem nem o nível TEA. “Conforme o perfil” mantém a regra anterior de peças. Os ajustes passam a valer ao abrir novamente o módulo.
- O aluno ainda pode desligar o avanço automático nas suas configurações.
- O relatório e o modal do aluno mostram **Aprendizagem por palavra**, com acertos, erros, dicas, sessões e última prática. São registros enviados pelas novas atividades concluídas, sem converter o histórico antigo em acertos ou dicas presumidos.
- Uma conclusão reutiliza o mesmo identificador de tentativa até o servidor confirmar o salvamento. Uma repetição de rede não duplica XP nem evidências. Revisar uma atividade já concluída registra novas evidências sem conceder XP novamente.

## Banco e publicação

O backend está em um repositório independente na pasta `back-tcc-version-2`. Aplique a migração **migrations/20261104_learning_reliability.sql**, usando o procedimento administrativo do projeto, antes de publicar o backend e este frontend. O servidor precisa do cliente administrativo configurado. As tabelas e funções novas não são acessíveis por contas de navegador.

A migração foi aplicada ao projeto Roar db em 04/11/2026, após os testes locais e a conferência da estrutura. A cópia roar-vercel permanece para uma etapa futura de hospedagem; as atualizações deste ciclo usam os repositórios principais. Leia **back-tcc-version-2/docs/LEARNING_IMPROVEMENTS.md** para os contratos e a sequência de instalação. Sem a versão nova da API, o carregamento dos ajustes e das atividades apresentará erro; não publique o frontend isoladamente.

## Verificar localmente

```text
npm ci
npm test
python tools/check_frontend.py
npx playwright install chromium
npm run test:browser
```

No Windows, os testes de navegador usam o Edge instalado. No Linux da integração contínua usam o Chromium do Playwright. Os serviços e salvamentos dos testes de interface são simulados e não usam contas de alunos.

O workflow **.github/workflows/tests.yml** verifica o frontend em push e pull request. O workflow do backend verifica autenticação e autorização, além de criar PostgreSQL 16 descartável para migração, rollback e operações concorrentes. Os testes de concorrência ficam ignorados localmente quando não há banco descartável configurado. Nenhum workflow precisa de credenciais do banco de produção.

## Recuperação de falhas

A página de atividade mostra **Atividade indisponível**, **Tentar novamente** e **Voltar aos módulos** quando o serviço não responde. A seta de voltar funciona mesmo sem controlador carregado. Falhar ao abrir a próxima etapa não repete o salvamento da etapa anterior. As mensagens de indisponibilidade não atribuem automaticamente a falha à conexão do aluno.

O antigo aviso para a cópia roar-vercel ficou disponível somente por execução manual; um push não cria notificações nessa cópia enquanto a hospedagem está adiada.
