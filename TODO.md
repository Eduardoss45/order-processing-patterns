# ✔️ Ordem de desenvolvimento (queue)

## 1. Fundação (config + conexão)

Objetivo: garantir que o serviço sobe sem erro.

- `dotenv` carregando
- validação com `zod`
- conexão com PostgreSQL via `pg`

✔️ Critério de sucesso:

- serviço sobe
- conexão com DB funciona

---

## 2. Modelo de dados mínimo

Crie apenas o essencial:

```sql
CREATE SCHEMA order_service;

CREATE TABLE order_service.orders (
  id TEXT PRIMARY KEY,
  status TEXT
);
```

✔️ Critério:

- consegue inserir e ler pedidos

---

## 3. Camada de domínio (order)

Implemente:

- `order.repository`
- `order.service`

Fluxo:

```text
createOrder → salva no banco (status: CREATED)
```

✔️ Critério:

- consegue criar pedido via código

---

## 4. Integração com RabbitMQ (producer)

Implemente:

- conexão
- criação da fila `orders`
- envio de mensagem

Mensagem inicial:

```json
{
  "type": "process-order",
  "orderId": "uuid"
}
```

✔️ Critério:

- mensagem aparece na fila (UI do RabbitMQ)

---

## 5. Conectar domínio + mensageria

No `order-service`:

```text
createOrder → salva no DB → envia mensagem para fila
```

✔️ Critério:

- criar pedido gera mensagem na fila

---

## 6. Criar worker-service (consumer)

Estrutura separada:

```bash
worker-service/
  messaging/consumer/
  modules/
```

Implementar:

- conexão com RabbitMQ
- consumo da fila `orders`

✔️ Critério:

- worker recebe mensagem

---

## 7. Handler do worker (fluxo sequencial)

Implementar no worker:

```text
processOrder:
  1. processPayment
  2. updateInventory
  3. sendNotification
```

Inicialmente:

- tudo mock (console.log)

✔️ Critério:

- fluxo completo executa

---

## 8. Atualização de estado no banco

Worker atualiza:

```text
CREATED → PAID → INVENTORY_UPDATED → COMPLETED
```

✔️ Critério:

- status muda corretamente no DB

---

## 9. Idempotência (primeiro nível)

Criar tabela:

```sql
CREATE TABLE order_service.processed_events (
  event_id TEXT PRIMARY KEY
);
```

No worker:

```text
se já processado → ignora
```

✔️ Critério:

- duplicação não quebra fluxo

---

## 10. Retry + DLQ

Configurar:

- retry manual (NACK)
- dead letter queue

Filas:

```text
orders
orders-dlq
```

✔️ Critério:

- falha vai para retry
- excedeu limite → DLQ

---

## 11. Logs estruturados

Usar seu pacote de logger:

- entrada da mensagem
- início processamento
- sucesso / erro

✔️ Critério:

- consegue rastrear fluxo só pelos logs

---

# ✔️ Ordem resumida (checklist)

```text
[ ] config + env
[ ] db conectado
[ ] tabela orders
[ ] domínio (createOrder)
[ ] producer RabbitMQ
[ ] integração order → fila
[ ] worker consumer
[ ] fluxo sequencial no worker
[ ] persistência de status
[ ] idempotência
[ ] retry + DLQ
[ ] logging
```

---

# ⚠️ Regras durante o desenvolvimento

- Não implemente tudo de uma vez
- Valide **cada etapa isoladamente**
- Só avance quando o anterior estiver estável

---

# 💡 Insight importante

O erro comum é começar por:

- múltiplos serviços
- múltiplas filas
- lógica distribuída

Isso mata o aprendizado.

> Comece com **um fluxo simples e controlado**, depois adicione complexidade.
