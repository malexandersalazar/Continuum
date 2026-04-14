import type { ChatMessage, SessionState } from "@/shared/domain/types";

export interface TurnResponse {
  message: ChatMessage;
  session: SessionState;
}
