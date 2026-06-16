import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Callable

from app.services.scrapers.brave import BraveScraper
from app.services.scrapers.exa import ExaScraper
from app.services.scrapers.firecrawl import FirecrawlScraper
from app.services.scrapers.google_cse import GoogleCSEScraper
from app.services.scrapers.internet_archive import InternetArchiveScraper
from app.services.scrapers.jina import JinaScraper
from app.services.scrapers.newsapi import NewsAPIScraper
from app.services.scrapers.serper import SerperScraper
from app.services.scrapers.tavily import TavilyScraper
from app.services.scrapers.wikipedia import WikipediaScraper
from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)

LogFn = Callable[[str, str, int, str], None]


def _is_enabled(key: str, default: str = "true") -> bool:
    return get_platform_setting(key, default).lower() in ("true", "1", "yes")


class ResearchAggregator:
    """Runs all enabled scrapers in parallel to maximize data collection."""

    def __init__(self, log_fn: LogFn | None = None):
        self._log = log_fn or (lambda phase, msg, prog, level="info": None)

    async def scrape_all(self, topic: str) -> dict[str, Any]:
        scraper_defs: list[tuple[str, str, str, Any, str]] = [
            ("tavily", "scraper_tavily_enabled", "Tavily", TavilyScraper(), "scrape_topic"),
            ("jina", "scraper_jina_enabled", "Jina AI", JinaScraper(), "scrape_topic"),
            ("serper", "scraper_serper_enabled", "Serper", SerperScraper(), "scrape_topic"),
            ("firecrawl", "scraper_firecrawl_enabled", "Firecrawl", FirecrawlScraper(), "scrape_topic"),
            ("exa", "scraper_exa_enabled", "Exa", ExaScraper(), "scrape_topic"),
            ("brave", "scraper_brave_enabled", "Brave Search", BraveScraper(), "scrape_topic"),
            ("newsapi", "scraper_newsapi_enabled", "NewsAPI", NewsAPIScraper(), "scrape_topic"),
            ("google_cse", "scraper_google_cse_enabled", "Google CSE", GoogleCSEScraper(), "scrape_topic"),
            ("wikipedia", "scraper_wikipedia_enabled", "Wikipedia", WikipediaScraper(), "fetch_timeline_facts"),
            ("internet_archive", "scraper_internet_archive_enabled", "Internet Archive", InternetArchiveScraper(), "search_archival_media"),
        ]

        enabled: list[tuple[str, str, Any, str]] = []
        for source_id, toggle, display, scraper, method in scraper_defs:
            if not _is_enabled(toggle):
                continue
            enabled.append((source_id, display, scraper, method))

        if not enabled:
            raise ValueError("No scrapers enabled. Configure API keys in Admin → Scraping Tools.")

        names = [d for _, d, _, _ in enabled]
        self._log("scraping", f"Launching {len(enabled)} scrapers: {', '.join(names)}", 6)

        async def run_one(source_id: str, display: str, scraper: Any, method: str):
            try:
                if method == "fetch_timeline_facts":
                    data = await scraper.fetch_timeline_facts(topic)
                elif method == "search_archival_media":
                    data = await scraper.search_archival_media([topic])
                else:
                    data = await scraper.scrape_topic(topic)
                detail = _result_detail(source_id, data)
                return source_id, display, {"data": data, "detail": detail, "error": None}
            except Exception as exc:
                return source_id, display, {"data": None, "detail": "", "error": str(exc)}

        results_raw = await asyncio.gather(
            *[run_one(sid, disp, scr, meth) for sid, disp, scr, meth in enabled]
        )

        results: dict[str, Any] = {}
        combined_parts: list[str] = []
        successful: list[str] = []
        failed: list[str] = []
        step = max(1, 14 // max(len(results_raw), 1))
        progress = 8

        for source_id, display, outcome in results_raw:
            progress = min(22, progress + step)
            if outcome["error"]:
                failed.append(display)
                self._log("scraping", f"{display}: skipped — {outcome['error'][:100]}", progress, "warn")
            else:
                successful.append(display)
                data = outcome["data"]
                results[source_id] = data
                text = _extract_text(source_id, data)
                if text:
                    combined_parts.append(f"=== {display.upper()} ===\n{text}")
                self._log("scraping", f"✓ {display}: {outcome['detail']}", progress)

        if not combined_parts:
            raise ValueError(
                f"All scrapers failed. Configure API keys in Admin → Scraping Tools. Failed: {', '.join(failed)}"
            )

        total_chars = len("\n\n".join(combined_parts))
        self._log(
            "scraping",
            f"Research complete — {len(successful)}/{len(enabled)} sources, {total_chars:,} chars collected",
            22,
            "success",
        )

        return {
            "topic": topic,
            "sources": successful,
            "failed_sources": failed,
            "source_count": len(successful),
            "raw_results": results,
            "combined_text": "\n\n".join(combined_parts)[:50000],
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }


def _extract_text(source_id: str, data: Any) -> str:
    if isinstance(data, dict):
        if data.get("combined_text"):
            return data["combined_text"]
        if data.get("answer"):
            return str(data["answer"])
    if isinstance(data, list):
        parts = []
        for item in data:
            if isinstance(item, dict):
                parts.append(
                    item.get("extract")
                    or item.get("description")
                    or item.get("content")
                    or item.get("title", "")
                )
        return "\n".join(p for p in parts if p)
    return ""


def _result_detail(source_id: str, data: Any) -> str:
    if isinstance(data, dict):
        if "results" in data:
            r = data["results"]
            count = len(r) if isinstance(r, list) else r
            return f"{count} results"
        if "pages" in data:
            return f"{data['pages']} pages"
        if "articles" in data:
            return f"{data['articles']} articles"
        text = data.get("combined_text", "")
        if text:
            return f"{len(text):,} chars"
    if isinstance(data, list):
        return f"{len(data)} items"
    return "OK"
