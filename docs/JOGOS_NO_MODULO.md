# Jogos dentro dos módulos

Na última atividade de cada módulo, o controlador acrescenta o quebra-cabeça e, quando houver vocabulário compatível, a prática de categorias antes de enviar a conclusão. A etapa original e as práticas usam o mesmo identificador da atividade e geram um único salvamento. Não há novas páginas de jogos nem alterações no cadastro dos alunos ou no banco.

## Separe por categorias

São usados somente cartões com imagem e palavra já presentes no módulo. O catálogo explícito em `module-practice.js` permite:

- Aves e mamíferos.
- Membros (braços e pernas, incluindo mãos e pés) e cabeça/tronco.
- Frutas e verduras/legumes, sem itens de classificação ambígua como tomate.

A rodada só aparece quando o módulo contém pelo menos um cartão em cada grupo. Usa até dois cartões distintos por grupo. Palavras desconhecidas não são classificadas por suposição. Cada cartão oferece duas alternativas, iguais para todos os modos e níveis TEA. Um acerto avança automaticamente no intervalo configurado pelo professor (padrão: um segundo); um erro permite tentar novamente.

As alternativas apresentam o nome em inglês com pictogramas. As traduções ficam recolhidas em “Ajuda”, com um botão para ouvir a categoria em inglês. No corpo humano, os pictogramas destacam cabeça/tronco ou membros; no cartão central, um guia corporal destaca a parte estudada. A ilustração vetorial ARM também recebe um contorno no braço, sem alterar a imagem original.

## Mesmo quebra-cabeça para todos os temas

Todos os módulos usam o mesmo motor, recortes com abas, encaixes, controles e sequência de rodadas. Cada rodada monta uma imagem cadastrada no próprio módulo. São usadas todas as palavras distintas com imagem válida, preservando a ordem do vocabulário.

- Corpo Humano: **Monte o corpo**, com as partes do corpo.
- Animais/Fazenda: **Monte os animais**, com os animais do módulo.
- Demais temas: **Monte as imagens**, com o vocabulário correspondente.

“Complete a cena”, com caixa e mesa, foi retirado da sequência. O tema altera o título, as imagens e as palavras; a forma de jogar permanece a mesma.

A fonte é `vectorImage`, com `realImage` como alternativa. A quantidade de peças segue o ajuste individual do professor; em “Conforme o perfil”, mantém suporte TEA 1 → 6, 2 → 4, 3 → 2 peças e, sem TEA informado, aprendizagem 1 → 2, 2 → 4, 3 → 6. “Ouvir palavra” usa as preferências de áudio. “Mostrar dica” destaca o encaixe selecionado, quando as dicas estão disponíveis. Arrasto, toque e teclado compartilham a validação. “Como jogar” explica a montagem.

O avanço só começa após todas as peças da imagem estarem encaixadas, respeitando o tempo configurado e a preferência de avanço automático. A conclusão usa o mesmo salvamento único da etapa do módulo. Falhas de imagem oferecem nova tentativa.

## Ritmo, acessibilidade e progresso

- O quebra-cabeça oferece arrasto por mouse/toque e alternativa de seleção por botões nativos. As categorias continuam por toque, clique, Enter ou Espaço.
- A preferência de som/volume/velocidade é atendida pelo serviço comum de áudio.
- Configurações → Acessibilidade → Avanço automático controla a troca, respeitando o intervalo configurado pelo professor. A preferência é guardada por aluno no navegador. Esse controle não aparece na tela de atividades.
- Não há botão “Próximo cartão”. O controlador comum avança entre cartões e entre jogos; com avanço automático desligado, o botão principal “Próximo” permite continuar após cada acerto.
- O serviço de voz escolhe uma voz do idioma solicitado, quando disponível, e respeita a velocidade e o volume salvos. A qualidade e as vozes disponíveis dependem do navegador/sistema.
- Sons, eventos e temporizadores são encerrados ao sair ou trocar de jogo.
- O progresso da última etapa é enviado depois das práticas. Uma falha de salvamento permite nova tentativa pelo Próximo. A retomada local preserva a rodada e as peças por aluno e módulo neste navegador. Rascunhos da antiga sequência com caixa/mesa são invalidados ao mudar o padrão, evitando pular o novo quebra-cabeça.
- Sombras mantém a adaptação de peças já aprovada; não há nova dificuldade vinculada ao TEA nestes jogos.

## Verificação

`node tools/check_activity_flow.cjs` verifica pausa/retomada, integração das práticas no final do módulo, conclusão única, falha/repetição e cancelamento ao sair.

`node tools/check_module_practice_browser.cjs <caminho-do-pacote-playwright>` usa Edge em modo headless e servidor local temporário. Abre a página real de atividade com serviço de contexto/conclusão simulado, usa as imagens e motores reais e testa arrasto por mouse/toque, cancelamento, erro/acerto, teclado, foco, avanço e conclusão única em 320, 390 e 1280 pixels, verificando o mesmo quebra-cabeça em Corpo Humano e Animais e a ausência da caixa e da mesa. O servidor e navegador são fechados ao terminar. Não usa credenciais nem acessa o banco real.
