# Documental

Document intelligence app: upload documents, search them semantically, and chat with grounded answers plus citations. Built as a Spring Boot RAG API with a React frontend.

## Live links

| What | URL | Who |
|------|-----|-----|
| **App (frontend)** | [https://documental-jet.vercel.app](https://documental-jet.vercel.app) | Anyone — sign up / log in and use the product |
| **API (backend)** | [https://documental-api.onrender.com](https://documental-api.onrender.com) | Service health / root |
| **API docs (Swagger)** | [https://documental-api.onrender.com/swagger-ui.html](https://documental-api.onrender.com/swagger-ui.html) | Developers exploring endpoints |
| **Database (Neon)** | [https://console.neon.tech](https://console.neon.tech) | You (owner) — SQL editor & tables after login |
| **Source code** | [https://github.com/sanidhya17N/documental](https://github.com/sanidhya17N/documental) | Public repo |

**Viewers:** open the Vercel app link, create an account, upload documents, and use Chat / Knowledge Base.

**You (data access):** open Neon Console → your project → **SQL Editor** (or Tables) to inspect users, documents, chunks, and the `vector_store` embeddings table. Connection details and passwords stay in Neon / Render env vars — do not commit them.

> Render free tier may spin the API down after idle time. The first request after sleep can take ~30–60s.

## Features

- **Auth** — JWT signup / login; each user’s documents and RAG scope are private
- **Upload** — PDF, DOCX, TXT (and similar); progress UI; chunking + embeddings into Postgres/`pgvector`
- **Documents** — list, open viewer, browse chunks
- **Chat** — RAG answers with citations; prompt templates; streaming when available
- **Knowledge Base** — semantic search across clauses / concepts / facts-style queries
- **Settings** — account-oriented preferences in the UI

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, TypeScript, Vite, Tailwind CSS — hosted on **Vercel** |
| Backend | Java 21, Spring Boot, Spring AI (Gemini), Spring Security JWT — hosted on **Render** (Docker) |
| Database | PostgreSQL + **pgvector** on **Neon** |

## Architecture (deployed)

```
Browser  →  Vercel (React)
                │
                ▼  VITE_API_BASE_URL
         Render (Spring Boot API)
                │
                ▼  JDBC + SSL
         Neon (Postgres + pgvector)
                │
                ▼
         Google Gemini (chat + embeddings)
```

## Local development

### Prerequisites

- JDK 21+, Maven (or `./mvnw`)
- Node.js 20+
- Docker (optional) for local Postgres via `docker-compose.yml`
- A Gemini API key

### Backend

```bash
# optional: start local Postgres + pgvector
docker compose up -d

export GEMINI_API_KEY=your-key
export JWT_SECRET=change-me-to-a-long-random-string
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

API defaults to `http://localhost:8081` (Swagger at `/swagger-ui.html`).

### Frontend

```bash
cd frontend
npm install
# optional if not using Vite proxy:
# echo 'VITE_API_BASE_URL=http://localhost:8081/api/v1' > .env
npm run dev
```

App: `http://localhost:5173`

## Deployed environment (reference)

Set these on **Render** (not in git):

| Variable | Purpose |
|----------|---------|
| `SPRING_PROFILES_ACTIVE` | `dev` (current deploy profile) |
| `SPRING_DATASOURCE_URL` | Neon JDBC URL (`jdbc:postgresql://...neon.tech/neondb?sslmode=require`) |
| `SPRING_DATASOURCE_USERNAME` | Neon role (e.g. `neondb_owner`) |
| `SPRING_DATASOURCE_PASSWORD` | Neon password |
| `GEMINI_API_KEY` | Google Gemini key |
| `JWT_SECRET` | Long random secret for JWT signing |

On **Vercel** (frontend):

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://documental-api.onrender.com/api/v1` |

CORS allows `https://documental-jet.vercel.app` and local Vite origins.

## Project layout

```
├── src/                 # Spring Boot API
├── frontend/            # React app (Vercel root: frontend/)
├── Dockerfile           # Render image build
├── docker-compose.yml   # Local Postgres
└── init.sql             # Local DB extensions / bootstrap
```

## License

Private / educational project unless otherwise stated.
