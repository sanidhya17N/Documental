# Documental Frontend

React + TypeScript + Tailwind CSS UI for the Documental / DocMind backend.

## Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173).

Ensure the Spring Boot API is running on `http://localhost:8081`.

## Environment

Copy or edit `.env`:

```
VITE_API_BASE_URL=http://localhost:8081/api/v1
```

Vite also proxies `/api` → `http://localhost:8081` if you point the client at a relative base.

## Features

- **Home** — hero + feature cards
- **Documents** — list, filter, delete, open chunk viewer
- **Upload dialog** — multi-file dropzone with upload + indexing progress bars
- **Chat** — RAG Q&A, markdown answers, feature templates, source citations
- **Knowledge Base** — saved Q&A, semantic search for clauses / concepts / facts
- **Document viewer** — chunk sidebar + snippet detail with page/chunk metadata
- **Settings** — local preferences
