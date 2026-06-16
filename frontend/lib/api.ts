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

  async generateShort(data: { topic: string; target_duration_seconds?: number }) {
    return this.request<{
      job_id: string;
      status: string;
      phase: string;
      message: string;
    }>("/shorts/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getShortJob(jobId: string) {
    return this.request<{
      job_id: string;
      topic: string;
      status: string;
      phase: string;
      progress: number;
      output_url: string | null;
      error: string | null;
      logs: Array<{
        timestamp: string;
        phase: string;
        message: string;
        progress: number;
        level: string;
      }>;
      created_at: string | null;
    }>(`/shorts/${jobId}`);
  }

  async getShortLogs(jobId: string) {
    return this.request<
      Array<{
        timestamp: string;
        phase: string;
        message: string;
        progress: number;
        level: string;
      }>
    >(`/shorts/${jobId}/logs`);
  }

  async listShortJobs() {
    return this.request<
      Array<{
        job_id: string;
        topic: string;
        status: string;
        phase: string;
        progress: number;
        output_url: string | null;
        error: string | null;
        created_at: string | null;
      }>
    >("/shorts");
  }

  async getScraperStatus() {
    return this.request<
      Array<{
        id: string;
        label: string;
        enabled: boolean;
        configured: boolean;
        ready: boolean;
      }>
    >("/admin/scrapers");
  }

  async getAdminSettings() {
    return this.request<
      Array<{
        key: string;
        value: string;
        category: string;
        label: string | null;
        is_secret: boolean;
        value_masked: string | null;
      }>
    >("/admin/settings");
  }

  async updateAdminSettings(settings: Record<string, string>) {
    return this.request<{ status: string; updated_keys: string[] }>(
      "/admin/settings",
      {
        method: "PUT",
        body: JSON.stringify({ settings }),
      }
    );
  }
}

export const api = new ApiClient();
