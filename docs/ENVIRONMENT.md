# Environment Policy

## Policy

- Never commit real environment values.
- Never store secrets in docs, logs, PR descriptions, commits, or screenshots.
- Use `.env.example` as the tracked template and create `.env.local` locally from it.
- The legacy `.env.local` from the old project was used only to extract variable names.
- Any secret that was exposed in the legacy project must be rotated manually by the owner.
- The current frontend consumes only public configuration when needed.

## Local setup

1. Copy `.env.example` to `.env.local` on your machine.
2. Fill the values manually from your own secure source.
3. Keep `.env.local` untracked.
4. Do not paste values into the repo or into issue/PR text.

## What is needed now

- The frontend can operate with the default relative API base `/api`.
- `VITE_ARALUME_API_BASE_URL` is optional and public when the frontend needs an explicit base URL.
- `ARALUME_ASSET_STORAGE_ROOT` is optional for the media asset registry and defaults to a safe local path when not set.

## E13 approved provider inventory

- Approved for E13: YouTube Data API with Google OAuth 2.0.
- Deferred for later documentation: YouTube Analytics API for Sprint 13 metrics.
- Not approved for E13: TikTok, Instagram, LinkedIn.

## What will be used in Backend Foundation

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `ARALUME_ENV`
- `ARALUME_LOG_LEVEL`
- `OPERATOR_ACCOUNTS_JSON`
- `OPERATOR_SESSION_TTL_MINUTES`

## What is future AI / video / publication work

- `ARALUME_OPENAI_API_KEY`
- `ARALUME_TTS_API_KEY`
- `ARALUME_TTS_MODEL`
- `ARALUME_TTS_PROVIDER`
- `ARALUME_TTS_VOICE`
- `ARALUME_FFMPEG_PATH`
- `ARALUME_FFPROBE_PATH`
- `ARALUME_VIDEO_RENDERER`
- `ARALUME_PUBLICATION_OFFICIAL_ADAPTERS`
- `ARALUME_PUBLICATION_TOKEN_SECRET`
- `ARALUME_TIKTOK_ACCOUNT`
- `ARALUME_YOUTUBE_CLIENT_ID`
- `ARALUME_YOUTUBE_CLIENT_SECRET`
- `ARALUME_YOUTUBE_REDIRECT_URI`

## Legacy / review

- `ARALUME_GOOGLE_ACCOUNT`
- `ARALUME_GOOGLE_ACCOUNT_PASSWORD`

## Empty categories

- Provedores de IA: no legacy variables were found.
- Desconhecido: no legacy variables were found.

## Inventory

| Variavel                              | Categoria                    | Uso esperado                                     | Status           |
| ------------------------------------- | ---------------------------- | ------------------------------------------------ | ---------------- |
| ARALUME_APP_NAME                      | Aplicacao                    | Metadados da aplicacao / shell                   | Futura           |
| ARALUME_ENV                           | Aplicacao                    | Ambiente de execucao e configuracoes gerais      | Futura           |
| ARALUME_LOG_LEVEL                     | Observabilidade / logs       | Nivel de log padrao do runtime                   | Futura           |
| DATABASE_URL                          | Banco de dados               | Conexao do backend futuro                        | Futura           |
| TEST_DATABASE_URL                     | Testes                       | Banco isolado para validacoes                    | Futura           |
| OPERATOR_ACCOUNTS_JSON                | Autenticacao                 | Lista de operadores para controle interno futuro | Futura           |
| OPERATOR_SESSION_TTL_MINUTES          | Autenticacao                 | Tempo de sessao do operador                      | Futura           |
| ARALUME_GOOGLE_ACCOUNT                | Legado / revisar             | Conta antiga para revisao manual                 | Legado / revisar |
| ARALUME_GOOGLE_ACCOUNT_PASSWORD       | Legado / revisar             | Credencial antiga para revisao manual            | Legado / revisar |
| ARALUME_OPENAI_API_KEY                | OpenAI / LLM                 | IA futura controlada                             | Futura           |
| ARALUME_TTS_API_KEY                   | Voz / TTS                    | Provedor de voz futuro                           | Futura           |
| ARALUME_TTS_MODEL                     | Voz / TTS                    | Modelo de voz futuro                             | Futura           |
| ARALUME_TTS_PROVIDER                  | Voz / TTS                    | Provedor de voz futuro                           | Futura           |
| ARALUME_TTS_VOICE                     | Voz / TTS                    | Voz padrao do sistema                            | Futura           |
| ARALUME_ASSET_STORAGE_ROOT            | Storage                      | Raiz de armazenamento para midia                 | Futura           |
| ARALUME_FFMPEG_PATH                   | Imagem / video               | Caminho do encoder futuro                        | Futura           |
| ARALUME_FFPROBE_PATH                  | Imagem / video               | Caminho do probe futuro                          | Futura           |
| ARALUME_VIDEO_RENDERER                | Imagem / video               | Motor de renderizacao futuro                     | Futura           |
| ARALUME_PUBLICATION_OFFICIAL_ADAPTERS | YouTube / OAuth / publicacao | Adaptadores oficiais de publicacao aprovados para E13 | E13 aprovado |
| ARALUME_PUBLICATION_TOKEN_SECRET      | YouTube / OAuth / publicacao | Segredo de token para publicacao futura          | Futura           |
| ARALUME_TIKTOK_ACCOUNT                | YouTube / OAuth / publicacao | Conta de publicacao antiga                       | Legado / revisar |
| ARALUME_YOUTUBE_CLIENT_ID             | YouTube / OAuth / publicacao | OAuth de publicacao aprovado para E13            | E13 aprovado     |
| ARALUME_YOUTUBE_CLIENT_SECRET         | YouTube / OAuth / publicacao | OAuth de publicacao aprovado para E13            | E13 aprovado     |
| ARALUME_YOUTUBE_REDIRECT_URI          | YouTube / OAuth / publicacao | Fluxo de OAuth aprovado para E13                 | E13 aprovado     |

## Notes

- The legacy inventory was created from names only.
- No real secret value was copied into the repository.
- Any future backend implementation must keep the same safety rules and continue using manual secret entry.
