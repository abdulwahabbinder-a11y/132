"""Public-source asset scrapers (Wikipedia, Wikimedia, Internet Archive,
Pexels, Pixabay). All scrapers expose `async fetch(...)` and return a list of
asset dicts: `{"url": str, "kind": "image"|"video", "credit": str}`.
"""
