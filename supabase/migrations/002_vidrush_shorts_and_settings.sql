-- Vidrush AI Clone: platform settings, short video jobs, admin role

-- Admin flag on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Dynamic platform settings (API keys managed via admin dashboard)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'api_keys',
    label TEXT,
    is_secret BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

-- Seed default setting keys (values filled via admin dashboard)
INSERT INTO public.platform_settings (key, value, category, label, is_secret) VALUES
    ('tavily_api_key', '', 'api_keys', 'Tavily API Key', true),
    ('jina_api_key', '', 'api_keys', 'Jina AI API Key', true),
    ('nvidia_nim_api_key', '', 'api_keys', 'NVIDIA NIM API Key', true),
    ('elevenlabs_api_key', '', 'api_keys', 'ElevenLabs API Key', true),
    ('elevenlabs_voice_id', '21m00Tcm4TlvDq8ikWAM', 'api_keys', 'ElevenLabs Voice ID', false),
    ('pexels_api_key', '', 'api_keys', 'Pexels API Key', true),
    ('pixabay_api_key', '', 'api_keys', 'Pixabay API Key', true),
    ('mapbox_access_token', '', 'api_keys', 'Mapbox Access Token', true),
    ('stripe_secret_key', '', 'api_keys', 'Stripe Secret Key', true),
    ('stripe_webhook_secret', '', 'api_keys', 'Stripe Webhook Secret', true),
    ('stripe_pro_price_id', '', 'api_keys', 'Stripe Pro Price ID', false)
ON CONFLICT (key) DO NOTHING;

-- Viral short video jobs (9:16)
CREATE TABLE IF NOT EXISTS public.short_video_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    phase TEXT NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0,
    script_json JSONB,
    scraped_data JSONB,
    output_url TEXT,
    error TEXT,
    logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_video_jobs_user_id ON public.short_video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_short_video_jobs_status ON public.short_video_jobs(status);

-- RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_video_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write platform settings
CREATE POLICY "Admins can read platform settings"
    ON public.platform_settings FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can update platform settings"
    ON public.platform_settings FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can insert platform settings"
    ON public.platform_settings FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Users manage their own short jobs
CREATE POLICY "Users can read own short jobs"
    ON public.short_video_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own short jobs"
    ON public.short_video_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS for backend workers
