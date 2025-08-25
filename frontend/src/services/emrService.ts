// src/services/emrService.ts
import { API_ENDPOINTS } from "../constants/api";
import type {
  EMRSaveRequest,
  EMRSaveResponse,
  MergeRequest,
  MergeResponse,
} from "../types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function mergeContent(
  data: MergeRequest
): Promise<MergeResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MERGE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("MERGE 요청 실패");
  return response.json();
}

export async function saveEMR(data: EMRSaveRequest): Promise<EMRSaveResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SAVE_EMR}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("EMR 저장 실패");
  return response.json();
}
