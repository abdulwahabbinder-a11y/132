import { GenerateStoryResponse, JobStatusResponse } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Please login with Supabase before generating videos.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function createStory(payload: {
  topic: string;
  language: string;
  target_duration_seconds: number;
}): Promise<GenerateStoryResponse> {
  const response = await fetch(`${backendUrl}/api/generate-story`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Story generation request failed.");
  }
  return response.json();
}

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${backendUrl}/api/jobs/${jobId}`, {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Unable to fetch job status.");
  }
  return response.json();
}
