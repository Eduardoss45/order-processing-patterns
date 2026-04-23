# Order Pipeline — Queue vs Stream

## Objetivo

Este projeto existe para comparar **dois modelos arquiteturais distintos** usando o mesmo domínio:

* Versão 1: **Orientada a fila (task-based)**
* Versão 2: **Orientada a stream (event-based)**

O objetivo NÃO é trocar tecnologia. O objetivo é entender como o **modelo mental muda**.

---

# Domínio

Sistema simplificado de processamento de pedidos.

Um pedido passa por 3 etapas:

1. Pagamento
2. Atualização de estoque
3. Notificação ao usuário

---

# Estrutura do repositório

```
order-pipeline/
  queue-version/
  stream-version/
  shared/
```

* `shared/`: tipos, contratos JSON e utilitários

---

# Versão 1 — Arquitetura com FILA

## Modelo mental

* Mensagem = **tarefa a ser executada**
* Um consumidor processa cada mensagem
* Foco: **execução confiável**

---

## Componentes

### 1. order-service

Responsável por:

* Criar pedidos
* Enviar tarefa para fila

### 2. order-worker (orquestrador)

Responsável por:

* Consumir mensagens da fila
* Executar TODAS as etapas do pedido

### 3. Filas

* `orders`
* `orders-dlq` (dead letter)

---

## Fluxo detalhado

1. order-service cria pedido

```json
{
  "orderId": "123",
  "userId": "abc",
  "items": [{ "productId": "p1", "qty": 2 }]
}
```

2. Envia mensagem para fila `orders`

Mensagem:

```json
{
  "type": "process-order",
  "payload": { ...order }
}
```

3. order-worker consome a mensagem

4. Executa sequencialmente:

* processPayment(order)
* updateInventory(order)
* sendNotification(order)

5. Se tudo OK → ACK

6. Se falhar:

* retry
* ou DLQ

---

## Responsabilidades claras

| Componente    | Responsabilidade |
| ------------- | ---------------- |
| order-service | Produzir tarefa  |
| order-worker  | Executar tudo    |
| fila          | Buffer + entrega |

---

## Características

* Forte acoplamento de fluxo
* Um ponto central de execução
* Sem histórico após consumo

---

# Versão 2 — Arquitetura com STREAM

## Modelo mental

* Mensagem = **evento (fato ocorrido)**
* Múltiplos consumidores independentes
* Foco: **propagação de estado**

---

## Componentes

### 1. order-service

* Cria pedido
* Publica evento

### 2. payment-service

### 3. inventory-service

### 4. notification-service

Todos independentes.

---

## Tópicos (streams)

* `order-created`
* `payment-processed`
* `inventory-updated`

---

## Fluxo detalhado (SEM ORQUESTRADOR)

### Etapa 1 — criação

order-service publica:

```json
{
  "event": "order-created",
  "orderId": "123",
  "userId": "abc",
  "items": [...]
}
```

---

### Etapa 2 — pagamento

payment-service:

* Consome: `order-created`
* Executa pagamento
* Publica:

```json
{
  "event": "payment-processed",
  "orderId": "123",
  "status": "success"
}
```

---

### Etapa 3 — estoque

inventory-service:

* Consome: `payment-processed`
* Atualiza estoque
* Publica:

```json
{
  "event": "inventory-updated",
  "orderId": "123"
}
```

---

### Etapa 4 — notificação

notification-service:

* Consome: `inventory-updated`
* Envia notificação

---

## Responsabilidades claras

| Serviço              | Consome           | Publica           |
| -------------------- | ----------------- | ----------------- |
| order-service        | -                 | order-created     |
| payment-service      | order-created     | payment-processed |
| inventory-service    | payment-processed | inventory-updated |
| notification-service | inventory-updated | -                 |

---

## Características

* Sem orquestrador central
* Alto desacoplamento
* Histórico persistente
* Reprocessamento possível

---

# Diferença crítica

## Fila

```text
"Faça isso"
```

## Stream

```text
"Isso aconteceu"
```

---

# Regras obrigatórias do projeto

## 1. Idempotência

Todos os consumidores devem suportar mensagens duplicadas.

---

## 2. Falhas

Simular:

* queda de serviço
* retry
* duplicação

---

## 3. Logs obrigatórios

Cada etapa deve logar:

```
[service] received event
[service] processing
[service] done
```

---

# O que validar

## Na versão fila

* Apenas um worker executa o fluxo
* Mensagem desaparece após consumo

## Na versão stream

* Múltiplos serviços reagem ao mesmo evento
* Eventos permanecem disponíveis

---

# Critério de sucesso

Você deve conseguir responder sem hesitação:

* Quem produz cada mensagem?
* Quem consome?
* A mensagem representa ação ou fato?
* É possível reprocessar?

Se qualquer resposta não estiver clara, a arquitetura está incorreta.

---

# Observação final

Se a versão stream parecer apenas uma fila distribuída, o modelo foi implementado errado.

O objetivo é internalizar:

* Fila = execução
* Stream = histórico + reação
