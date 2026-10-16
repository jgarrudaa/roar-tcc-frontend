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
- O seletor oferece 2, 4 ou 6 peças. Mudar a quantidade reinicia o animal atual.
- Ao terminar os seis animais, a revisão permite ouvir as palavras novamente ou reiniciar o jogo.

As imagens de vaca, cavalo, porco, ovelha, pato e galinha são os arquivos já presentes em `public/assets/imagens/modulos/fazenda/`, servidos pelo próprio projeto.

## Prática e integração

A página de prática não exige autenticação nem consulta a API. O progresso fica na memória da partida e não é enviado ao XP ou aos relatórios. A preferência de som usa o armazenamento de preferências já existente na plataforma.

O motor reutilizável é `createShadowActivity` em `public/js/features/atividades/sombra.js`. Ele segue o contrato dos outros jogos (`start`, `repeatInstruction`, `next`) e oferece `destroy` para cancelar carregamento e listeners. A geometria fica em `sombra-puzzle.js`.

O controlador de atividades já reconhece `shadow`. O serviço traduz os tipos `Sombra`, `Shadow`, `Quebra-cabeca` e `Quebra-cabeça`. Os tipos de associação existentes mantêm seu comportamento.

Para colocar o jogo em sequências oficiais, ainda é necessário permitir o tipo **Sombra** na lista `TIPOS_INTERACAO` do backend e cadastrar as atividades e variações correspondentes com vocabulário e imagens válidos. O banco não foi alterado. Nesse fluxo, o controlador existente registra a conclusão de um animal como um acerto, independentemente da quantidade de peças.

## Verificação

```powershell
python tools/check_frontend.py
node tools/check_activity_learning_modes.cjs
node tools/check_shadow_game.cjs
```

Os testes geométricos verificam se as peças cobrem a imagem inteira sem lacunas ou sobreposição. Os testes no navegador incluem arraste correto e incorreto, encaixe pelo teclado, dica, troca de quantidade de peças, seis animais, revisão, reinício e largura móvel de 320 px.
