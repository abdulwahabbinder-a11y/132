/** Mock admin data for preview mode */
import type { ScraperStatus, SettingItem } from "@/lib/admin/types";

const SCRAPER_TOGGLES: SettingItem[] = [
  { key: "scraper_tavily_enabled", value: "true", category: "scraping", label: "Enable Tavily", is_secret: false, value_masked: null },
  { key: "scraper_jina_enabled", value: "true", category: "scraping", label: "Enable Jina AI", is_secret: false, value_masked: null },
  { key: "scraper_serper_enabled", value: "true", category: "scraping", label: "Enable Serper", is_secret: false, value_masked: null },
  { key: "scraper_firecrawl_enabled", value: "true", category: "scraping", label: "Enable Firecrawl", is_secret: false, value_masked: null },
  { key: "scraper_exa_enabled", value: "true", category: "scraping", label: "Enable Exa", is_secret: false, value_masked: null },
  { key: "scraper_brave_enabled", value: "true", category: "scraping", label: "Enable Brave Search", is_secret: false, value_masked: null },
  { key: "scraper_newsapi_enabled", value: "true", category: "scraping", label: "Enable NewsAPI", is_secret: false, value_masked: null },
  { key: "scraper_google_cse_enabled", value: "false", category: "scraping", label: "Enable Google CSE", is_secret: false, value_masked: null },
  { key: "scraper_wikipedia_enabled", value: "true", category: "scraping", label: "Enable Wikipedia", is_secret: false, value_masked: null },
  { key: "scraper_internet_archive_enabled", value: "true", category: "scraping", label: "Enable Internet Archive", is_secret: false, value_masked: null },
];

export const DEMO_ADMIN_SETTINGS: SettingItem[] = [
  { key: "tavily_api_key", value: "", category: "scraping", label: "Tavily API Key", is_secret: true, value_masked: null },
  { key: "jina_api_key", value: "", category: "scraping", label: "Jina AI API Key", is_secret: true, value_masked: null },
  { key: "serper_api_key", value: "", category: "scraping", label: "Serper (Google Search) API Key", is_secret: true, value_masked: null },
  { key: "firecrawl_api_key", value: "", category: "scraping", label: "Firecrawl API Key", is_secret: true, value_masked: null },
  { key: "exa_api_key", value: "", category: "scraping", label: "Exa AI Search API Key", is_secret: true, value_masked: null },
  { key: "brave_search_api_key", value: "", category: "scraping", label: "Brave Search API Key", is_secret: true, value_masked: null },
  { key: "newsapi_key", value: "", category: "scraping", label: "NewsAPI Key", is_secret: true, value_masked: null },
  { key: "google_cse_api_key", value: "", category: "scraping", label: "Google Custom Search API Key", is_secret: true, value_masked: null },
  { key: "google_cse_cx", value: "", category: "scraping", label: "Google CSE Engine ID (cx)", is_secret: false, value_masked: null },
  { key: "claude_api_key", value: "", category: "llm", label: "Anthropic Claude API Key", is_secret: true, value_masked: null },
  { key: "claude_model", value: "claude-sonnet-4-20250514", category: "llm", label: "Claude Model ID", is_secret: false, value_masked: null },
  { key: "research_llm", value: "claude", category: "llm", label: "Research LLM", is_secret: false, value_masked: null },
  { key: "script_llm", value: "claude_then_llama", category: "llm", label: "Script LLM", is_secret: false, value_masked: null },
  { key: "nvidia_nim_api_key", value: "", category: "media", label: "NVIDIA NIM API Key", is_secret: true, value_masked: null },
  { key: "elevenlabs_api_key", value: "", category: "media", label: "ElevenLabs API Key", is_secret: true, value_masked: null },
  { key: "elevenlabs_voice_id", value: "21m00Tcm4TlvDq8ikWAM", category: "media", label: "ElevenLabs Voice ID", is_secret: false, value_masked: null },
  { key: "pexels_api_key", value: "", category: "media", label: "Pexels API Key", is_secret: true, value_masked: null },
  { key: "pixabay_api_key", value: "", category: "media", label: "Pixabay API Key", is_secret: true, value_masked: null },
  { key: "mapbox_access_token", value: "", category: "media", label: "Mapbox Access Token", is_secret: true, value_masked: null },
  { key: "stripe_secret_key", value: "", category: "billing", label: "Stripe Secret Key", is_secret: true, value_masked: null },
  { key: "stripe_webhook_secret", value: "", category: "billing", label: "Stripe Webhook Secret", is_secret: true, value_masked: null },
  { key: "stripe_pro_price_id", value: "", category: "billing", label: "Stripe Pro Price ID", is_secret: false, value_masked: null },
  ...SCRAPER_TOGGLES,
];

export const DEMO_SCRAPER_STATUS: ScraperStatus[] = [
  { id: "tavily", label: "Tavily", enabled: true, configured: false, ready: false },
  { id: "jina", label: "Jina AI", enabled: true, configured: false, ready: false },
  { id: "serper", label: "Serper", enabled: true, configured: false, ready: false },
  { id: "firecrawl", label: "Firecrawl", enabled: true, configured: false, ready: false },
  { id: "exa", label: "Exa", enabled: true, configured: false, ready: false },
  { id: "brave", label: "Brave Search", enabled: true, configured: false, ready: false },
  { id: "newsapi", label: "NewsAPI", enabled: true, configured: false, ready: false },
  { id: "google_cse", label: "Google CSE", enabled: false, configured: false, ready: false },
  { id: "wikipedia", label: "Wikipedia", enabled: true, configured: true, ready: true },
  { id: "internet_archive", label: "Internet Archive", enabled: true, configured: true, ready: true },
];
