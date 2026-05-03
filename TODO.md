# Ordem de desenvolvimento (stream)

Objetivo: implementar a versão **event-based / stream** descrita no `README.md`, usando Kafka (via Apache) e consumidores independentes.

Infra esperada em `projects/stream/docker-compose.yml`:

* PostgreSQL;
* Apache (Kafka API).

---

## 1. Fundação (config + conexões)

Objetivo: garantir que cada serviço sobe sem erro.

* `dotenv` carregando;
* validação com `zod` (env + payload de eventos);
* conexão com PostgreSQL via `pg`;
* conexão com Kafka via `kafkajs`;
* logging com `pino` (ou `packages/logger`).

Critério de sucesso:

* O processo sobe;
* consegue conectar no DB;
* consegue conectar no broker Kafka.

---

## 2. Tópicos (streams) e grupos de consumo

Defina (no mínimo) os tópicos:

* `order-created`;
* `payment-processed`;
* `inventory-updated`.

Defina grupos (um por serviço consumidor):

* `payment-service`;
* `inventory-service`;
* `notification-service`.

Critério:

* consegue publicar e consumir manualmente (ex.: via `rpk` / tooling do Apache).

---

## 3. Contratos de eventos (shape + validação)

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

* `eventId` único (base para idempotência);
* `correlationId` estável ao longo do fluxo (rastreio);
* `payload` validado com `zod` no consumidor (fail-fast).

Critério:

* eventos inválidos são rejeitados de forma previsível (log + DLQ ou drop controlado).

---

## 4. Modelo de dados mínimo (por serviço)

Em streams, cada serviço deve manter seu próprio estado (mesmo que, no laboratório, tudo use o mesmo Postgres com schemas separados).

Mínimo recomendado:

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

Critério:

* cada serviço consegue persistir seu próprio progresso (mesmo que seja só `processed_events` no início).

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

Critério:

* criar pedido resulta em mensagem no tópico `order-created`.

---

## 6. payment-service (consumer -> producer)

Criar um app novo em `projects/stream/apps/payment-service`.

Fluxo:

```text
consome order-created -> processa pagamento (mock) -> publica payment-processed
```

Critério:

* ao publicar `order-created`, aparece `payment-processed`.

---

## 7. inventory-service (consumer -> producer)

Criar `projects/stream/apps/inventory-service`.

Fluxo:

```text
consome payment-processed -> atualiza estoque (mock) -> publica inventory-updated
```

Critério:

* ao aparecer `payment-processed`, aparece `inventory-updated`.

---

## 8. notification-service (consumer final)

Criar `projects/stream/apps/notification-service`.

Fluxo:

```text
consome inventory-updated -> envia notificação (mock) -> termina
```

Critério:

* ao aparecer `inventory-updated`, o serviço registra "notificado".

---

## 9. Idempotência (obrigatório)

Em cada consumidor:

* antes de processar, checa `processed_events` por `eventId`;
* se já existe: ignora (safe no-op);
* se não existe: processa e grava `eventId`.

Critério:

* eventos duplicados não geram efeitos colaterais duplicados.

---

## 10. Falhas, retry e DLQ (streams)

Defina uma estratégia mínima (sem sofisticação no início):

* em erro "recuperável": retry (reprocessar a mesma mensagem);
* em erro "não recuperável": publica em um DLQ (ex.: `order-created-dlq`, `payment-processed-dlq`).

Inclua no DLQ:

* evento original;
* erro (mensagem + stack curta);
* timestamp.

Critério:

* falhas não travam o pipeline; ficam observáveis e reprocessáveis.

---

## 11. Logs estruturados (rastreabilidade)

Cada serviço deve logar pelo menos:

```text
[service] received eventName=... eventId=... correlationId=... topic=... partition=... offset=...
[service] processing ...
[service] done
```

Critério:

* dá para reconstruir o caminho de um pedido olhando só os logs.

---

# Ordem resumida (checklist)

```text
[ ] config + env (todos os serviços)
[ ] db conectado
[ ] kafka conectado (Apache)
[ ] tópicos criados
[ ] contrato/envelope + zod
[ ] order-service publica order-created
[ ] payment-service consome/publica payment-processed
[ ] inventory-service consome/publica inventory-updated
[ ] notification-service consome inventory-updated
[ ] idempotência por eventId (processed_events por serviço)
[ ] retry + DLQ por tópico
[ ] logging estruturado
```

---

# Regras durante o desenvolvimento

* Não implemente tudo de uma vez.
* Valide cada etapa isoladamente.
* Só avance quando o anterior estiver estável.

---

# Insight importante

O erro comum é transformar stream em "fila distribuída":

* 1 único consumidor fazendo tudo;
* eventos sem histórico/reprocessamento.

Comece com o fluxo simples (um tópico, um consumidor, um evento novo publicado) e evolua.