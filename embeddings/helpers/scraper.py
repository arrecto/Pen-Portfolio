from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode

DEFAULT_SUBPAGES = [
    "/",
    "/about",
    "/about-us",
    "/faq",
    "/faqs",
    "/contact",
    "/contact-us",
    "/services",
    "/pricing",
    "/team",
    "/blog",
    "/terms",
    "/terms-of-service",
    "/privacy",
    "/privacy-policy",
    "/help",
    "/support",
    "/features",
    "/products",
]


async def scrape_domain(domain: str) -> list[dict]:
    """Scrape a predefined list of subpages from a domain.

    Only fetches pages from the built-in subpage list — no deep crawling
    or feed data. Returns a list of dicts with 'url' and 'content' keys
    for pages that returned meaningful content.
    """
    if not domain.startswith(("http://", "https://")):
        domain = f"https://{domain}"
    domain = domain.rstrip("/")

    urls = [f"{domain}{path}" for path in DEFAULT_SUBPAGES]
    results = []

    config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

    async with AsyncWebCrawler() as crawler:
        for url in urls:
            try:
                result = await crawler.arun(url=url, config=config)
                if result.success and result.markdown and len(result.markdown.strip()) > 200:
                    results.append({"url": url, "content": result.markdown})
            except Exception:
                continue

    return results
