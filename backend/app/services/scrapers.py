from typing import Any

import httpx

from app.core.config import get_settings


async def fetch_wikipedia_summary(topic: str) -> dict[str, Any]:
    settings = get_settings()
    params = {"action": "query", "format": "json", "prop": "extracts", "exintro": 1, "titles": topic}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(settings.wikipedia_api, params=params)
    response.raise_for_status()
    return response.json()


async def fetch_wikidata_entities(topic: str) -> dict[str, Any]:
    settings = get_settings()
    params = {"action": "wbsearchentities", "format": "json", "language": "en", "search": topic}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(settings.wikidata_api, params=params)
    response.raise_for_status()
    return response.json()


async def fetch_wikimedia_commons_media(keywords: list[str]) -> list[dict[str, Any]]:
    settings = get_settings()
    query = " ".join(keywords)
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrlimit": 10,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.get(settings.wikimedia_commons_api, params=params)
    response.raise_for_status()
    pages = response.json().get("query", {}).get("pages", {})
    return list(pages.values())


async def fetch_internet_archive_assets(keywords: list[str]) -> list[dict[str, Any]]:
    settings = get_settings()
    query = " AND ".join([f"title:({keyword})" for keyword in keywords])
    params = {
        "q": query,
        "fl[]": ["identifier", "title", "year", "mediatype"],
        "rows": 20,
        "page": 1,
        "output": "json",
    }
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.get(settings.internet_archive_base_url, params=params)
    response.raise_for_status()
    return response.json().get("response", {}).get("docs", [])


async def fetch_pexels_stock_video(keywords: list[str]) -> list[dict[str, Any]]:
    settings = get_settings()
    headers = {"Authorization": settings.pexels_api_key}
    params = {"query": " ".join(keywords), "per_page": 8}
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.get("https://api.pexels.com/videos/search", headers=headers, params=params)
    response.raise_for_status()
    return response.json().get("videos", [])


async def fetch_pixabay_stock_video(keywords: list[str]) -> list[dict[str, Any]]:
    settings = get_settings()
    params = {
        "key": settings.pixabay_api_key,
        "q": "+".join(keywords),
        "video_type": "all",
        "per_page": 10,
    }
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.get("https://pixabay.com/api/videos/", params=params)
    response.raise_for_status()
    return response.json().get("hits", [])
