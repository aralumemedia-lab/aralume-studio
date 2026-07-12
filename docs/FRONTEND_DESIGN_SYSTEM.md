# Aralume — Design System

Plataforma SaaS empresarial para operação de uma fábrica editorial multicanal com agentes de IA. Este documento resume os padrões visuais da interface.

## Identidade
- **Nome:** Aralume — combinação sutil de "aura" e "lume" (luz).
- **Símbolo:** um "A" abstrato formado por um feixe luminoso que atravessa uma órbita. Componente reutilizável em `src/components/aralume/AralumeLogo.tsx` com variantes `AralumeIcon`, `AralumeWordmark`, `AralumeLogo` (com prop `compact` para sidebar recolhida).
- **Iconografia:** Lucide (`lucide-react`) com traço `1.5`, cantos suaves, tamanhos padrão 13–16px.

## Tokens (src/styles.css, @theme inline + :root)
- Superfícies: `--background`, `--surface`, `--surface-muted`, `--card`.
- Texto: `--foreground`, `--muted-foreground`.
- Primária: `--primary` (azul profundo oklch 0.46 0.14 250), `--primary-soft`.
- Bordas: `--border`, `--border-strong`, `--input`, `--ring`.
- Status: `--ok`, `--attention`, `--warning`, `--critical`, `--info` (cada uma com variante `-soft`).
- Sidebar: paleta escura própria (`--sidebar`, `--sidebar-active`, `--sidebar-muted`, `--sidebar-border`).
- Raio base `--radius: 0.375rem`.

## Tipografia
- Família: `Inter` (via `<link>` no `__root`), fallback system-ui. Mono: `JetBrains Mono`.
- Escala densa:
  - Página H1: 22–26px, `font-semibold`, `tracking-tight`.
  - H2/Section: 13.5px, `font-semibold`.
  - Corpo: 13px base (body). Tabelas: 12px. Labels/eyebrows: 10.5–11px uppercase 0.06–0.1em.
  - Números: `tabular-nums`.

## Densidade
- Sidebar 248px expandida / 56px recolhida.
- Topbar 56px.
- Linhas de tabela 34px, header 32px.
- Cards com padding 16px (`p-4`). KPIs compactos.
- Botões: h-7 (11.5px) para tabelas, h-8 (12px) para topbar/ações.

## Componentes chave
- **Layout:** `AppShell`, `PageHeader`, `Sidebar` (interno ao AppShell), `Topbar`, `ChannelSwitcher`.
- **Cards:** `Card`, `CardHeader`, `KpiCard`, `SectionHeader`, `EmptyState`, `LoadingState`, `ErrorState` (`components/ui/data-card.tsx`).
- **Tabelas:** `CompactTable<T>` com `Column<T>` (`components/ui/compact-table.tsx`).
- **Progresso:** `ProgressBar` com `tone` semântico.
- **Status Badges:** `StatusBadge` e helpers `ChannelStatusBadge`, `WorkflowStatusBadge`, `AgentStatusBadge`, `RiskBadge`, `CostBadge`, `PublicationStatusBadge`, `ComplianceStatusBadge`, `ApprovalStatusBadge`, `ContentStatusBadge`.

## Padrões de tela
1. `PageHeader` com `eyebrow`, `title`, `description`, `actions`.
2. Faixa de KPIs (grid 2/4/8 colunas conforme viewport).
3. Duas colunas: conteúdo principal (workflows/tabelas) + painel lateral (custos, aprovações, alertas).
4. Todas as tabelas: badge de status por linha, número tabular, ação inline opcional.
5. Ações mockadas usam `sonner` toast; nenhuma chamada real é feita.

## Regras
- **Nunca** usar `text-white`, `bg-black`, cores literais `#hex` em componentes — sempre tokens semânticos.
- Estados obrigatórios em toda página: loading, empty, error, com dados.
- Cores de status seguem estritamente os enums em `src/contracts/status.ts`.
- Todas as páginas consomem `src/services/api-client.ts` (que hoje reexporta `mock-api`) — jamais importar mocks diretamente em componentes de página.
