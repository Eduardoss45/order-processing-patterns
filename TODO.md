# Ordem de desenvolvimento (stream)

Objetivo: implementar a versao **event-based / stream** descrita no `README.md`, usando Kafka (via Apache) e consumidores independentes.

Infra esperada em `projects/stream/docker-compose.yml`:

- PostgreSQL
- Apache (Kafka API)

---

## 1. Fundacao (config + conexoes)

Objetivo: garantir que cada servico sobe sem erro.

- `dotenv` carregando
- validacao com `zod` (env + payload de eventos)
- conexao com PostgreSQL via `pg`
- conexao com Kafka via `kafkajs`
- logging com `pino` (ou `packages/logger`)

Criterio de sucesso:

- o processo sobe
- consegue conectar no DB
- consegue conectar no broker Kafka

---

## 2. Topicos (streams) e grupos de consumo

Defina (no minimo) os topicos:

- `order-created`
- `payment-processed`
- `inventory-updated`

Defina grupos (um por servico consumidor):

- `payment-service`
- `inventory-service`
- `notification-service`

Criterio:

- consegue publicar e consumir manualmente (ex.: via `rpk` / tooling do Apache)

---

## 3. Contratos de eventos (shape + validacao)

Padronize um envelope simples para todos os eventos:

```json
{
  "eventId": "uuid",
  "eventName": "order-created",
  "occurredAt": "ISO-8601",
  "correlationId": "uuid",
  "payload": {}
}
```

Regras:

- `eventId` unico (base para idempotencia)
- `correlationId` estavel ao longo do fluxo (rastreio)
- `payload` validado com `zod` no consumidor (fail-fast)

Criterio:

- eventos invalidos sao rejeitados de forma previsivel (log + DLQ ou drop controlado)

---

## 4. Modelo de dados minimo (por servico)

Em streams, cada servico deve manter seu proprio estado (mesmo que, no laboratorio, tudo use o mesmo Postgres com schemas separados).

Minimo recomendado:

```sql
CREATE SCHEMA order_service;
CREATE TABLE order_service.orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL
);

CREATE SCHEMA payment_service;
CREATE TABLE payment_service.processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SCHEMA inventory_service;
CREATE TABLE inventory_service.processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SCHEMA notification_service;
CREATE TABLE notification_service.processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Criterio:

- cada servico consegue persistir seu proprio progresso (mesmo que seja so `processed_events` no inicio)

---

## 5. order-service (producer do primeiro evento)

No `order-service`:

Fluxo:

```text
createOrder -> salva no DB (status: CREATED) -> publica evento order-created
```

Evento:

```json
{
  "eventName": "order-created",
  "payload": { "orderId": "uuid", "userId": "abc", "items": [] }
}
```

Criterio:

- criar pedido resulta em mensagem no topico `order-created`

---

## 6. payment-service (consumer -> producer)

Criar um app novo em `projects/stream/apps/payment-service`.

Fluxo:

```text
consome order-created -> processa pagamento (mock) -> publica payment-processed
```

Criterio:

- ao publicar `order-created`, aparece `payment-processed`

---

## 7. inventory-service (consumer -> producer)

Criar `projects/stream/apps/inventory-service`.

Fluxo:

```text
consome payment-processed -> atualiza estoque (mock) -> publica inventory-updated
```

Criterio:

- ao aparecer `payment-processed`, aparece `inventory-updated`

---

## 8. notification-service (consumer final)

Criar `projects/stream/apps/notification-service`.

Fluxo:

```text
consome inventory-updated -> envia notificacao (mock) -> termina
```

Criterio:

- ao aparecer `inventory-updated`, o servico registra "notificado"

---

## 9. Idempotencia (obrigatorio)

Em cada consumidor:

- antes de processar, checa `processed_events` por `eventId`
- se ja existe: ignora (safe no-op)
- se nao existe: processa e grava `eventId`

Criterio:

- eventos duplicados nao geram efeitos colaterais duplicados

---

## 10. Falhas, retry e DLQ (streams)

Defina uma estrategia minima (sem sofisticacao no inicio):

- em erro "recuperavel": retry (reprocessar a mesma mensagem)
- em erro "nao recuperavel": publica em um DLQ (ex.: `order-created-dlq`, `payment-processed-dlq`)

Inclua no DLQ:

- evento original
- erro (mensagem + stack curta)
- timestamp

Criterio:

- falhas nao travam o pipeline; ficam observaveis e reprocessaveis

---

## 11. Logs estruturados (rastreabilidade)

Cada servico deve logar pelo menos:

```text
[service] received eventName=... eventId=... correlationId=... topic=... partition=... offset=...
[service] processing ...
[service] done
```

Criterio:

- da para reconstruir o caminho de um pedido olhando so os logs

---

# Ordem resumida (checklist)

```text
[ ] config + env (todos os servicos)
[ ] db conectado
[ ] kafka conectado (Apache)
[ ] topicos criados
[ ] contrato/envelope + zod
[ ] order-service publica order-created
[ ] payment-service consome/publica payment-processed
[ ] inventory-service consome/publica inventory-updated
[ ] notification-service consome inventory-updated
[ ] idempotencia por eventId (processed_events por servico)
[ ] retry + DLQ por topico
[ ] logging estruturado
```

---

# Regras durante o desenvolvimento

- Nao implemente tudo de uma vez
- Valide cada etapa isoladamente
- So avance quando o anterior estiver estavel

---

# Insight importante

O erro comum e transformar stream em "fila distribuida":

- 1 unico consumidor fazendo tudo
- eventos sem historico/reprocessamento

Comece com o fluxo simples (um topico, um consumidor, um evento novo publicado) e evolua.
