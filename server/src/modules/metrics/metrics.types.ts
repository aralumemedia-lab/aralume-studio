export type ID = string;
export type ISODate = string;

export type MetricOrigin = "manual" | "imported" | "demo" | "fixture";
export type MetricValidationStatus = "validated" | "partial";
export type MetricAnalysisStatus = "ready" | "insufficient_data" | "partial";
export type MetricConfidence = "low" | "medium" | "high";

export type PerformanceMetric = {
  id: ID;
  channelId: ID;
  contentId: ID;
  platform: string;
  periodStart: ISODate;
  periodEnd: ISODate;
  views?: number;
  reach?: number;
  averageWatchSeconds?: number;
  completionRate?: number;
  shares?: number;
  saves?: number;
  comments?: number;
  followersGained?: number;
  origin: MetricOrigin;
  validationStatus: MetricValidationStatus;
  capturedAt: ISODate;
  idempotencyKey: string;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type CreateMetricInput = Omit<
  PerformanceMetric,
  "id" | "createdAt" | "updatedAt" | "validationStatus"
> & { validationStatus?: MetricValidationStatus };

export type MetricFilters = {
  channelId: ID;
  from?: ISODate;
  to?: ISODate;
  contentId?: ID;
  platform?: string;
  page?: number;
  pageSize?: number;
};

export type MetricEvidence = {
  metricId: ID;
  contentId: ID;
  platform: string;
  label: string;
  value: number;
  unit: string;
};

export type EditorialRecommendation = {
  id: ID;
  channelId: ID;
  periodStart: ISODate;
  periodEnd: ISODate;
  status: "available" | "insufficient_data";
  evidence: MetricEvidence[];
  rationale: string;
  suggestedAction: string;
  confidence: MetricConfidence;
  limitations: string[];
  generatedAt: ISODate;
  ruleVersion: "metrics-learning-v1";
};

export type MetricContentSummary = {
  contentId: ID;
  platforms: string[];
  sampleCount: number;
  views?: number;
  completionRate?: number;
  shares?: number;
  followersGained?: number;
};

export type MetricsSummary = {
  channelId: ID;
  periodStart?: ISODate;
  periodEnd?: ISODate;
  status: MetricAnalysisStatus;
  sampleCount: number;
  contentCount: number;
  platforms: string[];
  origins: MetricOrigin[];
  totals: {
    views?: number;
    reach?: number;
    averageWatchSeconds?: number;
    completionRate?: number;
    shares?: number;
    saves?: number;
    comments?: number;
    followersGained?: number;
  };
  byContent: MetricContentSummary[];
  recommendation?: EditorialRecommendation;
  missingData: string[];
  lastCapturedAt?: ISODate;
};

export type MetricsSeed = { metrics: PerformanceMetric[] };

export type MetricsRepository = {
  replaceAll(seed: Partial<MetricsSeed>): void;
  listMetrics(filters?: Omit<MetricFilters, "page" | "pageSize">): PerformanceMetric[];
  getMetric(id: ID): PerformanceMetric | undefined;
  findByIdempotency(channelId: ID, idempotencyKey: string): PerformanceMetric | undefined;
  insertMetric(metric: PerformanceMetric): void;
};
