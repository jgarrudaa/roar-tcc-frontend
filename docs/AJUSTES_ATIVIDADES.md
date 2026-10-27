# Ajustes das atividades

Implementação das orientações do documento **ajustes jogo.pdf** (seis páginas).

## Navegação e respostas

- Ao concluir um jogo, a resposta fica protegida contra novos cliques e o avanço acontece após **1 segundo**. O botão **Próximo** continua permitindo avançar antes.
- A seta no cabeçalho volta à atividade anterior, usando a ordem cadastrada no módulo. Na primeira atividade, volta ao catálogo.
- Sair, voltar ou avançar manualmente cancela o avanço pendente. Cada conclusão gera uma solicitação de salvamento por vez.
- Se o salvamento falhar, a tela permanece na resposta concluída e o botão **Próximo** permite tentar novamente. Não há repetição automática de requisições.

## Voz e vocabulário — níveis 1 e 2

- Reconhecer: instrução inicial em português com o nome do item.
- Áudio/imagem: palavra inglesa visível em caixa alta e pronúncia ao abrir, com botão para ouvir novamente.
- Validar no nível 1: mantém a palavra em inglês depois do exercício de áudio, evitando voltar ao alvo em português.
- Associação: pronuncia o alvo ao abrir; tocar na imagem repete a palavra. O tamanho da imagem e suas margens foram padronizados.
- Verdadeiro/falso: mostra apenas o alvo inglês em caixa alta; fala a pergunta em português seguida do alvo com pronúncia inglesa. Respostas **Yes** e **No**.
- O serviço de áudio respeita as preferências de som, volume e velocidade. A reprodução automática depende da permissão do navegador; os botões de repetição continuam disponíveis. Sair cancela falas pendentes.

## Memória e jogo adicional

- Níveis 1 e 2 começam com as cartas abertas **nas posições reais** durante 5 segundos. **Começar agora** permite encerrar a prévia antes.
- As tentativas ficam bloqueadas durante a prévia. Ao esconder as cartas, a ordem é mantida.
- Não há mais a tela separada “Conheça os pares”. A orientação é falada na abertura.
- A grade adapta-se ao espaço disponível, sem rolagem interna nas dimensões verificadas. Em telas muito pequenas ou com zoom, a rolagem necessária permanece disponível para não cortar conteúdo.
- No modo de aprendizagem 2, concluir a memória abre uma rodada adicional de **Sombras**, usando o vocabulário da atividade. As peças seguem o suporte TEA cadastrado (1 = 6, 2 = 4, 3 = 2); sem TEA preenchido, o modo Aprendiz Guiado usa 4 peças. A barra identifica **Jogo 1 de 2** e **Jogo 2 de 2**.
- Memória e Sombras compõem a mesma atividade do backend: o progresso só é enviado após os dois jogos, uma única vez. Não foram criados registros nem tipos novos no banco.
- O endereço antigo da página avulsa de Sombras redireciona para os módulos.

## Verificação

```powershell
node tools/check_activity_flow.cjs
node tools/check_memory_activity.cjs
node tools/check_shadow_game.cjs
node tools/check_activity_learning_modes.cjs
python tools/check_frontend.py
```

Os testes cobrem avanço temporizado, clique repetido, falha e nova tentativa de salvamento, saída durante requisição, atividade anterior com ordens não consecutivas, memória seguida de Sombras, sequência de idiomas e preferências de áudio. A memória também verifica prévia, posições, pares, tentativas e cancelamento de timers.

A revisão visual local verificou memória em 1280 × 720 e 390 × 844, imagens de associação e palavras em caixa alta. O fluxo memória → Sombras → conclusão foi exercitado no navegador com os motores e o controlador reais, usando dados locais e salvamento simulado. O envio ao backend com uma conta de aluno não foi exercitado.
