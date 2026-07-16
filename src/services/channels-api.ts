import type {
  Channel,
  ChannelEditorialProfile,
  ChannelSettings,
  EditorialRules,
  ID,
} from "@/contracts/types";
import type { ApiListSuccess, ApiSuccess } from "@/contracts/api-contracts";

import { ApiRequestError, requestApiEnvelope } from "@/services/http-client";

export type CreateChannelInput = Pick<
  Channel,
  "name" | "slug" | "status" | "timezone" | "language"
>;
export type UpdateChannelInput = Partial<CreateChannelInput>;
export type ChannelProfileUpdateInput = {
  requestedBy?: string;
  editorialTone?: string;
  language?: string;
  audience?: string;
  allowedFormats?: string[];
  editorialRules?: Partial<EditorialRules>;
};

const CHANNELS_PATH = "/channels";
const DEFAULT_REQUESTED_BY = "Ana Ribeiro";

export async function getChannels(): Promise<ApiListSuccess<Channel>> {
  return requestApiEnvelope<ApiListSuccess<Channel>>(CHANNELS_PATH);
}

export async function getChannel(channelId: ID): Promise<ApiSuccess<Channel>> {
  return requestApiEnvelope<ApiSuccess<Channel>>(`${CHANNELS_PATH}/${channelId}`);
}

export async function getChannelSettings(channelId: ID): Promise<ApiSuccess<ChannelSettings>> {
  return requestApiEnvelope<ApiSuccess<ChannelSettings>>(`${CHANNELS_PATH}/${channelId}/settings`);
}

export async function getChannelProfile(
  channelId: ID,
): Promise<ApiSuccess<ChannelEditorialProfile>> {
  return requestApiEnvelope<ApiSuccess<ChannelEditorialProfile>>(
    `${CHANNELS_PATH}/${channelId}/profile`,
  );
}

export async function createChannel(input: CreateChannelInput): Promise<ApiSuccess<Channel>> {
  return requestApiEnvelope<ApiSuccess<Channel>>(CHANNELS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateChannel(
  channelId: ID,
  input: UpdateChannelInput,
): Promise<ApiSuccess<Channel>> {
  return requestApiEnvelope<ApiSuccess<Channel>>(`${CHANNELS_PATH}/${channelId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateChannelProfile(
  channelId: ID,
  input: ChannelProfileUpdateInput,
): Promise<ApiSuccess<ChannelEditorialProfile>> {
  return requestApiEnvelope<ApiSuccess<ChannelEditorialProfile>>(
    `${CHANNELS_PATH}/${channelId}/profile`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...input,
        requestedBy: input.requestedBy ?? DEFAULT_REQUESTED_BY,
      }),
    },
  );
}

type ChannelErrorContext = "channels" | "settings" | "profile" | "mutation";

export function describeChannelsApiError(
  error: unknown,
  context: ChannelErrorContext = "channels",
): string {
  if (!(error instanceof ApiRequestError)) {
    return "Nao foi possivel carregar os canais.";
  }

  if (error.kind === "network") {
    return "Backend indisponivel. Tente novamente.";
  }

  if (error.kind === "timeout") {
    return "A requisicao de canais expirou. Tente novamente.";
  }

  if (error.kind === "invalid_json") {
    return "O backend respondeu com um formato invalido.";
  }

  if (error.kind === "unexpected_envelope") {
    if (error.status === 404) {
      if (context === "settings") {
        return "Configuracoes do canal nao encontradas.";
      }

      if (context === "profile") {
        return "Perfil editorial do canal nao encontrado.";
      }

      return "Canal nao encontrado.";
    }

    if (error.status === 409) {
      return context === "mutation"
        ? "Slug ja em uso por outro canal."
        : "Slug ja em uso por outro canal.";
    }

    if (error.status === 400) {
      if (context === "settings") {
        return "Configuracoes do canal estao invalidas.";
      }

      if (context === "profile") {
        return "Perfil editorial do canal esta invalido.";
      }

      return "Os dados enviados sao invalidos.";
    }

    return "O backend respondeu de forma inesperada.";
  }

  return "Nao foi possivel carregar os canais.";
}
