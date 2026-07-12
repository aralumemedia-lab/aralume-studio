import type { AuditLog } from "@/contracts/types";

export const mockAuditLogs: AuditLog[] = [
  { id: "au_01", channelId: "ch_historia", actorType: "user", actorName: "Ana Ribeiro", action: "approval.approved", entityType: "HumanApproval", entityId: "ap_04", status: "success", message: "Publicação de 'A logística do Império Romano' aprovada.", createdAt: "2026-07-11T14:00:00.000Z" },
  { id: "au_02", channelId: "ch_historia", actorType: "agent", actorName: "Publicador", action: "publication.scheduled", entityType: "PublicationJob", entityId: "pj_02", status: "success", message: "Corte agendado para 13/07 12:00.", createdAt: "2026-07-11T16:00:00.000Z" },
  { id: "au_03", channelId: "ch_curiosidades", actorType: "agent", actorName: "Conformidade", action: "compliance.blocked", entityType: "Content", entityId: "idea_04", status: "warning", message: "Bloqueio aplicado — claim sem fonte primária.", createdAt: "2026-07-11T20:00:00.000Z" },
  { id: "au_04", channelId: "ch_curiosidades", actorType: "system", actorName: "Aralume Core", action: "cost.threshold.warning", entityType: "Channel", entityId: "ch_curiosidades", status: "warning", message: "Custo mensal atingiu 94% do orçamento.", createdAt: "2026-07-12T08:00:00.000Z" },
  { id: "au_05", channelId: "ch_historia", actorType: "agent", actorName: "Editor de Vídeo", action: "video.render.completed", entityType: "VideoAsset", entityId: "vd_01", status: "success", message: "Render finalizado em 1080p.", createdAt: "2026-07-11T13:20:00.000Z" },
  { id: "au_06", channelId: "ch_historia", actorType: "user", actorName: "Marcos Lima", action: "channel.updated", entityType: "Channel", entityId: "ch_historia", status: "success", message: "Configuração de narração ajustada.", createdAt: "2026-07-10T15:12:00.000Z" },
  { id: "au_07", channelId: "ch_curiosidades", actorType: "agent", actorName: "Pesquisador", action: "research.completed", entityType: "ResearchSession", entityId: "rs_03", status: "warning", message: "Sessão encerrada com 3 claims de baixa confiança.", createdAt: "2026-07-11T22:10:00.000Z" },
  { id: "au_08", actorType: "system", actorName: "Aralume Core", action: "system.snapshot", entityType: "Platform", entityId: "global", status: "success", message: "Snapshot operacional gerado.", createdAt: "2026-07-12T14:30:00.000Z" },
];
