import type { PerformanceMetric, PublicationJob, PublicationTarget, ComplianceCheck } from "@/contracts/types";

export const mockMetrics: PerformanceMetric[] = [
  { id: "me_01", channelId: "ch_historia", contentId: "idea_06", platform: "youtube", periodStart: "2026-07-01T00:00:00.000Z", periodEnd: "2026-07-12T00:00:00.000Z", views: 184320, reach: 220500, averageWatchSeconds: 412, completionRate: 0.49, shares: 2140, saves: 3820, comments: 612, followersGained: 1420, revenueCents: 58200 },
  { id: "me_02", channelId: "ch_historia", contentId: "idea_06", platform: "tiktok", periodStart: "2026-07-01T00:00:00.000Z", periodEnd: "2026-07-12T00:00:00.000Z", views: 412800, reach: 512000, averageWatchSeconds: 22, completionRate: 0.61, shares: 8410, saves: 6210, comments: 1204, followersGained: 3820, revenueCents: 4200 },
  { id: "me_03", channelId: "ch_curiosidades", platform: "youtube", periodStart: "2026-07-01T00:00:00.000Z", periodEnd: "2026-07-12T00:00:00.000Z", views: 92400, reach: 128000, averageWatchSeconds: 214, completionRate: 0.41, shares: 812, saves: 1420, comments: 288, followersGained: 620, revenueCents: 22800 },
  { id: "me_04", channelId: "ch_curiosidades", platform: "instagram", periodStart: "2026-07-01T00:00:00.000Z", periodEnd: "2026-07-12T00:00:00.000Z", views: 240100, reach: 310000, averageWatchSeconds: 18, completionRate: 0.55, shares: 4100, saves: 5210, comments: 720, followersGained: 2140, revenueCents: 0 },
];

export const mockPublicationTargets: PublicationTarget[] = [
  { id: "pt_01", channelId: "ch_historia", platform: "youtube", accountName: "@aralume-historia", status: "authenticated", lastConnectedAt: "2026-07-01T09:00:00.000Z", tokenExpiresAt: "2026-09-01T09:00:00.000Z" },
  { id: "pt_02", channelId: "ch_historia", platform: "tiktok", accountName: "@aralume.historia", status: "authenticated", lastConnectedAt: "2026-07-01T09:00:00.000Z" },
  { id: "pt_03", channelId: "ch_historia", platform: "instagram", accountName: "@aralume.historia", status: "token_expired", lastConnectedAt: "2026-04-14T09:00:00.000Z", tokenExpiresAt: "2026-07-01T09:00:00.000Z" },
  { id: "pt_04", channelId: "ch_curiosidades", platform: "youtube", accountName: "@aralume-curiosidades", status: "authenticated", lastConnectedAt: "2026-06-20T09:00:00.000Z" },
  { id: "pt_05", channelId: "ch_curiosidades", platform: "tiktok", accountName: "@aralume.curiosidades", status: "authenticated" },
  { id: "pt_06", channelId: "ch_negocios", platform: "linkedin", accountName: "Aralume Negócios", status: "not_connected" },
];

export const mockPublicationJobs: PublicationJob[] = [
  { id: "pj_01", channelId: "ch_historia", contentId: "idea_06", platform: "youtube", title: "A logística do Império Romano", description: "Como Roma abastecia um continente.", status: "published", scheduledAt: "2026-07-11T18:00:00.000Z", approvalId: "ap_04", createdAt: "2026-07-11T14:00:00.000Z", updatedAt: "2026-07-11T18:05:00.000Z" },
  { id: "pj_02", channelId: "ch_historia", contentId: "idea_06", platform: "tiktok", title: "Como Roma abastecia 1 milhão de pessoas", description: "Corte vertical.", status: "scheduled", scheduledAt: "2026-07-13T12:00:00.000Z", approvalId: "ap_04", createdAt: "2026-07-11T16:00:00.000Z", updatedAt: "2026-07-11T16:00:00.000Z" },
  { id: "pj_03", channelId: "ch_curiosidades", contentId: "idea_03", platform: "youtube", title: "Por que dormimos?", description: "Explicação atualizada.", status: "draft", createdAt: "2026-07-12T11:00:00.000Z", updatedAt: "2026-07-12T11:00:00.000Z" },
  { id: "pj_04", channelId: "ch_curiosidades", contentId: "idea_04", platform: "youtube", title: "Paradoxo de Fermi — 8 respostas", description: "Bloqueado por conformidade.", status: "failed", createdAt: "2026-07-11T20:00:00.000Z", updatedAt: "2026-07-11T20:00:00.000Z" },
];

export const mockComplianceChecks: ComplianceCheck[] = [
  { id: "cc_01", channelId: "ch_curiosidades", contentId: "idea_04", status: "blocked", riskLevel: "critical", requiresHumanReview: true, findings: [
    { id: "cf_01", severity: "critical", title: "Claim sem fonte primária", description: "A afirmação sobre 'colonizações prévias' não é sustentada por fontes revisadas por pares.", blocking: true },
    { id: "cf_02", severity: "warning", title: "Hipótese apresentada como fato", description: "Trecho 12s–18s trata uma hipótese como consenso.", blocking: false },
  ], createdAt: "2026-07-11T20:00:00.000Z" },
  { id: "cc_02", channelId: "ch_curiosidades", contentId: "idea_03", status: "attention", riskLevel: "attention", requiresHumanReview: false, findings: [
    { id: "cf_03", severity: "attention", title: "Uso de terceiros", description: "B-roll licenciado com licença pendente de verificação.", blocking: false },
  ], createdAt: "2026-07-12T09:00:00.000Z" },
  { id: "cc_03", channelId: "ch_historia", contentId: "idea_06", status: "approved", riskLevel: "ok", requiresHumanReview: false, findings: [], createdAt: "2026-07-11T13:00:00.000Z" },
];
