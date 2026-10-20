# Jogo das sombras

Abra `pages/aluno/sombra.html` em um servidor HTTP. O catálogo de atividades também tem o botão **Jogar agora**.

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Acesse http://127.0.0.1:8765/pages/aluno/sombra.html.

## Como jogar

- Arraste uma peça até a parte correspondente da sombra.
- Também é possível tocar na peça e depois no encaixe. Pelo teclado, use Tab e Enter ou Espaço; Escape cancela a seleção.
- **Ouvir palavra** pronuncia o nome do animal em inglês. O som pode ser desligado.
- Selecione uma peça e use **Mostrar dica** para destacar seu destino.
- O botão de próximo animal só libera depois de encaixar todas as peças. Não há limite de tempo ou de tentativas.
- Com suporte TEA informado no perfil, a quantidade é automática: nível 1 = 6 peças, nível 2 = 4 peças e nível 3 = 2 peças. Ela permanece a mesma nos seis animais e no reinício.
- Sem suporte TEA informado, o jogo começa com 2 peças e permite selecionar 2, 4 ou 6. Mudar a quantidade reinicia o animal atual.
- Ao terminar os seis animais, a revisão permite ouvir as palavras novamente ou reiniciar o jogo.

As imagens de vaca, cavalo, porco, ovelha, pato e galinha são os arquivos já presentes em `public/assets/imagens/modulos/fazenda/`, servidos pelo próprio projeto.

## Prática e integração

A página de prática pode ser aberta sem autenticação. Para alunos autenticados, consulta `/alunos/me` antes de iniciar para usar `teaSupportLevel` do perfil. Se o perfil não carregar, oferece nova tentativa. O progresso fica na memória da partida e não é enviado ao XP ou aos relatórios. A preferência de som usa o armazenamento de preferências já existente na plataforma.

## Suporte TEA separado do modo de aprendizagem

O professor informa o campo opcional **Nível de suporte TEA** no cadastro ou em **Alunos → editar aluno**. Ele não é calculado pela triagem de comunicação/leitura. O campo `nivel_suporte_tea` do banco/API aceita somente `null`, `1`, `2` ou `3`; o perfil autenticado expõe `teaSupportLevel`.

A persistência usa a tabela protegida `public.aluno_suporte_tea`, vinculada por `aluno_id`. Ela tem RLS ativo e não concede acesso a `anon`/`authenticated`: o backend usa seu cliente administrativo, após autorizar o aluno ou professor. A chave administrativa permanece exclusivamente no servidor. A coluna provisória `alunos.nivel_suporte_tea` não é usada; não grave valores nela.

| Nível de suporte TEA | Peças do quebra-cabeça |
| --- | --- |
| 1 | 6 |
| 2 | 4 |
| 3 | 2 |
| Não informado | 2 inicialmente, com ajuste manual na prática |

Os modos existentes (Suporte Visual Puro, Aprendiz Guiado e Autonomia Contextual) continuam independentes e não são usados para deduzir o nível TEA. No motor `shadow`, um nível TEA válido tem prioridade sobre `pieceCount`. O jogo de encaixar a figura inteira (`shadowPuzzle` / `DragAndDrop`) continua com sua regra de alternativas; esta adaptação é do quebra-cabeça de partes (`shadow`).

## Publicação

O backend está em `back-tcc-version-2`, um repositório Git separado referenciado pelo frontend. Publique os dois projetos para ativar o fluxo completo. Antes de publicar o backend, confirme a tabela protegida e a variável de servidor `SUPABASE_SECRET_KEY` (cliente `supabase_admin`). A nova versão do frontend consulta o perfil autenticado; não usa o nível TEA de uma sessão antiga em cache.

O banco do projeto já recebeu `20261016185809_create_protected_student_tea_support`. Foram conferidos a restrição de valores, a chave estrangeira e o bloqueio de leitura para os papéis de navegador. A migração anterior `20261016185538_add_student_tea_support_level` deixou uma coluna opcional em `alunos`; ela permanece sem uso. O backend deve sempre consultar a tabela protegida.

Não há preenchimento automático para alunos já cadastrados. O professor pode informar ou remover o nível pela edição do aluno.

O motor reutilizável é `createShadowActivity` em `public/js/features/atividades/sombra.js`. Ele segue o contrato dos outros jogos (`start`, `repeatInstruction`, `next`) e oferece `destroy` para cancelar carregamento e listeners. A geometria fica em `sombra-puzzle.js`.

O controlador de atividades já reconhece `shadow`. O serviço traduz os tipos `Sombra`, `Shadow`, `Quebra-cabeca` e `Quebra-cabeça`. O tipo `DragAndDrop` mantém o motor `shadowPuzzle`, como já ocorre nesta versão do projeto.

Para colocar o jogo em sequências oficiais, ainda é necessário permitir o tipo **Sombra** na lista `TIPOS_INTERACAO` do backend e cadastrar as atividades e variações correspondentes com vocabulário e imagens válidos. Nesse fluxo, o controlador existente registra a conclusão de um animal como um acerto, independentemente da quantidade de peças.

## Verificação

```powershell
python tools/check_frontend.py
node tools/check_activity_learning_modes.cjs
node tools/check_shadow_game.cjs
node tools/check_shadow_page.cjs
node tools/check_student_tea_support.cjs
python -m unittest discover -s back-tcc-version-2/tests -p test_tea_support_level.py
```

Os testes geométricos verificam se as peças cobrem a imagem inteira sem lacunas ou sobreposição. As verificações da página simulam DOM e API para conferir níveis, bloqueio de ajuste manual, seis animais, revisão, reinício e falha/repetição do carregamento do perfil. Os testes do backend usam banco simulado. A verificação visual no navegador continua necessária para arraste, teclado, dica e largura móvel de 320 px.
