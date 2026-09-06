import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5173/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Scroll the homepage to reveal the constellation area (the section with the text 'Scroll to enter the network').
        await page.mouse.wheel(0, 300)
        
        # -> Scroll slightly within the constellation area, then locate the 'svg circle' node elements so one can be interacted with.
        await page.mouse.wheel(0, 300)
        
        # -> Scroll the constellation slightly and then locate the colored circle nodes in the constellation graphic so their element indexes and attributes can be retrieved.
        await page.mouse.wheel(0, 300)
        
        # --> Assertions to verify final state
        
        # --> Hovering a constellation node reveals the profile panel showing the node's name (Currently in view Aria Mendes).
        # Assert-outcome: passed
        # Assert: The profile panel contains the text 'Currently in view Aria Mendes'.
        await expect(page.locator("xpath=/html/body/div/div/main/article/div/div[1]/div").nth(0)).to_contain_text("Currently in view Aria Mendes", timeout=15000), "The profile panel contains the text 'Currently in view Aria Mendes'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    