# UniCarona — Back-end

API REST para o **UniCarona**, aplicativo de caronas universitárias que conecta motoristas e passageiros de forma segura e organizada.

## Status do projeto

| Item | Status |
|------|--------|
| API REST | Funcional |
| Autenticação JWT | Funcional |
| Recuperação de senha | Funcional (e-mail mock em dev) |
| Testes automatizados | 80+ testes passando |
| Pronto para GitHub | Sim |
| Pronto para produção | Parcial — ver [Riscos e melhorias](#riscos-e-melhorias) |

---

## Tecnologias

- **Node.js** + **TypeScript**
- **Express 5** — rotas HTTP
- **Prisma 7** + **PostgreSQL** — ORM e banco de dados
- **bcryptjs** — hash de senhas
- **jsonwebtoken** — autenticação JWT
- **Jest** + **Supertest** — testes unitários e HTTP

---

## Arquitetura

O projeto segue camadas bem definidas:

```
src/
├── controllers/   # Entrada HTTP, validação de payload, respostas
├── services/      # Regras de negócio
├── repositories/  # Acesso ao banco (Prisma)
├── routes/        # Definição de rotas
├── middlewares/   # Auth JWT, controle de roles
├── utils/         # Validadores e helpers
└── database/      # Cliente Prisma
```

**Padrão:** `Route → Controller → Service → Repository → Database`

---

## Funcionalidades

- Cadastro e gestão de usuários
- Autenticação JWT com roles (`USER`, `ADMIN`)
- **Recuperação de senha** (token seguro + expiração)
- CRUD de veículos, caronas e reservas
- Sistema de avaliações pós-carona
- Integração com mapas (geocoding e rotas via OpenStreetMap)
- Health check

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm

---

## Instalação

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd Back_end

# 2. Instalar dependências (gera o Prisma Client automaticamente)
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Aplicar migrations
npm run db:migrate

# 5. Popular banco com dados de exemplo (opcional)
npm run db:seed
```

---

## Executar

```bash
# Desenvolvimento (hot-reload)
npm run dev

# Produção
npm run build
npm start
```

Servidor padrão: `http://localhost:3333`

---

## Testes

```bash
# Todos os testes
npm test

# Apenas autenticação / recuperação de senha
npm run test:auth

# Verificação de tipos (lint)
npm run lint
```

---

## Variáveis de ambiente

Copie `.env.example` para `.env`:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL |
| `JWT_SECRET` | Sim | Chave secreta para tokens JWT |
| `PORT` | Não | Porta HTTP (padrão: 3333) |
| `JWT_EXPIRES_IN` | Não | Expiração do JWT (padrão: 1d) |
| `RESET_PASSWORD_EXPIRES_MINUTES` | Não | Expiração do token de reset (padrão: 15) |
| `FRONTEND_URL` | Não | URL base para link de recuperação |
| `MAIL_*` | Não | Reservado para integração de e-mail futura |

> **Nunca** commite o arquivo `.env` — ele está no `.gitignore`.

---

## Estrutura do projeto

```
Back_end/
├── prisma/
│   ├── schema.prisma          # Modelos do banco
│   ├── migrations/            # Histórico de migrations
│   └── seed.ts                # Dados iniciais
├── scripts/
│   └── create-caronas.ts      # Script auxiliar de desenvolvimento
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middlewares/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── postman_collection.json    # Collection Postman
├── .env.example
├── jest.config.js
└── tsconfig.json
```

---

## Endpoints principais

### Autenticação (público)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login com e-mail e senha |
| POST | `/auth/esqueci-senha` | Solicitar recuperação de senha |
| POST | `/auth/redefinir-senha` | Redefinir senha com token |

### Usuários

| Método | Rota | Auth |
|--------|------|------|
| POST | `/usuarios` | Não |
| GET | `/usuarios` | Admin |
| GET/PATCH/DELETE | `/usuarios/:id` | Sim |

### Caronas, Reservas, Veículos, Avaliações, Maps

Consulte `postman_collection.json` para a lista completa.

---

## Exemplos de requisição

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "alice@exemplo.com",
  "senha": "senha_segura_123"
}
```

### Recuperação de senha

```http
POST /auth/esqueci-senha
Content-Type: application/json

{
  "email": "usuario@email.com"
}
```

Resposta (sempre genérica — anti-enumeração):

```json
{
  "message": "Se o e-mail existir, um link de recuperação foi enviado."
}
```

> Em desenvolvimento, o link aparece no console do servidor (`MockEmailService`).

### Redefinir senha

```http
POST /auth/redefinir-senha
Content-Type: application/json

{
  "token": "TOKEN_RECEBIDO_NO_EMAIL",
  "novaSenha": "nova_senha_123"
}
```

### Health check

```http
GET /health
```

---

## Fluxo de recuperação de senha

1. Usuário envia e-mail em `POST /auth/esqueci-senha`
2. Sistema valida formato, busca usuário ativo (sem revelar existência)
3. Gera token criptográfico (32 bytes), armazena **hash SHA-256** + expiração
4. Envia link por e-mail (mock em dev)
5. Usuário envia token + nova senha em `POST /auth/redefinir-senha`
6. Senha atualizada com bcrypt, token invalidado (uso único)

---

## Riscos e melhorias

| Item | Prioridade |
|------|------------|
| Rate limiting nos endpoints de auth | Alta |
| Provedor de e-mail real (SendGrid/SMTP) | Alta |
| CI/CD com GitHub Actions | Média |
| Normalizar e-mail no cadastro | Média |

---

## Licença

ISC
