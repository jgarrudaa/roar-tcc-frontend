# Dados e privacidade no ROAR

Levantamento de 06/11/2026. Primeira entrega de gerenciamento de dados, com a
exportação assistida pelo professor escolhida pelo responsável pelo projeto.

## O que foi conferido

- Código do frontend e do backend local, incluindo autenticação, cadastro,
  relatórios, IA, jogos, preferências e desativação de alunos.
- Metadados de tabelas, colunas e permissões no projeto Supabase Roar db.
  As consultas desta etapa usaram estrutura e permissões, sem ler registros
  individuais de alunos ou exportar dados reais.
- Esta página registra o comportamento técnico observado e as decisões de
  implementação. A política pública será redigida após as definições da equipe.

## Inventário

| Grupo | Armazenamento e dados observados | Finalidade observada | Acesso na aplicação | Retenção e decisão pendente |
| --- | --- | --- | --- | --- |
| Cadastro do aluno | `alunos`: nome, e-mail, ano escolar, professor, modo de aprendizagem, criação, situação da conta, XP, hiperfoco e seleção de skin | Identificação, vínculo com a turma e personalização | Perfil do próprio aluno e funções do professor vinculado | Prazo a definir. Desativação preserva os registros |
| Credenciais do aluno | `alunos.pin_acesso` e token JWT na sessão do navegador | Login | Login, exibição do próprio PIN e redefinição pelo professor | Token com validade de 8 horas no código. Prazo de guarda do PIN a definir. Credenciais ficam fora da exportação |
| Cadastro do professor | `professores`: nome, e-mail, CPF, credencial de senha e verificação de e-mail | Acesso e administração da turma | Funções autenticadas do professor | Prazo a definir. Formato efetivo das credenciais armazenadas precisa de auditoria própria |
| Triagem pedagógica | `avaliacao_inicial`: comunicação, forma de comunicação, suporte de áudio, modo resultante e data | Definir o modo inicial de aprendizagem | Cadastro e perfil pedagógico | Prazo e necessidade de cada resposta a definir |
| Suporte TEA | Fonte usada pela API: `aluno_suporte_tea`. Existe também coluna legada em `alunos.nivel_suporte_tea` | Adaptação das atividades | Rotas autorizadas que consultam o serviço privado de suporte | Informação de saúde exige tratamento restrito. Prazo e eventual duplicidade legada precisam de definição e conferência |
| Histórico | `historico_desempenho`: aluno, atividade, modo usado, erros, tempo, conclusão e data | Progresso, relatórios e XP | Relatórios do aluno e do professor vinculado | Prazo a definir |
| Evolução por palavra | `aluno_palavras_pratica`: palavra, acertos, erros, ajudas, atividade, tentativa e data | Revisão e acompanhamento pedagógico | Rotas de relatórios autorizadas | Prazo a definir |
| Ajustes pedagógicos | `aluno_preferencias_jogos`: preferências e atualização | Peças, dicas e tempos configurados pelo professor | Professor vinculado e uso nas atividades do aluno | Prazo a definir |
| Personalização de mídia | `personalizacao_aluno.url_foto_real` | Usar mídia específica nas atividades | Composição das atividades | Conferir onde os arquivos de imagem ficam armazenados e seu ciclo de remoção |
| Loja e recompensas | `aluno_skins_lex`, `recompensas_missoes`, XP e skin do cadastro | Inventário e recompensas dos jogos | Aluno autenticado e operações do servidor | Prazo a definir |
| Controle de reenvio | `roar_progress_requests`: identificador de tentativa e resposta | Evitar processamento duplicado do progresso | Operações privadas do servidor | Prazo a definir |
| Cópia histórica | `backup_historico_desempenho_20260915` contém vínculo por `aluno_id` | Finalidade da cópia precisa ser confirmada pela equipe | Verificar permissões específicas antes de definir seu tratamento | Incluir no planejamento de retenção, correção e exclusão |
| Preferências locais | `roarPreferences:<perfil>:<id>` em `localStorage` | Tema, fonte, volume, som, animações, estímulos e avanço automático | Navegador usado na sessão | Sem limpeza automática identificada ao sair |
| Retomada local | `roarActivityDraft:<aluno>:<módulo>`, incluindo fingerprint do perfil, estatísticas e estado do jogo | Retomar uma atividade interrompida | Navegador do aluno | Leitura invalida rascunhos após 14 dias. Isso não remove automaticamente o registro físico do navegador. A conclusão limpa o rascunho correspondente |
| Sessão local | `roarSession`, com JWT e perfil retornado pela API | Autenticação | Navegador atual | Logout remove a sessão. Verificar limpeza em equipamentos compartilhados |

