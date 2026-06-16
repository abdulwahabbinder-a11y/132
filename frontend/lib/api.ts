import { GenerateStoryResponse, Project } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function generateStory(
  accessToken: string,
  payload: { topic: string; language: string; tone: string; target_minutes: number },
): Promise<GenerateStoryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-story`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Story generation failed");
  }
  return (await response.json()) as GenerateStoryResponse;
}

export async function listProjects(accessToken: string): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return [];
  }
  return (await response.json()) as Project[];
}
