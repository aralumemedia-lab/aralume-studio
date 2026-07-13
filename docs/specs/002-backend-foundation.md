# Spec 002 - Backend Foundation

## Status
Planejada.

## Objetivo
Criar a fundacao backend da Aralume Studio sem implementar o dominio completo ainda.

## Contexto
Esta spec abre a fase backend depois da base documental e da migracao segura de ambiente. O objetivo e estabelecer o runtime principal, o padrao de resposta, a validacao de ambiente e a primeira superficie HTTP estavel para a plataforma.

## Pre-condicoes
- `AGENTS.md` com SDD integrado.
- `docs/specs/000-sdd-process.md` existe.
- `docs/specs/001-environment-safe-migration.md` existe.
- `docs/ENVIRONMENT.md` existe.
- `.env.example` existe.
- `.gitignore` protege segredos.
- `main` limpo.
- `npm run lint`, `npx tsc --noEmit` e `npm run build` passando.

## Escopo
- Estrutura backend.
- Validacao de ambiente.
- Servidor HTTP basico.
- Endpoint de health check.
- Envelope padrao de resposta.
- Envelope padrao de erro.
- Logger simples.
- Middlewares essenciais.
- Documentacao de setup.
- Scripts de dev/build/check para backend, se aplicavel.
- Testes minimos, se a stack permitir sem excesso.

## Fora de escopo
- Dominio de Canais.
- CRUD real.
- Integracao frontend-backend.
- Autenticacao real.
- Supabase.
- IA.
- Video.
- Publicacao.
- OAuth.
- Workers.
- Filas.
- Renderizacao.

## Fontes de verdade
- `AGENTS.md`
- `docs/PROJECT_MASTER.md`
- `docs/NEXT_SPRINTS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/FRONTEND_API_CONTRACTS.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/specs/000-sdd-process.md`
- `docs/specs/001-environment-safe-migration.md`

## Entidades e contratos relevantes
### Envelope de sucesso
```json
{
  "data": {},
  "meta": {}
}
```

### Envelope de erro
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Resposta de health check
```json
{
  "ok": true,
  "service": "aralume-api",
  "environment": "development",
  "version": "0.1.0"
}
```

## Regras obrigatorias
- O backend principal deve usar Node.js, TypeScript, Express, Zod e Postgres com Drizzle apenas quando a implementacao concreta desta fase exigir persistencia.
- Python nao entra na fundacao principal; ele pode existir no futuro apenas como worker desacoplado para midia, IA, FFmpeg ou LangGraph.
- Toda resposta HTTP publica deve seguir o envelope aprovado.
- Todo erro publico deve seguir o envelope de erro aprovado.
- A validacao de ambiente deve falhar cedo quando variaveis obrigatorias nao existirem.
- O health check deve ser simples e deterministico.

## Endpoints esperados
- `GET /health`

## Validacoes
- Subir o servidor localmente.
- Confirmar o retorno do health check.
- Confirmar a validacao de ambiente.
- Confirmar a consistencia dos envelopes.

## Critrios de aceite
- Backend foundation existe.
- Health check validavel.
- Validacao de ambiente existe.
- Envelope de resposta e erro existem.
- Documentacao de setup existe.
- Frontend continua saudavel.
- Nenhum dominio real foi implementado.
- Nenhum segredo foi exposto.

## Proxima sprint recomendada
Sprint 3 - Channels Domain Foundation.

