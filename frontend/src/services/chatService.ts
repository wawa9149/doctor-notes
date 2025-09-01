// src/services/chatService.ts
import { API_BASE_URL } from "../constants/api";
import type { ChatSessionResponse } from "../types/api";

export async function createChatSession(
  patientId: number,
  encounterId: number
): Promise<ChatSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      patient_id: patientId,
      encounter_id: encounterId,
    }),
  });
  if (!response.ok) {
    throw new Error("채팅 세션 생성에 실패했습니다.");
  }
  return response.json();
}

export async function addChatMessage(
  sessionId: number,
  role: 'user' | 'assistant',
  content: string
) {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      session_id: sessionId,
      role,
      content,
    }),
  });
  if (!response.ok) {
    throw new Error("채팅 메시지 저장에 실패했습니다.");
  }
  return response.json();
}

export async function getChatSessionsByEncounter(
  encounterId: number
): Promise<ChatSessionResponse[]> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/encounter/${encounterId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("채팅 기록 조회에 실패했습니다.");
  }
  return response.json();
}
