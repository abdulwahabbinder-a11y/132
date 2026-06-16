-- Extended scrapers, Claude AI, and LLM routing settings

INSERT INTO public.platform_settings (key, value, category, label, is_secret) VALUES
    -- Scraping & Research APIs
    ('serper_api_key', '', 'scraping', 'Serper (Google Search) API Key', true),
    ('firecrawl_api_key', '', 'scraping', 'Firecrawl API Key', true),
    ('exa_api_key', '', 'scraping', 'Exa AI Search API Key', true),
    ('brave_search_api_key', '', 'scraping', 'Brave Search API Key', true),
    ('newsapi_key', '', 'scraping', 'NewsAPI Key', true),
    ('google_cse_api_key', '', 'scraping', 'Google Custom Search API Key', true),
    ('google_cse_cx', '', 'scraping', 'Google Custom Search Engine ID (cx)', false),
    ('reddit_client_id', '', 'scraping', 'Reddit API Client ID', true),
    ('reddit_client_secret', '', 'scraping', 'Reddit API Client Secret', true),
    -- LLM / Research
    ('claude_api_key', '', 'llm', 'Anthropic Claude API Key', true),
    ('claude_model', 'claude-sonnet-4-20250514', 'llm', 'Claude Model ID', false),
    ('research_llm', 'claude', 'llm', 'Research LLM (claude | llama)', false),
    ('script_llm', 'claude_then_llama', 'llm', 'Script LLM (llama | claude | claude_then_llama)', false),
    -- Scraper toggles
    ('scraper_tavily_enabled', 'true', 'scraping', 'Enable Tavily Scraper', false),
    ('scraper_jina_enabled', 'true', 'scraping', 'Enable Jina AI Scraper', false),
    ('scraper_serper_enabled', 'true', 'scraping', 'Enable Serper Scraper', false),
    ('scraper_firecrawl_enabled', 'true', 'scraping', 'Enable Firecrawl Scraper', false),
    ('scraper_exa_enabled', 'true', 'scraping', 'Enable Exa Scraper', false),
    ('scraper_brave_enabled', 'true', 'scraping', 'Enable Brave Search Scraper', false),
    ('scraper_newsapi_enabled', 'true', 'scraping', 'Enable NewsAPI Scraper', false),
    ('scraper_wikipedia_enabled', 'true', 'scraping', 'Enable Wikipedia/Wikidata Scraper', false),
    ('scraper_internet_archive_enabled', 'true', 'scraping', 'Enable Internet Archive Scraper', false),
    ('scraper_google_cse_enabled', 'false', 'scraping', 'Enable Google Custom Search', false),
    ('scraper_reddit_enabled', 'false', 'scraping', 'Enable Reddit Scraper', false)
ON CONFLICT (key) DO NOTHING;

-- Re-categorize existing scraping keys for admin UI grouping
UPDATE public.platform_settings SET category = 'scraping', label = 'Tavily API Key' WHERE key = 'tavily_api_key';
UPDATE public.platform_settings SET category = 'scraping', label = 'Jina AI API Key' WHERE key = 'jina_api_key';
UPDATE public.platform_settings SET category = 'media', label = 'NVIDIA NIM API Key' WHERE key = 'nvidia_nim_api_key';
UPDATE public.platform_settings SET category = 'media', label = 'ElevenLabs API Key' WHERE key = 'elevenlabs_api_key';
UPDATE public.platform_settings SET category = 'media', label = 'ElevenLabs Voice ID' WHERE key = 'elevenlabs_voice_id';
UPDATE public.platform_settings SET category = 'media', label = 'Pexels API Key' WHERE key = 'pexels_api_key';
UPDATE public.platform_settings SET category = 'media', label = 'Pixabay API Key' WHERE key = 'pixabay_api_key';
UPDATE public.platform_settings SET category = 'media', label = 'Mapbox Access Token' WHERE key = 'mapbox_access_token';
UPDATE public.platform_settings SET category = 'billing', label = 'Stripe Secret Key' WHERE key = 'stripe_secret_key';
UPDATE public.platform_settings SET category = 'billing', label = 'Stripe Webhook Secret' WHERE key = 'stripe_webhook_secret';
UPDATE public.platform_settings SET category = 'billing', label = 'Stripe Pro Price ID' WHERE key = 'stripe_pro_price_id';
