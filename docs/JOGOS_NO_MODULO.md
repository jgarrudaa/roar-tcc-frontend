# Jogos dentro dos módulos

Na última atividade de cada módulo, o controlador acrescenta duas práticas antes de enviar a conclusão. A etapa original e as práticas usam o mesmo identificador da atividade e geram um único salvamento. Não há novas páginas de jogos nem alterações no cadastro dos alunos ou no banco.

## Separe por categorias

São usados somente cartões com imagem e palavra já presentes no módulo. O catálogo explícito em `module-practice.js` permite:

- Aves e mamíferos.
- Membros (braços e pernas, incluindo mãos e pés) e cabeça/tronco.
- Frutas e verduras/legumes, sem itens de classificação ambígua como tomate.

A rodada só aparece quando o módulo contém pelo menos um cartão em cada grupo. Usa até dois cartões distintos por grupo. Palavras desconhecidas não são classificadas por suposição. Cada cartão oferece duas alternativas, iguais para todos os modos e níveis TEA. Um acerto avança automaticamente após um segundo; um erro permite tentar novamente.

As alternativas apresentam o nome em inglês com pictogramas. As traduções ficam recolhidas em “Ajuda”, com um botão para ouvir a categoria em inglês. No corpo humano, os pictogramas destacam cabeça/tronco ou membros; no cartão central, um guia corporal destaca a parte estudada. A ilustração vetorial ARM também recebe um contorno no braço, sem alterar a imagem original.

## Monte o corpo

No módulo com vocabulário corporal, “Monte o corpo” substitui a prática da caixa e da mesa. São usadas as palavras cadastradas com imagem: HEAD, ARM, HAND, BELLY, LEG e FOOT. Cada rodada monta a imagem original de uma parte do corpo, usando o mesmo motor, os mesmos recortes com abas e o mesmo encaixe do Jogo das Sombras. A fonte é `vectorImage`, com `realImage` como alternativa, recebida no contexto do módulo; não há desenho corporal substituto nem imagem criada para esta atividade.

A quantidade de peças segue o perfil já aprovado: suporte TEA 1 → 6, 2 → 4, 3 → 2; sem TEA informado, aprendizagem 1 → 2, 2 → 4, 3 → 6. “Ouvir palavra” usa o serviço de áudio com as preferências do aluno. “Mostrar dica” destaca o encaixe da peça selecionada. Arrasto, toque e teclado compartilham a validação. “Como jogar” explica a montagem. O avanço de um segundo só começa quando todas as peças da imagem foram encaixadas, respeitando a preferência de avanço automático. A conclusão usa o mesmo salvamento único da etapa do módulo; falhas de carregamento da imagem oferecem nova tentativa.

## Complete a cena (outros módulos)

Usa um cartão do módulo em duas instruções: “Put the … card in the box” e “Put the … card on the table”. O aluno arrasta o cartão até a caixa ou a mesa e vê a imagem encaixada no destino correto. As traduções ficam em “Ajuda”; o botão de áudio repete a instrução. São cartões de vocabulário, inclusive para palavras como ARM e BLUE, e não objetos colocados literalmente na cena.

A orientação é “Arraste o cartão”, seguida do destino. O cartão acompanha o mouse, a caneta ou o toque; bordas tracejadas indicam os destinos e o destino sob o cartão recebe destaque. Soltar fora ou cancelar devolve o cartão sem contar erro; soltar no destino errado permite tentar novamente. Como alternativa, é possível selecionar o cartão por toque, Enter ou Espaço e depois escolher o destino. Escape cancela a seleção ou o arrasto. Sair da atividade remove o cartão flutuante e seus eventos. O cartão LEG usa `leg-complete.svg`, uma ilustração vetorial com pernas e pés completos, margem nas bordas e contorno na perna estudada; a imagem também acompanha o cartão ao ser colocado na caixa ou mesa.

## Ritmo, acessibilidade e progresso

- Complete a cena oferece arrasto por mouse/toque e alternativa de seleção por botões nativos. As categorias continuam por toque, clique, Enter ou Espaço.
- A preferência de som/volume/velocidade é atendida pelo serviço comum de áudio.
- Configurações → Acessibilidade → Avanço automático controla a troca após um segundo. A preferência é guardada por aluno no navegador. Esse controle não aparece na tela de atividades.
- Não há botão “Próximo cartão”. O controlador comum avança entre cartões e entre jogos; com avanço automático desligado, o botão principal “Próximo” permite continuar após cada acerto.
- O serviço de voz escolhe uma voz do idioma solicitado, quando disponível, e respeita a velocidade e o volume salvos. A qualidade e as vozes disponíveis dependem do navegador/sistema.
- Sons, eventos e temporizadores são encerrados ao sair ou trocar de jogo.
- O progresso da última etapa só é salvo depois das práticas. Uma falha de salvamento permite nova tentativa pelo Próximo. Sair antes desse salvamento exige refazer a última etapa; não foi criado salvamento de rodadas parciais.
- Sombras mantém a adaptação de peças já aprovada; não há nova dificuldade vinculada ao TEA nestes jogos.

## Verificação

`node tools/check_activity_flow.cjs` verifica pausa/retomada, integração das práticas no final do módulo, conclusão única, falha/repetição e cancelamento ao sair.

`node tools/check_module_practice_browser.cjs <caminho-do-pacote-playwright>` usa Edge em modo headless e servidor local temporário. Abre a página real de atividade com serviço de contexto/conclusão simulado, usa as imagens e motores reais e testa arrasto por mouse/toque, cancelamento, erro/acerto, teclado, foco, avanço em um segundo e conclusão única em 320, 390 e 1280 pixels. O servidor e navegador são fechados ao terminar. Não usa credenciais nem acessa o banco real.
