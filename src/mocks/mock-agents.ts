import type { AgentDefinition } from "@/contracts/types";

const t = "2026-01-10T00:00:00.000Z";

export const mockAgentDefinitions: AgentDefinition[] = [
  { id: "ag_niche", name: "Inteligência de Nicho", slug: "niche-intel", phase: "intelligence", description: "Detecta oportunidades editoriais e tendências emergentes.", iconKey: "signal", defaultStatus: "idle", order: 1, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_researcher", name: "Pesquisador", slug: "researcher", phase: "research", description: "Coleta fontes primárias e valida evidências.", iconKey: "search", defaultStatus: "idle", order: 2, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_editorial", name: "Editorial", slug: "editorial", phase: "research", description: "Aplica linha editorial, tom e verifica coerência factual.", iconKey: "book", defaultStatus: "idle", order: 3, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_writer", name: "Roteirista", slug: "writer", phase: "creation", description: "Constrói arcos narrativos e escreve o roteiro.", iconKey: "pen", defaultStatus: "idle", order: 4, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_visual", name: "Direção Visual", slug: "visual-direction", phase: "creation", description: "Planeja cenas, referências visuais e estilo.", iconKey: "frame", defaultStatus: "idle", order: 5, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_voice", name: "Narração", slug: "voice", phase: "production", description: "Gera a narração com voz configurada do canal.", iconKey: "waveform", defaultStatus: "idle", order: 6, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_media", name: "Produção Visual", slug: "media-producer", phase: "production", description: "Gera e organiza imagens, vídeos e trilhas.", iconKey: "layers", defaultStatus: "idle", order: 7, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_editor", name: "Editor de Vídeo", slug: "video-editor", phase: "production", description: "Monta o vídeo final a partir dos ativos.", iconKey: "film", defaultStatus: "idle", order: 8, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_clips", name: "Gerador de Cortes", slug: "clips-maker", phase: "production", description: "Deriva cortes verticais e ganchos por plataforma.", iconKey: "scissors", defaultStatus: "idle", order: 9, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_quality", name: "Qualidade", slug: "quality", phase: "validation", description: "Verifica render, áudio, legenda e duração.", iconKey: "check-shield", defaultStatus: "idle", order: 10, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_compliance", name: "Conformidade", slug: "compliance", phase: "validation", description: "Avalia risco editorial, licenças e políticas.", iconKey: "gavel", defaultStatus: "idle", order: 11, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_publisher", name: "Publicador", slug: "publisher", phase: "distribution", description: "Prepara pacote de publicação por plataforma.", iconKey: "broadcast", defaultStatus: "idle", order: 12, isRequired: true, createdAt: t, updatedAt: t },
  { id: "ag_analyst", name: "Analista", slug: "analyst", phase: "analysis", description: "Lê métricas e retroalimenta pautas.", iconKey: "chart", defaultStatus: "idle", order: 13, isRequired: true, createdAt: t, updatedAt: t },
];
