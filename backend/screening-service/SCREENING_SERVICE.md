# Screening Service

## Visao geral

O `screening-service` e o servico responsavel pelo ciclo de triagem do paciente.
Ele recebe os dados iniciais da triagem, sugere uma prioridade com base em sinais
vitais e sintomas, valida a classificacao final definida por um profissional e,
por fim, encaminha o paciente para o setor de destino mais adequado.

O fluxo principal do servico e:

1. Criar a triagem.
2. Sugerir classificacao.
3. Validar classificacao final.
4. Encaminhar o paciente.

Estados possiveis da triagem:

- `AGUARDANDO_CLASSIFICACAO`
- `CLASSIFICADA`
- `AGUARDANDO_ATENDIMENTO`

## Stack e comportamento geral

- API REST com Spring Boot
- Persistencia com Spring Data JPA
- Validacao com Jakarta Validation
- Publicacao de eventos com Kafka
- Seguranca liberada para todas as rotas no estado atual (`permitAll`)

## Entidade principal

A entidade `Screening` representa a triagem e guarda:

- dados do paciente
- profissional que abriu a triagem
- queixa principal
- sintomas estruturados
- sinais vitais
- prioridade sugerida
- prioridade final
- setor de destino
- timestamps de classificacao e encaminhamento

## Regras de negocio mais importantes

### 1. Nao pode existir mais de uma triagem ativa por paciente

No `create`, o servico verifica se o paciente ja possui triagem com status:

- `AGUARDANDO_CLASSIFICACAO`
- `CLASSIFICADA`
- `AGUARDANDO_ATENDIMENTO`

Se sim, retorna erro `400` com a mensagem:

```json
{
  "message": "Paciente ja possui triagem ativa."
}
```

### 2. A sugestao de prioridade e automatica

O `ClassificationEngine` usa sinais vitais, sintomas estruturados e texto da
queixa principal/sintomas complementares para sugerir:

- `VERMELHO`
- `LARANJA`
- `AMARELO`
- `VERDE`
- `AZUL`

Exemplos das heuristicas:

- `VERMELHO`: hipoxia severa (`SpO2 < 90`), PA critica com sintomas cardiacos,
  convulsao, hemorragia ativa, AVC/choque/parada cardiaca no texto
- `LARANJA`: febre muito alta em faixa etaria de risco, dor intensa com trauma
  ou dor toracica, desconforto respiratorio com FR elevada
- `AMARELO`: vomito persistente, sinais de desidratacao, febre alta,
  frequencia cardiaca muito alterada
- `VERDE`: trauma leve, tosse, cefaleia, diarreia, entorse, febre baixa
- `AZUL`: quadro leve ou demanda sem sinal de gravidade imediata

### 3. Mudanca manual da prioridade exige justificativa

Na validacao da classificacao, se o profissional informar `finalPriority`
diferente da prioridade sugerida, `overrideJustification` passa a ser obrigatoria.

### 4. So pode encaminhar triagem ja classificada

O endpoint de encaminhamento exige:

- status atual `CLASSIFICADA`
- `finalPriority` preenchida

### 5. Encaminhamento automatico

Se o setor de destino nao for enviado no request, o `RoutingEngine` sugere um:

- `VERMELHO` -> `SALA_EMERGENCIA`
- `LARANJA` com dor no peito/falta de ar -> `SALA_EMERGENCIA`
- ferimento/corte/sutura -> `SALA_SUTURAS`
- fratura/entorse/luxacao/trauma -> `CONSULTORIO_ORTOPEDICO`
- menor de 18 anos, sem prioridade alta -> `CONSULTORIO_PEDIATRICO`
- caso contrario -> `CONSULTORIO_CLINICA_GERAL`

### 6. Eventos publicados

O servico publica eventos Kafka nestes momentos:

- ao criar triagem: `triagem.criada`
- ao encaminhar triagem classificada: `triagem.classificada`
- ao encaminhar triagem de alta prioridade (`VERMELHO` ou `LARANJA`):
  `triagem.critica`

