"""
Log in as a test creator and capture dashboard screenshots for marketing.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "https://openfans.online"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "demo-screenshots"
OUTPUT_DIR.mkdir(exist_ok=True)

# Test creator credentials
EMAIL = "alexcarney460@gmail.com"
PASSWORD = "Iloveliam2014"

DASHBOARD_PAGES = [
    {"name": "12-dashboard-home", "url": "/dashboard", "viewport": (1440, 900)},
    {"name": "13-dashboard-earnings", "url": "/dashboard/earnings", "viewport": (1440, 900)},
    {"name": "14-dashboard-analytics", "url": "/dashboard/analytics", "viewport": (1440, 900)},
    {"name": "15-dashboard-wallet", "url": "/dashboard/wallet", "viewport": (1440, 900)},
    {"name": "16-dashboard-posts", "url": "/dashboard/posts", "viewport": (1440, 900)},
    {"name": "17-dashboard-settings", "url": "/dashboard/settings", "viewport": (1440, 900)},
    {"name": "18-dashboard-messages", "url": "/dashboard/messages", "viewport": (1440, 900)},
    {"name": "19-dashboard-mobile", "url": "/dashboard", "viewport": (390, 844)},
    {"name": "20-admin-dashboard", "url": "/admin", "viewport": (1440, 900)},
    {"name": "21-admin-payouts", "url": "/admin/payouts", "viewport": (1440, 900)},
    {"name": "22-new-post", "url": "/dashboard/posts/new", "viewport": (1440, 900)},
    {"name": "23-dashboard-live", "url": "/dashboard/live", "viewport": (1440, 900)},
    {"name": "24-dashboard-stories", "url": "/dashboard/stories", "viewport": (1440, 900)},
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = await context.new_page()

        # Log in
        print("Logging in...")
        await page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Fill login form
        email_input = page.locator('input[type="email"]')
        password_input = page.locator('input[type="password"]')

        if await email_input.count() > 0:
            await email_input.fill(EMAIL)
            await password_input.fill(PASSWORD)
            await page.wait_for_timeout(500)

            # Click the "Log In" button specifically
            submit_btn = page.get_by_role("button", name="Log In")
            if await submit_btn.count() > 0:
                await submit_btn.click()
                await page.wait_for_timeout(5000)
                print(f"  Current URL: {page.url}")
        else:
            print("  Could not find login form inputs")

        # Take screenshots of each dashboard page
        for pc in DASHBOARD_PAGES:
            name = pc["name"]
            url = f"{BASE_URL}{pc['url']}"
            w, h = pc["viewport"]

            print(f"Capturing {name} ({w}x{h})...")

            await page.set_viewport_size({"width": w, "height": h})
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)

                filepath = OUTPUT_DIR / f"{name}.png"
                await page.screenshot(path=str(filepath), full_page=False)
                print(f"  Saved: {filepath}")
            except Exception as e:
                print(f"  ERROR: {e}")

        await context.close()
        await browser.close()

    print(f"\nDone! Dashboard screenshots saved to: {OUTPUT_DIR}")

asyncio.run(main())
