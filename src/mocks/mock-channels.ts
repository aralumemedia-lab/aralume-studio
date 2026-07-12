import type { Channel, ChannelSettings, EditorialRules } from "@/contracts/types";

const now = "2026-07-12T14:32:00.000Z";

export const mockChannels: Channel[] = [
  {
    id: "ch_historia",
    name: "Aralume História",
    slug: "aralume-historia",
    description:
      "Narrativas de história factual com curadoria acadêmica e roteiros cinematográficos.",
    status: "active",
    niche: "História e civilizações",
    audience: "Adultos 25-55, curiosos e entusiastas",
    language: "pt-BR",
    region: "Brasil",
    timezone: "America/Sao_Paulo",
    editorialTone: "Sério, contemplativo, cinematográfico",
    publishingFrequency: "3 vídeos longos + 5 cortes por semana",
    monthlyBudgetCents: 480000,
    monthlyCostUsedCents: 312400,
    costStatus: "healthy",
    riskLevel: "ok",
    healthScore: 92,
    activeWorkflowsCount: 7,
    pendingApprovalsCount: 3,
    connectedPlatformsCount: 4,
    lastActivityAt: "2026-07-12T13:58:00.000Z",
    createdAt: "2025-11-04T10:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "ch_curiosidades",
    name: "Aralume Curiosidades",
    slug: "aralume-curiosidades",
    description:
      "Curiosidades científicas e culturais em formato multiplataforma com forte potencial de cortes.",
    status: "warning",
    niche: "Ciência e curiosidades gerais",
    audience: "Jovens adultos 18-34",
    language: "pt-BR",
    region: "Brasil",
    timezone: "America/Sao_Paulo",
    editorialTone: "Dinâmico, provocativo, acessível",
    publishingFrequency: "2 vídeos longos + 14 cortes por semana",
    monthlyBudgetCents: 620000,
    monthlyCostUsedCents: 587200,
    costStatus: "attention",
    riskLevel: "warning",
    healthScore: 71,
    activeWorkflowsCount: 11,
    pendingApprovalsCount: 6,
    connectedPlatformsCount: 3,
    lastActivityAt: "2026-07-12T14:10:00.000Z",
    createdAt: "2026-01-18T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "ch_negocios",
    name: "Aralume Negócios",
    slug: "aralume-negocios",
    description: "Análises de mercado, cases empresariais e estratégia para tomadores de decisão.",
    status: "draft",
    niche: "Negócios e estratégia corporativa",
    audience: "Executivos, empreendedores e analistas",
    language: "pt-BR",
    region: "Brasil",
    timezone: "America/Sao_Paulo",
    editorialTone: "Institucional, analítico, direto",
    publishingFrequency: "A configurar",
    monthlyBudgetCents: 350000,
    monthlyCostUsedCents: 0,
    costStatus: "not_configured",
    riskLevel: "attention",
    healthScore: 42,
    activeWorkflowsCount: 0,
    pendingApprovalsCount: 0,
    connectedPlatformsCount: 1,
    lastActivityAt: "2026-07-10T18:22:00.000Z",
    createdAt: "2026-06-28T14:00:00.000Z",
    updatedAt: now,
  },
];

export const mockChannelSettings: ChannelSettings[] = mockChannels.map((c, i) => ({
  id: `cs_${c.id}`,
  channelId: c.id,
  averageVideoDurationSeconds: [900, 480, 720][i] ?? 600,
  allowedFormats: ["horizontal", "vertical", "square"],
  allowedSubniches:
    c.id === "ch_historia"
      ? ["Antiguidade", "Idade Média", "Guerras Mundiais", "Brasil Colônia"]
      : c.id === "ch_curiosidades"
        ? ["Corpo humano", "Espaço", "Psicologia", "Curiosidades históricas"]
        : ["M&A", "Startups", "Estratégia", "Liderança"],
  blockedThemes:
    c.id === "ch_curiosidades"
      ? ["teorias da conspiração", "pseudociência", "conteúdo médico prescritivo"]
      : ["conteúdo político-partidário"],
  preferredSources:
    c.id === "ch_historia"
      ? ["Britannica", "Cambridge University Press", "USP", "Fundação Getúlio Vargas"]
      : c.id === "ch_curiosidades"
        ? ["Nature", "Scientific American", "MIT Technology Review"]
        : ["Harvard Business Review", "McKinsey Quarterly", "The Economist"],
  visualIdentity: {
    primaryColor: ["#1B3A5C", "#B8412C", "#0F2A3F"][i] ?? "#1B3A5C",
    secondaryColor: ["#E8D9B4", "#F2C14E", "#C7D3DD"][i] ?? "#E8D9B4",
    typography:
      ["Cormorant Garamond + Inter", "Space Grotesk + Inter", "Söhne + Inter"][i] ?? "Inter",
    subtitleStyle: "Bloco inferior, alto contraste, 42px",
    openingStyle: "Fade 1.2s com stinger sonoro discreto",
    thumbnailStyle: "Retrato dominante + tipografia contrastante",
  },
  narration: {
    voiceName: ["Ravi PT-BR", "Luíza PT-BR", "Bernardo PT-BR"][i] ?? "Ravi PT-BR",
    voiceProvider: "ElevenLabs (mock)",
    speed: [0.98, 1.05, 1.0][i] ?? 1.0,
    tone: ["Grave e contemplativo", "Enérgico e curioso", "Formal executivo"][i] ?? "Neutro",
    pronunciationNotes: ["Aralume: A-ra-lú-me", "Números em extenso até 12"],
  },
  createdAt: c.createdAt,
  updatedAt: now,
}));

export const mockEditorialRules: EditorialRules[] = mockChannels.map((c) => ({
  id: `er_${c.id}`,
  channelId: c.id,
  factualContentRequiresSources: true,
  minimumSources: c.id === "ch_historia" ? 4 : c.id === "ch_curiosidades" ? 3 : 3,
  allowFictionalNarratives: false,
  allowThirdPartyAssets: true,
  requiresHumanApprovalBeforePublication: true,
  highRiskAutoBlock: true,
  prohibitedClaims:
    c.id === "ch_curiosidades"
      ? ["curas milagrosas", "eventos não verificáveis apresentados como fato"]
      : ["projeções financeiras específicas sem fonte"],
  complianceNotes: [
    "Sempre distinguir fato, hipótese e opinião no roteiro.",
    "Fontes devem ser reproduzíveis e datadas.",
  ],
  createdAt: c.createdAt,
  updatedAt: now,
}));