Fontes técnicas principais: `back-tcc-version-2/src/aluno.py`, `professora.py`,
`relatorios.py`, `suporte_tea.py`, `learning_improvements.py`, `auth.py`,
`public/js/utils/storage.js` e `public/js/services/activity-progress-service.js`.

## Envio ao serviço de IA

`_montar_metricas_para_ia`, em `src/relatorios.py`, monta os seguintes grupos
para `gerar_analise_aluno`, em `src/assistente_ia.py`.

- Modo de aprendizagem e ano escolar.
- Atividades disponíveis, concluídas, tentativas, taxa de conclusão e médias de
  erros e de tempo.
- Métricas por módulo e palavras com dificuldade.

O adaptador envia essas métricas ao Google Gemini quando a análise é solicitada.
Esse objeto não inclui nome, e-mail, PIN ou nível de suporte TEA. A ausência
desses identificadores não comprova anonimização, pois o conjunto continua
relacionado a um perfil pedagógico individual.

O prompt orienta a evitar diagnósticos, reconhecer poucos registros e preservar
a avaliação humana. A política pública precisa explicar o serviço externo e a
finalidade. A equipe deve confirmar a necessidade de ano escolar e modo de
aprendizagem, além das condições de retenção e processamento do provedor. Não
foi encontrado armazenamento da resposta da IA nas rotas inspecionadas.

## Permissões da primeira entrega

Decisão recebida nesta conversa: a exportação será feita pelo professor da
turma, após verificar o solicitante. O aluno não baixa diretamente o arquivo.

| Pessoa | Primeira entrega | Verificação |
| --- | --- | --- |
| Professor vinculado | Exportar cadastro atual e histórico do aluno selecionado | JWT com perfil professor e `alunos.professor_id` igual ao professor do token |
| Professor de outra turma | Acesso recusado | Conferência no backend antes de ler histórico ou suporte TEA |
| Aluno | Acessar orientações em Configurações > Gerenciar dados | Exportação é assistida pelo professor |
| Responsável | Solicitar atendimento ao professor | Identidade, vínculo e autorização conferidos manualmente. Não há perfil de responsável ou verificação automática implementados |
| Visitante | Exportação recusada | Token obrigatório |

O professor declara o tipo de solicitante e confirma a verificação a cada
download. O checkbox registra uma declaração do professor, sem substituir a
checagem de identidade. A equipe ainda deve definir como será feita essa checagem.

## Exportação assistida

Rota `POST /professores/alunos/<aluno_id>/exportacao-dados`, com corpo
`{"solicitante":"titular"|"responsavel","verificacao_confirmada":true}`.
Campos adicionais que tentem informar identidades são rejeitados.

O JSON inclui cadastro atual, suporte TEA da fonte privada e histórico de
atividades. Também identifica o professor exportador, a data, o tipo de
solicitante e um identificador do arquivo. A rota registra um evento de geração
no logger da aplicação, sem nome, e-mail, conteúdo pedagógico ou credenciais.
A retenção dos logs depende do ambiente de hospedagem e precisa ser definida.

O arquivo tem escopo expresso. Avaliação inicial, arquivos de mídia,
recompensas, prática por palavra e preferências não integram esta primeira
exportação. Um atendimento completo de acesso aos dados deverá considerar
também essas categorias e as cópias existentes.

- O backend usa o cliente administrativo e valida o vínculo com o professor.
- Todas as seleções e o JSON usam listas explícitas de campos. O PIN e as
  credenciais de autenticação ficam fora do arquivo.
- O histórico é paginado até o maior ID observado no início, para não omitir
  registros pela paginação padrão nem incorporar novas tentativas sem fim.
  Leituras entre páginas não constituem um snapshot transacional.
- O limite desta versão é 50.000 registros. Falha ou limite excedido retorna
  erro, sem entregar uma exportação parcial. Volume grande pode exigir outro
  fluxo de atendimento e geração assíncrona.
- Respostas usam `Cache-Control: no-store, private`. O frontend não salva o
  arquivo em `localStorage` e ignora respostas após fechar o perfil do aluno.
- As seleções do exportador são reiniciadas ao trocar de aluno. A confirmação
  também é reiniciada após o download ou ao mudar o tipo de solicitante.
- O arquivo baixado permanece no equipamento até a pessoa removê-lo. A tela
  orienta a entrega por canal seguro.

O backend e o frontend desta entrega precisam ser publicados de forma
coordenada para o recurso funcionar na aplicação hospedada.

### Publicação da exportação

O frontend aponta para `https://back-tcc-version-2.vercel.app`. Na verificação
de 06/11/2026, a raiz dessa API respondeu 200, mas o OPTIONS da rota de
exportação respondeu 404. A falha de preflight faz o navegador apresentar um
erro de rede mesmo com a API principal online.

