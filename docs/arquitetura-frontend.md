# Arquitetura Frontend da ROAR

## Objetivo

Organizar o frontend da ROAR com HTML, CSS e JavaScript nativos, mantendo responsabilidades claras e preparando o consumo de uma API Flask desenvolvida em projeto separado.

## Estrutura

```text
roar-tcc-main/
├── index.html
├── pages/
│   ├── auth/                 # Login e cadastro
│   ├── aluno/                # Jornada do estudante
│   ├── professor/            # Gestão pedagógica
├── public/
│   ├── assets/               # Imagens, áudio e ícones
│   ├── css/
│   │   ├── base/             # Tokens, reset, tipografia e acessibilidade
│   │   ├── components/       # Componentes visuais reutilizáveis
│   │   ├── layouts/          # Estruturas de dashboard e atividade
│   │   └── pages/            # Estilos exclusivos de cada página
│   ├── js/
│   │   ├── api/              # Requisições HTTP
│   │   ├── components/       # Comportamentos visuais compartilhados
│   │   ├── config/           # URL da API e rotas
│   │   ├── features/         # Funcionalidades de domínio
│   │   ├── pages/            # Inicialização das páginas
│   │   ├── services/         # Regras e coordenação de dados
│   │   └── utils/            # Funções genéricas e sem regra de domínio
│   └── mocks/                # Contratos temporários enquanto a API não existe
└── docs/                     # Arquitetura e contrato esperado da API
```

## Dependências entre camadas

```text
Página HTML
    ↓
Controlador da página
    ↓
Serviço de domínio
    ↓
Cliente da API
    ↓
API Flask
```

- Uma página não chama `fetch()` diretamente.
- A pasta `api` conhece HTTP, headers, token e endpoints.
- A pasta `services` conhece as regras da ROAR.
- A pasta `features` implementa experiências completas, como as atividades.
- A pasta `utils` não conhece aluno, professor, módulo ou atividade.

## Motor de atividades

Todos os módulos utilizam uma única página:

```text
/pages/aluno/atividade.html?modulo=corpo-humano&etapa=1
```

O controlador carrega o contexto e escolhe um dos três motores:

```text
atividade-controller.js
├── reconhecer.js
├── associar.js
└── validar.js
```

O conteúdo do módulo permanece igual. O nível altera apresentação, quantidade de apoio, áudio e interação.

### Níveis oficiais

1. Suporte Visual Puro
2. Aprendiz Guiado
3. Autonomia Contextural

### Estados de atividade

- `active`: pode ser iniciada.
- `blocked`: foi bloqueada pelo professor.
- `completed`: já foi concluída.

O professor altera o estado pela interface. O backend é a fonte de verdade. O aluno pode errar quantas vezes precisar.

## Persistência

O frontend não usa `localStorage` como banco de dados. Ele pode guardar apenas:

- token e papel da sessão;
- preferências de tema;
- preferências locais de acessibilidade.

Alunos, níveis, módulos, status, tentativas e progresso pertencem à API.

Enquanto `useMocks` estiver ativo, o progresso demonstrativo é salvo localmente para permitir testar abandono e retomada sem o backend. Essa persistência deixa de ser utilizada quando a API Flask for ativada.

## Catálogo e trilha

- O catálogo apresenta um único cartão por módulo.
- Os nomes internos `Reconhecer`, `Associar` e `Validar` não aparecem nessa página.
- Ao abrir um módulo novo, o aluno entra automaticamente na etapa 1.
- Ao retornar, o frontend abre a primeira etapa ainda não concluída.
- O progresso do módulo é calculado pelas três etapas: `0%`, `33%`, `67%` ou `100%`.

## Convenções

- Arquivos e funções possuem uma responsabilidade principal.
- Funções assíncronas usam `async/await` e tratamento explícito de erro.
- Seletores do DOM são obtidos na inicialização da página.
- Dados externos são validados antes do uso.
- CSS de página não contém regras globais.
- HTML não contém blocos `<style>` ou `<script>`.
- A página de atividade usa `100dvh` e não possui rolagem.
- Componentes interativos possuem rótulo acessível e foco visível.

## Migração concluída

As páginas duplicadas, redirecionamentos temporários e atividades legadas foram removidos após a validação do motor genérico. As rotas oficiais estão concentradas em `pages/auth`, `pages/aluno` e `pages/professor`.