## Controller

O unico controller HTTP do servico e:

- `ScreeningController`

Base path:

```text
/screenings
```

---

## 1. Criar triagem

### Endpoint

```http
POST /screenings
```

### JSON de teste

```json
{
  "patientId": "11111111-1111-1111-1111-111111111111",
  "patientName": "Maria Silva",
  "patientBirthDate": "1998-03-20",
  "susCardNumber": "898001160417647",
  "medicalRecordNumber": "PRONT-0001",
  "triageProfessionalId": "22222222-2222-2222-2222-222222222222",
  "mainComplaint": "Trauma em perna direita com dor intensa",
  "symptoms": [
    "TRAUMA"
  ],
  "complementarySymptoms": "Paciente relata queda da propria altura ha 30 minutos.",
  "allergies": [
    "Dipirona"
  ],
  "medicationsInUse": [
    "Losartana 50mg"
  ],
  "comorbidities": [
    "Hipertensao"
  ],
  "generalNotes": "Paciente chegou consciente e orientada.",
  "vitalSigns": {
    "pressaoSistolica": 120,
    "pressaoDiastolica": 80,
    "frequenciaCardiaca": 88,
    "temperatura": 36.5,
    "frequenciaRespiratoria": 16,
    "saturacaoOxigenio": 98,
    "glicemia": 100,
    "escalaDor": 6
  }
}
```

### Fluxo esperado

1. O controller recebe o request e aplica as validacoes de campo.
2. O service verifica se o paciente ja possui triagem ativa.
3. Se nao existir triagem ativa, cria uma nova `Screening`.
4. O status inicial sempre sera `AGUARDANDO_CLASSIFICACAO`.
5. O protocolo e fixado como `Manchester Adaptado`.
6. A triagem e salva no banco.
7. O evento `triagem.criada` e publicado no Kafka.
8. A API retorna `201 Created` com o objeto completo da triagem.

### Resposta esperada

Campos mais importantes esperados no retorno:

```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "AGUARDANDO_CLASSIFICACAO",
  "protocol": "Manchester Adaptado",
  "suggestedPriority": null,
  "finalPriority": null,
  "destinationSector": null
}
```

### Erros comuns

- `400`: paciente ja possui triagem ativa
- `400`: campos obrigatorios ausentes ou fora dos limites de validacao

---

## 2. Buscar triagem por ID

### Endpoint

```http
GET /screenings/{id}
```

### JSON de teste

Como e um `GET`, nao ha body. O teste normalmente usa o `id` retornado no `POST`.
Exemplo de resposta esperada:

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "patientId": "11111111-1111-1111-1111-111111111111",
  "patientName": "Maria Silva",
  "status": "AGUARDANDO_CLASSIFICACAO",
  "protocol": "Manchester Adaptado"
}
```

### Fluxo esperado

1. O controller recebe o `UUID` da rota.
2. O service busca a triagem no repositorio.
3. Se encontrar, transforma a entidade em `ScreeningResponse`.
4. Retorna `200 OK`.

### Erros comuns

- `404`: triagem nao encontrada

---

## 3. Listar triagens

### Endpoint

```http
GET /screenings
```

### Parametros aceitos

- `status` opcional
- `patientId` opcional

Exemplos:

```http
GET /screenings
GET /screenings?status=CLASSIFICADA
GET /screenings?patientId=11111111-1111-1111-1111-111111111111
```

### JSON de teste

Como e um `GET`, nao ha body. Exemplo de resposta:

```json
[
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "patientId": "11111111-1111-1111-1111-111111111111",
    "patientName": "Maria Silva",
    "status": "AGUARDANDO_CLASSIFICACAO"
  }
]
```

### Fluxo esperado

1. Se `patientId` for informado, a busca prioriza triagens desse paciente.
2. Se `patientId` nao vier e `status` vier, busca por status.
3. Se nenhum filtro vier, retorna todas as triagens em ordem decrescente de criacao.
4. O retorno e sempre uma lista de `ScreeningResponse`.

### Observacao importante

Se `patientId` e `status` forem enviados juntos, o codigo atual prioriza `patientId`
e ignora o filtro por `status`.

---

## 4. Buscar triagem ativa por paciente

### Endpoint

```http
GET /screenings/active/patient/{patientId}
```

### JSON de teste

Como e um `GET`, nao ha body. Exemplo de resposta:

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "patientId": "11111111-1111-1111-1111-111111111111",
  "status": "AGUARDANDO_CLASSIFICACAO"
}
```

