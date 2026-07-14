import type { RenderJobsSeed } from "./renders.types.js";

const now = "2026-07-13T03:30:00.000Z";

export const renderJobsDemoSeed: RenderJobsSeed = {
  renderJobs: [
    {
      id: "rj_historia_01",
      channelId: "ch_historia",
      renderType: "controlled_video",
      status: "completed",
      inputAssetIds: ["ma_hist_image_01", "ma_hist_narration_01"],
      outputAssetId: "vd_historia_01",
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "seed:rj_historia_01",
      outputStoragePath: "ch_historia/video/rendered/vd_historia_01.mp4",
      createdAt: now,
      startedAt: "2026-07-13T03:30:02.000Z",
      completedAt: "2026-07-13T03:30:05.000Z",
      durationSeconds: 3,
      attemptCount: 1,
      logSummary: "Render controlado concluido com sucesso.",
      logEntries: [
        {
          timestamp: "2026-07-13T03:30:02.000Z",
          level: "info",
          message: "Render iniciado.",
        },
        {
          timestamp: "2026-07-13T03:30:05.000Z",
          level: "info",
          message: "Render concluido.",
        },
      ],
      technicalMetadata: {
        codec: "libx264",
        container: "mp4",
        resolution: "1280x720",
        frameRate: 30,
        durationSeconds: 3,
        outputSizeBytes: 1024,
      },
      contentId: "idea_06",
      workflowRunId: "wf_02",
      updatedAt: now,
    },
    {
      id: "rj_curio_01",
      channelId: "ch_curiosidades",
      renderType: "controlled_video",
      status: "blocked",
      inputAssetIds: ["ma_curio_video_01"],
      renderProfile: "controlled_demo_short_v1",
      idempotencyKey: "seed:rj_curio_01",
      outputStoragePath: "ch_curiosidades/video/rendered/vd_curio_01.mp4",
      createdAt: now,
      attemptCount: 0,
      errorCode: "OPERATION_BLOCKED",
      errorMessage: "Modo operacional demo bloqueou renderizacao real.",
      logSummary: "Render bloqueado por policy operacional.",
      logEntries: [
        {
          timestamp: now,
          level: "warn",
          message: "Render bloqueado pelo modo demo.",
          code: "OPERATION_BLOCKED",
        },
      ],
      technicalMetadata: {
        blockedBy: "operational_mode",
        decisionCode: "DEMO_VIDEO_BLOCKED",
      },
      contentId: "idea_03",
      workflowRunId: "wf_03",
      updatedAt: now,
    },
  ],
};
