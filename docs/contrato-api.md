# Contrato Esperado da API ROAR

Este arquivo descreve apenas as necessidades do frontend. A arquitetura interna do backend Flask não faz parte deste repositório.

## Autenticação

### Professor

`POST /api/v1/auth/professor/login`

```json
{
  "email": "ana@escola.com",
  "password": "senha-segura"
}
```

### Aluno

`POST /api/v1/auth/aluno/login`

```json
{
  "email": "aluno@escola.com",
  "pin": "4821"
}
```

Resposta esperada:

```json
{
  "token": "token-de-sessao",
  "role": "student",
  "user": {
    "id": 1,
    "name": "Leandro"
  }
}
```

## Cadastro do professor

`POST /api/v1/auth/professor/cadastro`

Campos: `name`, `cpf`, `email` e `password`.

## Cadastro do aluno

`POST /api/v1/professor/alunos`

```json
{
  "name": "Leandro",
  "cpf": "000.000.000-00",
  "email": "leandro@escola.com",
  "schoolYear": "6",
  "supportLevel": 2
}
```

O PIN é gerado pelo backend e devolvido uma única vez na criação:

```json
{
  "id": 1,
  "pin": "4821",
  "supportLevel": 2
}
```

## Atividade do aluno

`GET /api/v1/alunos/me/modulos`

Retorna somente os módulos que devem aparecer no catálogo, acompanhados das etapas concluídas. O frontend calcula o percentual e abre automaticamente a primeira etapa pendente.

```json
[
  {
    "id": "corpo-humano",
    "title": "Corpo Humano",
    "status": "active",
    "completedStages": [1],
    "activities": [
      { "stage": 1 },
      { "stage": 2 },
      { "stage": 3 }
    ]
  }
]
```

Nesse exemplo, o catálogo mostra `33% concluído` e direciona o aluno para a etapa 2. Os nomes internos das etapas não aparecem no catálogo.

`GET /api/v1/modulos/{moduleId}/atividades/{stage}`

```json
{
  "module": {
    "id": "corpo-humano",
    "title": "Corpo Humano",
    "items": [
      {
        "id": "head",
        "pt": "cabeça",
        "en": "HEAD",
        "realImage": "/media/corpo-humano/head-real.png",
        "vectorImage": "/media/corpo-humano/head-vector.png"
      }
    ]
  },
  "id": "corpo-humano-1",
  "stage": 1,
  "type": "recognize",
  "status": "active"
}
```

O nível do estudante é obtido em `GET /api/v1/alunos/me` e não pode ser alterado pelo professor após a triagem.

## Tentativas

`POST /api/v1/atividades/{activityId}/tentativas`

```json
{
  "itemId": "head",
  "correct": false
}
```

Não existe limite de tentativas.

## Conclusão

`POST /api/v1/atividades/{activityId}/conclusao`

```json
{
  "correct": 5,
  "wrong": 2
}
```

## Controle do professor

`PATCH /api/v1/professor/atividades/{activityId}/status`

```json
{
  "status": "blocked"
}
```

Valores aceitos: `active` e `blocked`.

## Erros

Todas as respostas de erro devem usar uma estrutura previsível:

```json
{
  "message": "Descrição compreensível do erro",
  "code": "ACTIVITY_BLOCKED"
}
```
