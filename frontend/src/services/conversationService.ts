import { http } from "./http";
import type { AskDTO, Conversation, ConversationCreateDTO, Message } from "@/types";

const PATH = "/conversations";

export const conversationService = {
  /** Start a new doubt-solver conversation (optionally scoped to a subject). */
  create: (dto: ConversationCreateDTO = {}) =>
    http.post<Conversation>(`${PATH}/`, dto).then((r) => r.data),

  /** List recent conversations. */
  list: () =>
    http.get<Conversation[]>(`${PATH}/`).then((r) => r.data),

  /** Get a conversation and its full message history. */
  getById: (id: string) =>
    http.get<Conversation>(`${PATH}/${id}`).then((r) => r.data),

  /** Send a question and receive an AI reply in the given conversation. */
  ask: (id: string, dto: AskDTO) =>
    http.post<Message>(`${PATH}/${id}/ask`, dto).then((r) => r.data),
};
