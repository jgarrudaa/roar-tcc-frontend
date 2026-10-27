# Revisão dos jogos

## Mudanças

- Associação, áudio/imagem, banco de palavras, completar frase, escrita, ordenar frase, reconhecimento, validação, verdadeiro/falso e encaixe da figura agora expõem `destroy`. Eventos, temporizadores de feedback e foco agendado pertencem à rodada e são cancelados ao sair. Callbacks atrasados e instruções de motores encerrados são ignorados.
- Memória e Sombras de peças mantêm seus mecanismos existentes de limpeza. O controlador cancela fala e efeitos na saída e na transição entre jogos.
- Efeitos sonoros usam as mesmas preferências por aluno da fala (`storage.getPreferences`), incluindo som desligado, volume e redução de estímulos. Osciladores pendentes são interrompidos ao sair. Mudanças nas preferências interrompem o áudio atual; a próxima fala usa os novos valores. Valores inválidos de volume/velocidade recebem padrões válidos.
- Foco visível com contorno azul, botões com altura mínima de 44px e campos com largura limitada ao espaço disponível. Os jogos de frases usam descrições genéricas de imagem, válidas também para animais.
- Dificuldades existentes preservadas. Sombras de peças mantém suporte TEA 1 = 6, 2 = 4, 3 = 2 peças. Nenhuma mudança no banco, no XP ou nas regras de avaliação.

O avanço automático de 2 segundos, a proteção contra cliques repetidos e a tentativa manual de salvar novamente já existiam no controlador e passaram novamente na suíte de regressão.

## Evidências

- Navegador com os motores reais e dados fictícios: 12 jogos × 3 modos de aprendizagem × 3 larguras (320×740, 390×844, 1280×800), total de 108 combinações. Todos renderizaram sem rolagem horizontal e sem erros de console nas verificações.
- Teclado: foco visível, erro seguido de acerto em Sombras, associação, escrita e completar frase; conclusão de ordenar frase e banco de palavras. Contagem real das Sombras conferida nos três níveis TEA.
- Testes determinísticos de recursos: encerramento de dez motores, remoção de eventos, cancelamento de timers/frames, silêncio de efeitos com som desligado/volume zero, volume por perfil e sequência de fala após mudança de preferência.
- Testes existentes cobrem os 2 segundos, saída durante salvamento, cliques duplicados, falha de rede e nova tentativa, memória seguida de Sombras, prévia de memória, geometria das peças e retorno pelo histórico.

As verificações usaram dados fictícios e salvamento simulado. Não houve envio de progresso de alunos nem publicação. A conferência de telas estreitas é em navegador redimensionado, não em dispositivo físico.

## Reproduzir

```text
node tools/check_game_resources.cjs
node tools/check_activity_flow.cjs
node tools/check_memory_activity.cjs
node tools/check_shadow_game.cjs
node tools/check_shadow_page.cjs
node tools/check_activity_learning_modes.cjs
node tools/check_student_tea_support.cjs
python tools/check_frontend.py
```

Os controles da prévia usados na verificação foram removidos. `tools/preview_activities.html` agora redireciona ao catálogo real de atividades. O aluno acessa sua conta e o jogo usa o perfil cadastrado, sem escolher aprendizagem, TEA ou peças. Nas Sombras, o TEA preenchido tem prioridade; quando ausente, o modo cadastrado define 2, 4 ou 6 peças. Nenhum nível TEA é inferido ou gravado a partir do modo de aprendizagem.
