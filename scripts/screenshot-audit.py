"""Take screenshots of all key pages for design audit."""
from playwright.sync_api import sync_playwright
import os

OUT = "C:/Users/Ryan/Desktop/claude project/website/zusu/screenshots"
os.makedirs(OUT, exist_ok=True)

PAGES = [
    ("/", "home"),
    ("/games", "games-list"),
    ("/teams", "teams-list"),
    ("/posts", "posts-list"),
    ("/news", "news"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Desktop viewport
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    for path, name in PAGES:
        page.goto(f"http://localhost:3000/zh-TW{path}")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path=f"{OUT}/{name}-desktop.png", full_page=True)
        print(f"✓ {name} desktop")

    # Mobile viewport
    page2 = browser.new_page(viewport={"width": 390, "height": 844})
    for path, name in PAGES:
        page2.goto(f"http://localhost:3000/zh-TW{path}")
        page2.wait_for_load_state("networkidle")
        page2.wait_for_timeout(1000)
        page2.screenshot(path=f"{OUT}/{name}-mobile.png", full_page=True)
        print(f"✓ {name} mobile")

    browser.close()
    print(f"\nAll screenshots saved to {OUT}")
