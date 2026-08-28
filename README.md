# ROAR Frontend

Frontend da plataforma ROAR, desenvolvido com HTML, CSS e JavaScript nativos.

## Executar localmente

Sirva a raiz do projeto por HTTP. Os mocks e módulos JavaScript não funcionam corretamente ao abrir os HTMLs diretamente pelo sistema de arquivos.

Exemplo de rota principal:

```text
http://localhost:8000/
```

## Configuração

Edite `public/js/config/app-config.js`:

- `apiBaseUrl`: endereço da API Flask.
- `useMocks`: `true` durante o desenvolvimento sem backend; `false` para usar a API.

## Documentação

- `docs/arquitetura-frontend.md`
- `docs/contrato-api.md`
- `docs/entendimento-funcional-roar.docx`
