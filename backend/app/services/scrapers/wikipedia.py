import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"


class WikipediaScraper:
    async def fetch_timeline_facts(self, topic: str) -> list[dict[str, Any]]:
        facts: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            search_resp = await client.get(
                WIKIPEDIA_API,
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": topic,
                    "format": "json",
                    "srlimit": 3,
                },
            )
            search_resp.raise_for_status()
            search_data = search_resp.json()
            pages = search_data.get("query", {}).get("search", [])

            for page in pages[:2]:
                title = page["title"]
                extract_resp = await client.get(
                    WIKIPEDIA_API,
                    params={
                        "action": "query",
                        "titles": title,
                        "prop": "extracts|pageimages",
                        "exintro": True,
                        "explaintext": True,
                        "pithumbsize": 600,
                        "format": "json",
                    },
                )
                extract_resp.raise_for_status()
                pages_data = extract_resp.json().get("query", {}).get("pages", {})
                for page_id, page_info in pages_data.items():
                    if page_id == "-1":
                        continue
                    facts.append(
                        {
                            "source": "wikipedia",
                            "title": page_info.get("title"),
                            "extract": page_info.get("extract", "")[:1000],
                            "thumbnail": page_info.get("thumbnail", {}).get("source"),
                        }
                    )

            wikidata_facts = await self._fetch_wikidata_timeline(client, topic)
            facts.extend(wikidata_facts)

        logger.info("Fetched %d timeline facts for topic '%s'", len(facts), topic)
        return facts

    async def _fetch_wikidata_timeline(
        self, client: httpx.AsyncClient, topic: str
    ) -> list[dict[str, Any]]:
        search_resp = await client.get(
            WIKIDATA_API,
            params={
                "action": "wbsearchentities",
                "search": topic,
                "language": "en",
                "format": "json",
                "limit": 1,
            },
        )
        search_resp.raise_for_status()
        entities = search_resp.json().get("search", [])
        if not entities:
            return []

        entity_id = entities[0]["id"]
        entity_resp = await client.get(
            WIKIDATA_API,
            params={
                "action": "wbgetentities",
                "ids": entity_id,
                "props": "claims|descriptions|labels",
                "format": "json",
            },
        )
        entity_resp.raise_for_status()
        entity_data = entity_resp.json().get("entities", {}).get(entity_id, {})

        timeline: list[dict[str, Any]] = []
        claims = entity_data.get("claims", {})

        for prop in ("P571", "P580", "P582", "P585"):
            if prop in claims:
                for claim in claims[prop][:3]:
                    try:
                        time_val = claim["mainsnak"]["datavalue"]["value"]["time"]
                        timeline.append(
                            {
                                "source": "wikidata",
                                "property": prop,
                                "date": time_val,
                                "entity_id": entity_id,
                            }
                        )
                    except (KeyError, TypeError):
                        continue

        if entity_data.get("descriptions", {}).get("en"):
            timeline.append(
                {
                    "source": "wikidata",
                    "description": entity_data["descriptions"]["en"]["value"],
                    "entity_id": entity_id,
                }
            )

        return timeline