### Fluxo esperado

1. O controller recebe o `patientId`.
2. O service busca a triagem mais recente do paciente dentro dos status ativos.
3. Status considerados ativos:
   - `AGUARDANDO_CLASSIFICACAO`
   - `CLASSIFICADA`
   - `AGUARDANDO_ATENDIMENTO`
4. Se encontrar, retorna `200 OK`.

### Erros comuns

- `404`: paciente nao possui triagem ativa

---

## 5. Sugerir classificacao

### Endpoint

```http
POST /screenings/{id}/classification/suggestion
```

### JSON de teste

Esse endpoint tambem nao recebe body. Exemplo de resposta esperada para um caso
grave com hipoxia:

```json
{
  "suggestedPriority": "VERMELHO",
  "score": 5,
  "maxWaitMinutes": 0,
  "reasons": [
    "SpO2 abaixo de 90%, indicando hipoxia severa."
  ]
}
```

### Fluxo esperado

1. O controller recebe o `id` da triagem.
2. O service carrega a triagem.
3. O `ClassificationEngine` analisa sinais vitais, sintomas e texto livre.
4. A API retorna a prioridade sugerida com score, tempo maximo de espera e razoes.

### Observacao importante

Esse endpoint apenas sugere a classificacao. Ele nao altera o status da triagem
nem grava a prioridade no banco.

### Erros comuns

- `404`: triagem nao encontrada

---

## 6. Validar classificacao final

### Endpoint

```http
POST /screenings/{id}/classification
```

### JSON de teste

Exemplo 1: aceitar a sugestao automaticamente

```json
{
  "professionalId": "44444444-4444-4444-4444-444444444444"
}
```

Exemplo 2: sobrescrever a prioridade sugerida

```json
{
  "professionalId": "44444444-4444-4444-4444-444444444444",
  "finalPriority": "AZUL",
  "overrideJustification": "Paciente estabilizado apos reavaliacao clinica."
}
```

### Fluxo esperado

1. O controller valida o body.
2. O service busca a triagem.
3. O status precisa estar em `AGUARDANDO_CLASSIFICACAO`.
4. O service solicita novamente a sugestao ao `ClassificationEngine`.
5. Se `finalPriority` nao vier, a prioridade final sera a mesma da sugestao.
6. Se `finalPriority` vier diferente da sugestao, `overrideJustification` e obrigatoria.
7. O service grava:
   - `suggestedPriority`
   - `suggestedPriorityReason`
   - `finalPriority`
   - `classificationScore`
   - `classificationProfessionalId`
   - `overrideJustification`
   - `classifiedAt`
8. O status passa para `CLASSIFICADA`.
9. A API retorna `200 OK` com a triagem atualizada.

