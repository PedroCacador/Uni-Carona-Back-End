# UniCarona — Back-end

API REST para o **UniCarona**, aplicativo de caronas universitárias que conecta motoristas e passageiros de forma segura e organizada.

## Status do projeto

| Item | Status |
|------|--------|
| API REST | Funcional |
| Autenticação JWT | Funcional |
| Recuperação de senha | Funcional (Resend em production, mock em dev) |
| Testes automatizados | 146 testes passando |
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

### Deploy do banco (PostgreSQL / Supabase)

Após configurar `DATABASE_URL` no `.env`:

```bash
# Aplicar migrations no banco remoto
npm run db:migrate

# (Opcional) Popular dados de exemplo
npm run db:seed

# Verificar status das migrations
npm run db:status
```

Em produção, configure também `JWT_SECRET`, `RESEND_API_KEY` e `MAIL_FROM` antes de subir a API.

```bash
npm run build
npm start
```

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
| `JWT_SECRET` | Sim | Chave secreta para tokens JWT (não pode ficar vazia; validada na inicialização) |
| `PORT` | Não | Porta HTTP (padrão: 3333) |
| `JWT_EXPIRES_IN` | Não | Expiração do JWT (padrão: 1d) |
| `RESET_PASSWORD_EXPIRES_MINUTES` | Não | Expiração do código de recuperação (padrão: 15) |
| `RESEND_API_KEY` | Sim em `NODE_ENV=production` | API Key do Resend |
| `MAIL_FROM` | Sim em `NODE_ENV=production` | Remetente (ex.: `UniCarona <onboarding@resend.dev>`) |
| `NODE_ENV` | Não | `development` = mock; `production` = Resend |

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
| POST | `/auth/esqueci-senha` | Solicitar código de recuperação por e-mail |
| POST | `/auth/validar-codigo` | Validar código de 6 dígitos (opcional: `email`) |
| POST | `/auth/redefinir-senha` | Redefinir senha com código + nova senha |

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
  "message": "Se o e-mail existir, um código de recuperação foi enviado."
}
```

> Em `NODE_ENV=development`, o envio é simulado (`MockEmailService`). Em `NODE_ENV=production`, o e-mail é enviado via **Resend** (`ResendEmailService`) com o código de 6 dígitos (sem link).

### Configurar Resend (production)

1. Crie conta em [resend.com](https://resend.com).
2. Gere API Key em [resend.com/api-keys](https://resend.com/api-keys).
3. Para testes, use `onboarding@resend.dev` como remetente — **só envia para o e-mail da conta Resend**. Para produção, verifique seu domínio no dashboard.
4. Configure no `.env`:

```env
NODE_ENV=production
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM=UniCarona <onboarding@resend.dev>
```

### Testar localmente

- **Sem Resend:** `NODE_ENV=development` → `POST /auth/esqueci-senha` e logs `[MockEmailService]`.
- **Com Resend:** `NODE_ENV=production` + `RESEND_API_KEY` + `MAIL_FROM`, reinicie o servidor e teste o mesmo endpoint.

### Validar código (mobile)

```http
POST /auth/validar-codigo
Content-Type: application/json

{
  "codigo": "123456",
  "email": "usuario@email.com"
}
```

Resposta quando válido:

```json
{ "valid": true }
```

> O campo `email` é opcional; quando informado, o código deve pertencer a esse usuário.

### Redefinir senha

```http
POST /auth/redefinir-senha
Content-Type: application/json

{
  "codigo": "123456",
  "novaSenha": "nova_senha_123"
}
```

> O controller também aceita `token` como alias de `codigo` por compatibilidade.

### Health check

```http
GET /health
```

---

## Fluxo de recuperação de senha

1. Usuário envia e-mail em `POST /auth/esqueci-senha`
2. Sistema valida formato, busca usuário ativo (sem revelar existência)
3. Gera código numérico de 6 dígitos (`crypto.randomInt`), armazena **hash SHA-256** + expiração
4. Envia o código por e-mail (mock em dev ou Resend em production)
5. App mobile valida em `POST /auth/validar-codigo` (opcional, não consome o código)
6. Usuário envia código + nova senha em `POST /auth/redefinir-senha`
7. Senha atualizada com bcrypt; hash do código invalidado (uso único)

---

## Riscos e melhorias

| Item | Prioridade | Status |
|------|------------|--------|
| Rate limiting nos endpoints de auth | Alta | Implementado |
| Normalizar e-mail no cadastro | Média | Implementado |
| Fila/retry de e-mails em falha transitória | Média | Pendente |
| CI/CD com GitHub Actions | Média | Pendente |
| Verificar domínio no Resend para envio a qualquer destinatário | Alta | Pendente (obrigatório em production) |

---

## Licença

ISC