O serviço de exportação agora distingue o 404 direto e essa falha de
preflight: após um erro de rede, faz somente um GET de diagnóstico, sem token
ou cookies, na mesma rota. Um 404 informa que a atualização da API precisa ser
publicada; um 405 informa que o servidor responde, mas a exportação não pôde
ser acessada. Falha também no diagnóstico preserva a mensagem de conexão.
O diagnóstico não repete o POST nem gera downloads.

Para liberar a função no endereço existente:

1. Incluir no commit do backend `app.py`, `openapi.yaml`,
   `src/privacidade.py` e `tests/test_privacidade.py`. O novo módulo precisa
   acompanhar o registro do blueprint.
2. Enviar o commit aprovado ao repositório `Glcost/back-tcc-version-2` e
   publicar esse commit no projeto que atende o domínio existente. Um
   redeploy de um commit anterior não inclui a função.
3. Aguardar a publicação ficar pronta e conferir OPTIONS 200 e POST sem token
   401, usando dados fictícios. Isso verifica rota, CORS e autenticação sem
   exportar informações de alunos.
4. Com uma conta de teste autorizada, conferir o fluxo de download pela tela
   do professor. A publicação só estará validada após essa conferência.

Os testes locais não substituem a validação do ambiente publicado. O envio
ao GitHub e a publicação dependem da aprovação combinada com o responsável
pelo projeto.

### Relatório em PDF

No perfil do aluno, em Gerenciar dados, o professor pode escolher **Gerar
relatório em PDF** após selecionar o solicitante e confirmar a verificação.
O JSON continua disponível ao lado. A confirmação é exigida novamente após
cada download e ambos os botões ficam indisponíveis durante uma geração.

Rota adicional: `POST /professores/alunos/<aluno_id>/relatorio-dados.pdf`,
com o mesmo corpo e as mesmas verificações de sessão, perfil, vínculo e
solicitante da exportação JSON. A geração ocorre em memória com ReportLab
4.4.9. Não há envio à IA ou outro serviço de geração de documentos, nem
armazenamento de PDFs no servidor.

O PDF mostra cadastro atual, resumo dos registros, histórico com nome da
atividade e módulo, data de emissão e identificador. Os nomes vêm de
`atividades.palavra_chave` e `modulos.nome`, consultados pelo cliente
administrativo apenas depois de validar o vínculo do professor. Atividades
removidas ou sem título são identificadas pelo código preservado no histórico.
Uma consulta somente de catálogo confirmou os campos utilizados, sem consultar
cadastros de alunos.

- Dados não preenchidos aparecem como não informados. Suporte TEA não é
  inferido pelo modo de aprendizagem.
- Atividades distintas e concluídas são contadas por atividade, sem duplicar
  uma conclusão por haver várias tentativas.
- Erros e tempos somam somente os valores registrados, com indicação da
  quantidade de registros que possuem essas medidas. Zero é preservado.
- Horários com fuso são apresentados em Brasília (UTC-3); datas sem fuso são
  preservadas e identificadas como tal.
- O histórico ocupa quantas páginas forem necessárias, repetindo o cabeçalho
  da tabela e numerando as páginas.
- O limite do PDF é 500 registros para manter a geração leve. Acima disso,
  a API responde 422 e orienta a usar o JSON, sem entregar um PDF truncado.
- O navegador aceita somente um arquivo com tipo PDF e assinatura `%PDF-`,
  ignora respostas após fechar o perfil e permite tentar novamente após falha.
- O download usa nome com identificador numérico do aluno, sem seu nome no
  arquivo. O conteúdo continua contendo dados pessoais, com entrega restrita
  ao solicitante verificado e resposta privada sem cache.

A nova rota e a dependência ReportLab precisam estar na mesma publicação do
backend. Conferir OPTIONS 200 e POST sem token 401 também para essa rota.

