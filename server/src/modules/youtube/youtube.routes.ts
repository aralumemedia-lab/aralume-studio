import { Router, type Response } from "express";
import { z } from "zod";
import { AppError } from "../../http/errors.js";
import { createSuccessResponse } from "../../http/response.js";
import type { YouTubeService } from "./youtube.types.js";

const channelQuery = z.object({ channelId: z.string().min(1) });
const selection = z.object({ channelId: z.string().min(1), youtubeChannelId: z.string().min(1) });
const upload = z.object({
  channelId: z.string().min(1),
  requestedBy: z.string().trim().min(1).optional(),
});
const callback = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export function createYouTubeRouter(service: YouTubeService): Router {
  const router = Router();
  router.get("/integrations/youtube/oauth/start", (req, res) => {
    const input = parse(channelQuery, req.query);
    res.json(
      createSuccessResponse(service.startOAuth(input.channelId), { requestId: requestId(res) }),
    );
  });
  router.get("/integrations/youtube/oauth/callback", async (req, res) => {
    const input = parse(callback, req.query);
    const state = await service.handleCallback(input);
    res
      .status(200)
      .type("html")
      .send(`<p>YouTube authorization ${escapeHtml(state.status)}. You may close this window.</p>`);
  });
  router.get("/integrations/youtube/connection", (req, res) => {
    const input = parse(channelQuery, req.query);
    res.json(
      createSuccessResponse(service.getConnection(input.channelId), { requestId: requestId(res) }),
    );
  });
  router.get("/integrations/youtube/channels", async (req, res) => {
    const input = parse(channelQuery, req.query);
    res.json(
      createSuccessResponse(await service.listChannels(input.channelId), {
        requestId: requestId(res),
      }),
    );
  });
  router.post("/integrations/youtube/selection", async (req, res) => {
    const input = parse(selection, req.body);
    res.json(
      createSuccessResponse(await service.selectChannel(input.channelId, input.youtubeChannelId), {
        requestId: requestId(res),
      }),
    );
  });
  router.get("/integrations/youtube/readiness", (req, res) => {
    const input = parse(channelQuery, req.query);
    res.json(
      createSuccessResponse(service.getReadiness(input.channelId), { requestId: requestId(res) }),
    );
  });
  router.post("/integrations/youtube/revoke", async (req, res) => {
    const input = parse(channelQuery, req.body);
    const result = await service.revoke(input.channelId);
    res.json(createSuccessResponse(result, { requestId: requestId(res) }));
  });
  router.post("/publications/:publicationJobId/upload", async (req, res) => {
    const params = z.object({ publicationJobId: z.string().min(1) }).parse(req.params);
    const input = parse(upload, req.body);
    const result = await service.uploadPublication({
      publicationJobId: params.publicationJobId,
      ...input,
    });
    res.status(202).json(createSuccessResponse(result, { requestId: requestId(res) }));
  });
  router.get("/publications/:publicationJobId/upload", (req, res) => {
    const params = z.object({ publicationJobId: z.string().min(1) }).parse(req.params);
    const input = parse(channelQuery, req.query);
    const result = service.getUploadResult(params.publicationJobId, input.channelId);
    if (!result)
      throw new AppError({ code: "NOT_FOUND", status: 404, message: "Upload result not found." });
    res.json(createSuccessResponse(result, { requestId: requestId(res) }));
  });
  return router;
}

function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(normalize(value));
  if (!result.success)
    throw new AppError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "Invalid YouTube integration request.",
      details: {
        issues: result.error.issues.map((issue) => ({ path: issue.path, code: issue.code })),
      },
    });
  return result.data;
}
function normalize(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item[0] : item]),
  );
}
function requestId(res: Response): string {
  return typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
}
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
