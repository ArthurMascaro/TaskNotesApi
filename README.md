# Task Notes API

API REST para gerenciamento de tarefas/anotações, desenvolvida com NestJS, TypeScript, PostgreSQL, Redis e Docker.

O objetivo do projeto é demonstrar o uso de Docker Compose com múltiplos serviços, variáveis de ambiente, volumes Docker, cache com Redis e publicação de imagem Docker por meio do GitHub Actions.

---

## Tecnologias utilizadas

* Node.js
* NestJS
* TypeScript
* PostgreSQL
* Redis
* Docker
* Docker Compose
* GitHub Actions
* GitHub Container Registry

---

## Serviços Docker

O projeto possui três serviços principais:

### API

Serviço principal da aplicação.

Responsável por:

* Expor os endpoints HTTP;
* Criar, listar, buscar, atualizar, concluir e remover tarefas;
* Conectar com o PostgreSQL;
* Conectar com o Redis;
* Utilizar variáveis de ambiente.

### PostgreSQL

Banco de dados relacional usado para persistir as tarefas.

O serviço utiliza volume Docker para manter os dados mesmo após reiniciar os containers.

Volume utilizado:

```yml
postgres_data:/var/lib/postgresql/data
```

### Redis

Serviço de cache utilizado no endpoint de listagem de tarefas.

O Redis armazena temporariamente o resultado do endpoint `GET /tasks`, evitando consultas desnecessárias ao banco de dados.

Volume utilizado:

```yml
redis_data:/data
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`.

Exemplo:

```env
API_PORT=3000

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=task_notes

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_TTL=30

TYPEORM_SYNCHRONIZE=true
```

---

## Como rodar o projeto com Docker Compose

Na raiz do projeto, execute:

```bash
docker compose up --build
```

A API ficará disponível em:

```txt
http://localhost:3000
```

---

## Como parar os containers

```bash
docker compose down
```

---

## Como parar os containers e remover os volumes

```bash
docker compose down -v
```

Esse comando remove também os dados salvos no PostgreSQL e no Redis.

---

## Endpoints da API

### Criar tarefa

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Estudar Docker",
    "description": "Revisar Docker Compose, volumes e variáveis de ambiente"
  }'
```

---

### Listar tarefas

```bash
curl http://localhost:3000/tasks
```

Esse endpoint utiliza cache com Redis.

---

### Buscar tarefa por ID

```bash
curl http://localhost:3000/tasks/ID_DA_TAREFA
```

---

### Atualizar tarefa

```bash
curl -X PATCH http://localhost:3000/tasks/ID_DA_TAREFA \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Estudar Docker Compose"
  }'
```

---

### Concluir tarefa

```bash
curl -X PATCH http://localhost:3000/tasks/ID_DA_TAREFA/done
```

---

### Remover tarefa

```bash
curl -X DELETE http://localhost:3000/tasks/ID_DA_TAREFA
```

---

## Funcionamento do cache com Redis

O endpoint `GET /tasks` utiliza Redis para armazenar temporariamente a listagem de tarefas.

Fluxo do cache:

1. A API verifica se existe uma chave de cache no Redis.
2. Caso exista, retorna os dados armazenados no Redis.
3. Caso não exista, busca as tarefas no PostgreSQL.
4. Salva o resultado no Redis por alguns segundos.
5. Retorna a listagem para o usuário.

A chave de cache é invalidada quando uma tarefa é:

* Criada;
* Atualizada;
* Concluída;
* Removida.

Dessa forma, a API evita retornar dados desatualizados.

---

## Testando o Redis

Após chamar o endpoint:

```bash
curl http://localhost:3000/tasks
```

Acesse o Redis:

```bash
docker exec -it task-notes-redis redis-cli
```

Liste as chaves:

```bash
keys *
```

A chave esperada é:

```txt
tasks:list
```

Para visualizar o conteúdo:

```bash
get tasks:list
```

Para consultar o tempo restante de cache:

```bash
ttl tasks:list
```

---

## Dockerfile da API

O projeto possui um `Dockerfile` responsável por gerar a imagem Docker da aplicação.

A imagem:

* Usa Node.js;
* Instala as dependências;
* Faz o build da aplicação NestJS;
* Executa a API em modo produção.

---

## GitHub Actions

O projeto possui um workflow em:

```txt
.github/workflows/docker-image.yml
```

Esse workflow é executado quando ocorre:

* Push na branch `main`;
* Publicação de uma release.

O workflow realiza:

1. Checkout do repositório;
2. Login no GitHub Container Registry;
3. Geração de metadados da imagem Docker;
4. Build da imagem da API;
5. Publicação da imagem no GHCR.

---

## Imagem Docker publicada

Após o workflow executar com sucesso, a imagem da API será publicada no GitHub Container Registry.

---

## Exemplo de uso externo da imagem

A imagem publicada pode ser utilizada em outro projeto sem precisar clonar o código-fonte da API.

Exemplo de `docker-compose.yml` externo:

```yml
services:
  api:
    image: ghcr.io/SEU_USUARIO/task-notes-api:latest
    container_name: task-notes-api
    ports:
      - "3000:3000"
    environment:
      API_PORT: 3000
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: task_notes
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_TTL: 30
      TYPEORM_SYNCHRONIZE: true
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    container_name: task-notes-postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: task_notes
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: task-notes-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Estrutura principal do projeto

```txt
src/
  tasks/
    dto/
    task.entity.ts
    task-status.enum.ts
    tasks.controller.ts
    tasks.module.ts
    tasks.service.ts
  redis/
    redis.module.ts
    redis.service.ts
  app.module.ts
  main.ts

.github/
  workflows/
    docker-image.yml

Dockerfile
docker-compose.yml
.env.example
README.md
```

---

## Comandos úteis

Subir o projeto:

```bash
docker compose up --build
```

Parar containers:

```bash
docker compose down
```

Remover containers e volumes:

```bash
docker compose down -v
```

Ver containers em execução:

```bash
docker ps
```

Ver volumes criados:

```bash
docker volume ls
```

Ver logs da API:

```bash
docker logs task-notes-api
```

Acessar o Redis:

```bash
docker exec -it task-notes-redis redis-cli
```

Acessar o PostgreSQL:

```bash
docker exec -it task-notes-postgres psql -U admin -d task_notes
```