Referência técnica: [tabelas e paginação no ReportLab](https://docs.reportlab.com/reportlab/userguide/ch7_tables/).

## Achados de segurança que precedem a publicação

Consulta de metadados do banco em 06/11/2026 confirmou RLS desligado e permissões
de SELECT e UPDATE para `anon` em `alunos`, `professores`, `avaliacao_inicial`,
`historico_desempenho` e `personalizacao_aluno`. As tabelas
`aluno_suporte_tea` e `aluno_preferencias_jogos` estão com RLS ativo e sem essas
permissões anônimas. A efetiva exposição depende também da configuração da Data
API, que deve ser conferida antes da liberação.

O backend antigo usa `SUPABASE_KEY` em várias rotas com autorização própria.
Remover permissões ou ativar RLS sem adaptar essas rotas pode interromper login,
cadastro e relatórios. A próxima correção prioritária deve migrar os acessos
legítimos para o servidor com autorização por perfil e restringir o acesso
direto às tabelas. Essa alteração exige testes integrados antes de aplicar a
migração no banco.

Na rota legada `/alunos/desempenho` do código local inspecionado, o aluno é
recebido pelo corpo da requisição. Deve-se revisar essa rota e sua relação com
`/atividades/progresso` para garantir que escritas usem a identidade autenticada.
Esse achado está registrado para a revisão de autorização, além da exportação.

## Decisões institucionais pendentes

O responsável pelo projeto informou que os professores ainda serão cadastrados
completamente e que o responsável pelo atendimento e o canal oficial serão
definidos depois.

1. Quem recebe, analisa e responde aos pedidos, incluindo substituição do
   professor e alunos com conta desativada.
2. Canal oficial e procedimento para verificar identidade e representação,
   coletando apenas a comprovação necessária.
3. Finalidade, hipótese legal e prazo de retenção por categoria, com tratamento
   específico de suporte TEA, cópias, logs e arquivos de mídia.
4. Critérios para correção, bloqueio, anonimização, exclusão e conservação de
   registros, com responsabilidade pela decisão.
5. Condições de uso do provedor de IA e informações estritamente necessárias.

Após essas definições, implementar solicitações com protocolo, acompanhamento e
permissões. A desativação existente continua sendo registrada como desativação,
com preservação de histórico. A equipe definirá o atendimento de exclusão.

## Referências e evidências para o TCC

| Referência | Recurso ou revisão relacionada | Evidência técnica nesta etapa |
| --- | --- | --- |
| LGPD, art. 6º | Finalidade, necessidade, transparência e segurança | Inventário, escopo explícito e lista de campos exportados |
| LGPD, art. 9º | Informações sobre o tratamento | Mapeamento para a política, com responsável e canal pendentes |
| LGPD, arts. 5º, II, e 11 | Tratamento de informação de saúde | Identificação da fonte de suporte TEA e acesso autorizado à exportação |
| LGPD, art. 14 | Melhor interesse de crianças e adolescentes | Exportação assistida e verificação manual de representação proposta |
| LGPD, arts. 18 e 19 | Acesso e atendimento ao titular | Exportação de cadastro e histórico, com escopo e limites documentados |
| LGPD, arts. 15 e 16 | Término e conservação do tratamento | Tabela de retenção pendente e identificação de backup e rascunhos |
| LGPD, art. 46 | Proteção contra acesso não autorizado | Testes de autenticação, vínculo e isolamento, além do achado de permissões antigas |

Essas relações orientam a revisão técnica. A existência de um recurso ou teste
isolado não comprova conformidade integral do projeto.

Fontes oficiais consultadas em 06/11/2026.

- [LGPD, texto atualizado na Câmara dos Deputados](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html)
- [ANPD, direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares)
- [ANPD, tratamento de dados de crianças e adolescentes](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes)

## Validação

- `back-tcc-version-2/tests/test_privacidade.py` usa as rotas reais com Flask e
  JWT, banco simulado e dados fictícios. Cobre sessão, perfil, vínculo,
  confirmação, campos, paginação, falhas, repetição e requisições de diagnóstico.
- A verificação de navegador JSON exercita confirmação, download, falha/repetição,
  troca de perfil, descarte de resposta tardia, API não publicada, falha de
  acesso, falta de conexão e orientações ao aluno.
- A verificação PDF conecta o navegador à rota real Flask/JWT, com banco e
  alunos fictícios. Cobre download, confirmação, outro professor, perfil aluno,
  sessão inválida, falha/repetição, arquivos inválidos, concorrência dos dois
  formatos, descarte de resposta tardia, teclado e tela de 1280 e 390 pixels.
- Instalar as dependências de teste do backend com
  `python -m pip install -r back-tcc-version-2/requirements-dev.txt`. Executar
  `python -m unittest discover -s back-tcc-version-2/tests -p test_privacidade.py -v`
  e `npm run test:privacy` na raiz do frontend. Para usar outro interpretador
  Python no teste de navegador, definir `ROAR_TEST_PYTHON` ou passar seu caminho
  como terceiro argumento a `node tools/check_student_report_browser.cjs playwright`.
- Os quinze testes de rota e os cenários de navegador em 1280 e 390 pixels
  passaram nesta entrega. `npm test` também passou.
- O uso no backend hospedado e a restrição das tabelas legadas dependem das
  próximas etapas de publicação e revisão de autorização.
