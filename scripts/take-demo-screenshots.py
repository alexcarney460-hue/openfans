"""
Capture demo screenshots of the OpenFans platform for Instagram marketing.
Uses Playwright to take full-page and viewport screenshots.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "https://openfans.online"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "demo-screenshots"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGES = [
    # Landing page sections
    {"name": "01-landing-hero", "url": "/", "viewport": (1440, 900), "full_page": False},
    {"name": "02-landing-full", "url": "/", "viewport": (1440, 900), "full_page": True},
    {"name": "03-landing-mobile", "url": "/", "viewport": (390, 844), "full_page": False},

    # Explore page
    {"name": "04-explore", "url": "/explore", "viewport": (1440, 900), "full_page": False},

    # Pricing page
    {"name": "05-pricing", "url": "/pricing", "viewport": (1440, 900), "full_page": True},

    # Login page
    {"name": "06-login", "url": "/login", "viewport": (1440, 900), "full_page": False},

    # Signup page
    {"name": "07-signup", "url": "/signup", "viewport": (1440, 900), "full_page": False},

    # Help page
    {"name": "08-help", "url": "/help", "viewport": (1440, 900), "full_page": True},

    # Contact page
    {"name": "09-contact", "url": "/contact", "viewport": (1440, 900), "full_page": False},

    # Mobile versions
    {"name": "10-explore-mobile", "url": "/explore", "viewport": (390, 844), "full_page": False},
    {"name": "11-pricing-mobile", "url": "/pricing", "viewport": (390, 844), "full_page": False},
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for page_config in PAGES:
            name = page_config["name"]
            url = f"{BASE_URL}{page_config['url']}"
            w, h = page_config["viewport"]
            full_page = page_config["full_page"]

            print(f"Capturing {name} ({w}x{h})...")

            context = await browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2,  # Retina quality
            )
            page = await context.new_page()

            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(2000)  # Let animations settle

                filepath = OUTPUT_DIR / f"{name}.png"
                await page.screenshot(path=str(filepath), full_page=full_page)
                print(f"  Saved: {filepath}")
            except Exception as e:
                print(f"  ERROR: {e}")
            finally:
                await context.close()

        await browser.close()

    print(f"\nDone! Screenshots saved to: {OUTPUT_DIR}")

asyncio.run(main())
