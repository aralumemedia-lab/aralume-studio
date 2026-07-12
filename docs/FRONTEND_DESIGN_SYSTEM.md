# Aralume Studio Frontend Design System

## Identity
- Aralume Studio uses a dense SaaS admin visual language.
- The logo family lives in `src/components/aralume/AralumeLogo.tsx` and has icon, wordmark, and compact variants.
- The app uses Lucide icons with restrained stroke weight and small sizes.

## Core tokens
- Theme tokens are defined in `src/styles.css`.
- Surfaces use semantic tokens for background, card, muted surface, border, and ring.
- Status colors are semantic, not literal, and map to project enums in `src/contracts/status.ts`.
- The sidebar has its own dark palette and active state tokens.

## Typography
- Primary font: Inter.
- Mono font: JetBrains Mono.
- The UI is intentionally compact:
- page titles are medium-sized and tight;
- section titles are smaller than standard marketing dashboards;
- body text is small enough for operational tables;
- tables use tabular numerals where possible.

## Density and spacing
- The app favors operational density over roomy consumer UI.
- Sidebar width is wide when expanded and compact when collapsed.
- Topbar height is consistent and shallow.
- Cards use compact padding.
- Table rows are short and readable.
- Actions are small and aligned with admin workflows.

## Components
- Layout primitives: `AppShell`, `Topbar`, `Sidebar`, `PageHeader`, `ChannelSwitcher`.
- Content blocks: `Card`, `CardHeader`, `KpiCard`, `SectionHeader`, `EmptyState`, `LoadingState`, `ErrorState`.
- Tables: `CompactTable`.
- Status elements: `StatusBadge` plus domain-specific badges for channels, workflows, agents, risk, cost, publication, compliance, approval, and content.
- Feedback: toast-based mock actions through `sonner`.

## Page patterns
1. `PageHeader` with eyebrow, title, description, and actions.
2. KPI strip near the top.
3. Main content area plus a secondary panel for supporting state.
4. Badges on rows and cards for status-heavy views.
5. Tables remain compact and legible on laptop and desktop widths.

## State patterns
- Every page should support loading, empty, error, and data states.
- Empty states should explain the missing data and the next operator action.
- Error states should stay compact and recoverable.

## Navigation and shell
- Sidebar is the main navigation anchor.
- Topbar surfaces channel context and page-level controls.
- Channel switching is a first-class interaction and should remain visually obvious.

## Rules for new screens
- Reuse existing tokens and primitives before adding new ones.
- Do not introduce literal colors or ad hoc spacing scales.
- Keep new screens dense, consistent, and business-oriented.
- Status should always be expressed with the project enums and existing badge helpers.

## QA minimum
- Validate dashboard, channels, and agent office first.
- Check for overflow, overlap, broken cards, unreadable tables, and oversized badges.
- Verify desktop widths at 1366, 1600, and 1920.
- Prefer structural fixes over restyling.

## Sprint 1 snapshot
- Lint warnings for `react-refresh/only-export-components` were removed by splitting shared exports into dedicated modules.
- The visual language stayed intact; no broad redesign was introduced.
- Screenshots were captured for dashboard, channels, and agent office at 1366x768, 1600x900, and 1920x1080.
- Smoke checks were also performed on production, approvals, costs, compliance, and audit logs.
