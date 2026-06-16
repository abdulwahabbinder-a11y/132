const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getSubscription() {
    return this.request<{
      plan_type: string;
      video_credits_left: number;
      billing_cycle_end: string | null;
    }>("/subscription");
  }

  async generateStory(data: {
    topic: string;
    language: string;
    duration_minutes: number;
    style: string;
  }) {
    return this.request<{
      job_id: string;
      story: Record<string, unknown>;
      credits_remaining: number;
      status: string;
    }>("/generate-story", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listJobs() {
    return this.request<
      Array<{
        job_id: string;
        status: string;
        progress: number;
        output_url: string | null;
        error: string | null;
        created_at: string | null;
      }>
    >("/jobs");
  }

  async createCheckout(plan: string = "pro") {
    return this.request<{ checkout_url: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
  }
}

export const api = new ApiClient();