### Resposta esperada

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "status": "CLASSIFICADA",
  "suggestedPriority": "LARANJA",
  "finalPriority": "AZUL",
  "classificationScore": 1,
  "overrideJustification": "Paciente estabilizado apos reavaliacao clinica."
}
```

### Erros comuns

- `400`: triagem nao esta aguardando classificacao
- `400`: justificativa obrigatoria ao alterar a classificacao sugerida
- `404`: triagem nao encontrada

---

## 7. Encaminhar paciente

### Endpoint

```http
POST /screenings/{id}/routing
```

### JSON de teste

Exemplo 1: deixar o motor sugerir o setor

```json
{
  "professionalId": "55555555-5555-5555-5555-555555555555",
  "routingNotes": "Encaminhar apos classificacao."
}
```

Exemplo 2: definir setor manualmente

```json
{
  "professionalId": "55555555-5555-5555-5555-555555555555",
  "destinationSector": "SALA_EMERGENCIA",
  "routingNotes": "Levar direto para atendimento imediato."
}
```

### Fluxo esperado

1. O controller valida o body.
2. O service busca a triagem.
3. O status precisa estar em `CLASSIFICADA`.
4. A triagem precisa ter `finalPriority` definida.
5. Se `destinationSector` vier no request, ele sera usado.
6. Se nao vier, o `RoutingEngine` sugere o setor automaticamente.
7. O service grava:
   - `destinationSector`
   - `routingNotes`
   - `routingProfessionalId`
   - `routedAt`
8. O status passa para `AGUARDANDO_ATENDIMENTO`.
9. O evento `triagem.classificada` e publicado.
10. Se a prioridade final for `VERMELHO` ou `LARANJA`, o evento
    `triagem.critica` tambem e publicado.
11. A resposta inclui `queueMetrics` quando houver setor de destino e prioridade
    final definidos.

### Resposta esperada

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "status": "AGUARDANDO_ATENDIMENTO",
  "finalPriority": "VERMELHO",
  "destinationSector": "SALA_EMERGENCIA",
  "queueMetrics": {
    "elapsedMinutes": 2,
    "remainingMinutes": 0,
    "queuePosition": 1
  }
}
```

### Como `queueMetrics` e calculado

- considera apenas triagens no mesmo `destinationSector`
- considera apenas triagens com status `AGUARDANDO_ATENDIMENTO`
- ordena primeiro por prioridade mais alta
- em empate, ordena pela classificacao mais antiga

### Erros comuns

- `400`: triagem precisa estar classificada antes do encaminhamento
- `400`: triagem sem prioridade final definida
- `404`: triagem nao encontrada

---

## Validacoes de payload

### Campos obrigatorios em `CreateScreeningRequest`

- `patientId`
- `patientName`
- `patientBirthDate`
- `triageProfessionalId`
- `mainComplaint`
- `vitalSigns`

### Validacoes importantes em `SinaisVitais`

- `pressaoSistolica`: 30 a 300
- `pressaoDiastolica`: 20 a 200
- `frequenciaCardiaca`: 20 a 250
- `temperatura`: 25.0 a 45.0
- `frequenciaRespiratoria`: 5 a 80
- `saturacaoOxigenio`: 50 a 100
- `glicemia`: 20 a 600
- `escalaDor`: 0 a 10

### Exemplo de erro de validacao

```json
{
  "timestamp": "2026-04-29T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Dados invalidos",
  "fieldErrors": {
    "patientName": "must not be blank",
    "vitalSigns.saturacaoOxigenio": "must be greater than or equal to 50"
  }
}
```

## Resumo de fluxo ponta a ponta

### Cenario normal

1. Cliente cria a triagem com `POST /screenings`.
2. Cliente consulta a sugestao com `POST /screenings/{id}/classification/suggestion`.
3. Profissional confirma ou ajusta a classificacao com
   `POST /screenings/{id}/classification`.
4. Profissional encaminha com `POST /screenings/{id}/routing`.
5. O paciente passa a ficar em `AGUARDANDO_ATENDIMENTO`.

### Cenario critico

1. Triagem e criada com sinais vitais graves.
2. O motor sugere `VERMELHO`.
3. A classificacao final e validada.
4. No encaminhamento, o destino tende a ser `SALA_EMERGENCIA`.
5. O servico publica `triagem.classificada` e `triagem.critica`.

## Observacoes tecnicas

- No estado atual, o controller nao exige autenticacao.
- A busca de sugestao de classificacao nao persiste nada por si so.
- O encaminhamento e o passo que gera metricas de fila no retorno.
- O documento foi montado a partir do codigo atual do servico, especialmente de:
  - `ScreeningController`
  - `ScreeningService`
  - `ClassificationEngine`
  - `RoutingEngine`
  - `ScreeningEventPublisher`
